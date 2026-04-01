const bcrypt = require('bcryptjs')
const Employee = require('../models/Employee')

// ─── GET /api/employees ──────────────────────────────────────────────────────
// Query: ?includeInactive=true (solo admin)
const getAll = async (req, res, next) => {
  try {
    const showInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin'
    const filter = showInactive ? {} : { isActive: true }

    const employees = await Employee.find(filter)
      .populate('servicios', 'nombre precio duracion imagen isActive')
      .sort({ nombre: 1 })

    res.json({ success: true, data: employees })
  } catch (error) {
    next(error)
  }
}

// ─── GET /api/employees/:id ──────────────────────────────────────────────────
const getOne = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('servicios', 'nombre precio duracion imagen isActive')

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Empleada no encontrada' })
    }

    // Empleada solo puede ver su propio perfil
    if (req.user?.role === 'empleada' && req.user.id !== employee._id.toString()) {
      return res.status(403).json({ success: false, message: 'Acceso denegado' })
    }

    res.json({ success: true, data: employee })
  } catch (error) {
    next(error)
  }
}

// ─── POST /api/employees ─────────────────────────────────────────────────────
const create = async (req, res, next) => {
  try {
    const {
      nombre, email, foto, descripcion, especialidades,
      servicios, horarioPersonalizado, password,
    } = req.body

    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El nombre es requerido' })
    }

    const data = { nombre, foto, descripcion, especialidades, servicios, horarioPersonalizado };
    if (email) data.email = email;

    if (password) {
      data.password = await bcrypt.hash(password, 12)
    }

    const employee = await Employee.create(data)
    await employee.populate('servicios', 'nombre precio duracion imagen')

    res.status(201).json({ success: true, data: employee })
  } catch (error) {
    next(error)
  }
}

// ─── PUT /api/employees/:id ──────────────────────────────────────────────────
const update = async (req, res, next) => {
  try {
    const { password, ...fields } = req.body

    if (password) {
      fields.password = await bcrypt.hash(password, 12)
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: fields },
      { new: true, runValidators: true }
    ).populate('servicios', 'nombre precio duracion imagen')

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Empleada no encontrada' })
    }

    res.json({ success: true, data: employee })
  } catch (error) {
    next(error)
  }
}

// ─── DELETE /api/employees/:id (soft-delete) ─────────────────────────────────
const deactivate = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Empleada no encontrada' })
    }

    res.json({ success: true, message: 'Empleada desactivada correctamente', data: employee })
  } catch (error) {
    next(error)
  }
}

// ─── PATCH /api/employees/:id/reactivate ─────────────────────────────────────
const reactivate = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    )

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Empleada no encontrada' })
    }

    res.json({ success: true, message: 'Empleada reactivada correctamente', data: employee })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAll, getOne, create, update, deactivate, reactivate }
