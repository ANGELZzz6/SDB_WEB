const Appointment  = require('../models/Appointment')
const Service      = require('../models/Service')
const Employee     = require('../models/Employee')
const Settings     = require('../models/Settings')
const { getAvailability: _getAvailability, timeToMinutes, minutesToTime, dateOnly } = require('./availabilityController')

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verifica en tiempo real si un slot está disponible para la cita que se va a crear.
 * Usa la misma lógica de availabilityController para garantizar consistencia.
 */
const checkSlotAvailable = async (employeeId, serviceId, date, timeSlot, excludeAppointmentId = null) => {
  const settings = await Settings.getSettings()
  const { bufferBetweenAppointments } = settings

  const service = await Service.findById(serviceId)
  if (!service || !service.isActive) throw new Error('Servicio no encontrado o inactivo')

  const BlockedSlot = require('../models/BlockedSlot')
  const target = dateOnly(new Date(date))

  // Verificar bloqueo de día completo
  const fullDayBlock = await BlockedSlot.findOne({
    employee: { $in: [employeeId, 'all'] },
    isFullDay: true,
    date: { $gte: target, $lt: new Date(target.getTime() + 24 * 60 * 60 * 1000) },
  })
  if (fullDayBlock) throw new Error('El día está completamente bloqueado')

  // Verificar bloqueo de hora específica
  const hourBlock = await BlockedSlot.findOne({
    employee: { $in: [employeeId, 'all'] },
    isFullDay: false,
    timeSlot,
    date: { $gte: target, $lt: new Date(target.getTime() + 24 * 60 * 60 * 1000) },
  })
  if (hourBlock) throw new Error('Ese horario está bloqueado')

  // Verificar solapamiento con citas existentes
  const slotStart = timeToMinutes(timeSlot)
  const slotEnd   = slotStart + service.duracion + bufferBetweenAppointments

  const query = {
    employee: employeeId,
    date: { $gte: target, $lt: new Date(target.getTime() + 24 * 60 * 60 * 1000) },
    status: { $nin: ['cancelled'] },
  }
  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId }
  }

  const existing = await Appointment.find(query).populate('service', 'duracion')

  for (const appt of existing) {
    const apptStart    = timeToMinutes(appt.timeSlot)
    const apptDuration = appt.service?.duracion || 60
    const apptEnd      = apptStart + apptDuration + bufferBetweenAppointments

    if (slotStart < apptEnd && slotEnd > apptStart) {
      throw new Error(`Horario ocupado — existe una cita de ${appt.timeSlot} a ${appt.endTime}`)
    }
  }

  return service // devolvemos el servicio para reusarlo
}

// ─── GET /api/appointments ───────────────────────────────────────────────────
// Query: ?date=, ?employeeId=, ?status=, ?from=, ?to=, ?page=, ?limit=
const getAll = async (req, res, next) => {
  try {
    const {
      date, employeeId, status, from, to,
      page = 1, limit = 50,
    } = req.query

    const filter = {}

    // Empleada solo ve sus propias citas
    if (req.user?.role === 'empleada') {
      filter.employee = req.user.id
    } else if (employeeId) {
      filter.employee = employeeId
    }

    if (status) filter.status = status

    if (date) {
      const d = dateOnly(new Date(date))
      filter.date = { $gte: d, $lt: new Date(d.getTime() + 24 * 60 * 60 * 1000) }
    } else if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = new Date(from)
      if (to)   filter.date.$lte = new Date(to)
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('employee', 'nombre foto')
        .populate('service', 'nombre precio duracion')
        .sort({ date: 1, timeSlot: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Appointment.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: appointments,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    next(error)
  }
}

// ─── GET /api/appointments/:id ───────────────────────────────────────────────
const getOne = async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate('employee', 'nombre foto')
      .populate('service', 'nombre precio duracion')

    if (!appt) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' })
    }

    // Empleada solo puede ver sus propias citas
    if (req.user?.role === 'empleada' && appt.employee._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Acceso denegado' })
    }

    res.json({ success: true, data: appt })
  } catch (error) {
    next(error)
  }
}

