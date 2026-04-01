const BlockedSlot = require('../models/BlockedSlot')
const { dateOnly } = require('./availabilityController')

// ─── GET /api/blocked-slots ──────────────────────────────────────────────────
// Query: ?employeeId=, ?from=, ?to=, ?isFullDay=
const getAll = async (req, res, next) => {
  try {
    const { employeeId, from, to, isFullDay } = req.query
    const filter = {}

    if (employeeId) {
      filter.employee = { $in: [employeeId, 'all'] }
    }
    if (isFullDay !== undefined) {
      filter.isFullDay = isFullDay === 'true'
    }
    if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = new Date(from)
      if (to)   filter.date.$lte = new Date(to)
    }

    const slots = await BlockedSlot.find(filter).sort({ date: 1, timeSlot: 1 })
    res.json({ success: true, data: slots })
  } catch (error) {
    next(error)
  }
}

// ─── POST /api/blocked-slots ─────────────────────────────────────────────────
// Body: { employee: ObjectId|'all', date, isFullDay, timeSlot?, reason? }
const create = async (req, res, next) => {
  try {
    const { employee, date, isFullDay, timeSlot, reason } = req.body

    if (!employee || !date) {
      return res.status(400).json({
        success: false,
        message: 'employee y date son requeridos',
      })
    }

    if (!isFullDay && !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'timeSlot es requerido cuando isFullDay es false',
      })
    }

    const slot = await BlockedSlot.create({
      employee,
      date: dateOnly(new Date(date)),
      isFullDay: isFullDay ?? false,
      timeSlot: isFullDay ? undefined : timeSlot,
      reason: reason || '',
    })

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
