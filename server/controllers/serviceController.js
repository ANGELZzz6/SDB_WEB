const Service = require('../models/Service')
const Employee = require('../models/Employee')

// ─── GET /api/services ───────────────────────────────────────────────────────
// Query: ?includeInactive=true, ?employeeId=...
const getAll = async (req, res, next) => {
  try {
    const showInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin'
    const filter = showInactive ? {} : { isActive: true }

    if (req.query.employeeId) {
      filter.empleadas = req.query.employeeId
    }

    const services = await Service.find(filter)
      .populate('empleadas', 'nombre foto isActive')
      .sort({ nombre: 1 })

    res.json({ success: true, data: services })
  } catch (error) {
    next(error)
  }
}

// ─── GET /api/services/:id ───────────────────────────────────────────────────
const getOne = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('empleadas', 'nombre foto isActive')

    if (!service) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' })
    }

    res.json({ success: true, data: service })
  } catch (error) {
    next(error)
  }
}

// ─── POST /api/services ──────────────────────────────────────────────────────
const create = async (req, res, next) => {
  try {
    const {
      nombre, descripcion, precio, duracion, empleadas, imagen,
      precioTipo, precioDesde, precioHasta
    } = req.body

    if (!nombre || precio === undefined || !duracion) {
      return res.status(400).json({
        success: false,
        message: 'nombre, precio y duracion son requeridos',
      })
    }

    const data = {
      nombre, descripcion, precio, duracion, empleadas, imagen,
      precioTipo: precioTipo || 'fijo',
      precioDesde,
      precioHasta
    }

    const service = await Service.create(data)

    // Actualizar referencia en Employee.servicios (sincronización bidireccional)
    if (empleadas && empleadas.length > 0) {
      await Employee.updateMany(
        { _id: { $in: empleadas } },
        { $addToSet: { servicios: service._id } }
      )
    }

    await service.populate('empleadas', 'nombre foto isActive')
    res.status(201).json({ success: true, data: service })
  } catch (error) {
    next(error)
  }
}

// ─── PUT /api/services/:id ───────────────────────────────────────────────────
const update = async (req, res, next) => {
  try {
    const existing = await Service.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' })
    }

    const { empleadas, ...fields } = req.body

    // Sincronización bidireccional de empleadas
    if (empleadas !== undefined) {
      const oldEmployees = existing.empleadas.map(id => id.toString())
      const newEmployees = empleadas.map(id => id.toString())

      const removed = oldEmployees.filter(id => !newEmployees.includes(id))
      const added   = newEmployees.filter(id => !oldEmployees.includes(id))

      if (removed.length > 0) {
        await Employee.updateMany(
          { _id: { $in: removed } },
          { $pull: { servicios: existing._id } }
        )
      }
      if (added.length > 0) {
        await Employee.updateMany(
          { _id: { $in: added } },
          { $addToSet: { servicios: existing._id } }
        )
      }

      fields.empleadas = empleadas
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: fields },
      { new: true, runValidators: true }
    ).populate('empleadas', 'nombre foto isActive')

    res.json({ success: true, data: service })
  } catch (error) {
    next(error)
  }
}

// ─── DELETE /api/services/:id (soft-delete) ──────────────────────────────────
const deactivate = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )

    if (!service) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' })
    }

    res.json({ success: true, message: 'Servicio desactivado correctamente', data: service })
  } catch (error) {
    next(error)
  }
}

// ─── PATCH /api/services/:id/reactivate ─────────────────────────────────────
const reactivate = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    )

    if (!service) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' })
    }

    res.json({ success: true, message: 'Servicio reactivado correctamente', data: service })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAll, getOne, create, update, deactivate, reactivate }
