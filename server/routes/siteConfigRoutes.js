const express = require('express');
const router = express.Router();
const { getConfig, updateConfig } = require('../controllers/siteConfigController');
const { authMiddleware } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// GET /api/config — Público
router.get('/', getConfig);

// PUT /api/config — Admin o Especialista con permiso 'configuracion'
router.put('/', authMiddleware, checkPermission('configuracion'), updateConfig);

module.exports = router;
