# [NOMBRE_SALON] — Sistema de Agendamiento

Sistema de agendamiento de citas para salón de belleza colombiano.
**Dirección:** Carrera 102 #70-50 | **Horario:** 6:00am - 9:00pm

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + TypeScript + Tailwind CSS (Vite) |
| Backend | Node.js + Express |
| Base de datos | MongoDB Atlas |
| Auth | JWT (admin y empleadas) |
| Imágenes | Cloudinary |
| Frontend deploy | Vercel |
| Backend deploy | Render |

---

## Setup Inicial

### Prerrequisitos
- Node.js >= 18
- Cuenta en [MongoDB Atlas](https://cloud.mongodb.com) (free tier M0)
- Cuenta en [Cloudinary](https://cloudinary.com) (free tier)

### 1. Clonar y configurar variables de entorno

```bash
# Configurar servidor
cp server/.env.example server/.env
# → Editar server/.env con tu MONGODB_URI, JWT_SECRET, Cloudinary keys

# Configurar cliente
cp client/.env.example client/.env
# → Editar client/.env con tu VITE_CLOUDINARY_CLOUD_NAME
```

### 2. Instalar dependencias

```bash
# Instalar deps del servidor
cd server
npm install

# Instalar deps del cliente
cd ../client
npm install
```

### 3. Iniciar en desarrollo

**Backend** (puerto 5000):
```bash
cd server
npm run dev
```

**Frontend** (puerto 5173):
```bash
cd client
npm run dev
```

### 4. Verificar que todo funciona

```
GET http://localhost:5000/api/health
→ { "success": true, "message": "Servidor funcionando correctamente" }

Frontend: http://localhost:5173
```

---

## Estructura de Carpetas

```
salon-app/
├── client/                  ← React + TypeScript + Tailwind
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.tsx     ← Módulo 1 (pendiente)
│       │   ├── ChatbotPage.tsx     ← Módulo 2 (pendiente)
│       │   └── AdminPanel.tsx      ← Módulo 3 (pendiente)
│       ├── components/             ← Componentes reutilizables
│       ├── services/
│       │   └── api.ts              ← Cliente HTTP base
│       └── types/
│           └── index.ts            ← Tipos TypeScript globales
│
├── server/                  ← Node.js + Express
│   ├── config/
│   │   └── db.js                   ← Conexión MongoDB Atlas
│   ├── models/
│   │   ├── Employee.js
│   │   ├── Service.js
│   │   ├── Appointment.js
│   │   ├── BlockedSlot.js
│   │   └── Settings.js
│   ├── controllers/               ← Lógica de negocio (pendiente)
│   ├── routes/
│   │   ├── employees.js
│   │   ├── services.js
│   │   ├── appointments.js
│   │   ├── blockedSlots.js
│   │   ├── settings.js
│   │   └── auth.js
│   ├── middleware/
│   │   ├── auth.js                ← JWT + roles
│   │   └── errorHandler.js        ← Manejador global de errores
│   └── server.js                  ← Punto de entrada
│
├── AGENT.md                        ← Contexto del proyecto para el agente
└── README.md
```

---

## API Endpoints (Scaffold)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check del servidor |
| POST | `/api/auth/login` | Login admin/empleada |
| GET | `/api/auth/me` | Usuario actual |
| GET | `/api/employees` | Listar empleadas |
| POST | `/api/employees` | Crear empleada |
| GET | `/api/services` | Listar servicios |
| POST | `/api/services` | Crear servicio |
| GET | `/api/appointments` | Listar citas |
| POST | `/api/appointments` | Crear cita (público) |
| GET | `/api/appointments/available-slots` | Slots disponibles |
| GET | `/api/blocked-slots` | Listar slots bloqueados |
| POST | `/api/blocked-slots` | Bloquear slot |
| GET | `/api/settings` | Configuración del negocio |
| PUT | `/api/settings` | Actualizar configuración |

---

## Módulos de Desarrollo

Prioridad según AGENT.md:

1. **Módulo 1 — Landing Page** → `client/src/pages/LandingPage.tsx`
   - Hero, servicios, empleadas, galería, contacto

2. **Módulo 2 — Chatbot de Agendamiento** → `client/src/pages/ChatbotPage.tsx`
   - Flujo por botones: Empleada → Servicio → Día → Hora → Datos → Confirmación

3. **Módulo 3 — Panel Admin** → `client/src/pages/AdminPanel.tsx`
   - Roles: admin (total) + empleada (sus citas)

---

## CORS

- **Development:** `http://localhost:5173`
- **Production:** `FRONTEND_URL` del `.env` (dominio de Vercel)

La configuración es dinámica según `NODE_ENV`.

---

## Deploy

```
Frontend  → Vercel   (npm run build → dist/)
Backend   → Render   (npm start)
DB        → MongoDB Atlas (M0 free, 512MB)
Imágenes  → Cloudinary (25GB free)
```

**Variables de entorno en Render:**
Copiar todas las de `server/.env.example` y completar con valores reales.

**Variables de entorno en Vercel:**
Copiar las de `client/.env.example` y completar.

---

## Pendientes

- [ ] Definir nombre del salón → reemplazar `[NOMBRE_SALON]`
- [ ] Activar WhatsApp Business → `[WHATSAPP_NUMERO]`
- [ ] Crear cuenta MongoDB Atlas y obtener connection string
- [ ] Crear cuenta Cloudinary y obtener credenciales
- [ ] Generar JWT_SECRET: `node -e "require('crypto').randomBytes(64).toString('hex')"`
