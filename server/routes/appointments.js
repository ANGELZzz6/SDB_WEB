const express = require('express')
const router = express.Router()
const apptCtrl = require('../controllers/appointmentController')
const availCtrl = require('../controllers/availabilityController')
const { authMiddleware, optionalAuth, requireRole } = require('../middleware/auth')
const checkPermission = require('../middleware/checkPermission')

// ── Disponibilidad — PÚBLICA (chatbot la necesita sin login) ─────────────────
// GET /api/appointments/availability/:employeeId/:date?serviceId=...
router.get(
  '/availability/:employeeId/:date',
  availCtrl.getAvailability
)

// ── Estadísticas y Clientes — solo admin o especialista con permiso ────────────────────────────────────────────────
router.get('/stats', authMiddleware, checkPermission('citas'), apptCtrl.getStats)

// GET /api/appointments/clients
router.get('/clients', authMiddleware, checkPermission('clientes'), apptCtrl.getClients)

// ── CRUD de citas ─────────────────────────────────────────────────────────────

// GET /api/appointments — autenticado (admin ve todas, empleada solo las suyas)
router.get('/', authMiddleware, apptCtrl.getAll)

// GET /api/appointments/itinerary/:employeeId/:date
router.get('/itinerary/:employeeId/:date', authMiddleware, apptCtrl.getItinerary)

// GET /api/appointments/:id
router.get('/:id', authMiddleware, apptCtrl.getOne)

// POST /api/appointments/bulk — PÚBLICO (clientes agendan múltiples servicios)
router.post('/bulk', apptCtrl.createBulk)

// POST /api/appointments — PÚBLICO (clientes agendan desde chatbot)
router.post('/', apptCtrl.create)

// PUT /api/appointments/:id — admin o empleada dueña
router.put('/:id', authMiddleware, apptCtrl.update)

// PATCH /api/appointments/:id/complete — admin o empleada dueña 
router.patch('/:id/complete', authMiddleware, apptCtrl.complete)

// PATCH /api/appointments/:id/reschedule — admin O la empleada dueña de la cita
// BUG 3 FIX: Se reemplaza requireRole('admin') por ownership check en el controlador
router.patch('/:id/reschedule', authMiddleware, apptCtrl.reschedule)

// DELETE /api/appointments/:id — cancelar (admin, empleada dueña, o cliente con validación)
router.delete('/:id', optionalAuth, apptCtrl.cancel)

module.exports = router
