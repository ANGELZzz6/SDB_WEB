const jwt = require('jsonwebtoken')

/**
 * Middleware de autenticación JWT
 * Verifica el token en el header Authorization: Bearer <token>
 * Disponible en req.user = { id, role }
 */
const authMiddleware = (req, res, next) => {
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

    req.user = {
      id:   decoded.id,
      role: decoded.role, // 'admin' | 'empleada'
    }

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
        id:   decoded.id,
        role: decoded.role,
      }
    }
  } catch (error) {
    // ignorar error de token inválido, el usuario solo se queda anónimo
  }
  next()
}

module.exports = { authMiddleware, requireRole, optionalAuth }
