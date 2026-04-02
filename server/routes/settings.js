const express = require('express')
const router = express.Router()
const settingsCtrl = require('../controllers/settingsController')
const { authMiddleware, requireRole } = require('../middleware/auth')
const checkPermission = require('../middleware/checkPermission')

// GET /api/settings — público (landing page necesita horarios, WhatsApp, etc.)
router.get('/', settingsCtrl.getSettings)

// PUT /api/settings — solo admin o especialista con permiso 'configuracion'
router.put('/', authMiddleware, checkPermission('configuracion'), settingsCtrl.updateSettings)

module.exports = router
