# 📖 Sistema de Gestión L'Élixir - Master Context & Business Logic

Este documento sirve como transferencia de contexto técnico y de negocio. Detalla la arquitectura actual, las reglas de persistencia y el motor de Business Intelligence (BI) implementado.

---

## 🏗️ 1. Arquitectura de Seguridad (PBAC)

Hemos migrado de un sistema basado en roles fijos a uno de **Control de Acceso Basado en Permisos (PBAC)** dinámico.

- **Middlewares Críticos**:
    - `authMiddleware.js`: Convierte el JWT en un objeto `req.user`. Si el usuario es una "empleada", hace una query en tiempo real a la colección `Employee` para obtener sus `permissions`.
    - `checkPermission.js`: Valida si el módulo solicitado (ej: `'clientes'`, `'servicios'`) está activo en el objeto de permisos del usuario. Los administradores tienen un bypass total.
- **Estructura de Permisos**:
  `{ citas: bool, clientes: bool, servicios: bool, especialistas: bool, galeria: bool, configuracion: bool, liquidaciones: bool }`

---

## 👤 2. Gestión de Clientes y CRM

El sistema utiliza un modelo de persistencia híbrido para garantizar integridad histórica y facilidad de uso.

### A. Colección `Client` vs `Appointments`
- Históricamente, los clientes se derivaban de las citas.
- **Estado Actual**: Existe una colección `Client` que actúa como fuente de verdad para el estado de activación (`isActive`).
- **Sincronización Automática**: Al crear una cita, el `appointmentController` intenta registrar al cliente usando `findOneAndUpdate` con `$setOnInsert`. Esto asegura que si un cliente fue desactivado manualmente, no se reactive solo por agendar una nueva cita.

### B. Normalización de Datos
- Se utiliza `server/utils/normalize.js` (`normalizePhone`) en cada interacción con teléfonos.
- **Regla**: Solo dígitos. Esto evita duplicados como `"+57 300"` y `"300"`.

---

## 📊 3. Motor de Business Intelligence (BI)

La joya de la corona del sistema. Transforma datos operativos en indicadores estratégicos.

### A. Integridad Financiera (`priceSnapshot`)
- El modelo `Appointment` incluye un campo `priceSnapshot`.
- **Lógica**: Al crear o actualizar una cita (si cambia el servicio), se captura el precio actual del servicio. Así, si los precios del salón suben mañana, el historial de gasto del cliente no se distorsiona.

### B. Métricas de Retención (Smart Risk)
- **Frecuencia (`visitFrequency`)**: Calculada como `(última - primera) / (n - 1)` días.
- **Detección de Riesgo (`isAtRisk`)**: Un cliente entra en riesgo si `días_desde_última_visita > (frecuencia_habitual * 2)`. Si no hay historial, el default es 30 días.

### C. Segmentación (Tiers)
Clasificación dinámica por "Lifetime Value" (LTV):
- **🟣 VIP**: Gasto > 300,000.
- **🔵 Medio**: Gasto 100,000 - 300,000.
- **⚪ Básico**: Gasto < 100,000.

### D. Patrones de Consumo
- **Servicio Estrella**: Identifica el servicio más reservado por el cliente.
- **Próxima Visita**: Proyecta una fecha estimada de regreso basada en su frecuencia histórica (Clamped entre 1-120 días).

---

## 📅 4. Motor de Agendamiento y Disponibilidad

El sistema gestiona la agenda con precisión quirúrgica usando tres capas de validación:

### A. Capa de Disponibilidad Proactiva (`disponibleHoy`)
- Cada especialista tiene un toggle en su perfil que activa/desactiva su agenda para el día en curso.
- **Persistencia**: Campo `disponibleHoy` en el modelo `Employee`.
- **Impacto**: Si es `false`, el chatbot y el calendario público ocultan automáticamente todos los slots de esa especialista para "Hoy" (Bogotá Time).

### B. Sistema de Bloqueos Inteligentes (`BlockedSlot`)
- Soporta bloqueos **Globales** (ej: cierre por festivo) y por **Especialista** (ej: cita médica).
- **Transparencia**: El campo `reason` permite informar al cliente el motivo del bloqueo (ej: "Mantenimiento local") directamente en el flujo de reserva.
- **Prioridad**: Los bloqueos `isFullDay` tienen precedencia sobre la generación de slots.

### C. Consistencia de Zona Horaria
- Todas las comparaciones de "Hoy" utilizan `America/Bogota` de forma estricta:
  `new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })`
- Esto evita que citas se pierdan o se dupliquen por desfases entre el servidor (UTC) y la operación local.

---

## 🛠️ 4. Optimizaciones Técnicas

Para soportar el crecimiento, se han implementado:
- **Índices Compuestos**: `Appointment.index({ clientPhone: 1, date: -1 })` para que la carga de historiales sea instantánea.
- **Aggregations Eficientes**: El listado general de clientes mezcla datos de la colección `Client` y `Appointment` usando un `Map` para deduplicación y prioridad de base de datos.
- **Frontend CRM**: Una página de detalle dedicada `AdminClientDetailPage.tsx` que consume el endpoint analítico `GET /api/clients/:phone`.

---

## 📂 5. Archivos Clave para el Futuro Agente

- **Lógica CRM/BI**: `server/controllers/clientController.js`
- **Sincronización**: `server/controllers/appointmentController.js` (métodos `create` y `update`).
- **Disponibilidad**: `server/controllers/availabilityController.js` (Lógica de slots y bloqueos).
- **Modelos**: `server/models/Client.js`, `server/models/Appointment.js`, `server/models/BlockedSlot.js`.
- **Seguridad**: `server/middleware/auth.js`, `server/middleware/checkPermission.js`.
- **Frontend Core**: `client/src/App.tsx` (Guarda de rutas), `client/src/lib/adminTokens.ts` (Config de navegación).
- **Frontend CRM**: `client/src/pages/AdminClientDetailPage.tsx`.

---

> [!NOTE]
> Este sistema está diseñado para ser modular. Cualquier lógica nueva de automatización (ej: envíos de WhatsApp) debe basarse en las métricas de `visitFrequency` y `nextSuggestedVisit` ya calculadas en el controlador de clientes.
