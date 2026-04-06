# 📖 Sistema de Gestión L'Élixir - Master Context & Business Logic

Este documento es la única fuente de verdad (SSOT) del proyecto. Consolida el contexto de negocio, arquitectura técnica, sistema de diseño y reglas críticas.

---

## 🏗️ 1. Arquitectura y Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Tailwind CSS (v4).
- **Backend**: Node.js + Express.
- **Base de Datos**: MongoDB Atlas (Mongoose).
- **Multimedia**: Cloudinary (Imágenes de empleados y galería).
- **Seguridad (PBAC)**: Control de acceso basado en permisos dinámicos + JWT.
- **Notificaciones**: WhatsApp Business (via API o librerías bridge).

### Estructura de Seguridad
- `authMiddleware.js`: Intercepta el token. Si es Rol `'admin'`, otorga bypass. Si es `'empleada'`, carga permisos desde la DB.
- **Virtual Admin**: Existe una cuenta "maestra" virtual (no está en la DB de empleados) que se intercepta en el backend (`authController.js`) comparando el ID o el Rol `'admin'`. Esto previene errores de "Cast to ObjectId" en la base de datos.
- **Persistencia de Sesión**: Los especialistas tienen un `tokenVersion` para invalidar sesiones antiguas (cierre de sesión dinámico).

---

## 👤 2. Modelos de Datos y Business Intelligence

### Core Entities
- **Employee**: Gestiona perfil, especialidades, horario personalizado y permisos. 
    - *Regla*: `isActive` es obligatorio para login.
- **Service**: Servicios con duración (minutos), precio y empleados asignados.
- **Appointment**: Citas con `priceSnapshot` (precio capturado al agendar) y `endTime` calculado.
- **Client**: Colección CRM que rastrea `ltv` (lifetime value), frecuencia de visitas y riesgos de deserción.

### Motor de BI & CRM
- **Sincronización Automática**: Al completar una cita, se actualizan las métricas del cliente en la colección `Client`.
- **Price Integrity**: Siempre usar `priceSnapshot` para reportes financieros, ignorando cambios posteriores en el precio del servicio base.

---

## 🎨 3. Sistema de Diseño (The Ethereal Editor)

El diseño busca una estética premium, minimalista y botánica (colores palo de rosa y cafés cálidos).

### Tokens de Color (Muestra)
| Token | Hex | Uso |
|---|---|---|
| `primary` | `#944555` | Acentos, botones, marca |
| `surface` | `#FDF8F5` | Fondo crema cálido (Base) |
| `secondary` | `#7D5630` | Íconos, elementos táctiles |
| `on-surface` | `#1C1B1A` | Texto principal (No usar #000) |

### Tipografía
- **Headlines**: `Noto Serif` (Google Fonts). Uso de *italic* para énfasis elegante.
- **Body/Actions**: `Plus Jakarta Sans`.

---

## 📅 4. Lógica de Agendamiento y Disponibilidad

### Reglas Críticas
1. **Buffer**: Espacio configurable entre citas (default 10min).
2. **Disponibilidad Proactiva**: El flag `disponibleHoy` en `Employee` puede cerrar la agenda instantáneamente si el especialista lo decide.
3. **Bloqueos**: Los `BlockedSlot` pueden ser totales (día completo) o parciales (hora específica).
4. **Validación de Slots**: El backend calcula slots disponibles restando `Citas Existentes + Duración Servicio + Buffer + Bloqueos`.

---

## 🛠️ 5. Mantenimiento y Herramientas

- **Pruebas**: Usar `server/test-backend.js` para validación integral de endpoints (Auth, CRUD, Flujos).
- **CMS**: La colección `siteconfigs` (Singleton) gestiona horarios globales, mensajes de confirmación y RRSS.
- **Documentación Redundante**: Se han eliminado `AGENT.md` y `DESIGN.md` en favor de este documento.

---

> [!IMPORTANT]
> **Seguridad Médula**: Nunca realices un `findById` sobre un usuario sin validar primero si es el administrador virtual (`req.user.id === 'admin'`). En consultas de empleados, siempre incluir `isActive` en el `.select()` para evitar errores de validación de estado.

> [!TIP]
> Para depurar el flujo de autenticación, revisa `server/controllers/authController.js` método `me`.
