# Reporte del Proyecto: L'Élixir Salon Management Platform

Este documento detalla la naturaleza, arquitectura y lógica específica del sistema diseñado para **L'Élixir Salon**, una plataforma integral de gestión para salones de belleza de alta gama.

---

## 1. Concepto General
La web es una solución **B2C (Business to Consumer)** y **SaaS (Software as a Service) privado** que combina una experiencia de lujo para el cliente con una herramienta de administración potente.

*   **Público objetivo**: Clientes que buscan servicios de belleza de lujo.
*   **Usuarios internos**: El Administrador (dueño del salón) y los Especialistas (estilistas, manicuristas, etc.).

---

## 2. Arquitectura de la Solución
El sistema sigue una arquitectura de **Capa Desacoplada**:
*   **Frontend**: React + TypeScript (Vite). Enfocado en una estética "premium" con tipografía refinada y micro-animaciones.
*   **Backend**: Node.js + Express. API RESTful que maneja la lógica de negocio y persistencia.
*   **Base de Datos**: MongoDB Atlas (NoSQL). Ideal para la flexibilidad de los horarios y perfiles de empleados.
*   **Almacenamiento**: Cloudinary. Gestión de imágenes de alta resolución para la galería y perfiles.

---

## 3. Módulos Principales

### A. Landing Page (Pública)
Punto de entrada para el cliente. Presenta la marca, los servicios destacados, el equipo de especialistas y una galería visual del trabajo realizado.

### B. Chatbot de Agendamiento
Ubicado en `/chatbot`. Es un flujo guiado que permite al cliente agendar una cita en tiempo real sin intervención humana.
*   **Flujo**: Selección de Especialista → Servicio → Fecha → Hora (solo slots disponibles) → Datos personales → Confirmación.

### C. Panel Administrativo (Admin Dashboard)
Ubicado en `/admin`. Es el núcleo de la operación.

---

## 4. Funcionalidades del Administrador (Prioridad)

El panel administrativo está dividido en secciones clave, cada una con una lógica específica:

### 1. Resumen (Dashboard)
*   **Lógica**: Muestra estadísticas mensuales (citas confirmadas vs canceladas), servicios más populares y un listado de las citas del día actual.
*   **Citas Pendientes**: Sección especial para confirmar o rechazar citas solicitadas por el chatbot.

### 2. Calendario & Bloqueos
*   **Visualización**: Vista de agenda por especialista.
*   **Bloqueos**: Permite cerrar horarios específicos (almuerzos) o días completos (festivos/vacaciones), impidiendo que el chatbot ofrezca esos horarios.

### 3. Servicios
*   **Gestión**: Control de precios, duraciones y fotos de cada servicio. 
*   **Impacto**: La duración del servicio define automáticamente cuántos "slots" ocupa en la agenda.

### 4. Especialistas
*   **Configuración**: Gestión del equipo, sus fotos y descripciones.
*   **Horarios Personalizados**: Cada especialista tiene su propio horario de entrada/salida por cada día de la semana.

### 5. Clientes
*   **CRM Básico**: Listado de clientes con su historial de visitas, servicios realizados y "Especialista Preferido" (calculado por frecuencia).

### 6. Galería (Portfolio)
*   **Lógica**: Organización de fotos por categorías para mostrar en la landing page.

### 7. Control de Accesos (Seguridad)
*   **Gestión de Cuentas**: El Admin crea correos y contraseñas para los especialistas.
*   **Permisos Dinámicos**: El Admin puede habilitar o deshabilitar secciones específicas para cada especialista (ej: permitir que un estilista vea la galería pero no la configuración de precios).

---

## 5. Lógica Específica y Archivos Clave

### A. Lógica de Disponibilidad (`server/controllers/availabilityController.js`)
Es la parte más compleja del backend. Calcula los huecos libres cruzando:
1.  Horario base del especialista.
2.  Citas ya agendadas.
3.  Bloqueos manuales (BlockedSlots).
4.  Buffer de tiempo (descanso entre citas configurado en Settings).

### B. Sistema de Seguridad (`server/middleware/auth.js`)
*   **JWT**: Genera tokens que expiran para mantener la sesión segura.
*   **Granularidad**: No solo distingue entre `admin` y `empleada`, sino que verifica permisos individuales almacenados en el perfil de cada empleado.

### C. Diseño de Interfaz (`client/src/lib/adminTokens.ts`)
Define el **Sistema de Diseño** del admin (colores, fuentes, sombras). Todo el panel de admin hereda estos tokens para mantener una estética coherente y lujosa.

---

## 6. Estructura de Archivos (Resumen)

| Archivo/Carpeta | Función |
| :--- | :--- |
| `client/src/App.tsx` | Enrutador principal y definición de rutas protegidas. |
| `client/src/pages/AdminPage.tsx` | Pantalla principal (Dashboard) del admin. |
| `client/src/pages/AdminAccessPage.tsx` | Lógica de gestión de permisos y cuentas. |
| `server/models/Appointment.js` | Modelo de datos que define qué es una cita. |
| `server/controllers/appointmentController.js` | Lógica para crear, cancelar y procesar citas. |
| `server/routes/` | Define los puntos de entrada (URLs) de la API. |
| `client/src/services/api.ts` | El puente que conecta el frontend con el backend. |

---
