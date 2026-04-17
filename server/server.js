require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const rateLimit = require('express-rate-limit')
const sanitize = require('./utils/sanitize')
const helmet = require('helmet')

const app = express()
const PORT = process.env.PORT || 5000

// ==============================
// Conectar a MongoDB
// ==============================
connectDB()

// ==============================
// CORS dinámico según NODE_ENV
// ==============================
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    // En producción: solo el dominio de Vercel
    return [process.env.FRONTEND_URL].filter(Boolean)
  }
  // En desarrollo: localhost + IP LAN desde .env (FRONTEND_URL_LAN)
  return [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_LAN, // ← IP del móvil en LAN, definida en server/.env
  ].filter(Boolean)
}

app.use(cors({
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins()
    // Permitir requests sin origin (ej: Postman, mobile apps)
    if (!origin || allowed.includes(origin)) {
      return callback(null, true)
    }
    callback(new Error(`Origen no permitido por CORS: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ==============================
// Middlewares globales
// ==============================
app.disable('x-powered-by');

// HTTPS redirect en producción
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-inline es común en React apps con estilos inyectados
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://i.pravatar.cc"],
      connectSrc: ["'self'", "https://api.cloudinary.com"],
    }
  },
  crossOriginEmbedderPolicy: false // Necesario para cargar imágenes de Cloudinary/Unsplash
}));

app.use((req, res, next) => {
  sanitize(req.body)
  sanitize(req.query)
  sanitize(req.params)
  next()
})
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ==============================
// Rate Limiting
// ==============================
const isProd = process.env.NODE_ENV === 'production'

// General API limit (Carga de datos, navegación por el dashboard, peticiones GET en general)
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isProd ? 500 : 10000, // Elevado a 500 para soportar alta actividad administrativa
  skip: (req) => !isProd || req.method === 'OPTIONS', // Evitar bloquear peticiones preflight u OPTIONS
  message: { success: false, message: 'Demasiadas peticiones desde esta red, por favor intenta después de unos minutos.' }
}))

// Login — más estricto (10 intentos / 15 min)
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 1000,
  skip: () => !isProd,
  message: { success: false, message: 'Demasiados intentos de inicio de sesión fallidos. Por seguridad, intenta de nuevo en 15 minutos.' }
}))

// Agendamiento — protección contra spam y abusos (30 creaciones/ediciones / 15 min por IP)
app.use('/api/appointments', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 30 : 1000,
  // 🔥 CLAVE: Excluir las peticiones GET (para que al cargar el calendario no sume al límite estricto)
  skip: (req) => !isProd || req.method === 'GET' || req.method === 'OPTIONS',
  message: { success: false, message: 'Límite de creación o modificación de citas excedido temporalmente. Intenta en unos minutos.' }
}))

// Logs desactivados por petición del usuario para limpiar terminal
/*
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}
*/

// ==============================
// Rutas de la API
// ==============================
app.use('/api/employees',    require('./routes/employees'))
app.use('/api/services',     require('./routes/services'))
app.use('/api/appointments', require('./routes/appointments'))
app.use('/api/blocked-slots',require('./routes/blockedSlots'))
app.use('/api/settings',     require('./routes/settings'))
app.use('/api/gallery',      require('./routes/gallery'))
app.use('/api/auth',         require('./routes/auth'))
app.use('/api/clients',      require('./routes/clients'))
app.use('/api/settlements',  require('./routes/settlementRoutes'))
app.use('/api/config',       require('./routes/siteConfigRoutes'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// ==============================
// Ruta 404
// ==============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  })
})

// ==============================
// Manejador global de errores
// ==============================
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || 500
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message

  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err)
  }

  res.status(statusCode).json({
    success: false,
    message,
  })
})

// ==============================
// Iniciar servidor
// ==============================

// Validación crítica: ADMIN_PASSWORD debe ser un hash de BCrypt
if (process.env.NODE_ENV === 'production') {
  if (process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD.startsWith('$2')) {
    console.error('❌ ERROR CRÍTICO DE SEGURIDAD: ADMIN_PASSWORD debe ser un hash de BCrypt en producción.')
    console.error('Genera uno con: node -e "require(\'bcryptjs\').hash(\'tuPassword\',12).then(console.log)"')
    process.exit(1)
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
  console.log(`📋 Entorno: ${process.env.NODE_ENV}`)
  console.log(`🔗 CORS habilitado para: ${getAllowedOrigins().join(', ')}`)
})

module.exports = app
