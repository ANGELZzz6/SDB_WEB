const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/employeeController')
const { authMiddleware, requireRole, optionalAuth } = require('../middleware/auth')

// ── Rutas PÚBLICAS (chatbot, landing page) ───────────────────────────────────

// GET /api/employees — lista empleadas activas (público para chatbot, con auth opcional permite inactivos a admin)
router.get('/', optionalAuth, ctrl.getAll)

// GET /api/employees/:id — ver una empleada
router.get('/:id', optionalAuth, ctrl.getOne)

// ── Rutas PROTEGIDAS (admin) ─────────────────────────────────────────────────

// POST /api/employees — crear empleada
router.post('/', authMiddleware, requireRole('admin'), ctrl.create)

// PUT /api/employees/:id — editar empleada
router.put('/:id', authMiddleware, requireRole('admin'), ctrl.update)

// DELETE /api/employees/:id — desactivar (soft-delete)
router.delete('/:id', authMiddleware, requireRole('admin'), ctrl.deactivate)

// PATCH /api/employees/:id/reactivate — reactivar empleada
router.patch('/:id/reactivate', authMiddleware, requireRole('admin'), ctrl.reactivate)

module.exports = router
