const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/productController')
const { authMiddleware, optionalAuth } = require('../middleware/auth')
const checkPermission = require('../middleware/checkPermission')

// ── Rutas PÚBLICAS ────────────────────────────────────────────────────────────

// GET /api/products/categorias — lista de categorías únicas (debe ir antes de /:id)
router.get('/categorias', ctrl.getCategorias)

// GET /api/products — lista pública (costo oculto para no-admin)
router.get('/', optionalAuth, ctrl.getAll)

// GET /api/products/:id — detalle público (costo oculto para no-admin)
router.get('/:id', optionalAuth, ctrl.getOne)

// ── Rutas PROTEGIDAS (admin o empleada con permiso 'productos') ───────────────

// POST /api/products
router.post('/', authMiddleware, checkPermission('productos'), ctrl.create)

// PUT /api/products/:id
router.put('/:id', authMiddleware, checkPermission('productos'), ctrl.update)

// DELETE /api/products/:id — soft-delete
router.delete('/:id', authMiddleware, checkPermission('productos'), ctrl.deactivate)

// PATCH /api/products/:id/reactivate
router.patch('/:id/reactivate', authMiddleware, checkPermission('productos'), ctrl.reactivate)

module.exports = router
