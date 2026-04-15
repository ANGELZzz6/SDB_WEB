# 🚀 PRODUCTION_READY.md — L'Élixir Salon
> **Generado:** 2026-04-11 | **Scope:** Full-Stack Pre-Production Audit
> **Complementa:** `AI_CONTEXT.md` (arquitectura) y `AUDIT_REPORT.md` (seguridad)
>
> Este documento es la guía de DevOps/QA para preparar el sistema para producción real.
> Un desarrollador que lo lea debe poder desplegar y operar el sistema sin asistencia adicional.

---

## FASE 1 — Auditoría de "Cosas que Faltan"

### 🔴 CRÍTICO — Error Boundaries en React (Frontend)

**Estado:** ❌ NO IMPLEMENTADO

**Análisis:** `client/src/main.tsx` monta el árbol completo de React sin ningún `ErrorBoundary`. Si cualquier componente lanza un error de JavaScript no capturado (ej: un `undefined.map()` al recibir datos inesperados de la API), **toda la pestaña del navegador queda en blanco** — incluyendo el panel de administración.

```tsx
// main.tsx ACTUAL (vulnerable):
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />         // ← Sin ErrorBoundary. Un crash aquí = pantalla en blanco total
  </StrictMode>
)
```

**Impacto en producción:** Una especialista no podrá ver sus citas del día si la API devuelve un campo inesperado. Ningún mensaje de error, solo pantalla blanca.

**Parche requerido — crear `client/src/components/ErrorBoundary.tsx`:**
```tsx
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // En producción: enviar a servicio de monitoreo (Sentry, etc.)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', gap: '16px', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#ba1a1a' }}>Ocurrió un error inesperado</h2>
          <p style={{ color: '#666' }}>Por favor recarga la página o contacta al administrador.</p>
          <button onClick={() => window.location.reload()}
            style={{ padding: '12px 24px', backgroundColor: '#7c4e70', color: 'white',
              border: 'none', borderRadius: '9999px', cursor: 'pointer', fontWeight: 700 }}>
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Luego en `main.tsx`:**
```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
```

---

### 🟠 ALTO — Logging de Producción (Backend)

**Estado:** ⚠️ PARCIALMENTE INSTALADO, NO ACTIVADO

**Análisis profundo:**
- `morgan` **está instalado** (`package.json` línea 30) pero está **comentado** en `server.js` (líneas 109-113) "por petición del usuario para limpiar terminal".
- No hay Winston ni ningún logger estructurado. El error handler global usa `console.error` que en producción **se pierde en los logs del proceso** sin estructura de búsqueda.
- En producción (Railway/Render/VPS), los `console.log` del arranque son los únicos registros del sistema.

**Riesgo real:** Si el servidor lanza 200 errores 500 en 1 hora, no hay forma de saberlo ni de buscarlos. Un ataque fallido o un bug crítico pasará totalmente desapercibido hasta que el cliente se queje.

**Parche mínimo viable — reactivar Morgan en producción (`server.js`):**
```javascript
// Reemplazar el bloque comentado (líneas 108-113) con:
const morgan = require('morgan');

// En desarrollo: colorido y detallado
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  // En producción: formato JSON para parsing por Railway/Render/Logtail
  app.use(morgan('combined'));
}
```

**Parche completo recomendado — implementar Winston:**
```bash
npm install winston winston-daily-rotate-file
```
```javascript
// server/utils/logger.js
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: process.env.NODE_ENV !== 'production'
        ? format.combine(format.colorize(), format.simple())
        : format.json()
    }),
    // En producción, rotar archivos de log diariamente
    ...(process.env.NODE_ENV === 'production' ? [
      new transports.DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        level: 'error',
        maxFiles: '14d'
      })
    ] : [])
  ]
});