// ─── POST /api/appointments ──────────────────────────────────────────────────
// Público — clientes agendan desde el chatbot
const create = async (req, res, next) => {
  try {
    const { clientName, clientPhone, clientEmail, employee, service, date, timeSlot, notes } = req.body

    // Validaciones básicas
    if (!clientName || !clientPhone || !employee || !service || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: clientName, clientPhone, employee, service, date, timeSlot',
      })
    }

    const settings = await Settings.getSettings()

    // Validar rango máximo de días
    const today  = dateOnly(new Date())
    const target = dateOnly(new Date(date))
    const diffDays = Math.floor((target - today) / (1000 * 60 * 60 * 1000 * 24))
    if (diffDays < 0) {
      return res.status(400).json({ success: false, message: 'No se puede agendar en fechas pasadas' })
    }
    if (diffDays > settings.maxDaysInAdvance) {
      return res.status(400).json({
        success: false,
        message: `Solo se puede agendar con máximo ${settings.maxDaysInAdvance} días de anticipación`,
      })
    }

    // Verificar disponibilidad real en tiempo real (puede lanzar Error si no disponible)
    let svc
    try {
      svc = await checkSlotAvailable(employee, service, date, timeSlot)
    } catch (err) {
      return res.status(409).json({ success: false, message: err.message })
    }

    // Calcular endTime
    const startMin = timeToMinutes(timeSlot)
    const endMin   = startMin + svc.duracion
    const endTime  = minutesToTime(endMin)

    const appt = await Appointment.create({
      clientName, clientPhone, clientEmail,
      employee, service,
      date: dateOnly(new Date(date)),
      timeSlot, endTime,
      notes,
      status: 'pending',
    })

    await appt.populate([
      { path: 'employee', select: 'nombre foto' },
      { path: 'service',  select: 'nombre precio duracion' },
    ])

    res.status(201).json({ success: true, data: appt })
  } catch (error) {
    next(error)
  }
}

// ─── PUT /api/appointments/:id ───────────────────────────────────────────────
// Admin puede cambiar cualquier campo; empleada solo puede confirmar/completar sus citas
const update = async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.id)
    if (!appt) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' })
    }

    // Restricción de empleada
    if (req.user?.role === 'empleada' && appt.employee.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Acceso denegado' })
    }

    const allowedForEmpleada = ['status', 'notes']
    const allowedForAdmin    = ['status', 'notes', 'clientName', 'clientPhone', 'clientEmail', 'timeSlot', 'date', 'employee', 'service']

    const fields = req.user?.role === 'admin' ? allowedForAdmin : allowedForEmpleada

    const updates = {}
    fields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f]
    })

    // Si admin cambia el horario, recalcular endTime y verificar disponibilidad
    if (updates.timeSlot || updates.service) {
      const newTimeSlot = updates.timeSlot || appt.timeSlot
      const newServiceId = updates.service || appt.service
      const newEmployeeId = updates.employee || appt.employee
      const newDate = updates.date || appt.date

      let svc
      try {
        svc = await checkSlotAvailable(newEmployeeId, newServiceId, newDate, newTimeSlot, appt._id)
      } catch (err) {
        return res.status(409).json({ success: false, message: err.message })
      }

      const startMin = timeToMinutes(newTimeSlot)
      updates.endTime = minutesToTime(startMin + svc.duracion)
    }

    Object.assign(appt, updates)
    await appt.save()

    await appt.populate([
      { path: 'employee', select: 'nombre foto' },
      { path: 'service',  select: 'nombre precio duracion' },
    ])

    res.json({ success: true, data: appt })
  } catch (error) {
    next(error)
  }
}

// ─── DELETE /api/appointments/:id (cancelar) ─────────────────────────────────
// Sin restricción de horas (cancellationHoursLimit = 0)
const cancel = async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.id)
    if (!appt) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' })
    }

    if (appt.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'La cita ya está cancelada' })
    }

    if (appt.status === 'completed') {
      return res.status(400).json({ success: false, message: 'No se puede cancelar una cita completada' })
    }

    appt.status = 'cancelled'
    await appt.save()

    res.json({ success: true, message: 'Cita cancelada correctamente', data: appt })
  } catch (error) {
    next(error)
  }
}

// ─── GET /api/appointments/stats ─────────────────────────────────────────────
// Solo admin
const getStats = async (req, res, next) => {
  try {
    const now   = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1) // inicio del mes
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0) // fin del mes

    const [monthlyStats, topServices, todayCount] = await Promise.all([
      Appointment.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Appointment.aggregate([
        { $match: { status: { $nin: ['cancelled'] }, date: { $gte: start, $lte: end } } },
        { $group: { _id: '$service', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
        { $unwind: '$service' },
        { $project: { serviceName: '$service.nombre', count: 1 } },
      ]),
      Appointment.countDocuments({
        date: {
          $gte: dateOnly(now),
          $lt: new Date(dateOnly(now).getTime() + 24 * 60 * 60 * 1000),
        },
        status: { $nin: ['cancelled'] },
      }),
    ])

    res.json({
      success: true,
      data: { monthlyStats, topServices, todayCount },
    })
  } catch (error) {
    next(error)
  }
}

