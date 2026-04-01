const GalleryItem = require('../models/GalleryItem');
const GalleryCategory = require('../models/GalleryCategory');

// ─── CATEGORIES ───
const getCategories = async (req, res, next) => {
  try {
    const { all } = req.query; // Si 'all' es true, trae inactivas también para el admin
    const filter = all === 'true' ? {} : { isActive: true };
    const categories = await GalleryCategory.find(filter).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const category = await GalleryCategory.create({ name });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'La categoría ya existe' });
    }
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await GalleryCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    // Soft delete o desactivar
    const category = await GalleryCategory.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// ─── ITEMS ───
const getItems = async (req, res, next) => {
  try {
    const { categoryId, all } = req.query;
    const filter = all === 'true' ? {} : { isActive: true };
    if (categoryId) filter.categoryId = categoryId;

    const items = await GalleryItem.find(filter)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

const createItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.create(req.body);
    const populated = await item.populate('categoryId', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name');
    if (!item) return res.status(404).json({ success: false, message: 'Item no encontrado' });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item no encontrado' });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getItems,
  createItem,
  updateItem,
  deleteItem
};
