const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const Employee = require('../models/Employee')

/**
 * Middleware de autenticación JWT
 * Verifica el token en el header Authorization: Bearer <token>
 * Disponible en req.user = { id, role, isObjectId, permissions }
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado — token no proporcionado',
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    let permissions = {}

    // Si es empleada, cargamos sus permisos dinámicos desde la DB
    if (decoded.role === 'empleada' && mongoose.Types.ObjectId.isValid(decoded.id)) {
      const user = await Employee.findById(decoded.id).select('permissions isActive')
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado o inactivo',
        })
      }
      permissions = user.permissions || {}
    }

    req.user = {
      id: decoded.id,
      role: decoded.role, // 'admin' | 'empleada'
      isObjectId: mongoose.Types.ObjectId.isValid(decoded.id),
      permissions
    }

    console.log('👤 AUTH USER:', req.user)

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    })
  }
}

/**
 * Middleware de autorización por rol
 * Uso: router.delete('/:id', authMiddleware, requireRole('admin'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado — permisos insuficientes',
    })
  }
  next()
}

/**
 * Middleware opcional para extraer el usuario si el token está presente
 * Útil para rutas públicas que devuelven más información si eres admin
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = {
        id: decoded.id,
        role: decoded.role,
        isObjectId: mongoose.Types.ObjectId.isValid(decoded.id)
      }
    }
  } catch (error) {
    // ignorar error de token inválido, el usuario solo se queda anónimo
  }
  next()
}

module.exports = { authMiddleware, requireRole, optionalAuth }
