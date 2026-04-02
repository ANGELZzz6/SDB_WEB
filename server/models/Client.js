const mongoose = require('mongoose')

const clientSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  telefonoDuplicado: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Antes de guardar, asegurarnos de que el teléfono esté normalizado (doble seguridad)
clientSchema.pre('save', function (next) {
  if (this.isModified('phone')) {
    this.phone = this.phone.replace(/\D/g, '')
  }
  next()
})

module.exports = mongoose.model('Client', clientSchema)
