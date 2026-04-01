const Settings = require('../models/Settings')

// ─── GET /api/settings ───────────────────────────────────────────────────────
// Público — cualquiera puede leer la configuración del negocio
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings()
    res.json({ success: true, data: settings })
  } catch (error) {
    next(error)
  }
}

// ─── PUT /api/settings ──────────────────────────────────────────────────────
// Solo admin
const updateSettings = async (req, res, next) => {
  try {
    const allowed = [
      'businessName', 'businessHours', 'bufferBetweenAppointments',
      'maxDaysInAdvance', 'cancellationHoursLimit', 'whatsappNumber',
      'address', 'socialMedia',
    ]

    const updates = {}
    allowed.forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    })

    let settings = await Settings.findOne()
    if (!settings) {
      settings = await Settings.create(updates)
    } else {
      Object.assign(settings, updates)
      await settings.save()
    }

    res.json({ success: true, data: settings })
  } catch (error) {
    next(error)
  }
}

module.exports = { getSettings, updateSettings }
