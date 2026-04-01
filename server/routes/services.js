const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/serviceController')
const { authMiddleware, requireRole, optionalAuth } = require('../middleware/auth')

// ── Rutas PÚBLICAS ────────────────────────────────────────────────────────────

// GET /api/services — lista servicios activos (público para landing y chatbot)
router.get('/', optionalAuth, ctrl.getAll)

// GET /api/services/:id
router.get('/:id', optionalAuth, ctrl.getOne)

// ── Rutas PROTEGIDAS (admin) ─────────────────────────────────────────────────

// POST /api/services
router.post('/', authMiddleware, requireRole('admin'), ctrl.create)

// PUT /api/services/:id
router.put('/:id', authMiddleware, requireRole('admin'), ctrl.update)

// DELETE /api/services/:id — soft-delete
router.delete('/:id', authMiddleware, requireRole('admin'), ctrl.deactivate)

// PATCH /api/services/:id/reactivate
router.patch('/:id/reactivate', authMiddleware, requireRole('admin'), ctrl.reactivate)

module.exports = router
