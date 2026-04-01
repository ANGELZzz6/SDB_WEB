# AGENT.md — Proyecto Salón de Belleza

## Contexto del proyecto
Sistema de agendamiento de citas para salón de belleza colombiano.
Nombre del salón: [PENDIENTE — reemplazar cuando se defina]
Dirección: Carrera 102 #70-50
Horario: 6:00am - 9:00pm
WhatsApp Business: [PENDIENTE — reemplazar cuando esté activo]

## Stack tecnológico
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express
- Base de datos: MongoDB Atlas (free tier)
- Autenticación: JWT (solo admin y empleadas)
- Deploy: Vercel (frontend) + Render (backend) + MongoDB Atlas
- Notificaciones: WhatsApp via whatsapp-web.js o Twilio sandbox

## Estructura de carpetas esperada
```
salon-app/
├── client/          ← React + TypeScript + Tailwind
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── ChatbotPage.tsx
│   │   │   └── AdminPanel.tsx
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── server/          ← Node.js + Express
│   ├── models/
│   │   ├── Employee.js
│   │   ├── Service.js
│   │   ├── Appointment.js
│   │   ├── BlockedSlot.js
│   │   └── Settings.js
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── package.json
└── AGENT.md
```

## Modelos de datos

### Employee
```js
{
  nombre: String,
  foto: String, // URL Cloudinary
  descripcion: String,
  especialidades: [String],
  servicios: [{ type: ObjectId, ref: 'Service' }],
  horarioPersonalizado: {
    lunes: { inicio: String, fin: String, activo: Boolean },
    martes: { inicio: String, fin: String, activo: Boolean },
    miercoles: { inicio: String, fin: String, activo: Boolean },
    jueves: { inicio: String, fin: String, activo: Boolean },
    viernes: { inicio: String, fin: String, activo: Boolean },
    sabado: { inicio: String, fin: String, activo: Boolean },
    domingo: { inicio: String, fin: String, activo: Boolean }
  },
  password: String, // bcrypt, para login de empleada
  isActive: Boolean
}
```

### Service
```js
{
  nombre: String,
  descripcion: String,
  precio: Number,
  duracion: Number, // minutos
  empleadas: [{ type: ObjectId, ref: 'Employee' }],
  imagen: String, // URL Cloudinary
  isActive: Boolean
}
```

### Appointment
```js
{
  clientName: String,
  clientPhone: String,
  clientEmail: String, // opcional
  employee: { type: ObjectId, ref: 'Employee' },
  service: { type: ObjectId, ref: 'Service' },
  date: Date,
  timeSlot: String, // "HH:MM" formato 24h
  endTime: String,  // calculado: timeSlot + duracion del servicio
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'] },
  notes: String,
  reminderSent: Boolean,
  createdAt: { type: Date, default: Date.now }
}
```

### BlockedSlot
```js
{
  employee: { type: Mixed }, // ObjectId de Employee o string 'all'
  date: Date,
  isFullDay: Boolean,
  timeSlot: String, // solo si !isFullDay
  reason: String
}
```

### Settings
```js
{
  businessName: String,
  businessHours: {
    inicio: String, // "06:00"
    fin: String     // "21:00"
  },
  bufferBetweenAppointments: Number, // minutos (default 0, admin lo configura)
  maxDaysInAdvance: Number,          // 15
  cancellationHoursLimit: Number,    // 0 (puede cancelar cuando quiera)
  whatsappNumber: String,
  address: String,
  socialMedia: {
    instagram: String,
    facebook: String,
    tiktok: String
  }
}
```

## Módulos del sistema

### MÓDULO 1 — Landing Page Pública
- Hero section con diseño elegante, colores palo de rosa y cafés (pasteles)
- Sección de servicios con fotos y precios
- Sección de empleadas con foto y especialidades
- Botón "Agendar Cita" prominente que abre el chatbot
- Galería de trabajos realizados (fotos reales disponibles)
- Info de contacto, ubicación y horarios
- Botón flotante de WhatsApp

### MÓDULO 2 — Chatbot de Agendamiento (flujo por botones, NO texto libre)
Paso 1: Selección de empleada con foto
Paso 2: Selección de servicio con precio y duración
Paso 3: Selección de día (calendario, bloquea días no disponibles)
Paso 4: Selección de hora (descuenta citas existentes + duración + buffer)
Paso 5: Datos del cliente (nombre + teléfono)
Paso 6: Confirmación con resumen + opción de agregar a Google Calendar

