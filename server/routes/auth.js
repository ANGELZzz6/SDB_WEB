const express = require('express')
const router = express.Router()
const { login, me, logout, createEmployeeAccount, resetEmployeePassword } = require('../controllers/authController')
const { authMiddleware, requireRole } = require('../middleware/auth')

// POST /api/auth/login — público
router.post('/login', login)

// POST /api/auth/logout — público  
router.post('/logout', logout)

// GET /api/auth/me — requiere token válido
router.get('/me', authMiddleware, me)

// Acciones de administrador de cuentas
router.post('/create-employee-account', authMiddleware, requireRole('admin'), createEmployeeAccount)
router.post('/reset-employee-password', authMiddleware, requireRole('admin'), resetEmployeePassword)

module.exports = router
