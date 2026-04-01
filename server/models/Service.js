const mongoose = require('mongoose')

const serviceSchema = new mongoose.Schema({
  nombre:      { type: String, required: true, trim: true },
  descripcion: { type: String, default: '' },
  precio:       { type: Number, required: true, min: 0 },
  precioTipo:   { type: String, enum: ['fijo', 'rango', 'consultar'], default: 'fijo' },
  precioDesde:  { type: Number, min: 0 },
  precioHasta:  { type: Number, min: 0 },
  duracion:     { type: Number, required: true, min: 1 }, // minutos
  empleadas:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  imagen:      { type: String, default: '' }, // URL Cloudinary
  isActive:    { type: Boolean, default: true },
}, {
  timestamps: true,
})

module.exports = mongoose.model('Service', serviceSchema)
