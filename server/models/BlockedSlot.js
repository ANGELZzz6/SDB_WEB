const mongoose = require('mongoose')

const blockedSlotSchema = new mongoose.Schema({
  // ObjectId de una empleada específica. Soporta legacy 'all' pero se recomienda usar isGlobal.
  employee: {
    type: mongoose.Schema.Types.Mixed,
    required: function() { return !this.isGlobal; },
    validate: {
      validator: function (v) {
        // En creación de nuevos slots, preferimos isGlobal.
        return !v || v === 'all' || mongoose.Types.ObjectId.isValid(v)
      },
      message: 'employee debe ser un ObjectId válido o el string "all"',
    },
  },

  isGlobal: {
    type: Boolean,
    default: false
  },

  date:      { type: Date, required: true },
  isFullDay: { type: Boolean, default: false },
  timeSlot:  { type: String }, // solo requerido si !isFullDay — "HH:MM"
  reason:    { type: String, default: '' },
}, {
  timestamps: true,
})

// Índices para búsquedas eficientes
blockedSlotSchema.index({ employee: 1, date: 1 })
blockedSlotSchema.index({ isGlobal: 1, date: 1 })

module.exports = mongoose.model('BlockedSlot', blockedSlotSchema)
