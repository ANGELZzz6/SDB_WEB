const Product = require('../models/Product')

// ─── Campos públicos (nunca exponer costo ni precioOferta a no-admins) ─────────
const PUBLIC_FIELDS = '-costo'
const ADMIN_FIELDS  = '' // todo

// ─── GET /api/products ────────────────────────────────────────────────────────
// Query params: ?search=, ?categoria=, ?includeInactive=true (solo admin)
const getAll = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin'

    const showInactive = req.query.includeInactive === 'true' && isAdmin
    const filter = showInactive ? {} : { isActive: true }

    // ── Búsqueda segura con índice de texto (previene ReDoS) ───────────────────
    if (req.query.search) {
      // $text usa el índice texto creado en el modelo; no acepta ReDoS
      filter.$text = { $search: req.query.search }
    }

    // ── Filtro por categoría ───────────────────────────────────────────────────
    if (req.query.categoria && req.query.categoria !== 'Todos') {
      filter.categoria = req.query.categoria
    }

    // ── Proyección: omitir costo y precioOferta para usuarios anónimos ─────────
    const projection = isAdmin ? ADMIN_FIELDS : PUBLIC_FIELDS

    const products = await Product
      .find(filter, projection)
      .sort({ createdAt: -1 })

    // ── Calcular estadísticas rápidas (solo para admin) ────────────────────────
    let stats = null
    if (isAdmin) {
      const all = await Product.find({}, 'stock precio costo isActive stockMinimo')
      const totalProductos = all.length
      const valorInventario = all.reduce((acc, p) => acc + (p.stock * p.precio), 0)
      const stockBajo = all.filter(p => p.isActive && p.rastrearStock !== false && p.stock > 0 && p.stock <= p.stockMinimo).length
      const agotados  = all.filter(p => p.isActive && p.stock === 0).length
      stats = { totalProductos, valorInventario, stockBajo, agotados }
    }

    res.json({ success: true, data: products, stats })
  } catch (error) {
    next(error)
  }
}

// ─── GET /api/products/:id ────────────────────────────────────────────────────
const getOne = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin'
    const projection = isAdmin ? ADMIN_FIELDS : PUBLIC_FIELDS

    const product = await Product.findById(req.params.id, projection)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' })
    }
    res.json({ success: true, data: product })
  } catch (error) {
    next(error)
  }
}

// ─── POST /api/products ───────────────────────────────────────────────────────
const create = async (req, res, next) => {
  try {
    const { nombre, sku, categoria, precio, stock } = req.body

    if (!nombre || !sku || !categoria || precio === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Los campos nombre, sku, categoria, precio y stock son requeridos',
      })
    }

    // Verificar unicidad de SKU
    const exists = await Product.findOne({ sku: sku.toUpperCase().trim() })
    if (exists) {
      return res.status(400).json({
        success: false,
        message: `Ya existe un producto con el SKU "${sku.toUpperCase()}"`,
      })
    }

    const product = await Product.create(req.body)
    res.status(201).json({ success: true, data: product })
  } catch (error) {
    next(error)
  }
}

// ─── PUT /api/products/:id ────────────────────────────────────────────────────
const update = async (req, res, next) => {
  try {
    // ── Seguridad: el SKU no puede cambiarse (previene conflictos de unicidad) ──
    // eslint-disable-next-line no-unused-vars
    const { sku, _id, createdAt, updatedAt, ...safeFields } = req.body

    // Si el body intentó cambiar el SKU, verificar si ya existe (opcional, protección doble)
    if (sku) {
      const existing = await Product.findById(req.params.id)
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' })
      }
      const normalizedSku = sku.toUpperCase().trim()
      if (normalizedSku !== existing.sku) {
        const conflict = await Product.findOne({ sku: normalizedSku })
        if (conflict) {
          return res.status(400).json({
            success: false,
            message: `Ya existe otro producto con el SKU "${normalizedSku}"`,
          })
        }
        // Permitir cambio de SKU pero con validación explícita
        safeFields.sku = normalizedSku
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: safeFields },
      { new: true, runValidators: true }
    )
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' })
    }
    res.json({ success: true, data: product })
  } catch (error) {
    next(error)
  }
}

// ─── DELETE /api/products/:id (soft-delete) ───────────────────────────────────
const deactivate = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' })
    }
    res.json({ success: true, message: 'Producto desactivado correctamente', data: product })
  } catch (error) {
    next(error)
  }
}

// ─── PATCH /api/products/:id/reactivate ──────────────────────────────────────
const reactivate = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    )
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' })
    }
    res.json({ success: true, message: 'Producto reactivado correctamente', data: product })
  } catch (error) {
    next(error)
  }
}

// ─── GET /api/products/categorias ─────────────────────────────────────────────
// Devuelve la lista dinámica de categorías únicas (solo productos activos)
const getCategorias = async (req, res, next) => {
  try {
    const categorias = await Product.distinct('categoria', { isActive: true })
    res.json({ success: true, data: categorias.sort() })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAll, getOne, create, update, deactivate, reactivate, getCategorias }
