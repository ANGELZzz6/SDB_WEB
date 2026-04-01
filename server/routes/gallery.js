const express = require('express');
const router = express.Router();
const {
  getCategories, createCategory, updateCategory, deleteCategory,
  getItems, createItem, updateItem, deleteItem
} = require('../controllers/galleryController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Funciones públicas
router.get('/categories', getCategories);
router.get('/items', getItems);

// Funciones de admin
router.post('/categories', authMiddleware, requireRole('admin'), createCategory);
router.put('/categories/:id', authMiddleware, requireRole('admin'), updateCategory);
router.delete('/categories/:id', authMiddleware, requireRole('admin'), deleteCategory);

router.post('/items', authMiddleware, requireRole('admin'), createItem);
router.put('/items/:id', authMiddleware, requireRole('admin'), updateItem);
router.delete('/items/:id', authMiddleware, requireRole('admin'), deleteItem);

module.exports = router;
