const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/blockedSlotController')
const { authMiddleware, requireRole } = require('../middleware/auth')

// ── Todas las rutas de blocked-slots requieren ser admin ─────────────────────

// GET /api/blocked-slots
router.get('/', authMiddleware, requireRole('admin'), ctrl.getAll)

// POST /api/blocked-slots
router.post('/', authMiddleware, requireRole('admin'), ctrl.create)

// PUT /api/blocked-slots/:id
router.put('/:id', authMiddleware, requireRole('admin'), ctrl.update)

// DELETE /api/blocked-slots/:id
router.delete('/:id', authMiddleware, requireRole('admin'), ctrl.remove)

module.exports = router
