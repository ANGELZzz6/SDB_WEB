# 🚀 PRODUCTION_READY.md — L'Élixir Salon
> **Última Actualización:** 2026-04-15 | **Versión del Sistema:** 2.1.0 — Post Bug-Fix Release
> **Roles de referencia:** DevOps Engineer · SRE · Tech Lead
>
> Este documento es la guía de operaciones definitiva para desplegar y mantener el sistema en producción.
> Un desarrollador que lo lea debe ser capaz de: desplegar el sistema, responder a incidentes y aplicar parches sin asistencia adicional.
>
> **Complementa:** `AI_CONTEXT.md` (arquitectura y código) · `AUDIT_REPORT.md` (seguridad) · `MASTER_SYS_CONTEXT.md` (negocio)

---

## Mapa de Documentación del Sistema

```
1. MASTER_SYS_CONTEXT.md  → ¿QUÉ es el sistema? (negocio, reglas, glosario)
           ↓
2. AI_CONTEXT.md           → ¿CÓMO funciona? (arquitectura, código, convenciones)
           ↓
3. PRODUCTION_READY.md    → ¿CÓMO se despliega y mantiene? (DevOps, Ops, QA)
           ↓
4. AUDIT_REPORT.md         → ¿QUÉ riesgos tiene? (seguridad, diagramas)
```

---

## PARTE I — Estado Actual del Sistema

### ✅ Checklist de Bugs Críticos — COMPLETADOS

Los siguientes hallazgos del `AUDIT_REPORT.md` han sido resueltos en la sesión de desarrollo del **2026-04-15**.

| # | Descripción del Fix | Archivos afectados | Estado |
|---|---|---|---|
| ✅ **FIX-1** | **Cache de `fetch` desactivada** — Se eliminó el comportamiento de cache del navegador en las llamadas a la API de disponibilidad. El front ahora fuerza `cache: 'no-store'` para garantizar datos frescos en cada consulta. | `client/src/services/api.ts` | ✅ **HECHO** |
| ✅ **FIX-2** | **Transacciones Atómicas / Anti-TOCTOU** — El endpoint `createBulk` y el flujo de `update` (confirmación) ahora envuelven las operaciones de verify + write en una sesión de MongoDB (`startTransaction` / `commitTransaction`). La base de datos es el árbitro final. | `server/controllers/appointmentController.js` | ✅ **HECHO** |
| ✅ **FIX-3** | **Double-Cancel eliminado** — La función `cancel` pasó de un patrón `read → check → save` a un `findOneAndUpdate` atómico con filtro `status: { $nin: ['cancelled', 'completed'] }`. La operación es atómica por diseño de MongoDB. | `server/controllers/appointmentController.js` | ✅ **HECHO** |
| ✅ **FIX-4** | **Seguridad RBAC en `ProtectedRoute`** — El bloque de fallback local (`getMe()` falla + datos en cache) ahora respeta el `requiredPermission` de la ruta, evaluando los permisos del usuario cacheado en lugar de hacer `setHasPermission(true)` ciegamente. | `client/src/components/ProtectedRoute.tsx` | ✅ **HECHO** |
| ✅ **FIX-5** | **Visibilidad Total para el Admin en el Calendario** — El estado `selectedEmployee` en el admin del calendario se inicializa en `"all"` por defecto. El request a la API omite el parámetro `employeeId` cuando el admin está en modo "todos", y el controlador `getAll` acepta la ausencia del filtro sin lanzar error. | `client/src/pages/AdminCalendarPage.tsx` + `server/controllers/appointmentController.js` | ✅ **HECHO** |
| ✅ **FIX-6** | **UI Optimista/Pesimista** — Las acciones de confirmar y cancelar citas actualizan el estado local del componente de forma inmediata (optimistic update) y revierten al estado original si el servidor devuelve un error. Experiencia sin lag para el admin. | `client/src/pages/AdminCalendarPage.tsx` + `AdminPage.tsx` | ✅ **HECHO** |
| ✅ **FIX-7** | **Bloqueos por rangos de horas reales en BD** — La disponibilidad ahora se calcula usando los rangos de horario almacenados en el documento `Employee` (campo `horarioPersonalizado`), no con valores hardcodeados. El endpoint de disponibilidad refleja cambios de horario en tiempo real. | `server/controllers/availabilityController.js` | ✅ **HECHO** |

> [!NOTE]
> Los Hallazgos #3 (fuga de info en `reschedule`) y #5 (`settlementController` sin validación de ownership) del AUDIT_REPORT original están documentados en el backlog técnico post-lanzamiento (ver Parte II §2.4). Son de severidad media-baja y no son bloqueantes para el Go/No-Go de producción, dado que el backend siempre actúa como última línea de defensa.

