const Product = require('../models/Product')
const ProductMovement = require('../models/ProductMovement')

// Normaliza las categorías buscando coincidencias sin importar mayúsculas/minúsculas para evitar duplicados
const normalizeCategory = async (categoria) => {
  if (!categoria) return categoria
  const trimmed = categoria.trim()
  const existing = await Product.findOne({
    categoria: { $regex: new RegExp(`^${trimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
  })
  if (existing) {
    return existing.categoria
  }
  // Si no existe, capitalizar cada palabra
  return trimmed
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

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

    // Normalizar categoría para evitar duplicados
    req.body.categoria = await normalizeCategory(categoria)

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

    if (safeFields.categoria) {
      safeFields.categoria = await normalizeCategory(safeFields.categoria)
    }

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

// ─── ENDPOINTS DE MOVIMIENTOS DE PRODUCTOS (CONTROL DE INVENTARIO) ────────────

// POST /api/products/checkout (Público - desde el carrito)
// Registra movimientos de tipo "egreso" no confirmados.
// ── Seguridad básica de abuso ──────────────────────────────────────────────────
const MAX_CART_ITEMS = 20  // Máximo de líneas distintas de producto en un pedido
const MAX_QTY_PER_ITEM = 99 // Máximo de unidades por producto en un pedido
const mongoose = require('mongoose')

const checkout = async (req, res, next) => {
  try {
    const { items } = req.body

    // ── Validación de estructura ────────────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Los items del carrito son requeridos' })
    }

    if (items.length > MAX_CART_ITEMS) {
      return res.status(400).json({ success: false, message: `El pedido no puede tener más de ${MAX_CART_ITEMS} productos distintos` })
    }

    for (const item of items) {
      // Validar que el ID sea un ObjectId válido antes de consultar DB (previene inyección)
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({ success: false, message: 'ID de producto inválido en el carrito' })
      }
      // Validar y limitar la cantidad
      if (!Number.isInteger(item.qty) || item.qty < 1) {
        return res.status(400).json({ success: false, message: 'La cantidad debe ser un número entero positivo' })
      }
      if (item.qty > MAX_QTY_PER_ITEM) {
        return res.status(400).json({ success: false, message: `La cantidad máxima por producto es ${MAX_QTY_PER_ITEM} unidades` })
      }
    }

    const movements = []
    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product || !product.isActive) {
        return res.status(404).json({ success: false, message: `Producto no encontrado o inactivo` })
      }

      const mov = await ProductMovement.create({
        product: item.productId,
        tipo: 'egreso',
        cantidad: item.qty,
        motivo: 'Venta (WhatsApp)',
        confirmado: false
      })
      movements.push(mov)
    }

    res.status(201).json({ success: true, data: movements, message: 'Movimientos de venta pendientes registrados' })
  } catch (error) {
    next(error)
  }
}

// GET /api/products/:id/movements (Protegido - ver movimientos de un producto)
const getProductMovements = async (req, res, next) => {
  try {
    const { id } = req.params
    const movements = await ProductMovement.find({ product: id }).sort({ createdAt: -1 })
    res.json({ success: true, data: movements })
  } catch (error) {
    next(error)
  }
}

// POST /api/products/:id/movements (Protegido - agregar movimiento manual)
const createMovement = async (req, res, next) => {
  try {
    const { id } = req.params
    const { tipo, cantidad, motivo, confirmado } = req.body

    if (!tipo || !cantidad) {
      return res.status(400).json({ success: false, message: 'Tipo y cantidad son requeridos' })
    }

    const product = await Product.findById(id)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' })
    }

    const isConfirm = confirmado !== undefined ? confirmado : true

    if (isConfirm) {
      if (tipo === 'egreso') {
        if (product.rastrearStock && product.stock < cantidad) {
          return res.status(400).json({ success: false, message: 'Stock insuficiente para esta operación' });
        }
        if (product.rastrearStock) product.stock -= cantidad
      } else {
        if (product.rastrearStock) product.stock += cantidad
      }
      await product.save()
    }

    const movement = await ProductMovement.create({
      product: id,
      tipo,
      cantidad,
      motivo: motivo || (tipo === 'ingreso' ? 'Ingreso manual' : 'Egreso manual'),
      confirmado: isConfirm
    })

    res.status(201).json({ success: true, data: movement })
  } catch (error) {
    next(error)
  }
}

// POST /api/products/movements/:movementId/confirm (Protegido - confirmar movimiento pendiente)
const confirmMovement = async (req, res, next) => {
  try {
    const { movementId } = req.params
    const movement = await ProductMovement.findById(movementId)
    if (!movement) {
      return res.status(404).json({ success: false, message: 'Movimiento no encontrado' })
    }

    if (movement.confirmado) {
      return res.status(400).json({ success: false, message: 'Este movimiento ya ha sido confirmado' })
    }

    const product = await Product.findById(movement.product)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto asociado no encontrado' })
    }

    if (movement.tipo === 'egreso') {
      if (product.rastrearStock && product.stock < movement.cantidad) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente: solo quedan ${product.stock} unidades de "${product.nombre}"`
        })
      }
      if (product.rastrearStock) product.stock -= movement.cantidad
    } else {
      if (product.rastrearStock) product.stock += movement.cantidad
    }

    movement.confirmado = true
    await Promise.all([product.save(), movement.save()])

    res.json({ success: true, message: 'Movimiento confirmado e inventario actualizado', data: movement })
  } catch (error) {
    next(error)
  }
}

// DELETE /api/products/movements/:movementId (Protegido - eliminar/cancelar movimiento pendiente)
const deleteMovement = async (req, res, next) => {
  try {
    const { movementId } = req.params
    const movement = await ProductMovement.findById(movementId)
    if (!movement) {
      return res.status(404).json({ success: false, message: 'Movimiento no encontrado' })
    }

    if (movement.confirmado) {
      return res.status(400).json({ success: false, message: 'No se puede eliminar un movimiento ya confirmado' })
    }

    await ProductMovement.findByIdAndDelete(movementId)
    res.json({ success: true, message: 'Movimiento pendiente cancelado con éxito' })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAll,
  getOne,
  create,
  update,
  deactivate,
  reactivate,
  getCategorias,
  checkout,
  getProductMovements,
  createMovement,
  confirmMovement,
  deleteMovement
}
