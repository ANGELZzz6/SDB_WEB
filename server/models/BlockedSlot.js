const mongoose = require('mongoose')

const blockedSlotSchema = new mongoose.Schema({
  // ObjectId de una empleada específica. Soporta legacy 'all' pero se recomienda usar isGlobal.
  employee: {
    type: mongoose.Schema.Types.Mixed,
    required: function() { return !this.isGlobal; },
    validate: {
      validator: function (v) {
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

  // ── Bloqueo por slot exacto (compatibilidad hacia atrás) ──────────────────
  // "HH:MM" — se usa cuando no hay startTime/endTime
  timeSlot:  { type: String },

  // ── Bloqueo por rango horario (nuevo) ────────────────────────────────────
  // Ejemplo: bloquear de 19:00 a 22:00. Ambos campos deben venir juntos.
  startTime: { type: String }, // "HH:MM"
  endTime:   { type: String }, // "HH:MM"

  reason:    { type: String, default: '' },
}, {
  timestamps: true,
})

// ── Validación de integridad: startTime y endTime deben ir juntos ─────────────
blockedSlotSchema.pre('validate', function (next) {
  const hasStart = !!this.startTime
  const hasEnd   = !!this.endTime

  if (hasStart !== hasEnd) {
    return next(new Error('startTime y endTime deben enviarse juntos para bloqueos de rango'))
  }

  // Si tiene rango, validar que startTime < endTime (formato HH:MM permite comparación léxica)
  if (hasStart && hasEnd && this.startTime >= this.endTime) {
    return next(new Error('startTime debe ser anterior a endTime'))
  }

  // Si no es día completo y tampoco tiene rango ni slot exacto → error
  if (!this.isFullDay && !this.startTime && !this.timeSlot) {
    return next(new Error('Para bloqueos parciales se requiere timeSlot O el par startTime+endTime'))
  }

  next()
})

// Índices para búsquedas eficientes
blockedSlotSchema.index({ employee: 1, date: 1 })
blockedSlotSchema.index({ isGlobal: 1, date: 1 })

module.exports = mongoose.model('BlockedSlot', blockedSlotSchema)
