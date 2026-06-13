const mongoose = require('mongoose')

/**
 * Modelo de Movimiento de Producto para control de inventario.
 * Rastrea ingresos (compras/adiciones) y egresos (ventas/reducciones).
 * Las ventas inician como no confirmadas y solo restan stock cuando el admin las confirma.
 */
const productMovementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  tipo: {
    type: String,
    enum: ['ingreso', 'egreso'],
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  motivo: {
    type: String,
    default: 'Venta (WhatsApp)',
    trim: true
  },
  confirmado: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Índice para consultas rápidas por producto
productMovementSchema.index({ product: 1, createdAt: -1 })

module.exports = mongoose.model('ProductMovement', productMovementSchema)