module.exports = logger;
```

---

### 🟡 MEDIO — Optimización del Bundle de Vite

**Estado:** ⚠️ Sin configuración de build optimizado

**Análisis:** `vite.config.ts` solo tiene configuración de dev server. No hay:
- `build.rollupOptions` para code splitting
- Compresión manual (depende de la plataforma de hosting)
- Separación de chunks de vendors (React, React Router, etc.)

**Estimación del bundle:** Con ~10 páginas de admin (AdminCalendarPage ~50KB, ChatbotPage ~55KB, AdminPage ~47KB), el bundle sin split puede superar **1.5MB** sin comprimir — lento en redes móviles colombianas.

**Parche recomendado — `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // Separar vendors del código de la app para mejor caché del navegador
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        }
      }
    },
    // Alertar si algún chunk supera 500KB
    chunkSizeWarningLimit: 500,
  }
})
```

**Configurar compresión Gzip en la plataforma de hosting:**
- **Vercel:** Automático (sin configuración adicional)
- **Nginx:** `gzip on; gzip_types text/javascript application/javascript application/json;`
- **Railway/Render:** Automático en el CDN

---

### ✅ BIEN — Variables de Entorno

**Estado:** ✅ CORRECTO (con 1 observación menor)

**Hallazgos:**
- `api.ts` línea 13: `|| 'http://localhost:5001/api'` — el fallback usa **puerto 5001** pero el servidor corre en el **5000**. Mínimo riesgo (solo afecta si `VITE_API_URL` no está definida en dev), pero puede confundir.
- No hay credenciales hardcodeadas en el código fuente.
- Cloudinary: Referencias solo en headers CSP de Helmet — no hay API keys expuestas. ✅
- MongoDB: Solo via `process.env.MONGO_URI`. ✅
- JWT: Solo via `process.env.JWT_SECRET`. ✅
- Admin password: Validación BCrypt en arranque. ✅

**Corrección menor sugerida en `api.ts`:**
```typescript
// Cambiar puerto del fallback para consistencia:
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
//                                                               ^^^^^ de 5001 a 5000
```

---

### 🟡 MEDIO — UX Mobile / Touch Targets

**Estado:** ⚠️ MIXTO — algunos botones por debajo del mínimo WCAG (44px)

**Análisis:** Las especificaciones WCAG 2.1 y las guías de Apple/Google requieren **mínimo 44×44px** de área táctil para botones en móvil.

**Botones con riesgo detectado:**
- Botones de acción dentro del modal de calendario (`AdminCalendarPage.tsx`) usan clases `py-2.5 px-3` que generan ~40px de altura con texto pequeño — borderline.
- Botón de cerrar modal ("✕") en línea 484: `fontSize: '24px'` sin padding explícito — área táctil real ~24px.
- Los botones de WhatsApp inline del calendario (`fontSize: '10px'`, `py-2.5`) probablemente están bajo los 44px en móvil.

**Patrón de fix:**
```tsx
// Para cualquier botón de acción en móvil, agregar minHeight:
style={{ minHeight: '44px', minWidth: '44px', ... }}

// O con clases de Tailwind:
className="min-h-[44px] ..."
```

---

## FASE 2 — PRODUCTION_READY Checklist

---

### ☐ 2.1 Checklist de Infraestructura

#### SSL / HTTPS
- [ ] Dominio apuntando al servidor con DNS configurado (CNAME/A Record)
- [ ] Certificado SSL activo (Let's Encrypt via Certbot, o automático en Vercel/Railway)
- [ ] `HTTPS redirect` activo en `server.js` ✅ (ya implementado línea 49-53)
- [ ] `x-forwarded-proto` verificado detrás de reverso proxy ✅

#### Variables de Entorno — Lista Completa

**Backend (`server/.env`):**
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/salon?retryWrites=true&w=majority
JWT_SECRET=<mínimo 64 caracteres aleatorios — generar con: openssl rand -hex 64>
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$2b$12$<hash bcrypt generado>
ADMIN_NOMBRE=Administradora
ADMIN_EMAIL=admin@lelixirsalon.com
FRONTEND_URL=https://lelixirsalon.vercel.app
LOG_LEVEL=info
```

