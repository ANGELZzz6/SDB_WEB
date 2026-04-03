require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const connectDB = require('./config/db')

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
  // En desarrollo: localhost:5173
  return ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean)
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
app.use(helmet())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

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
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
  console.log(`📋 Entorno: ${process.env.NODE_ENV}`)
  console.log(`🔗 CORS habilitado para: ${getAllowedOrigins().join(', ')}`)
})

module.exports = app
