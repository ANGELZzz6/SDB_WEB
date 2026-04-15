# 🤖 AI_CONTEXT.md — Cerebro del Agente para L'Élixir Salon
> **Versión:** 2.0.0 | **Generado:** 2026-04-10 | **Scope:** Full-Stack (Backend Node.js + Frontend React/TS)
>
> Este documento es la referencia primaria para cualquier agente de IA que trabaje en este proyecto.
> Léelo completo antes de tocar cualquier archivo. Complementa (no reemplaza) a `MASTER_SYS_CONTEXT.md`.

---

## 1. Stack Tecnológico Exacto y Patrones de Diseño

### Backend
| Tecnología | Versión approx. | Rol |
|---|---|---|
| Node.js | 20+ | Runtime |
| Express | 4.x | Framework HTTP |
| Mongoose | 8.x | ODM para MongoDB |
| MongoDB Atlas | 7.x | Base de datos (cloud) |
| jsonwebtoken | — | JWT sign/verify |
| bcryptjs | — | Hashing de contraseñas |
| helmet | — | Security headers HTTP |
| express-rate-limit | — | Rate limiting por IP |
| cors | — | CORS configurable |

**Patrones de arquitectura Backend:**
- **MVC estricto**: Routes → Middleware → Controllers → Models. No hay lógica de negocio en las rutas.
- **Middlewares encadenados**: `authMiddleware` → `checkPermission(módulo)` → `requireRole(rol)` → handler.
- **Singleton pattern**: `Settings.getSettings()` garantiza un solo doc de configuración.
- **Caché en memoria (5 min)**: `configCache` en `availabilityController.js` para reducir lecturas a `SiteConfig`.
- **Transacciones Mongoose**: El handler `update` de citas usa `mongoose.startSession()` + `session.startTransaction()` para la confirmación atómica.

### Frontend
| Tecnología | Versión | Rol |
|---|---|---|
| React | 18.x | UI Framework |
| TypeScript | 5.x | Tipado estático |
| React Router DOM | 6.x | Enrutamiento SPA |
| Tailwind CSS | v4 | Estilos (utility-first) |
| Vite | — | Bundler y dev server |

**Patrones de arquitectura Frontend:**
- **Service Layer centralizado**: Todo el tráfico HTTP va a través de `client/src/services/api.ts`. Nunca usar `fetch` directamente en componentes.
- **ProtectedRoute HOC**: Guarda todas las rutas admin verificando JWT localmente + `getMe()` en servidor.
- **Local-first con sincronización**: Permisos se leen del cache `localStorage.adminUser` para velocidad, luego se revalidan desde el servidor.
- **Páginas monolíticas**: Actualmente las páginas admin son archivos `.tsx` grandes (hasta 50KB). La convención es colocar estado local con `useState`/`useEffect`, sin Redux/Zustand.

---

## 2. Estructura de Archivos Clave

```
SALONDEBELLEZAWEB/
├── server/
│   ├── server.js              # Entry point — middlewares globales y rutas
│   ├── controllers/
│   │   ├── appointmentController.js  # ⭐ Core — 1000+ líneas, ALL business logic
│   │   ├── availabilityController.js # ⭐ Cálculo de slots — exporta utils timeToMinutes, dateOnly
│   │   ├── authController.js         # Login admin virtual + empleadas
│   │   ├── employeeController.js
│   │   ├── serviceController.js
│   │   ├── settlementController.js   # Liquidaciones de comisiones
│   │   └── siteConfigController.js   # CMS — llama clearConfigCache() al actualizar
│   ├── middleware/
│   │   ├── auth.js            # authMiddleware, requireRole, optionalAuth
│   │   └── checkPermission.js # RBAC granular por módulo
│   ├── models/
│   │   ├── Appointment.js     # ⭐ Modelo core — índice único partcial anti-race-condition
│   │   ├── Employee.js        # horarioPersonalizado, permissions, tokenVersion
│   │   ├── Service.js         # allowSimultaneous flag
│   │   ├── Settings.js        # Singleton con getSettings()
│   │   ├── SiteConfig.js      # CMS — mensajes WhatsApp editables
│   │   ├── BlockedSlot.js
│   │   ├── Client.js          # CRM básico
│   │   └── Settlement.js      # Historial de liquidaciones
│   └── utils/
│       ├── sanitize.js        # Elimina $ y . de req.body/query/params (anti NoSQL injection)
│       └── normalize.js       # normalizePhone() — elimina no-dígitos
├── client/src/
│   ├── services/api.ts        # ⭐ Service layer completo — único punto de entrada HTTP
│   ├── components/
│   │   ├── ProtectedRoute.tsx # Auth guard con fallback local
│   │   ├── AdminLayout.tsx    # Layout con sidebar nav + permission checks
│   │   └── FlexibleConfirmationModal.tsx
│   ├── pages/
│   │   ├── AdminCalendarPage.tsx  # ⭐ Calendario con bandeja de flexibles (~50KB)
│   │   ├── AdminPage.tsx          # Dashboard principal (~47KB)
│   │   ├── ChatbotPage.tsx        # Agendamiento público con chatbot (~55KB)
│   │   └── AdminSettingsPage.tsx  # CMS + configuración salon (~38KB)
│   └── types/                 # Tipos TypeScript de la aplicación
└── MASTER_SYS_CONTEXT.md      # Contexto de negocio de alto nivel
```