**Frontend (`client/.env.production`):**
```env
VITE_API_URL=https://tu-backend.railway.app/api
```

**⚠️ NUNCA commitear `.env` a Git.** Verificar que `.gitignore` tenga:
```gitignore
.env
.env.production
.env.local
server/.env
client/.env.local
```

#### MongoDB Atlas — Configuración de Producción
- [ ] IP Whitelist configurada (solo IP del servidor backend, no `0.0.0.0/0`)
- [ ] Usuario de BD con permisos mínimos (`readWrite` en la base del salón únicamente)
- [ ] Backups automáticos habilitados (M10+ o Atlas Backup)
- [ ] Alertas de conexiones y latencia configuradas en Atlas
- [ ] `retryWrites=true` en la URI de conexión ✅ (ya en convención)
- [ ] Índices críticos verificados: `{ employee, date, timeSlot }` con `partialFilterExpression` ✅

#### Configuración del Servidor (Railway / Render / VPS)
- [ ] `NODE_ENV=production` configurado en la plataforma
- [ ] `npm run start` como comando de inicio (no `nodemon`)
- [ ] Health check configurado apuntando a `GET /api/health`
- [ ] Reinicio automático en crash (PM2 o la plataforma lo gestiona)
- [ ] Zona horaria del servidor: `TZ=America/Bogota` en variables de entorno

---

### ☐ 2.2 Checklist de Rendimiento

#### Frontend (Vite Build)
- [ ] Ejecutar `npm run build` y verificar que no haya chunks > 500KB
- [ ] Verificar que `index.html` resultante tenga `<link rel="preconnect">` para Google Fonts
- [ ] Code splitting configurado (`manualChunks` en vite.config.ts — ver Fase 1)
- [ ] Assets estáticos con nombres hasheados (Vite lo hace automáticamente) ✅
- [ ] Verificar que imágenes de Cloudinary usen transformaciones `f_auto,q_auto` en la URL

**Verificar el bundle generado:**
```bash
npm run build
# Revisar output en dist/assets/ — ningún .js debería superar 500KB sin comprimir
```

#### Backend (Node.js)
- [ ] Morgan activado para requests logging ✅ (pendiente descommentar)
- [ ] Mongoose connection pool: por defecto `maxPoolSize=5`, suficiente para este volumen
- [ ] Caché de `SiteConfig` activa (5 min) ✅
- [ ] `express.json({ limit: '10mb' })` — reducir a `'1mb'` si no hay uploads grandes vía API
- [ ] Sin `console.log` innecesarios en controladores ✅ (confirmado en auditoría)

#### Base de Datos
- [ ] Índices existentes son suficientes para el volumen esperado. Verificar con:
```javascript
// En MongoDB Atlas → Performance Advisor
// O desde mongosh:
db.appointments.getIndexes()
// Índices críticos a tener:
// { employee: 1, date: 1, timeSlot: 1 } — partialFilter ✅
// { clientPhone: 1 } — para búsquedas CRM
// { status: 1, date: 1 } — para getAll filtrado
// { bulkId: 1 } — para agrupar sesiones
```

---

### ☐ 2.3 Plan de Pruebas Manuales (QA)

#### 🧪 Suite A — Flujo de Agendamiento (ChatbotPage)

| # | Acción | Resultado Esperado |
|---|---|---|
| A1 | Ir a `/` → hacer clic en "Agenda tu cita" | Navega a `/chatbot` sin errores de consola |
| A2 | Seleccionar una especialista y un servicio | Los horarios del día se cargan dentro de 3 segundos |
| A3 | Seleccionar una fecha **pasada** (ayer) | El sistema debe rechazarla o no mostrar slots disponibles |
| A4 | Completar el flujo y agendar con teléfono válido | Mensaje de confirmación "Cita recibida" visible |
| A5 | Repetir A4 con el **mismo horario** desde otra pestaña simultáneamente | Solo una cita es creada; la segunda recibe error 409 |
| A6 | Intentar agendar **6+ citas** del mismo teléfono en 30 minutos | Recibir error 429 "Límite excedido" |
| A7 | Dejar el campo teléfono vacío y enviar | Mensaje de error "Teléfono celular requerido" visible |
| A8 | Seleccionar **"Disponibilidad flexible"** | El chatbot cambia al flujo flexible y solicita rangos de fecha |
| A9 | Completar una cita flexible | La cita aparece en el calendario del admin con ícono ✨ |

