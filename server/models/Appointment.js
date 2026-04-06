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

  date:     { type: Date, required: true },
  timeSlot: { type: String, required: true }, // "HH:MM" formato 24h
  endTime:  { type: String, required: true }, // calculado: timeSlot + duración del servicio

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
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

// Índices para consultas frecuentes: citas de una empleada en una fecha
appointmentSchema.index({ employee: 1, date: 1 })
appointmentSchema.index({ date: 1, status: 1 })
appointmentSchema.index({ clientPhone: 1, date: -1 })

// BLOCKER 3: Prevenir doble cita simultánea (Race Condition)
// Único por especialista + fecha + hora, EXCEPTO si la cita fue cancelada
appointmentSchema.index(
  { employee: 1, date: 1, timeSlot: 1 },
  { 
    unique: true, 
    partialFilterExpression: { status: { $nin: ['cancelled'] } } 
  }
)

module.exports = mongoose.model('Appointment', appointmentSchema)
