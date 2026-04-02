const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth')
const checkPermission = require('../middleware/checkPermission')
const ctrl = require('../controllers/clientController')

/**
 * Rutas de la API para gestión de clientes persistente.
 * Se requiere autenticación y permiso de 'clientes'.
 */

// GET /api/clients - Obtener todos los clientes (activos)
router.get(
  '/',
  authMiddleware,
  checkPermission('clientes'),
  ctrl.getAll
)

// GET /api/clients/:phone - Obtener detalle analítico del cliente
router.get(
  '/:phone',
  authMiddleware,
  checkPermission('clientes'),
  ctrl.getOne
)

// DELETE /api/clients/:phone - Desactivar un cliente (eliminación lógica persistente)
router.delete(
  '/:phone',
  authMiddleware,
  checkPermission('clientes'),
  ctrl.deactivate
)

module.exports = router
