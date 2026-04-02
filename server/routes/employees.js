const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/employeeController')
const { authMiddleware, requireRole, optionalAuth } = require('../middleware/auth')
const checkPermission = require('../middleware/checkPermission')

// ── Rutas PÚBLICAS (chatbot, landing page) ───────────────────────────────────

// GET /api/employees — lista empleadas activas (público para chatbot, con auth opcional permite inactivos a admin)
router.get('/', optionalAuth, ctrl.getAll)

// GET /api/employees/:id — ver una empleada
router.get('/:id', optionalAuth, ctrl.getOne)

// ── Rutas PROTEGIDAS (admin o especialista con permiso 'especialistas') ──────

// Perfil propio — cualquier usuario autenticado (la validación de ID se hace en el controlador)
router.put('/profile', authMiddleware, ctrl.updateProfile)

// POST /api/employees — crear empleada
router.post('/', authMiddleware, checkPermission('especialistas'), ctrl.create)

// PUT /api/employees/:id — editar empleada
router.put('/:id', authMiddleware, checkPermission('especialistas'), ctrl.update)

// DELETE /api/employees/:id — desactivar (soft-delete)
router.delete('/:id', authMiddleware, checkPermission('especialistas'), ctrl.deactivate)

// PATCH /api/employees/:id/reactivate — reactivar empleada
router.patch('/:id/reactivate', authMiddleware, checkPermission('especialistas'), ctrl.reactivate)

// PATCH /api/employees/:id/disponibilidad — cambiar disponibleHoy
router.patch('/:id/disponibilidad', authMiddleware, ctrl.updateAvailability)

module.exports = router
