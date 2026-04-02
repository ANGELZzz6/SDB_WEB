const express = require('express')
const router = express.Router()
const { login, me, logout, createEmployeeAccount, resetEmployeePassword } = require('../controllers/authController')
const { authMiddleware, requireRole } = require('../middleware/auth')
const checkPermission = require('../middleware/checkPermission')

// POST /api/auth/login — público
router.post('/login', login)

// POST /api/auth/logout — público  
router.post('/logout', logout)

// GET /api/auth/me — requiere token válido
router.get('/me', authMiddleware, me)

// Acciones de administrador de cuentas o especialista con permiso 'accesos'
router.post('/create-employee-account', authMiddleware, checkPermission('accesos'), createEmployeeAccount)
router.post('/reset-employee-password', authMiddleware, checkPermission('accesos'), resetEmployeePassword)

module.exports = router
