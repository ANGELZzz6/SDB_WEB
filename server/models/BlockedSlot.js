const mongoose = require('mongoose')

const blockedSlotSchema = new mongoose.Schema({
  // ObjectId de una empleada específica, o el string 'all' para bloquear a todas
  employee: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function (v) {
        return v === 'all' || mongoose.Types.ObjectId.isValid(v)
      },
      message: 'employee debe ser un ObjectId válido o el string "all"',
    },
  },

  date:      { type: Date, required: true },
  isFullDay: { type: Boolean, default: false },
  timeSlot:  { type: String }, // solo requerido si !isFullDay — "HH:MM"
  reason:    { type: String, default: '' },
}, {
  timestamps: true,
})

blockedSlotSchema.index({ employee: 1, date: 1 })

module.exports = mongoose.model('BlockedSlot', blockedSlotSchema)