#### 🧪 Suite B — Panel de Admin (AdminCalendarPage)

| # | Acción | Resultado Esperado |
|---|---|---|
| B1 | Login con credenciales de admin | Redirige a `/admin` con nombre correcto en header |
| B2 | Login con contraseña incorrecta **10 veces** | Al intento 11: respuesta 429 "Demasiados intentos" |
| B3 | Ir a `/admin/calendario` → clic en un día con citas | Modal del día se abre con las citas listadas |
| B4 | Hacer clic en "✕ CANCELAR" en una cita | Aparecen los 2 diálogos de confirmación en secuencia |
| B5 | En B4, responder "Sí" en el segundo diálogo (fue el cliente) | La cita queda cancelada; WhatsApp **NO** se abre automáticamente |
| B6 | En B4, responder "No" en el segundo diálogo (fue el salón) | La cita queda cancelada; WhatsApp **SÍ** se abre automáticamente |
| B7 | Confirmar una cita pendiente | Status cambia a "Confirmada"; banner verde de WhatsApp aparece |
| B8 | Intentar confirmar en un slot ya ocupado | Se muestra error 409 "Horario no disponible" |
| B9 | Reagendar una cita como **empleada** (no admin) | La solicitud debe ser bloqueada (403) |
| B10 | Bloquear un día completo | El día aparece con "🚫 DÍA BLOQUEADO" en el calendario |
| B11 | Intentar agendar en el día bloqueado desde chatbot | No aparecen horarios disponibles |

#### 🧪 Suite C — Flujo de Empleadas

| # | Acción | Resultado Esperado |
|---|---|---|
| C1 | Login como empleada | Solo ve menú con sus permisos asignados |
| C2 | Intentar acceder a `/admin/configuracion` sin permiso | Redirige al dashboard; no expone la página |
| C3 | Acceder sin conexión al servidor (servidor apagado) | El fallback usa permisos del cache; no muestra páginas no autorizadas |
| C4 | El admin hace logout forzado (resetea `tokenVersion`) | La empleada logueada recibe 401 en próxima acción |
| C5 | Ver itinerario del día | Citas en orden cronológico con gaps entre servicios |

#### 🧪 Suite D — Seguridad

| # | Acción | Resultado Esperado |
|---|---|---|
| D1 | Enviar `{ "clientPhone": { "$gt": "" } }` en body de agendamiento | Error 400; no expone datos (sanitización activa) |
| D2 | Intentar acceder a `/api/employees` sin token | Respuesta 401 |
| D3 | Acceder a `/api/settlements` con token de empleada sin permiso | Respuesta 403 |
| D4 | Enviar `employeeId: "no-es-un-objectid"` a `/api/appointments/:id/reschedule` | Respuesta 400 "ID de especialista inválido" (parche 3 activo) |
| D5 | Liquidar citas de otra especialista enviando sus IDs | Respuesta 400 "Citas no válidas para liquidar" (parche 5 activo) |
| D6 | Verificar header de respuesta | Debe incluir `X-Content-Type-Options`, `X-Frame-Options` (helmet activo) |
| D7 | Comprobar que `/api/health` responde en < 500ms | Indicador de conectividad saludable |

#### 🧪 Suite E — UX Mobile