---

## 3. Glosario de Estados de Citas (`Appointment.status`)

El campo `status` es el eje central de todo el flujo de negocio.

| Estado | Valor DB | Significado | ¿Ocupa slot en calendario? | ¿Puede transicionar a? |
|---|---|---|---|---|
| **Pendiente** | `pending` | Solicitud recibida, sin confirmar. Las **flexibles** permanecen aquí hasta que admin asigna fecha/hora. | ❌ No bloquea slots | `confirmed`, `rejected`, `cancelled` |
| **Confirmada** | `confirmed` | Admin asignó fecha + hora y verificó disponibilidad. Slot bloqueado. | ✅ Sí (bloquea slots para nuevas citas) | `completed`, `cancelled` |
| **Completada** | `completed` | El servicio fue prestado. Puede tener `finalPrice` diferente a `priceSnapshot`. | ✅ Sí (histórico) | — (terminal) |
| **Cancelada** | `cancelled` | Cancelada por cliente, empleada o admin. El índice único la **excluye** automáticamente (`partialFilterExpression`). | ❌ Libera slot | — (terminal) |
| **Rechazada** | `rejected` | El sistema detectó un conflicto al intentar confirmar. Se notifica al cliente. | ❌ Libera slot | — (terminal) |

### Interacción con el Calendario

- El `getAll` filtra por `date` usando `$or`: busca en `date` (citas normales) **Y** en `flexibleAvailabilities.date` (citas flexibles pendientes). **Esta es la regla más importante del sistema de visualización.**
- La lógica de disponibilidad (`checkSlotAvailable` en `availabilityController`) solo cuenta citas con status `confirmed` o `completed` como bloqueantes.
- El `getItinerary` incluye citas de **todos los estados** del día para el especialista, pero solo `confirmed` y `completed` reducen gaps.

---

## 4. Reglas de Negocio Estrictas (INVIOLABLES)

### 4.1 Motor de Disponibilidad

```
SLOTS DISPONIBLES = Rango horario del empleado
                  - Citas existentes (confirmed/completed) × su duración efectiva + buffer
                  - BlockedSlots de hora específica
                  - [SI isFullDay block] → retornar array vacío inmediatamente
                  - [SI disponibleHoy=false y fecha=hoy] → retornar array vacío
```

**Regla `allowSimultaneous`:** Si una cita tiene `service.allowSimultaneous === true`, su duración efectiva para calcular el bloqueo es `Math.min(30, service.duracion)`. Esto permite agendar citas durante el tiempo de "espera" de tratamientos largos (ej. tinte de cabello). La lógica está en `availabilityController.js` línea 198 y en `checkSlotAvailable` línea 64.

**Regla `buffer`:** El `bufferBetweenAppointments` de `Settings` (en minutos) se suma a la duración efectiva de CADA cita para el cálculo de solapamiento. `slotEnd = slotStart + serviceDuration + buffer`.

**Regla `duracionSlot`:** Los slots se generan en pasos de `SiteConfig.duracionSlot` minutos (default 30). Esto es configurable desde el CMS del admin.

### 4.2 Citas Flexibles

- Una cita flexible (`isFlexible: true`) NO tiene `date`, `timeSlot` ni `endTime` al crearse.
- Se almacena con `flexibleAvailabilities: [{ date, isFullDay, startTime, endTime }]` que representan las **preferencias del cliente**, no la cita definitiva.
- El índice único de anti-race-condition `{ employee, date, timeSlot }` la **excluye** explícitamente (`isFlexible: { $ne: true }`), previniendo errores de validación.
- El campo `date` en el schema es `required: function() { return !this.isFlexible }`, así que Mongoose no lo valida si `isFlexible=true`.
- Al confirmar una flexible, el admin usa `PUT /api/appointments/:id` con `{ status: 'confirmed', date, timeSlot }` y el backend actualiza todos los campos faltantes.

