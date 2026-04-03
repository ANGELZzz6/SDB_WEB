# 📖 Sistema de Gestión L'Élixir - Master Context & Business Logic

Este documento sirve como transferencia de contexto técnico y de negocio. Detalla la arquitectura actual, las reglas de persistencia, el motor de Business Intelligence (BI) y el sistema de personalización dinámica.

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

---

## 📊 3. Motor de Business Intelligence (BI)

Transforma datos operativos en indicadores estratégicos.

### A. Integridad Financiera (`priceSnapshot`)
- El modelo `Appointment` incluye un campo `priceSnapshot` que captura el precio en el momento de la reserva.

### B. Métricas de Retención (Smart Risk)
- **Frecuencia (`visitFrequency`)**: Calculada históricamente.
- **Detección de Riesgo (`isAtRisk`)**: Activada si `días_desde_última_visita > (frecuencia_habitual * 2)`.

---

## 📅 4. Motor de Agendamiento y Disponibilidad

### A. Capa de Disponibilidad Proactiva (`disponibleHoy`)
- Los especialistas pueden activar/desactivar su agenda diaria manualmente, afectando al chatbot en tiempo real.

### B. Sistema de Bloqueos Inteligentes (`BlockedSlot`)
- Soporta bloqueos globales y por especialista con motivos (reasons) visibles para el cliente.

---

## 🎨 5. CMS Visual y Motor de Branding Dinámico

Implementado para permitir cambios de identidad visual sin intervención técnica.

### A. Modelo Singleton `SiteConfig`
- Solo existe un documento en la colección `siteconfigs` (gestión vía `findOne/findOneAndUpdate`).
- Almacena: Horarios, Redes Sociales, Textos de Marketing y URLs de imágenes (Cloudinary).

### B. Inyección de Branding (CSS Variables)
- El sistema utiliza variables CSS (`--color-primary`, etc.) inyectadas dinámicamente en el `:root` desde el frontend al cargar la app.
- El panel administrativo permite una previsualización en tiempo real del branding antes de persistir los cambios.

---

## 📂 6. Archivos Clave para el Futuro Agente

- **Personalización (CMS)**: `server/models/SiteConfig.js`, `server/controllers/siteConfigController.js`.
- **Lógica CRM/BI**: `server/controllers/clientController.js`.
- **Sincronización**: `server/controllers/appointmentController.js`.
- **Disponibilidad**: `server/controllers/availabilityController.js`.
- **Modelos**: `server/models/Client.js`, `server/models/Appointment.js`, `server/models/BlockedSlot.js`, `server/models/SiteConfig.js`.
- **Seguridad**: `server/middleware/auth.js`, `server/middleware/checkPermission.js`.
- **Frontend Core**: `client/src/App.tsx`, `client/src/lib/adminTokens.ts`.
- **Frontend CMS**: `client/src/pages/AdminSettingsPage.tsx` (Sección Personalización).

---

> [!NOTE]
> Este sistema está diseñado para ser modular. Cualquier lógica nueva de automatización debe basarse en las métricas de `visitFrequency` y el motor de branding dinámico implementado.