| # | Acción | Resultado Esperado |
|---|---|---|
| E1 | Abrir ChatbotPage en iPhone 12 (375px) | Sin scroll horizontal; texto legible |
| E2 | Tap en botón "Agendar" en mobile | Responde al primer tap (no requiere doble tap) |
| E3 | Abrir modal del calendario en móvil | Bottom sheet visible; botones tap-friendly (≥44px) |
| E4 | Usar el campo de fecha en Android | Selector de fecha nativo del sistema operativo |

---

### ☐ 2.4 Backlog Técnico — Priorizado Post-Lanzamiento

#### 🔴 P1 — Urgente (primeras 2 semanas post-launch)

| ID | Tarea | Esfuerzo | Impacto |
|---|---|---|---|
| BL-01 | **Implementar ErrorBoundary en React** | 30 min | Evita pantallas en blanco para todos los usuarios |
| BL-02 | **Reactivar Morgan + agregar error logging persistente** | 1h | Sin esto, los bugs de producción son invisibles |
| BL-03 | **Configurar `vite.config.ts` con code splitting** | 30 min | Mejora TTI (Time to Interactive) en móvil ~40% |
| BL-04 | **Corregir puerto fallback** `localhost:5001` → `5000` en `api.ts` | 5 min | Evita confusión en dev sin `.env` |

#### 🟠 P2 — Importante (primer mes)

| ID | Tarea | Esfuerzo | Impacto |
|---|---|---|---|
| BL-05 | **Configurar Sentry.io** (o similar) para error tracking automático | 2h | Alertas en tiempo real de errores en producción |
| BL-06 | **Minify touch targets ≥ 44px** en modales del calendario | 1h | Usabilidad móvil admin |
| BL-07 | **Agregar índices de MongoDB** para `clientPhone` y `bulkId` | 30 min | Consultas CRM más rápidas bajo carga |
| BL-08 | **Implementar `compression` middleware** para Gzip en Express | 15 min | Reduce tamaño de respuestas JSON ~70% |

```bash
# BL-08:
npm install compression
# En server.js, antes de las rutas:
const compression = require('compression');
app.use(compression());
```

#### 🟡 P3 — Mejoras (segundo mes)

| ID | Tarea | Esfuerzo | Impacto |
|---|---|---|---|
| BL-09 | **Tests automatizados E2E** con Playwright para flujos críticos de agendamiento | 2d | Cobertura de regresiones |
| BL-10 | **Paginación en `getAll` appointments** para el calendario — ya hay base pero sin UI | 4h | Necesario cuando las citas superen 500 documentos |
| BL-11 | **Redis para rate limiting distribuido** (si se escala a múltiples instancias) | 1d | Actualmente el rate limit es por proceso, no compartido |
| BL-12 | **Notificaciones WhatsApp vía API oficial** (Twilio/360dialog) reemplazando el link manual | 3d | Automatización real; elimina intervención del admin |
| BL-13 | **Internacionalización de fechas** — actualmente hardcodeado en `es-CO` | 4h | Preparación para expansión |

---

## FASE 3 — Integración con AI_CONTEXT.md

### Mapa de Documentación del Sistema

Los tres archivos de documentación técnica forman un sistema complementario. Cualquier desarrollador futuro — humano o agente IA — debe leerlos en este orden:

```
1. MASTER_SYS_CONTEXT.md   → ¿QUÉ es el sistema? (negocio, reglas, glosario)
           ↓
2. AI_CONTEXT.md            → ¿CÓMO funciona? (arquitectura, código, convenciones)
           ↓
3. PRODUCTION_READY.md     → ¿CÓMO se mantiene vivo? (ops, QA, backlog)
           ↓
4. AUDIT_REPORT.md          → ¿QUÉ riesgos tiene? (seguridad, diagramas)
```

### Guía de Referencia Rápida para Desarrolladores Futuros