### 4.3 Bulk Appointments

- Múltiples servicios reservados juntos comparten un `bulkId` (timestamp base36 + random).
- En el `createBulk`, se valida intra-petición que un mismo cliente no tenga 2 servicios que se crucen en el mismo día (validación del "carrito").
- Rate limit por teléfono: máximo 4 citas cada 30 minutos (verificado en DB, no en IP).
- Rate limit global: 20 requests por 10 minutos a `/api/appointments` por IP (producción).

### 4.4 Admin Virtual

```
NUNCA hacer Employee.findById(req.user.id) sin validar req.user.role !== 'admin' primero.
El admin virtual tiene id = 'virtual-admin' (string), no un ObjectId.
Mongoose.Types.ObjectId.isValid('virtual-admin') retorna false.
```

Todo controlador que accede a la DB de employees debe comenzar con:
```javascript
if (req.user.role === 'admin') {
  // Manejar el caso admin virtual
  // El admin NO tiene un documento en la colección employees
}
```

### 4.5 Integridad de Precios

- `priceSnapshot`: Precio del servicio **en el momento de agendar**. Usar siempre para reportes financieros y liquidaciones.
- `finalPrice`: Precio cobrado realmente (puede diferir si hubo ajuste manual). Opcional, se asigna al completar.
- La liquidación usa `appt.finalPrice || appt.priceSnapshot || 0` como jerarquía.

### 4.6 Cancelación Pública

El endpoint `DELETE /api/appointments/:id` es semi-público (`optionalAuth`). La seguridad depende de que el cliente envíe su `clientPhone` en el body, que el backend normaliza y compara. El backend valida: `normalizePhone(clientPhone) === appt.clientPhone`.

---

## 5. Convenciones de Código

### 5.1 Manejo de Errores y Respuestas HTTP

**Estructura de respuesta exitosa (backend):**
```javascript
res.status(200).json({ success: true, data: <payload> })
res.status(201).json({ success: true, data: <payload> }) // para creaciones
```

**Estructura de respuesta de error (backend):**
```javascript
res.status(400).json({ success: false, message: 'Mensaje descriptivo en español' })
res.status(401).json({ success: false, message: '...' }) // No autenticado
res.status(403).json({ success: false, message: '...' }) // Sin permiso
res.status(404).json({ success: false, message: '...' }) // No encontrado
res.status(409).json({ success: false, message: '...' }) // Conflicto (ej. slot ocupado)
res.status(429).json({ success: false, message: '...' }) // Rate limit
```

**Todos los controladores usan el patrón `try/catch/next(error)`:**
```javascript
const handler = async (req, res, next) => {
  try {
    // lógica
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Conflicto de horario...' });
    }
    next(error); // pasa al errorHandler global en server.js
  }
}
```

### 5.2 Utilidades Compartidas

**Siempre importar de `availabilityController.js` para operaciones de tiempo:**
```javascript
const { timeToMinutes, minutesToTime, dateOnly } = require('./availabilityController')

timeToMinutes('09:30') // → 570
minutesToTime(570)     // → '09:30'
dateOnly(new Date())   // → new Date(UTC midnight)
```

**Siempre normalizar teléfonos:**
```javascript
const { normalizePhone } = require('../utils/normalize')
const phone = normalizePhone(req.body.clientPhone) // elimina no-dígitos
```

### 5.3 Tipado TypeScript (Frontend)

- Todos los tipos base están en `client/src/types/`. Siempre extender desde ahí.
- Para respuestas genéricas usar `ApiResponse<T>` del servicio api.ts.
- Las props de componentes deben tener interfaces explícitas (`interface Props { ... }`).
- No usar `any` salvo en puntos de integración con la API donde el tipo es realmente dinámico.

### 5.4 Manejo de `req.user` en Controllers

```javascript
// Siempre usar optional chaining:
req.user?.role === 'admin'        // ✅
// No asumir que req.user existe sin authMiddleware:
if (req.user && req.user.role === 'empleada') { ... }  // ✅
// Para el admin virtual específicamente:
if (req.user.role === 'admin' || req.user.id === 'virtual-admin') { ... } // ✅
```

### 5.5 Código Fechas/Timezone

El sistema opera en timezone **America/Bogota (UTC-5)**. Las fechas se almacenan en MongoDB como UTC midnight. La función `dateOnly` garantiza consistencia:

```javascript
// ✅ CORRECTO — comparación de fechas sin horas
const targetDate = dateOnly(new Date(dateString)) // → UTC midnight

// ✅ CORRECTO — rangos de un día
const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
filter.date = { $gte: targetDate, $lt: nextDay }

// ✅ CORRECTO — hora actual en Bogotá
const hoyBogota = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
```

