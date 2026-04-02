const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/blockedSlotController')
const { authMiddleware, requireRole } = require('../middleware/auth')
const checkPermission = require('../middleware/checkPermission')

// ── Rutas de bloqueos (requieren auth) ────────────────────────────────────────

// GET /api/blocked-slots — accesible por admin y empleada (para ver el calendario)
router.get('/', authMiddleware, ctrl.getAll)

// POST /api/blocked-slots — admin o especialista con permiso 'calendario'
router.post('/', authMiddleware, checkPermission('calendario'), ctrl.create)

// PUT /api/blocked-slots/:id
router.put('/:id', authMiddleware, checkPermission('calendario'), ctrl.update)

// DELETE /api/blocked-slots/:id
router.delete('/:id', authMiddleware, checkPermission('calendario'), ctrl.remove)

module.exports = router
