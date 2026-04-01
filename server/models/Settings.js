const mongoose = require('mongoose')

const settingsSchema = new mongoose.Schema({
  businessName: { type: String, default: '[NOMBRE_SALON]' },
  businessHours: {
    inicio: { type: String, default: '06:00' },
    fin:    { type: String, default: '21:00' },
  },
  bufferBetweenAppointments: { type: Number, default: 0 },  // minutos
  maxDaysInAdvance:          { type: Number, default: 15 },
  cancellationHoursLimit:    { type: Number, default: 0 },  // 0 = sin restricción
  whatsappNumber: { type: String, default: '[WHATSAPP_NUMERO]' },
  address:        { type: String, default: 'Carrera 102 #70-50' },
  socialMedia: {
    instagram: { type: String, default: '' },
    facebook:  { type: String, default: '' },
    tiktok:    { type: String, default: '' },
  },
}, {
  timestamps: true,
})

// Solo debe existir UN documento de Settings en la colección
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({})
  }
  return settings
}

module.exports = mongoose.model('Settings', settingsSchema)