---

## 6. Seguridad — Capas de Defensa

| Capa | Implementación | Donde |
|---|---|---|
| CORS | Whitelist de orígenes por `NODE_ENV` | `server.js` |
| Security Headers | `helmet()` con CSP configurada | `server.js` |
| NoSQL Injection | `sanitize(req.body/query/params)` elimina `$` y `.` | `server.js` + `utils/sanitize.js` |
| Rate Limiting IP | 100 req/15min general, 10 logins/15min, 20 agendas/10min | `server.js` |
| Rate Limiting por teléfono | 4 citas/30min por `clientPhone` | `appointmentController.js` |
| Autenticación | JWT con `JWT_SECRET`, `expiresIn: 7d` | `authMiddleware` |
| Sesiones dinámicas | `tokenVersion` en Employee — logout invalida token | `authMiddleware` + `authController` |
| RBAC | `checkPermission(módulo)` por ruta | `middleware/checkPermission.js` |
| Admin virtual | Token marcado `type: 'virtual'` — nunca busca en DB | `authMiddleware` + `authController` |
| Race conditions DB | Índice único parcial en `{ employee, date, timeSlot }` | `Appointment.js` líneas 70-79 |
| Inyección de regex | Login usa `$regex` para búsqueda de nombre — el input viene de DB, no del usuario final para operaciones críticas | `authController.js` |
| HTTPS | Redirect en producción via `x-forwarded-proto` | `server.js` |
| Password seguro | bcrypt con 12 salt rounds | `authController.js` |
| Admin password check | En producción, proceso falla si ADMIN_PASSWORD no es hash bcrypt | `server.js` líneas 173-179 |

---

## 7. Variables de Entorno Requeridas

```bash
# server/.env
MONGO_URI=mongodb+srv://...
JWT_SECRET=<string_largo_y_aleatorio>
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$2b$12$...  # DEBE ser hash BCrypt en producción
ADMIN_NOMBRE=Administradora
ADMIN_EMAIL=admin@salon.com
NODE_ENV=development|production
PORT=5000
FRONTEND_URL=https://tu-dominio-vercel.app
```

```bash
# client/.env
VITE_API_URL=http://localhost:5000/api  # o URL de producción
```

---

## 8. Flujos Críticos — Guía Rápida

### ¿Cómo agregar un nuevo módulo de permisos?

1. Agregar el nombre del módulo al objeto `default` de `permissions` en `Employee.js`.
2. Agregar la ruta en `routes/` con `checkPermission('nuevoModulo')`.
3. Agregar la ruta en `App.tsx` con `<ProtectedRoute requiredPermission="nuevoModulo">`.
4. Agregar el permiso en la UI de `AdminAccessPage.tsx`.

### ¿Cómo agregar un campo al SiteConfig (CMS)?

1. Agregar el campo con su tipo y default en `models/SiteConfig.js`.
2. Exponer el campo desde `siteConfigController.js` (ya devuelve todo el documento).
3. Agregar el control en `AdminSettingsPage.tsx`.
4. **Importante:** Si es un campo que usa `getCachedConfig()` en `availabilityController`, llamar `clearConfigCache()` desde `siteConfigController` al guardar (ya implementado).

### ¿Cómo extender la notificación WhatsApp?

Los mensajes se generan en frontend (`AdminCalendarPage.tsx` / `AdminPage.tsx`) abriendo un link `https://wa.me/${phone}?text=${encodeURIComponent(message)}`. Las plantillas de texto se editan en `SiteConfig` (campos `mensajeConfirmacion`, `mensajeReagendamiento`, etc.) con variables `{nombre}`, `{servicio}`, `{fecha}`, `{hora}`.

---

> [!IMPORTANT]
> **Regla de oro para agentes IA:** Antes de modificar `appointmentController.js` o `availabilityController.js`, leer el archivo completo. Estos dos archivos son el núcleo del sistema y tienen dependencias ciclicas implícitas (`appointmentController` importa helpers de `availabilityController`). Cualquier cambio debe mantener la firma de `checkSlotAvailable(employeeId, serviceId, date, timeSlot, excludeId?, session?)`.

> [!TIP]
> Para depurar problemas de disponibilidad, activar logs en `availabilityController.getAvailability()` y revisar los `occupiedIntervals` que se construyen desde `existingAppointments`. El 90% de los bugs de slots "incorrectamente ocupados" vienen de citas con status `pending` que no deberían bloquear.
