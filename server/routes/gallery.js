const express = require('express');
const router = express.Router();
const {
  getCategories, createCategory, updateCategory, deleteCategory,
  getItems, createItem, updateItem, deleteItem
} = require('../controllers/galleryController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// Funciones públicas
router.get('/categories', getCategories);
router.get('/items', getItems);

// Funciones de admin o especialista con permiso 'galeria'
router.post('/categories', authMiddleware, checkPermission('galeria'), createCategory);
router.put('/categories/:id', authMiddleware, checkPermission('galeria'), updateCategory);
router.delete('/categories/:id', authMiddleware, checkPermission('galeria'), deleteCategory);

router.post('/items', authMiddleware, checkPermission('galeria'), createItem);
router.put('/items/:id', authMiddleware, checkPermission('galeria'), updateItem);
router.delete('/items/:id', authMiddleware, checkPermission('galeria'), deleteItem);

module.exports = router;
