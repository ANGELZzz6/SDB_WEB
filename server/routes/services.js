const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/serviceController')
const { authMiddleware, requireRole, optionalAuth } = require('../middleware/auth')
const checkPermission = require('../middleware/checkPermission')

// ── Rutas PÚBLICAS ────────────────────────────────────────────────────────────

// GET /api/services — lista servicios activos (público para landing y chatbot)
router.get('/', optionalAuth, ctrl.getAll)

// GET /api/services/:id
router.get('/:id', optionalAuth, ctrl.getOne)

// ── Rutas PROTEGIDAS (admin o especialista con permiso) ───────────────────────

// POST /api/services
router.post('/', authMiddleware, checkPermission('servicios'), ctrl.create)

// PUT /api/services/:id
router.put('/:id', authMiddleware, checkPermission('servicios'), ctrl.update)

// DELETE /api/services/:id — soft-delete
router.delete('/:id', authMiddleware, checkPermission('servicios'), ctrl.deactivate)

// PATCH /api/services/:id/reactivate
router.patch('/:id/reactivate', authMiddleware, checkPermission('servicios'), ctrl.reactivate)

module.exports = router
