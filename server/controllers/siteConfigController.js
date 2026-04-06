const SiteConfig = require('../models/SiteConfig');
const { clearConfigCache } = require('./availabilityController');

// GET /api/config — Público
const getConfig = async (req, res, next) => {
  try {
    // Busca el primero. Si no existe, devuelve uno vacío con defaults
    const config = await SiteConfig.findOne({}).select('-updatedBy');
    if (!config) {
      return res.json({ success: true, data: new SiteConfig({}) });
    }
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

const updateConfig = async (req, res, next) => {
  try {
    const { horaAperturaAgendamiento, horaCierreAgendamiento } = req.body;

    // Validación de horario circular/inverso
    if (horaAperturaAgendamiento && horaCierreAgendamiento) {
      if (horaAperturaAgendamiento >= horaCierreAgendamiento) {
        return res.status(400).json({
          success: false,
          message: 'La hora de apertura debe ser anterior a la de cierre'
        });
      }
    }

    const updateData = { ...req.body, updatedAt: Date.now() };
    // BUG FIX: Evitar CastError si el usuario es el admin virtual (id: "admin")
    // El admin virtual no tiene un ObjectId válido de MongoDB.
    if (req.user) {
      updateData.updatedBy = req.user.isObjectId ? req.user.id : null;
    }

    // Buscamos y actualizamos el primero que encontremos, o creamos si no hay
    const config = await SiteConfig.findOneAndUpdate(
      {}, 
      updateData, 
      { new: true, upsert: true, runValidators: true }
    );

    // Invalidar caché de disponibilidad para que los cambios sean inmediatos
    clearConfigCache();

    res.json({ success: true, message: 'Configuración actualizada con éxito', data: config });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConfig,
  updateConfig
};
