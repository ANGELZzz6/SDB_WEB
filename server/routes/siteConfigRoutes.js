const express = require('express');
const router = express.Router();
const { getConfig, updateConfig } = require('../controllers/siteConfigController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/config — Público
router.get('/', getConfig);

// PUT /api/config — Solo Admin
router.put('/', authMiddleware, requireRole('admin'), updateConfig);

module.exports = router;
