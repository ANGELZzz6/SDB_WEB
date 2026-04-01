const express = require('express')
const router = express.Router()
const settingsCtrl = require('../controllers/settingsController')
const { authMiddleware, requireRole } = require('../middleware/auth')

// GET /api/settings — público (landing page necesita horarios, WhatsApp, etc.)
router.get('/', settingsCtrl.getSettings)

// PUT /api/settings — solo admin
router.put('/', authMiddleware, requireRole('admin'), settingsCtrl.updateSettings)

module.exports = router