// ─── GET /api/appointments/clients ─────────────────────────────────────────────
// Agrupa appointments por clientPhone (identificador único) solo para admin
const getClients = async (req, res, next) => {
  try {
    const clients = await Appointment.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $sort: { date: -1, timeSlot: -1 } },
      {
        $group: {
          _id: "$clientPhone",
          name: { $first: "$clientName" },
          email: { $first: "$clientEmail" },
          phone: { $first: "$clientPhone" },
          visits: { $sum: 1 },
          lastDate: { $first: "$date" },
          lastServiceId: { $first: "$service" },
          employeesUsed: { $push: "$employee" }
        }
      },
      {
        $lookup: {
          from: "services",
          localField: "lastServiceId",
          foreignField: "_id",
          as: "lastServiceInfo"
        }
      },
      { $unwind: { path: "$lastServiceInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          email: 1,
          phone: 1,
          visits: 1,
          lastDate: 1,
          lastService: "$lastServiceInfo.nombre",
          employeesUsed: 1
        }
      }
    ]);

    const allEmps = await Employee.find().select('_id nombre');
    const empMap = {};
    allEmps.forEach(e => empMap[e._id.toString()] = e.nombre);

    const formattedClients = clients.map(c => {
      const counts = {};
      let favorite = null;
      let max = 0;
      if (c.employeesUsed && c.employeesUsed.length > 0) {
        for (const eid of c.employeesUsed) {
          const idStr = eid ? eid.toString() : null;
          if (!idStr) continue;
          counts[idStr] = (counts[idStr] || 0) + 1;
          if (counts[idStr] > max) { max = counts[idStr]; favorite = idStr; }
        }
      }
      return {
        id: c.id,
        name: c.name,
        email: c.email || '',
        phone: c.phone || c.id,
        visits: c.visits,
        lastDate: c.lastDate,
        lastService: c.lastService || 'General',
        favoriteEmployee: favorite ? (empMap[favorite] || 'Desconocido') : 'Desconocido'
      };
    });

    // Ordenar clientes por cantidad de visitas desc y luego alfabéticamente
    formattedClients.sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name));

    res.json({ success: true, data: formattedClients });
  } catch (error) {
    next(error);
  }
}

// ─── PATCH /api/appointments/:id/reschedule ─────────────────────────────────────────────
// Solo admin. Reagenda y empuja notificación WhatsApp
const reschedule = async (req, res, next) => {
  try {
    const { date, timeSlot, employeeId, reason } = req.body;
    const apptId = req.params.id;

    if (!date || !timeSlot || !employeeId) {
      return res.status(400).json({ success: false, message: 'Faltan campos para reagendar (date, timeSlot, employeeId)' });
    }

    const appt = await Appointment.findById(apptId).populate('service');
    if (!appt) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    if (appt.status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'No se puede reagendar una cita cancelada.' })
    }

    // Checar disponibilidad
    let svc;
    try {
      svc = await checkSlotAvailable(employeeId, appt.service._id, date, timeSlot, apptId);
    } catch (err) {
      return res.status(409).json({ success: false, message: err.message });
    }

    const oldDate = new Date(appt.date);
    const oldDateString = oldDate.toISOString().split('T')[0];
    const oldTimeSlot = appt.timeSlot;

    // Actualizar campos basicos
    appt.date = dateOnly(new Date(date));
    appt.timeSlot = timeSlot;
    appt.employee = employeeId;
    
    // Calcular end time
    const startMin = timeToMinutes(timeSlot);
    appt.endTime = minutesToTime(startMin + svc.duracion);

    appt.rescheduledAt = new Date();
    appt.rescheduledReason = reason || 'Reasignación de agenda';

    // Generar log simulado de Whatsapp
    const fechaFormat = dateOnly(new Date(date)).toISOString().split('T')[0];
    const message = `Hola ${appt.clientName}, tu cita del ${oldDateString} a las ${oldTimeSlot} fue reagendada para el ${fechaFormat} a las ${timeSlot}. Motivo: ${reason || 'Reasignación administrativa'}. Disculpa los inconvenientes - L'Élixir Salon`;

    if(!appt.whatsappLog) appt.whatsappLog = [];
    appt.whatsappLog.push({
        message,
        date: new Date(),
        status: 'pending_whatsapp'
    });

    await appt.save();

    await appt.populate([
      { path: 'employee', select: 'nombre foto' },
      { path: 'service',  select: 'nombre precio duracion' },
    ]);

    res.json({ success: true, message: 'Cita reagendada exitosamente', data: appt });
  } catch(error) {
    next(error);
  }
}

module.exports = { getAll, getOne, create, update, cancel, reschedule, getStats, getClients }
