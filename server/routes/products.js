const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/productController')
const { authMiddleware, optionalAuth } = require('../middleware/auth')
const checkPermission = require('../middleware/checkPermission')

// ── Rutas PÚBLICAS ────────────────────────────────────────────────────────────

// GET /api/products/categorias — lista de categorías únicas
router.get('/categorias', ctrl.getCategorias)

// POST /api/products/checkout (Público - registro temporal de egreso)
router.post('/checkout', ctrl.checkout)

// GET /api/products — lista pública (costo oculto para no-admin)
router.get('/', optionalAuth, ctrl.getAll)

// GET /api/products/:id — detalle público (costo oculto para no-admin)
router.get('/:id', optionalAuth, ctrl.getOne)

// ── Rutas PROTEGIDAS (admin o empleada con permiso 'productos') ───────────────

// NOTA: Agregar sanitización de inputs en los controladores correspondientes

// POST /api/products
router.post('/', authMiddleware, checkPermission('productos'), ctrl.create)

// GET /api/products/:id/movements — ver movimientos del producto
router.get('/:id/movements', authMiddleware, checkPermission('productos'), ctrl.getProductMovements)

// POST /api/products/:id/movements — crear movimiento manual
router.post('/:id/movements', authMiddleware, checkPermission('productos'), ctrl.createMovement)

// POST /api/products/movements/:movementId/confirm — confirmar movimiento
router.post('/movements/:movementId/confirm', authMiddleware, checkPermission('productos'), ctrl.confirmMovement)

// DELETE /api/products/movements/:movementId — eliminar/cancelar movimiento pendiente
router.delete('/movements/:movementId', authMiddleware, checkPermission('productos'), ctrl.deleteMovement)

// PUT /api/products/:id
router.put('/:id', authMiddleware, checkPermission('productos'), ctrl.update)

// DELETE /api/products/:id — soft-delete
router.delete('/:id', authMiddleware, checkPermission('productos'), ctrl.deactivate)

// PATCH /api/products/:id/reactivate
router.patch('/:id/reactivate', authMiddleware, checkPermission('productos'), ctrl.reactivate)

module.exports = router
