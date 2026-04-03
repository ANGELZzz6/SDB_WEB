# L'Élixir Salon — Sistema de Agendamiento & CMS

Plataforma integral de gestión para salones de belleza de alta gama, con motor de agendamiento inteligente y personalización dinámica de marca.
**Dirección:** Carrera 102 #70-50 | **Atención:** Gestionada vía CMS

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React + TypeScript + Tailwind CSS (Vite) |
| Branding | Motor de inyección de variables CSS dinámicas |
| Backend | Node.js + Express |
| Base de Datos | MongoDB Atlas |
| Auth | PBAC (Permission-Based Access Control) |
| Imágenes | Cloudinary (Widget Integrado) |

---

## Setup Inicial

### 1. Clonar y configurar variables de entorno

```bash
# Configurar servidor
cp server/.env.example server/.env
# → Editar server/.env con MONGODB_URI, JWT_SECRET, CLOUDINARY_KEYS

# Configurar cliente
cp client/.env.example client/.env
# → Editar client/.env con VITE_API_URL
```

### 2. Instalación e Inicio

```bash
# Servidor (Puerto 5000)
cd server && npm install && npm run dev

# Cliente (Puerto 5173)
cd client && npm install && npm run dev
```

---

## Estructura de Carpetas Clave

```
salon-app/
├── client/src/
│   ├── pages/
│   │   ├── LandingPage.tsx        ← Sitio Público (Dinámico)
│   │   ├── ChatbotPage.tsx        ← Reservas Automatizadas
│   │   ├── AdminPage.tsx          ← Dashboard Operativo
│   │   └── AdminSettingsPage.tsx  ← CMS Visual y PBAC
│   └── services/api.ts            ← Cliente de API (Axios)
│
├── server/
│   ├── models/
│   │   ├── SiteConfig.js          ← Configuración de Marca (Singleton)
│   │   ├── Client.js              ← CRM & BI Metrics
│   │   └── Appointment.js         ← Gestión de Citas
│   ├── controllers/
│   │   └── siteConfigController.js ← Lógica de Personalización
│   └── middleware/
│       ├── auth.js                ← JWT Validation
│       └── checkPermission.js     ← PBAC Middleware
```

---

## API Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/config` | Obtener configuración de marca (Público) |
| PUT | `/api/config` | Actualizar CMS Visual (Admin) |
| GET | `/api/appointments/available-slots` | Motor de disponibilidad |
| GET | `/api/clients/:phone` | Detalle analítico CRM |
| POST | `/api/auth/login` | Autenticación PBAC |

---

## Estado de Módulos

- [x] **Módulo 1 — Landing Page**: 100% dinámico y personalizable.
- [x] **Módulo 2 — Chatbot**: Flujo de reserva con validación de slots en tiempo real.
- [x] **Módulo 3 — Panel Admin**: Gestión completa de citas, clientes (BI), servicios y especialistas.
- [x] **Módulo 4 — CMS Visual**: Personalización de colores, textos e imágenes desde la web.

---

## Deploy

- **Frontend**: Vercel
- **Backend**: Render
- **Imágenes**: Cloudinary
Copiar las de `client/.env.example` y completar.

---

## Pendientes

- [ ] Definir nombre del salón → reemplazar `[NOMBRE_SALON]`
- [ ] Activar WhatsApp Business → `[WHATSAPP_NUMERO]`
- [ ] Crear cuenta MongoDB Atlas y obtener connection string
- [ ] Crear cuenta Cloudinary y obtener credenciales
- [ ] Generar JWT_SECRET: `node -e "require('crypto').randomBytes(64).toString('hex')"`
