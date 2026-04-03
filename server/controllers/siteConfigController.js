const SiteConfig = require('../models/SiteConfig');

// GET /api/config — Público
const getConfig = async (req, res, next) => {
  try {
    // Busca el primero. Si no existe, devuelve uno vacío con defaults
    let config = await SiteConfig.findOne({});
    if (!config) {
      config = new SiteConfig({}); // Los defaults están en el esquema
    }
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

// PUT /api/config — Solo Admin
const updateConfig = async (req, res, next) => {
  try {
    const updateData = { ...req.body, updatedAt: Date.now() };
    if (req.user) {
      updateData.updatedBy = req.user.id;
    }

    // Buscamos y actualizamos el primero que encontremos, o creamos si no hay
    const config = await SiteConfig.findOneAndUpdate(
      {}, 
      updateData, 
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, message: 'Configuración actualizada con éxito', data: config });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConfig,
  updateConfig
};
