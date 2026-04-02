const mongoose = require('mongoose')
const BlockedSlot = require('../models/BlockedSlot')
const { dateOnly } = require('./availabilityController')

/**
 * Helper para aplicar el scope de bloqueos según el rol del usuario.
 * @param {Object} req - Request de Express
 * @param {Object} baseFilter - Filtro de búsqueda base
 */
function applyBlockedSlotScope(req, baseFilter) {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const { role, id, isObjectId } = req.user

  // ADMIN → acceso total sin tocar filtros
  if (role === 'admin') {
    return baseFilter
  }

  // EMPLEADA → acceso restringido
  if (role === 'empleada') {
    const orConditions = [
      { isGlobal: true },
      { employee: 'all' } // compatibilidad legacy
    ]

    // SOLO castear si es válido
    if (isObjectId) {
      orConditions.push({
        employee: new mongoose.Types.ObjectId(id)
      })
    }

    return {
      $and: [
        baseFilter,
        { $or: orConditions }
      ]
    }
  }

  throw new Error('Unauthorized role')
}

// ─── GET /api/blocked-slots ──────────────────────────────────────────────────
// Query: ?employeeId=, ?from=, ?to=, ?isFullDay=
const getAll = async (req, res, next) => {
  try {
    const { employeeId, from, to, isFullDay } = req.query
    const baseFilter = {}

    if (isFullDay !== undefined) {
      baseFilter.isFullDay = isFullDay === 'true'
    }

    if (from || to) {
      baseFilter.date = {}
      if (from) baseFilter.date.$gte = new Date(from)
      if (to) baseFilter.date.$lte = new Date(to)
    }

    // Solo admin puede especificar un employeeId en el filtro base
    if (employeeId && req.user?.role === 'admin') {
      if (mongoose.Types.ObjectId.isValid(employeeId)) {
        baseFilter.employee = new mongoose.Types.ObjectId(employeeId)
      }
    }

    // Aplicar scope de seguridad según el rol
    const finalFilter = applyBlockedSlotScope(req, baseFilter)

    const slots = await BlockedSlot
      .find(finalFilter)
      .sort({ date: 1, timeSlot: 1 })

    res.json({ success: true, data: slots })
  } catch (error) {
    next(error)
  }
}

// ─── POST /api/blocked-slots ─────────────────────────────────────────────────
// Body: { employee: ObjectId|'all', isGlobal, date, isFullDay, timeSlot?, reason? }
const create = async (req, res, next) => {
  try {
    let { employee, isGlobal, date, isFullDay, timeSlot, reason } = req.body

    if (!date) {
      return res.status(400).json({ success: false, message: 'La fecha es requerida' })
    }

    const slotData = {
      date: dateOnly(new Date(date)),
      isFullDay: isFullDay ?? false,
      timeSlot: isFullDay ? undefined : timeSlot,
      reason: reason || ''
    }

    if (isGlobal || employee === 'all') {
      slotData.isGlobal = true;
      // remove employee property explicitly for globals
      slotData.employee = undefined;
    } else {
      if (!employee) {
        return res.status(400).json({ success: false, message: 'employee es requerido para bloqueos privados' })
      }
      slotData.isGlobal = false;
      // Ensure ObjectId casting
      slotData.employee = new mongoose.Types.ObjectId(employee);
    }

    if (!slotData.isFullDay && !slotData.timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'timeSlot es requerido cuando isFullDay es false',
      })
    }

    const slot = await BlockedSlot.create(slotData)

    res.status(201).json({ success: true, data: slot })
  } catch (error) {
    next(error)
  }
}

// ─── DELETE /api/blocked-slots/:id ──────────────────────────────────────────
const remove = async (req, res, next) => {
  try {
    const slot = await BlockedSlot.findByIdAndDelete(req.params.id)
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot bloqueado no encontrado' })
    }
    res.json({ success: true, message: 'Bloqueo eliminado correctamente' })
  } catch (error) {
    next(error)
  }
}

// ─── PUT /api/blocked-slots/:id ─────────────────────────────────────────────
const update = async (req, res, next) => {
  try {
    const slot = await BlockedSlot.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot bloqueado no encontrado' })
    }
    res.json({ success: true, data: slot })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAll, create, remove, update }
