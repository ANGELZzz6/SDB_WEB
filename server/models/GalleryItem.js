const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'La URL de la imagen es requerida'],
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GalleryCategory',
    required: [true, 'La categoría es requerida'],
  },
  caption: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('GalleryItem', galleryItemSchema);
