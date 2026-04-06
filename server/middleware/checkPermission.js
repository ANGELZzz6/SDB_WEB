/**
 * Middleware para validar si el usuario tiene permiso para un módulo específico
 */
const checkPermission = (moduleName) => (req, res, next) => {
  // Admin tiene acceso total por defecto
  if (req.user?.role === 'admin') {
    return next();
  }

  // Si no es admin, debe tener el permiso específico habilitado
  if (!req.user?.permissions?.[moduleName]) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado — permisos insuficientes para el módulo: ' + moduleName
    });
  }

  next();
};

module.exports = checkPermission;
