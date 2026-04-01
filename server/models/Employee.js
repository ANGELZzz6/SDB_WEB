const mongoose = require('mongoose')

const dayScheduleSchema = new mongoose.Schema({
  inicio: { type: String, default: '06:00' },
  fin:    { type: String, default: '21:00' },
  activo: { type: Boolean, default: true },
}, { _id: false })

const employeeSchema = new mongoose.Schema({
  nombre:       { type: String, required: true, trim: true },
  email:        { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  foto:         { type: String, default: '' }, // URL Cloudinary
  descripcion:  { type: String, default: '' },
  especialidades: [{ type: String }],
  servicios:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  horarioPersonalizado: {
    lunes:     { type: dayScheduleSchema, default: () => ({}) },
    martes:    { type: dayScheduleSchema, default: () => ({}) },
    miercoles: { type: dayScheduleSchema, default: () => ({}) },
    jueves:    { type: dayScheduleSchema, default: () => ({}) },
    viernes:   { type: dayScheduleSchema, default: () => ({}) },
    sabado:    { type: dayScheduleSchema, default: () => ({ activo: false }) },
    domingo:   { type: dayScheduleSchema, default: () => ({ activo: false }) },
  },
  password: { type: String, select: false }, // bcrypt, solo para login de empleada
  permissions: {
    type: Object,
    default: {
      citas:         true,
      calendario:    true,
      clientes:      false,
      servicios:     false,
      especialistas: false,
      accesos:       false,
      galeria:       false,
      configuracion: false,
    }
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
})

// No devolver password en respuestas JSON
employeeSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('Employee', employeeSchema)
