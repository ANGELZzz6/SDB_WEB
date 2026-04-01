/**
 * Manejador de errores global de Express
 * Captura todos los errores pasados con next(err)
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500
  let message    = err.message || 'Error interno del servidor'

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors).map(e => e.message).join(', ')
  }

  // ObjectId inválido de MongoDB
  if (err.name === 'CastError') {
    statusCode = 400
    message = `ID inválido: ${err.value}`
  }

  // Token JWT inválido
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Token inválido'
  }

  // Token JWT expirado
  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expirado'
  }

  // No mostrar detalles internos en producción
  if (process.env.NODE_ENV !== 'production') {
    console.error(`❌ [${statusCode}] ${err.name}: ${message}`)
  }

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Error interno del servidor'
      : message,
  })
}

module.exports = errorHandler
