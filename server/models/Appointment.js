const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema({
  clientName:  { type: String, required: true, trim: true },
  clientPhone: { type: String, required: true, trim: true, index: true },
  clientEmail: { type: String, trim: true, lowercase: true }, // opcional
  bulkId:      { type: String, index: true }, // ID de agrupación para múltiples servicios
  priceSnapshot: { type: Number, default: 0 }, // Precio al agendar
  finalPrice:    { type: Number },              // Cobro real final
  settled:       { type: Boolean, default: false }, // ¿Ya liquidada a la empleada?

  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  service:  { type: mongoose.Schema.Types.ObjectId, ref: 'Service',  required: true },

  // --- Campos para Flexibilidad ---
  isFlexible: { type: Boolean, default: false },
  flexibleAvailabilities: {
    type: [{
      date: Date,
      isFullDay: { type: Boolean, default: true },
      startTime: String, // "HH:MM"
      endTime: String    // "HH:MM"
    }],
    default: []
  },

  // Estos campos pasan a ser condicionales: obligatorios solo si NO es flexible
  date:     { 
    type: Date, 
    required: function() { return !this.isFlexible; } 
  },
  timeSlot: { 
    type: String, 
    required: function() { return !this.isFlexible; } 
  },
  endTime:  { 
    type: String, 
    required: function() { return !this.isFlexible; } 
  },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
    default: 'pending',
  },

  notes:         { type: String, default: '' },
  reminderSent:  { type: Boolean, default: false },

  rescheduledAt: { type: Date },
  rescheduledReason: { type: String, default: '' },
  whatsappLog: [{
    message: String,
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending_whatsapp', 'sent', 'failed'], default: 'pending_whatsapp' }
  }],
}, {
  timestamps: true,
})

// Índices para consultas frecuentes
appointmentSchema.index({ employee: 1, date: 1 })
appointmentSchema.index({ date: 1, status: 1 })
appointmentSchema.index({ clientPhone: 1, date: -1 })

// BLOCKER: Prevenir doble cita simultánea (Race Condition)
// Único por especialista + fecha + hora, EXCEPTO si:
// 1. La cita fue cancelada/rechazada
// 2. La cita es flexible (aún no tiene horario definitivo)
appointmentSchema.index(
  { employee: 1, date: 1, timeSlot: 1 },
  { 
    unique: true, 
    partialFilterExpression: { 
      status: { $nin: ['cancelled', 'rejected'] },
      isFlexible: { $ne: true } 
    } 
  }
)

module.exports = mongoose.model('Appointment', appointmentSchema)