| Situación | Documento a consultar | Sección |
|---|---|---|
| "¿Qué significa estado `pending`?" | `AI_CONTEXT.md` | §3 Glosario de Estados |
| "¿Cómo agrego un nuevo módulo de permisos?" | `AI_CONTEXT.md` | §8 Flujos Críticos |
| "La app está en blanco en producción" | `PRODUCTION_READY.md` | Fase 1 → ErrorBoundary |
| "¿Qué variables de entorno necesito?" | `PRODUCTION_READY.md` | §2.1 Infraestructura |
| "Hay un bug de doble cancelación" | `AUDIT_REPORT.md` → `AI_CONTEXT.md` | Hallazgo 2 → §5 Convenciones |
| "¿Cómo testeo el flujo de agendamiento?" | `PRODUCTION_READY.md` | §2.3 Suite A |
| "Quiero escalar a múltiples instancias" | `PRODUCTION_READY.md` | BL-11 (Redis) |
| "Hay una race condition en bulk" | `AUDIT_REPORT.md` | Hallazgo 1 |

### Protocolo de Mantenimiento Mensual

Ejecutar estas verificaciones el primer lunes de cada mes:

```bash
# 1. Verificar que MongoDB Atlas no tenga slow queries
#    → Atlas UI → Performance Advisor → Operations sin índice

# 2. Rotar JWT_SECRET si ha habido sospechas de compromiso
#    → Actualizar env var en la plataforma
#    → Todos los usuarios serán deslogueados automáticamente

# 3. Revisar logs de errores del mes anterior
#    → Railway/Render → Logs → filtrar por "Error" o status 500

# 4. Verificar que los índices de MongoDB siguen siendo óptimos
db.appointments.explain("executionStats").find({ status: "confirmed", date: { $gte: new Date() } })

# 5. Revisar rate limit — si hay muchos 429, el salón puede estar siendo víctima de scraping
#    → Ajustar limits en server.js según el análisis

# 6. Ejecutar test-backend.js contra producción (con credenciales de test)
node server/test-backend.js
```

### Criterios de "Go/No-Go" para el Lanzamiento

Todos los ítems de esta lista deben ser ✅ antes de anunciar el sistema al público:

**Go/No-Go Checklist:**
- [ ] Suite A de QA completa sin fallos (agendamiento público)
- [ ] Suite B de QA completa sin fallos (panel admin)
- [ ] Suite D de QA completa sin fallos (seguridad)
- [ ] SSL activo y verificado (`https://` en la URL del frontend)
- [ ] Variables de entorno en producción verificadas (especialmente `ADMIN_PASSWORD` como hash BCrypt)
- [ ] `NODE_ENV=production` confirmado (verificar via `GET /api/health`)
- [ ] MongoDB Atlas: backups automáticos habilitados
- [ ] ErrorBoundary implementado (BL-01) — **no lanzar sin esto**
- [ ] Morgan reactivado para logging básico (BL-02) — **no lanzar sin esto**
- [ ] Revisión de al menos 1 cita de prueba end-to-end (chatbot → admin → confirmación)

---

> [!CAUTION]
> **Si el servidor está bajo carga alta (>50 usuarios simultáneos):** El rate limit de 100 req/15min por IP puede afectar a usuarios legítimos que comparten IP (ej. todo un edificio de oficinas detrás de un NAT). Considerar implementar el rate limit basado en `userId` para usuarios autenticados y reservar el limit por IP solo para rutas públicas.

> [!WARNING]
> **Punto de falla único actual:** El sistema no tiene ninguna instancia de failover. Si el servidor Node.js cae, toda la operación del salón se detiene — incluyendo la visualización del calendario por las especialistas. Para un salón activo, configurar alertas de uptime (UptimeRobot, Better Uptime) es **obligatorio antes del lanzamiento**.

> [!NOTE]
> **Sobre WhatsApp:** El sistema actual abre links `wa.me` que requieren que el admin haga clic manualmente. Esto significa que si el admin no está activo, los clientes no reciben notificaciones. El BL-12 (API oficial de WhatsApp) es la evolución natural para automatizar esto completamente.
