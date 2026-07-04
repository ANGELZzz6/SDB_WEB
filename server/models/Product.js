const mongoose = require('mongoose')

/**
 * Modelo de Producto para el catálogo del salón.
 * Incluye índice de texto para búsquedas eficientes (evita ReDoS).
 */
const productSchema = new mongoose.Schema({
  nombre:        { type: String, required: true, trim: true },
  marca:         { type: String, required: true, trim: true, default: 'Velvet & Bloom' },
  sku:           { type: String, required: true, unique: true, trim: true, uppercase: true },
  descripcion:   { type: String, default: '', trim: true },
  categoria:     { type: String, required: true, trim: true },
  imagenes:      [{ type: String, trim: true }],   // Array de URLs de Cloudinary
  ingredientes:  [{ type: String, trim: true }],   // Ingredientes activos separados
  beneficios:    [{ type: String, trim: true }],   // Beneficios clave (Bento Grid)
  precio:        { type: Number, required: true, min: 0 },
  precioOferta:  { type: Number, min: 0, default: null },
  costo:         { type: Number, min: 0, default: null }, // Sólo visible para admin
  stock:         { type: Number, required: true, default: 0, min: 0 },
  stockMinimo:   { type: Number, default: 15, min: 0 },
  rastrearStock: { type: Boolean, default: true },
  isActive:      { type: Boolean, default: true },
  seoTitle:      { type: String, trim: true, default: '' },
  seoDesc:       { type: String, trim: true, default: '' },
  likesCount:      { type: Number, default: 0 },
  rating:          { type: Number, default: 5.0, min: 0, max: 5 },
  destacadoEnHome: { type: Boolean, default: false }, // Aparece en carrusel del landing
}, {
  timestamps: true,
})

// ─── Índice de texto para búsqueda eficiente (evita ReDoS con $regex crudo) ──
productSchema.index({ nombre: 'text', marca: 'text', descripcion: 'text', categoria: 'text' })

// ─── Índice para filtro rápido por categoría ──────────────────────────────────
productSchema.index({ categoria: 1, isActive: 1 })

module.exports = mongoose.model('Product', productSchema)
