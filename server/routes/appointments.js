const express = require('express')
const router = express.Router()
const apptCtrl = require('../controllers/appointmentController')
const availCtrl = require('../controllers/availabilityController')
const { authMiddleware, requireRole } = require('../middleware/auth')

// ── Disponibilidad — PÚBLICA (chatbot la necesita sin login) ─────────────────
// GET /api/appointments/availability/:employeeId/:date?serviceId=...
router.get(
  '/availability/:employeeId/:date',
  availCtrl.getAvailability
)

// ── Estadísticas y Clientes — solo admin ────────────────────────────────────────────────
// GET /api/appointments/stats
router.get('/stats', authMiddleware, requireRole('admin'), apptCtrl.getStats)

// GET /api/appointments/clients
router.get('/clients', authMiddleware, requireRole('admin'), apptCtrl.getClients)

// ── CRUD de citas ─────────────────────────────────────────────────────────────

// GET /api/appointments — autenticado (admin ve todas, empleada solo las suyas)
router.get('/', authMiddleware, apptCtrl.getAll)

// GET /api/appointments/:id
router.get('/:id', authMiddleware, apptCtrl.getOne)

// POST /api/appointments — PÚBLICO (clientes agendan desde chatbot)
router.post('/', apptCtrl.create)

// PUT /api/appointments/:id — admin o empleada dueña
router.put('/:id', authMiddleware, apptCtrl.update)

// PATCH /api/appointments/:id/reschedule — admin solo
router.patch('/:id/reschedule', authMiddleware, requireRole('admin'), apptCtrl.reschedule)

// DELETE /api/appointments/:id — cancelar (admin, empleada dueña, o cliente)
// Sin restricción de horas según reglas de negocio
router.delete('/:id', apptCtrl.cancel)

module.exports = router
