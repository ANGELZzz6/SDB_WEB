const SiteConfig = require('../models/SiteConfig');

/**
 * Middleware que verifica si una página/sección está habilitada en SiteConfig.
 * Si está deshabilitada, devuelve HTTP 503 antes de ejecutar el handler.
 *
 * Esta es la CAPA 1 de seguridad — opera en el servidor y no puede ser eludida
 * desde el cliente, incluso si el usuario llama a la API directamente.
 *
 * Uso: router.post('/', checkPageEnabled('chatbot'), handler)
 *
 * @param {string} pageName - Nombre de la página en paginasOcultas (ej: 'chatbot')
 */
const checkPageEnabled = (pageName) => async (req, res, next) => {
  try {
    const config = await SiteConfig.findOne({}).select('paginasOcultas').lean();

    const pageConfig = config?.paginasOcultas?.[pageName];

    // Si el campo no existe en BD (instalaciones previas sin migración), permitir acceso
    if (!pageConfig) {
      return next();
    }

    // Si está explícitamente deshabilitada, bloquear con 503
    if (pageConfig.habilitada === false) {
      return res.status(503).json({
        success: false,
        pageDisabled: true,
        pageName,
        message: pageConfig.mensajeTitulo || 'Servicio no disponible',
        detail: pageConfig.mensajeCuerpo || 'Esta función no está disponible en este momento.',
      });
    }

    next();
  } catch (error) {
    // En caso de error al consultar la BD, permitir acceso (fail-open) para no bloquear el servicio
    console.error(`[checkPageEnabled] Error consultando estado de "${pageName}":`, error.message);
    next();
  }
};

module.exports = checkPageEnabled;