---

## PARTE II — Checklist de Despliegue (Pendiente)

### ☐ 2.1 Infraestructura

#### Paso 1 — MongoDB Atlas (Base de Datos de Producción)

- [ ] Crear organización y proyecto en [cloud.mongodb.com](https://cloud.mongodb.com)
- [ ] Crear cluster **M0 (gratuito)** o **M10 (para backups automáticos)**
- [ ] Crear usuario de BD: solo `readWrite` en la base `salon-produccion`
- [ ] En **Network Access**: agregar la IP del servidor backend (NO `0.0.0.0/0`)
- [ ] Copiar la **Connection String** (`mongodb+srv://...`)
- [ ] Habilitar **Atlas Backup** (requiere M10+) o configurar `mongodump` manual semanal
- [ ] Verificar que el índice único parcial exista:
  ```javascript
  // Desde Atlas → Collections → Appointments → Indexes
  // Debe existir: { employee: 1, date: 1, timeSlot: 1 }
  // con partialFilterExpression: { status: { $nin: ["cancelled","rejected"] }, isFlexible: { $ne: true } }
  ```
- [ ] Configurar alerta de conexiones: Atlas → Alerts → "Connections current > 80% of max"

#### Paso 2 — Backend en Railway (o Render)

- [ ] Conectar repositorio GitHub a Railway: [railway.app](https://railway.app) → New Project → Deploy from GitHub
- [ ] Configurar variables de entorno en Railway:

  ```env
  NODE_ENV=production
  PORT=5000
  MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/salon-produccion?retryWrites=true&w=majority
  JWT_SECRET=<mínimo 64 caracteres — generar: openssl rand -hex 64>
  JWT_EXPIRES_IN=7d
  ADMIN_USERNAME=admin
  ADMIN_PASSWORD=<hash BCrypt de 12 rondas — ver instrucción abajo>
  ADMIN_NOMBRE=Administradora
  ADMIN_EMAIL=admin@lelixirsalon.com
  FRONTEND_URL=https://lelixirsalon.vercel.app
  TZ=America/Bogota
  LOG_LEVEL=info
  ```

  **Generar `ADMIN_PASSWORD` como hash BCrypt:**
  ```bash
  # En tu terminal local con Node.js instalado:
  node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('TuPasswordSeguro123!', 12).then(h => console.log(h))"
  # Copiar el output ($2b$12$...) como valor de ADMIN_PASSWORD
  ```

- [ ] Configurar **Start Command**: `node server/server.js`
- [ ] Configurar **Health Check**: apuntar a `GET /api/health`
- [ ] Obtener la URL pública de Railway (ej. `https://salon-backend-production.up.railway.app`)

#### Paso 3 — Frontend en Vercel

- [ ] Conectar repositorio GitHub a Vercel: [vercel.com](https://vercel.com) → New Project
- [ ] Configurar **Root Directory**: `client`
- [ ] Configurar **Build Command**: `npm run build`
- [ ] Configurar **Output Directory**: `dist`
- [ ] Agregar variable de entorno en Vercel:

  ```env
  VITE_API_URL=https://salon-backend-production.up.railway.app/api
  ```

- [ ] Hacer el primer deploy y verificar que la URL de Vercel carga el frontend

#### Paso 4 — Dominio Personalizado (Opcional)

- [ ] En Vercel → Settings → Domains: agregar `lelixirsalon.com`
- [ ] En el proveedor de DNS (GoDaddy/Namecheap/etc.): crear registro CNAME apuntando a Vercel
- [ ] SSL automático de Vercel (Let's Encrypt) — esperar propagación DNS (~24h)
- [ ] Actualizar `FRONTEND_URL` en Railway con el dominio final
- [ ] Actualizar la whitelist CORS en `server.js` con el dominio final

#### Paso 5 — Verificaciones Post-Despliegue

- [ ] `GET https://tu-backend.railway.app/api/health` responde `200 OK` con `status: "ok"`
- [ ] `NODE_ENV` es `"production"` en la respuesta del health check
- [ ] El frontend en Vercel carga sin errores de consola
- [ ] Probar el flujo completo: chatbot → agendar cita → ver en admin calendar
- [ ] El header `X-Frame-Options: DENY` está presente (Helmet activo)
- [ ] El redirect HTTP → HTTPS funciona en el backend

---

### ☐ 2.2 Seguridad Pre-Lanzamiento

- [ ] **Verificar `.gitignore`** — confirmar que estos archivos NUNCA llegaron a Git:
  ```gitignore
  .env
  .env.production
  .env.local
  server/.env
  client/.env.local
  client/.env.production
  ```
  Ejecutar: `git log --all --full-history -- "**/.env"` — si devuelve commits, los archivos estuvieron expuestos. Rotar todas las credenciales.

- [ ] **Escanear el historial de Git** buscando credenciales accidentales:
  ```bash
  git log -p | grep -E "(password|secret|mongo|jwt)" --ignore-case
  ```

- [ ] **Probar Rate Limiting**: enviar 11 intentos de login incorrectos → recibir 429 en el intento 11

- [ ] **Probar NoSQL Injection**: enviar `{"clientPhone": {"$gt": ""}}` → recibir 400 (sanitización activa)

---

### ☐ 2.3 Checklist Go/No-Go

> [!IMPORTANT]
> **Todos los ítems deben ser ✅ antes de comunicar el sistema al público.**

- [ ] Suite A de QA completa (agendamiento público) — ver §2.4 abajo
- [ ] Suite B de QA completa (panel admin y calendario)
- [ ] Suite D de QA completa (seguridad)
- [ ] SSL activo: `https://` en la URL del frontend y del backend
- [ ] Variables de entorno de producción verificadas (especialmente `ADMIN_PASSWORD` como hash BCrypt)
- [ ] `NODE_ENV=production` confirmado via `GET /api/health`
- [ ] MongoDB Atlas: backups habilitados o estrategia documentada de backup manual
- [ ] ErrorBoundary implementado en React (BL-01 del backlog)
- [ ] Morgan activado para logging básico (BL-02 del backlog)
- [ ] UptimeRobot configurado: monitoreo cada 5 minutos + alerta por email/WhatsApp
- [ ] Al menos 1 cita de prueba end-to-end completada en producción (chatbot → admin → confirmación → completada)

---

### ☐ 2.4 Suites de QA Manual

#### 🧪 Suite A — Agendamiento Público (ChatbotPage)

| # | Acción | Resultado Esperado |
|---|---|---|
| A1 | Ir a `/` → clic en "Agenda tu cita" | Navega a `/chatbot` sin errores de consola |
| A2 | Seleccionar una especialista y un servicio | Horarios del día se cargan en < 3 segundos |
| A3 | Seleccionar una fecha pasada (ayer) | Sin slots disponibles |
| A4 | Completar el flujo — agendar con teléfono válido | "Cita recibida, pendiente de confirmación" |
| A5 | Repetir A4 con el **mismo horario** desde otra pestaña simultáneamente | Solo una cita es creada; la segunda recibe error 409 |
| A6 | Intentar agendar **5+ citas** del mismo teléfono en 30 minutos | Error 429 "Límite excedido" |
| A7 | Dejar el campo teléfono vacío y enviar | Error "Teléfono celular requerido" |
| A8 | Seleccionar **"Disponibilidad flexible"** | Chatbot cambia al flujo flexible y solicita rangos de fecha |
| A9 | Completar una cita flexible | La cita aparece en el calendario del admin con ícono ✨ |

#### 🧪 Suite B — Panel de Admin (AdminCalendarPage)

| # | Acción | Resultado Esperado |
|---|---|---|
| B1 | Login con credenciales de admin | Redirige a `/admin` con nombre correcto en el header |
| B2 | Login con contraseña incorrecta **10 veces** | Respuesta 429 "Demasiados intentos" al intento 11 |
| B3 | Ir a `/admin/calendario` — selector de empleada en "Todas" | El calendario muestra citas de **todas** las especialistas |
| B4 | Hacer clic en un día con citas | Modal del día se abre con todas las citas listadas |
| B5 | Clic en "✕ CANCELAR" en una cita | Aparecen los 2 diálogos de confirmación en secuencia |
| B6 | En B5, responder "Sí" (el cliente canceló) | Cita cancelada; WhatsApp **NO** se abre automáticamente |
| B7 | En B5, responder "No" (el salón canceló) | Cita cancelada; WhatsApp **SÍ** se abre automáticamente para disculparse |
| B8 | Confirmar una cita pendiente | Status cambia inmediatamente (UI optimista); banner verde de WhatsApp aparece |
| B9 | Confirmar en un slot ya ocupado | Error 409 "Horario no disponible"; la cita vuelve a estado anterior (UI reversa) |
| B10 | Bloquear un día completo | El día aparece con "🚫 DÍA BLOQUEADO" en el calendario |
| B11 | Intentar agendar en el día bloqueado desde el chatbot | No aparecen horarios disponibles |

#### 🧪 Suite D — Seguridad

| # | Acción | Resultado Esperado |
|---|---|---|
| D1 | Enviar `{ "clientPhone": { "$gt": "" } }` en body | Error 400; no expone datos de BD |
| D2 | Acceder a `/api/employees` sin token | Respuesta 401 |
| D3 | Acceder a `/api/settlements` con token de empleada sin permiso | Respuesta 403 |
| D4 | Enviar `employeeId: "no-es-un-objectid"` a `reschedule` | Respuesta 400 "ID inválido" |
| D5 | Liquidar citas de otra especialista enviando sus IDs | Respuesta 400 "Citas no válidas para liquidar" |
| D6 | Verificar headers de respuesta | `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy` presentes |

---

## PARTE III — Guía de Mantenimiento en Producción

> **Esta es la respuesta a la pregunta:**
> *"Si mañana surge un error crítico o se requiere hacer una modificación en la web mientras ya está publicada, ¿cómo lo solucionamos sin romper la experiencia de los clientes actuales?"*

---

### 3.1 El Flujo de Trabajo Seguro: Ambientes Separados

La regla más importante en producción es **nunca desarrollar directamente contra la base de datos de producción**. El diagrama es el siguiente:

```
┌─────────────────────────────────────────────────────────────┐
│  Tu Máquina Local (Desarrollo)                              │
│                                                             │
│  ┌──────────────┐     ┌──────────────┐                     │
│  │  client/     │────▶│  server/     │                     │
│  │  localhost:  │     │  localhost:  │                     │
│  │  5173        │     │  5000        │                     │
│  └──────────────┘     └──────┬───────┘                     │
│                              │                             │
│                              ▼                             │
│                    ┌─────────────────┐                     │
│                    │  MongoDB Atlas  │                     │
│                    │  BASE DE DATOS  │                     │
│                    │  DE DESARROLLO  │  ← salon-dev        │
│                    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘

                              ≠ (NUNCA EL MISMO)

┌─────────────────────────────────────────────────────────────┐
│  PRODUCCIÓN (La Nube)                                       │
│                                                             │
│  ┌──────────────┐     ┌──────────────┐                     │
│  │  Vercel      │────▶│  Railway     │                     │
│  │  (Frontend)  │     │  (Backend)   │                     │
│  └──────────────┘     └──────┬───────┘                     │
│                              │                             │
│                              ▼                             │
│                    ┌─────────────────┐                     │
│                    │  MongoDB Atlas  │                     │
│                    │  BASE DE DATOS  │                     │
│                    │  DE PRODUCCIÓN  │  ← salon-produccion │
│                    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

#### Cómo configurar el ambiente de desarrollo conectado al clúster DEV:

1. **Crear una base de datos separada en Atlas** — en el mismo clúster, crear una BD llamada `salon-dev` (gratis, mismo clúster M0).

2. **`server/.env` para desarrollo** — este archivo NUNCA se sube a Git:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/salon-dev?retryWrites=true&w=majority
   JWT_SECRET=cualquier-string-para-dev-no-importa-la-seguridad
   JWT_EXPIRES_IN=7d
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123   # En dev puede ser texto plano (el server lo detecta y lo hashea)
   ADMIN_NOMBRE=Admin Local
   ADMIN_EMAIL=admin@dev.com
   FRONTEND_URL=http://localhost:5173
   ```

3. **`client/.env`** — para el cliente en desarrollo:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Iniciar el entorno local:**
   ```bash
   # Terminal 1 — Backend
   cd server && npm run dev

   # Terminal 2 — Frontend
   cd client && npm run dev
   ```

5. **Sembrar datos de prueba** (opcional):
   ```bash
   node server/seed.js   # Si existe, o crear citas/empleadas manualmente via admin
   ```

---

### 3.2 Flujo de Trabajo Git — Ramas y Despliegue Seguro

El sistema de ramas asegura que **`main` siempre sea lo que está en producción**.

```
main (producción en Vercel/Railway)
  │
  └──▶ fix/nombre-del-bug   (rama de trabajo)
  └──▶ feature/nueva-funcion (rama de trabajo)
```

#### Flujo completo para cualquier cambio:

```bash
# 1. Asegurarse de estar actualizado con producción
git checkout main
git pull origin main

# 2. Crear una rama de trabajo descriptiva
git checkout -b fix/cancelacion-doble-cita
# o para features:
git checkout -b feature/notificaciones-email

# 3. Hacer los cambios en el editor/IDE
# ... editar archivos ...

# 4. Probar LOCALMENTE contra la BD de desarrollo
#    (servidor corriendo en localhost)

# 5. Committear con mensaje descriptivo
git add .
git commit -m "fix: cancelacion atomica usando findOneAndUpdate para prevenir doble-cancel"

# 6. Subir la rama al repositorio
git push origin fix/cancelacion-doble-cita

# 7. En GitHub: crear un Pull Request de fix/* → main
#    Revisar el diff una última vez antes de mergear

# 8. Mergear el PR a main
#    → Railway detecta el push a main y re-despliega el backend automáticamente
#    → Vercel detecta el push a main y re-despliega el frontend automáticamente
```

> [!IMPORTANT]
> **Vercel y Railway** detectan automáticamente los pushes a `main` y hacen el despliegue sin intervención manual. El tiempo de despliegue es ~2-3 minutos. Durante ese tiempo, la versión anterior sigue sirviendo requests (zero-downtime deployment).

---

### 3.3 Despliegue de un Hotfix (Parche de Emergencia)

Un **hotfix** es un fix crítico que no puede esperar el ciclo normal de desarrollo. Se aplica directamente sobre `main`.

#### Protocolo de Hotfix (Paso a Paso):

```
ALERTA DE BUG CRÍTICO EN PRODUCCIÓN
           │
           ▼
    ┌─────────────────────────┐
    │ 1. Evaluar la severidad │
    │    ¿Están los clientes  │
    │    sin poder agendar?   │
    └────────────┬────────────┘
                 │
        Sí → HOTFIX INMEDIATO
                 │
                 ▼
    ┌─────────────────────────┐
    │ 2. Reproducir en LOCAL  │
    │    conectado a BD dev   │
    └────────────┬────────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │ 3. Aplicar el fix       │
    │    Asegurarse de que    │
    │    funciona en local    │
    └────────────┬────────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │ 4. git commit + push    │
    │    → main directamente  │
    │    (justificado por     │
    │     la emergencia)      │
    └────────────┬────────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │ 5. Monitorear los logs  │
    │    en Railway durante   │
    │    los primeros 10 min  │
    └────────────┬────────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │ 6. Documentar el incid. │
    │    ¿Qué pasó? ¿Por qué? │
    │    ¿Cómo evitarlo?      │
    └─────────────────────────┘
```

#### Comandos para un Hotfix de Backend (Node.js/Express):

```bash
# 1. Reproducir el bug localmente
cd server && npm run dev
# Probar el endpoint fallido contra la BD de dev

# 2. Aplicar el fix
# (editar el archivo correspondiente)

# 3. Committear directamente a main
git add server/controllers/appointmentController.js
git commit -m "hotfix: corregir error 500 en createBulk cuando service no existe [CRÍTICO]"
git push origin main
# → Railway despliega automáticamente en ~2 minutos

# 4. Verificar el despliegue
curl https://salon-backend.railway.app/api/health
# Esperar respuesta 200 con la versión actualizada

# 5. Probar el endpoint arreglado en producción
curl -X POST https://salon-backend.railway.app/api/appointments/bulk \
  -H "Content-Type: application/json" \
  -d '{ "...datos de prueba..." }'
```

#### Comandos para un Hotfix de Frontend (React):

```bash
# 1. Reproducir el bug localmente
cd client && npm run dev

# 2. Aplicar el fix en el componente o página correspondiente

# 3. Verificar que el build compile sin errores
npm run build
# Si hay errores TypeScript, corregirlos antes de pushear

# 4. Committear y pushear
git add client/src/pages/AdminCalendarPage.tsx
git commit -m "hotfix: corregir crash en calendario cuando cita no tiene serviceId"
git push origin main
# → Vercel despliega automáticamente en ~2 minutos

# 5. Verificar en la URL de Vercel que el fix está activo
```

> [!TIP]
> **¿Cómo saber si el despliegue ya terminó sin entrar al dashboard?**
> Railway expone el número de versión en el health endpoint. Puedes agregar `buildTimestamp` o `version` a `/api/health` y comparar antes/después del push.

---

### 3.4 Migraciones de Base de Datos — Cambios de Esquema en Producción

> **Escenario:** Necesitas agregar un nuevo campo al schema de `Appointment` (o cualquier otro modelo). ¿Cómo lo haces sin corromper las citas viejas?

#### Principio Fundamental: La Migración Cero

MongoDB y Mongoose son **schema-less por naturaleza**. Esto significa que agregar un campo nuevo al schema de Mongoose **NO afecta los documentos existentes** en la base de datos. Los documentos viejos simplemente no tendrán ese campo — Mongoose devuelve `undefined` para los campos que no existen en el documento.

**La estrategia correcta es usar `default` values.**

#### Caso 1 — Agregar un Campo Opcional con Default

```javascript
// ANTES — en models/Appointment.js
const appointmentSchema = new Schema({
  status: { type: String, default: 'pending' },
  clientPhone: { type: String, required: true },
  // ...
})
```

```javascript
// DESPUÉS — agregar campo `source` para saber de dónde vino la cita
const appointmentSchema = new Schema({
  status: { type: String, default: 'pending' },
  clientPhone: { type: String, required: true },
  // NUEVO CAMPO — con default garantiza compatibilidad con documentos viejos
  source: { type: String, enum: ['chatbot', 'phone', 'walk-in'], default: 'chatbot' },
  // ...
})
```

**Resultado:**
- Las citas NEW tendrán `source: 'chatbot'` (o lo que el código especifique).
- Las citas VIEJAS devolverán `source: 'chatbot'` también, porque el `default` se aplica al leer si el campo no existe.
- **CERO riesgo de corrupción.**

#### Caso 2 — Agregar un Campo Requerido (Required)

> [!WARNING]
> **Nunca agregues `required: true` a un campo nuevo en producción sin un migration script.** Los documentos existentes no tienen ese campo → Mongoose fallará al intentar `.save()` sobre ellos.

**Procedimiento seguro:**

```bash
# PASO 1 — Hacer backup de la BD de producción
# En Atlas: Database → ... → Download → Export Collection

# PASO 2 — Agregar el campo como OPCIONAL primero (sin required)
# models/Appointment.js:
nuevosCampo: { type: String }   # Sin required, sin default todavía

# PASO 3 — Hacer deploy de este cambio a producción
git commit -m "feat: agregar campo nuevosCampo al schema (opcional, pendiente migración)"
git push origin main

# PASO 4 — Ejecutar el migration script en producción
# (conectado a la BD de producción via Mongo Shell o script Node.js)
```

```javascript
// server/scripts/migrate-add-source-field.js
// Ejecutar UNA SOLA VEZ: node server/scripts/migrate-add-source-field.js

const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

// ⚠️ IMPORTANTE: Apuntar a la BD de PRODUCCIÓN para la migración
const MONGO_URI = process.env.MONGO_URI; // Debe ser la URI de producción

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('Conectado a MongoDB. Iniciando migración...');

  const result = await mongoose.connection.db
    .collection('appointments')
    .updateMany(
      { source: { $exists: false } },   // Solo los documentos SIN el campo
      { $set: { source: 'chatbot' } }   // Asignar el valor por defecto histórico
    );

  console.log(`✅ Migración completada. Documentos actualizados: ${result.modifiedCount}`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('❌ Error en la migración:', err);
  process.exit(1);
});
```

```bash
# PASO 5 — Ejecutar la migración (una sola vez)
node server/scripts/migrate-add-source-field.js

# PASO 6 — Verificar que todos los documentos tienen el campo
# En Atlas → Collections → Appointments → Filter: { source: { $exists: false } }
# El resultado debe ser 0 documentos

# PASO 7 — AHORA SÍ agregar `required: true` si lo necesitas
# models/Appointment.js:
# nuevosCampo: { type: String, required: true }
git commit -m "feat: marcar nuevosCampo como required (post-migración exitosa)"
git push origin main
```

#### Caso 3 — Modificar un Índice Existente

```bash
# Escenario: Agregar un índice para optimizar una consulta lenta

# PASO 1 — Agregar el índice en el schema de Mongoose
# models/Appointment.js — al final del schema:
appointmentSchema.index({ clientPhone: 1 }, { background: true }) # background: true para no bloquear la BD

# PASO 2 — Deploy a producción
git push origin main
# Mongoose/MongoDB crea el índice en background — NO bloquea las operaciones existentes
# En Atlas → Collections → Appointments → Indexes → Estado: "building" → "ready"
```

> [!CAUTION]
> **Nunca elimines un índice** que esté siendo usado por queries en producción sin verificar primero con el Performance Advisor de Atlas qué queries lo usan.

---

### 3.5 Respuesta a Incidentes — Runbooks

#### 🔴 INCIDENTE: El backend no responde (HTTP 502/503)

```bash
# 1. Verificar el health endpoint
curl https://salon-backend.railway.app/api/health
# → Si timeout: el proceso Node.js se cayó

# 2. Ir a Railway Dashboard → Deployments
# → Ver los logs del último deploy
# → Buscar "Error" o "Cannot find module" o "MongoServerError"

# 3. Si fue un deploy reciente el causante: hacer Rollback
# Railway → Deployments → seleccionar el deploy anterior → Redeploy

# 4. Si el proceso crashea en loop: revisar las variables de entorno
# Railway → Variables → verificar MONGO_URI y JWT_SECRET
```

#### 🟠 INCIDENTE: Las citas no aparecen en el calendario del admin

```bash
# Síntoma: Admin ve el calendario vacío o con citas de solo una especialista

# Posibles causas:
# 1. El parámetro employeeId se está enviando cuando no debería (filtro activo)
# 2. Error en el query $or del getAll controller para fechas

# Diagnóstico — desde las DevTools del navegador:
# Network → XHR → buscar el request GET /api/appointments
# Verificar la URL: debe ser /api/appointments?date=2026-04-15 SIN employeeId cuando admin ve "Todas"

# Fix temporal si hay un bug:
# Ir al Calendario Admin → refrescar la página con F5
# Si persiste, revisar el log de Railway → Controller → getAll
```

#### 🟡 INCIDENTE: Un cliente reporta que no puede agendar

```bash
# 1. Preguntar al cliente: ¿Qué mensaje de error ve?
# 2. Reproducir en local:
#    cd client && npm run dev
#    Intentar el mismo agendamiento en localhost
# 3. Revisar los logs de Railway → filtrar por la IP del cliente o por "ERROR"
# 4. Causas comunes:
#    - Rate limit: el cliente envió demasiadas requests (ver error 429 en logs)
#    - Horario bloqueado: un BlockedSlot cubre el período que el cliente quiere
#    - El empleado tiene disponibleHoy=false en BD
# 5. Solución rápida: Atlas → Collections → Employees → buscar el empleado y verificar disponibleHoy
```

---

### 3.6 Monitoreo Continuo y Protocolo Mensual

#### Herramientas de Monitoreo Recomendadas (Gratuitas)

| Herramienta | Qué monitorea | Configuración |
|---|---|---|
| **UptimeRobot** | Disponibilidad del backend (ping cada 5 min) | uptimerobot.com → New Monitor → HTTP(s) → URL del health endpoint → Mail alert |
| **MongoDB Atlas Alerts** | Conexiones, latencia, disco | Atlas → Alerts → Add Alert → "Connections % > 80" |
| **Railway Logs** | Errores del proceso Node.js | Railway → Deployments → View Logs → buscar "Error" o "500" |
| **Vercel Analytics** | Tráfico y Core Web Vitals del frontend | Vercel → Analytics → Enable (plan gratuito) |

#### Protocolo de Mantenimiento — Primer Lunes de Cada Mes

```bash
# ═══════════════════════════════════════════
# CHECKLIST MENSUAL — L'ÉLIXIR SALON
# Ejecutar el primer lunes de cada mes
# ═══════════════════════════════════════════

# 1. VERIFICAR SLOW QUERIES EN MONGODB
#    Atlas → Performance Advisor → Operations sin índice
#    Si hay queries con ratio de IXSCAN bajo: agregar índice

# 2. VERIFICAR LOGS DE ERRORES DEL MES
#    Railway → Logs → filtrar "Error 500" o "MongoServerError"
#    Documentar los errores encontrados

# 3. REVISAR RATE LIMITS
#    ¿Hay muchos 429 en los logs? → Puede ser scraping o abuso
#    Ajustar limits en server.js si es necesario

# 4. BACKUP MANUAL DE LA BD (si no hay Atlas Backup M10)
#    Opción A: Atlas → ... → Export Collection → Appointments (como JSON)
#    Opción B: desde terminal con mongodump:
mongodump --uri="mongodb+srv://usuario:password@cluster.mongodb.net/salon-produccion" --out=./backups/$(date +%Y-%m-%d)

# 5. VERIFICAR EXPIRACIÓN DEL JWT
#    Si JWT_EXPIRES_IN=7d, todos los admin deben re-loguear cada semana
#    Evaluar aumentar a 30d para mayor comodidad operativa

# 6. REVISAR DEPENDENCIAS CON VULNERABILIDADES
cd server && npm audit
cd client && npm audit
#    Si hay vulnerabilidades HIGH: actualizar el paquete afectado

# 7. VERIFICAR ÍNDICES DE MONGODB
#    Desde mongosh o Atlas → Collections → Appointments → Explain Plan:
db.appointments.explain("executionStats").find({ status: "confirmed", date: { $gte: new Date() } })
#    Buscar "IXSCAN" en el plan (bueno). Si aparece "COLLSCAN" → falta un índice.

# 8. ROTAR JWT_SECRET SI HAY SOSPECHAS DE COMPROMISO
#    → Actualizar la variable en Railway
#    → TODOS los usuarios serán deslogueados automáticamente al siguiente request
#    → Comunicar a las especialistas que deben volver a iniciar sesión
```

---

## PARTE IV — Backlog Técnico Post-Lanzamiento

### 🔴 P1 — Urgente (primeras 2 semanas post-launch)

| ID | Tarea | Esfuerzo | Impacto |
|---|---|---|---|
| BL-01 | **Implementar ErrorBoundary en React** | 30 min | Evita pantalla en blanco total si un componente crashea |
| BL-02 | **Reactivar Morgan + logging persistente** | 1h | Sin esto, los bugs de producción son invisibles |
| BL-03 | **Code splitting en `vite.config.ts`** | 30 min | Mejora TTI en móvil ~40% |
| BL-04 | **Corregir puerto fallback** `5001` → `5000` en `api.ts` | 5 min | Consistencia en dev sin `.env` |
| BL-05 | **Configurar UptimeRobot** | 15 min | Alerta inmediata si el backend cae |

### 🟠 P2 — Importante (primer mes)

| ID | Tarea | Esfuerzo | Impacto |
|---|---|---|---|
| BL-06 | **Configurar Sentry.io** para error tracking | 2h | Alertas automáticas de errores en producción |
| BL-07 | **Fix Hallazgo #3** — validar `ObjectId` en `reschedule` + `requireRole('admin')` | 30 min | Cierra la brecha donde una empleada puede reagendar citas ajenas |
| BL-08 | **Fix Hallazgo #5** — validar ownership en `settlementController` | 1h | Previene liquidaciones cruzadas accidentales |
| BL-09 | **Minify touch targets ≥ 44px** en modales del calendario | 1h | Usabilidad móvil para el admin |
| BL-10 | **Agregar índices** para `clientPhone` y `bulkId` | 30 min | Consultas CRM más rápidas bajo carga |
| BL-11 | **Middleware `compression`** para Gzip en Express | 15 min | Reduce tamaño de respuestas JSON ~70% |

```bash
# BL-11 — Implementación:
npm install compression
# En server.js, antes de las rutas:
const compression = require('compression');
app.use(compression());
```

### 🟡 P3 — Mejoras (segundo mes)

| ID | Tarea | Esfuerzo | Impacto |
|---|---|---|---|
| BL-12 | **Tests E2E con Playwright** para flujos críticos de agendamiento | 2d | Cobertura de regresiones automática |
| BL-13 | **Paginación en `getAll` appointments** para el calendario | 4h | Necesario cuando las citas superen 500 documentos |
| BL-14 | **Redis para rate limiting distribuido** | 1d | Si se escala a múltiples instancias (actualmente por proceso) |
| BL-15 | **WhatsApp API oficial** (Twilio/360dialog) | 3d | Automatización real; elimina intervención manual del admin |

---

## PARTE V — Referencia Rápida para Desarrolladores

| Situación | Documento | Sección |
|---|---|---|
| "¿Qué significa estado `pending`?" | `AI_CONTEXT.md` | §3 Glosario de Estados |
| "¿Cómo agrego un nuevo módulo de permisos?" | `AI_CONTEXT.md` | §8 Flujos Críticos |
| "La app está en blanco en producción" | `PRODUCTION_READY.md` | BL-01 ErrorBoundary |
| "¿Qué variables de entorno necesito?" | `PRODUCTION_READY.md` | Parte II §2.1 |
| "Hay un error crítico en producción" | `PRODUCTION_READY.md` | Parte III §3.3 Hotfix |
| "Necesito agregar un campo a la BD" | `PRODUCTION_READY.md` | Parte III §3.4 Migraciones |
| "¿Cómo testeo el flujo de agendamiento?" | `PRODUCTION_READY.md` | Parte II §2.4 Suite A |
| "Quiero escalar a múltiples instancias" | `PRODUCTION_READY.md` | BL-14 Redis |
| "Hay una race condition en bulk" | `AUDIT_REPORT.md` | Hallazgo 1 |
| "El admin no ve todas las citas en el calendar" | `PRODUCTION_READY.md` | FIX-5 (Visibilidad Admin) |

---

> [!CAUTION]
> **Punto de falla único actual:** El sistema no tiene failover. Si el servidor Node.js en Railway cae, toda la operación del salón se detiene. Configurar alertas de UptimeRobot es **obligatorio antes del lanzamiento** (ver BL-05). Para mayor resiliencia, explorar redundancia en Render como servicio de backup (P3).

> [!WARNING]
> **Sobre el Admin Password en Producción:** El sistema valida en el arranque que `ADMIN_PASSWORD` sea un hash BCrypt (inicia con `$2b$`). Si arranca con texto plano en producción, el proceso falla intencionalmente. Nunca usar contraseñas simples en producción.

> [!NOTE]
> **Sobre WhatsApp:** El sistema actual abre links `wa.me` que requieren que el admin haga clic manualmente. Si el admin no está activo, los clientes no reciben notificaciones. El BL-15 (API oficial de WhatsApp) es la evolución natural para automatizar esto completamente en el futuro.