### MÓDULO 3 — Panel Administrador
Roles:
- admin: acceso total
- empleada: solo ve sus propias citas

Dashboard:
- Vista de citas del día actual
- Vista semanal calendario
- Citas filtradas por empleada
- Estadísticas básicas (citas del mes, servicios más solicitados)

Gestión:
- CRUD de empleadas con foto, servicios asignados, horario personalizado
- CRUD de servicios con precio, duración, imagen
- Gestión de horarios: bloquear días completos o horas específicas por empleada
- Gestión de citas: confirmar, cancelar, reagendar, agregar notas, marcar completada
- Historial de clientes

## Reglas de negocio críticas
1. No agendar en horario bloqueado (ni empleada ni negocio)
2. No agendar si la empleada ya tiene cita en ese slot (incluyendo duración del servicio)
3. Buffer configurable entre citas (default 0 — admin lo define)
4. Máximo 15 días de anticipación para agendar
5. Cancelación permitida en cualquier momento (no hay restricción de horas)
6. Servicio de 90min bloquea 90min completos en el calendario
7. Cada empleada puede tener horario diferente al del negocio
8. Admin puede bloquear días/horas para una empleada específica o para todas

## Notificaciones WhatsApp
- Confirmación de cita al cliente (mensaje al número del cliente)
- Recordatorio automático 1 hora antes al cliente
- Notificación a la empleada cuando llega cita nueva
- Notificación al admin de cancelaciones
- Implementar con: whatsapp-web.js (free) como primera opción

## Pagos
- Solo en local, NO pago online
- Mercado Pago referenciado en el documento pero NO implementar en esta fase
- Mostrar precios en la web Y opción "consultar"

## Diseño
- Paleta: palo de rosa (#F4A7B9, #E8849A), cafés cálidos (#8B6356, #C4956A), blancos/cremas
- Tipografía: elegante, femenina (sugerir Google Fonts: Playfair Display + Lato)
- Estética: salón de belleza premium, minimalista, moderno
- NO hay logo todavía — usar nombre del salón en tipografía elegante como logo temporal
- Fotos reales disponibles: empleadas + galería de trabajos

## Deploy gratuito
- Frontend → Vercel (gratis, sin límites para proyectos personales)
- Backend → Render (gratis, free tier)
- Base de datos → MongoDB Atlas (free tier M0, 512MB)
- Imágenes → Cloudinary (free tier, 25GB)
- Variables de entorno: nunca en código, siempre en .env y plataformas de deploy

## Variables de entorno necesarias

### server/.env
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=[generar string aleatorio fuerte de 64 chars]
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FRONTEND_URL=http://localhost:5173
WHATSAPP_NUMBER=[número del salón]
```

### client/.env
```
VITE_API_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=
```

## Convenciones de código
- TypeScript estricto en el frontend
- Nombres de variables y funciones en inglés (camelCase)
- Comentarios en español cuando sean necesarios
- Componentes React con nombre en PascalCase
- Rutas API en formato: /api/[recurso]/[acción]
- Validación de inputs en frontend Y backend
- No dejar console.log en producción

## Estado actual
- Frontend: COMPLETO (L'Élixir Salon — diseño aprobado) (pueden haber nuevas paginas a futuro)
- Backend: EN DESARROLLO — comenzando ahora
- MongoDB Atlas: CONECTADO
- Variables de entorno server/.env: COMPLETAS
- Fotos de empleadas: DISPONIBLES
- Fotos de galería: DISPONIBLES
- Nombre del salón: L'Élixir Salon
- WhatsApp Business: PENDIENTE

## Notas para el agente
- Cuando algo esté PENDIENTE, usar placeholder claro: [NOMBRE_SALON], [WHATSAPP_NUMERO]
- No bloquear el desarrollo por datos faltantes, seguir con placeholders
- Siempre crear primero la estructura base del proyecto antes de módulos específicos
- Prioridad de desarrollo: Landing → Chatbot → Panel Admin
- Cada módulo debe funcionar de forma independiente antes de integrar
