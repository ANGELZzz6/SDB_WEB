const mongoose = require('mongoose')
const Appointment = require('../models/Appointment')
const Service = require('../models/Service')
const Employee = require('../models/Employee')
const Settings = require('../models/Settings')
const Client = require('../models/Client')
const SiteConfig = require('../models/SiteConfig')
const { getAvailability: _getAvailability, timeToMinutes, minutesToTime, dateOnly } = require('./availabilityController')
const { normalizePhone } = require('../utils/normalize')

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verifica en tiempo real si un slot está disponible para la cita que se va a crear.
 * Usa la misma lógica de availabilityController para garantizar consistencia.
 */
const checkSlotAvailable = async (employeeId, serviceId, date, timeSlot, excludeAppointmentId = null, session = null) => {
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
  }).session(session)
  if (fullDayBlock) throw new Error('El día está completamente bloqueado')

  // Verificar bloqueo de hora específica
  const hourBlock = await BlockedSlot.findOne({
    employee: { $in: [employeeId, 'all'] },
    isFullDay: false,
    timeSlot,
    date: { $gte: target, $lt: new Date(target.getTime() + 24 * 60 * 60 * 1000) },
  }).session(session)
  if (hourBlock) throw new Error('Ese horario está bloqueado')

  // Verificar solapamiento con citas existentes
  const slotStart = timeToMinutes(timeSlot)
  const slotEnd = slotStart + service.duracion + bufferBetweenAppointments

  const query = {
    employee: employeeId,
    date: { $gte: target, $lt: new Date(target.getTime() + 24 * 60 * 60 * 1000) },
    status: { $in: ['confirmed', 'completed'] },
  }
  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId }
  }

  const existing = await Appointment.find(query).populate('service', 'duracion allowSimultaneous').session(session)

  for (const appt of existing) {
    const apptStart = timeToMinutes(appt.timeSlot)
    const apptDuration = appt.service?.duracion || 60
    const isSimultaneous = appt.service?.allowSimultaneous || false

    const effectiveDuration = isSimultaneous ? Math.min(30, apptDuration) : apptDuration
    const apptEnd = apptStart + effectiveDuration + bufferBetweenAppointments

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

    // Empleada solo ve sus propias citas - Forzamos ObjectId para evitar desajustes de tipos
    if (req.user?.role === 'empleada') {
      if (!req.user.id || !mongoose.Types.ObjectId.isValid(req.user.id)) {
        return res.status(400).json({ success: false, message: 'ID de empleada inválido o no proporcionado' });
      }
      filter.employee = new mongoose.Types.ObjectId(req.user.id);
    } else if (employeeId) {
      if (mongoose.Types.ObjectId.isValid(employeeId)) {
        filter.employee = new mongoose.Types.ObjectId(employeeId);
      }
    }

    if (status) filter.status = status

    if (date) {
      const d = dateOnly(new Date(date))
      const nextDay = new Date(d.getTime() + 24 * 60 * 60 * 1000)
      
      filter.$or = [
        { date: { $gte: d, $lt: nextDay } },
        { 
          isFlexible: true, 
          status: 'pending', 
          'flexibleAvailabilities.date': { $gte: d, $lt: nextDay } 
        }
      ]
    } else if (from || to) {
      const dateRange = {}
      if (from) dateRange.$gte = dateOnly(from)
      if (to) {
        const end = dateOnly(to)
        dateRange.$lt = new Date(end.getTime() + 24 * 60 * 60 * 1000)
      }
      
      filter.$or = [
        { date: dateRange },
        { 
          isFlexible: true, 
          status: 'pending', 
          'flexibleAvailabilities.date': dateRange 
        }
      ]
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

// ─── POST /api/appointments/bulk ──────────────────────────────────────────────
// Crea múltiples citas de forma atómica (lógica dry-run) o flexibles
const createBulk = async (req, res, next) => {
  try {
    const { clientName, clientPhone, clientEmail, appointments, isFlexible, flexibleAvailabilities, notes } = req.body
    
    if (!appointments || !Array.isArray(appointments) || appointments.length === 0) {
      return res.status(400).json({ success: false, message: 'Se requiere una lista de citas' })
    }
    
    // Normalizar teléfono
    const normalizedPhone = normalizePhone(clientPhone || '')
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Teléfono celular requerido' })
    }

    // 1. Limitar número de citas recientes (Spam protection)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentApptsCount = await Appointment.countDocuments({
      clientPhone: normalizedPhone,
      createdAt: { $gte: thirtyMinutesAgo }
    });
    if (recentApptsCount + appointments.length > 5) {
      return res.status(429).json({ 
        success: false, 
        message: 'Límite de citas excedido (máx 4 cada 30 min). No puedes agendar tantas citas a la vez.' 
      });
    }

    // 2. Validación de traslapes intra-petición (Mismo cliente, mismo día, servicios que se cruzan)
    const dailySlots = {}; // { "YYYY-MM-DD": [ {start, end, serviceName} ] }
    
    // 3. Dry-Run: Validar disponibilidad de cada slot individualmente
    const preparedData = [];
    const bulkId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const settings = await Settings.getSettings();

    for (const item of appointments) {
      const { employee, service, date, timeSlot } = item;
      
      let svc;
      
      // Si es FLEXIBLE, saltamos el dry-run de disponibilidad de slots
      if (isFlexible) {
        // Solo necesitamos cargar el servicio para el precio
        const Service = require('../models/Service');
        svc = await Service.findById(service);
        if (!svc) throw new Error(`Servicio no encontrado: ${service}`);

        preparedData.push({
          clientName, clientPhone: normalizedPhone, clientEmail,
          employee, service,
          isFlexible: true,
          flexibleAvailabilities: flexibleAvailabilities || [],
          // Los campos de tiempo quedan vacíos para el flujo flexible
          notes, bulkId,
          status: 'pending',
          priceSnapshot: svc.precio || 0
        });
        continue;
      }

      // Proceso normal (no es flexible)
      try {
        svc = await checkSlotAvailable(employee, service, date, timeSlot);
      } catch (err) {
        return res.status(409).json({ 
          success: false, 
          message: `El servicio "${item.serviceName || 'seleccionado'}" ya no está disponible a las ${timeSlot}. Error: ${err.message}` 
        });
      }

      // Validar traslape del propio cliente en su "carrito"
      const startMin = timeToMinutes(timeSlot);
      const endMin = startMin + svc.duracion;
      const dateKey = date.slice(0, 10);
      
      if (!dailySlots[dateKey]) dailySlots[dateKey] = [];
      for (const existing of dailySlots[dateKey]) {
        if (startMin < existing.end && endMin > existing.start) {
          return res.status(400).json({ 
            success: false, 
            message: `Tus servicios "${existing.serviceName}" y "${svc.nombre}" se cruzan en el horario. Por favor sepáralos.` 
          });
        }
      }
      dailySlots[dateKey].push({ start: startMin, end: endMin, serviceName: svc.nombre });

      preparedData.push({
        clientName, clientPhone: normalizedPhone, clientEmail,
        employee, service,
        date: dateOnly(new Date(date)),
        timeSlot, endTime: minutesToTime(endMin),
        notes, bulkId,
        status: 'pending',
        priceSnapshot: svc.precio || 0
      });
    }

    // 4. Inserción masiva (Si llegamos aquí, el dry-run fue exitoso)
    const createdAppointments = await Appointment.insertMany(preparedData);
    
    // 5. Registro de cliente persistente (usamos la info del primero)
    const regexName = new RegExp(`^${clientName.trim()}$`, 'i');
    const existingClient = await Client.findOne({ phone: normalizedPhone, name: { $regex: regexName } });
    if (!existingClient) {
      const phoneExists = await Client.exists({ phone: normalizedPhone });
      await Client.create({
        phone: normalizedPhone,
        name: clientName,
        telefonoDuplicado: !!phoneExists, // Marcar si el teléfono ya lo usa alguien más
        isActive: true
      });
    }

    res.status(201).json({ success: true, count: createdAppointments.length, bulkId, data: createdAppointments });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Uno de los horarios seleccionados fue ocupado por otro cliente. Por favor verifica tu carrito.' });
    }
    next(error);
  }
}

// ─── POST /api/appointments ──────────────────────────────────────────────────
// Público — clientes agendan desde el chatbot
const create = async (req, res, next) => {
  try {
    let { clientName, clientPhone, clientEmail, employee, service, date, timeSlot, isFlexible, flexibleAvailabilities, notes } = req.body

    // Normalizar teléfono inmediatamente
    clientPhone = normalizePhone(clientPhone)

    // Validaciones básicas (se relajan si es flexible)
    if (!clientName || !clientPhone || !employee || !service || (!isFlexible && (!date || !timeSlot))) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: clientName, clientPhone, employee, service' + (!isFlexible ? ', date, timeSlot' : ''),
      })
    }

    // FIX 5: Rate Limiting (4 citas / 30 min por teléfono)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentApptsCount = await Appointment.countDocuments({
      clientPhone,
      createdAt: { $gte: thirtyMinutesAgo }
    });

    if (recentApptsCount >= 4) {
      return res.status(429).json({ 
        success: false, 
        message: 'Has alcanzado el límite de citas permitidas (4 cada 30 min). Por favor intenta más tarde o contacta al salón directamente.' 
      });
    }

    const settings = await Settings.getSettings()

    // Validar rango máximo de días
    const hoyBogota = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
    const targetStr = date.slice(0, 10)

    if (targetStr < hoyBogota) {
      return res.status(400).json({ success: false, message: 'No se puede agendar en fechas pasadas' })
    }

    const diffDays = Math.floor((new Date(targetStr) - new Date(hoyBogota)) / (1000 * 60 * 60 * 24))
    if (diffDays > settings.maxDaysInAdvance) {
      return res.status(400).json({
        success: false,
        message: `Solo se puede agendar con máximo ${settings.maxDaysInAdvance} días de anticipación`,
      })
    }

    let svc, priceSnapshot, endTime;

    if (!isFlexible) {
      // Verificar disponibilidad real en tiempo real (puede lanzar Error si no disponible)
      try {
        svc = await checkSlotAvailable(employee, service, date, timeSlot)
        priceSnapshot = svc.precio || 0;
        const startMin = timeToMinutes(timeSlot)
        endTime = minutesToTime(startMin + svc.duracion)
      } catch (err) {
        return res.status(409).json({ success: false, message: err.message })
      }
    } else {
      // Si es flexible, solo cargamos el servicio para el precio
      const Service = require('../models/Service');
      svc = await Service.findById(service);
      priceSnapshot = svc?.precio || 0;
    }

    const appt = await Appointment.create({
      clientName, clientPhone, clientEmail,
      employee, service,
      date: date ? dateOnly(new Date(date)) : undefined,
      timeSlot, endTime,
      isFlexible, 
      flexibleAvailabilities: flexibleAvailabilities || [],
      notes,
      status: 'pending',
      priceSnapshot
    })

    // Sincronizar con colección Client (Persistent)
    if (clientPhone) {
      // FIX 4: Manejo de duplicados con mismo teléfono pero diferente nombre
      const regexName = new RegExp(`^${clientName.trim()}$`, 'i');
      let client = await Client.findOne({ 
        phone: clientPhone, 
        name: { $regex: regexName } 
      });

      if (!client) {
        // No existe un cliente con ese nombre y teléfono exactos
        const phoneExists = await Client.exists({ phone: clientPhone });
        await Client.create({
          phone: clientPhone,
          name: clientName,
          telefonoDuplicado: !!phoneExists, // Marcar si el teléfono ya lo usa alguien más
          isActive: true
        });
      } else if (!client.isActive) {
        // Si ya existía pero estaba inactivo, lo reactivamos
        client.isActive = true;
        await client.save();
      }
    }

    await appt.populate([
      { path: 'employee', select: 'nombre foto' },
      { path: 'service', select: 'nombre precio duracion' },
    ])

    res.status(201).json({ success: true, data: appt })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Este horario ya fue reservado por otro cliente mientras realizabas la solicitud. Por favor elige otro.' })
    }
    next(error)
  }
}

// ─── PUT /api/appointments/:id ───────────────────────────────────────────────
// Admin puede cambiar cualquier campo; empleada solo puede confirmar/completar sus citas
const update = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const appt = await Appointment.findById(req.params.id).session(session);
    if (!appt) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    // Restricción de empleada
    if (req.user?.role === 'empleada' && appt.employee.toString() !== req.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }

    // Extraer campos permitidos
    const allowedForEmpleada = ['status', 'notes'];
    const allowedForAdmin = ['status', 'notes', 'clientName', 'clientPhone', 'clientEmail', 'timeSlot', 'date', 'employee', 'service'];
    const fields = req.user?.role === 'admin' ? allowedForAdmin : allowedForEmpleada;

    const updates = {};
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        updates[f] = req.body[f];
        if (f === 'clientPhone') updates[f] = normalizePhone(updates[f]);
      }
    });

    // ── LÓGICA DE CONFIRMACIÓN ──
    // IMPORTANTE: Leemos de req.body directamente para asegurar que los valores del payload estén presentes
    const isTransitioningToConfirmed = (req.body.status === 'confirmed' || updates.status === 'confirmed') && appt.status !== 'confirmed';
    
    if (isTransitioningToConfirmed) {
      const targetDate = req.body.date || updates.date || appt.date;
      const targetTime = req.body.timeSlot || updates.timeSlot || appt.timeSlot;

      if (!targetDate) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'La fecha de la cita es obligatoria para confirmar.' });
      }

      if (!targetTime) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'El horario de la cita es obligatorio para confirmar.' });
      }

      // Asegurar que updates contenga estos valores para el guardado final
      updates.date = targetDate;
      updates.timeSlot = targetTime;
      updates.status = 'confirmed';

      try {
        await checkSlotAvailable(
          req.body.employee || updates.employee || appt.employee,
          req.body.service || updates.service || appt.service,
          targetDate,
          targetTime,
          appt._id.toString(),
          session
        );
      } catch (err) {
        if (err.name === 'CastError' || err.message.includes('Cast to date failed') || err.name === 'ValidationError') {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: `Error de validación: ${err.message}` });
        }

        appt.status = 'rejected';
        const config = await SiteConfig.findOne({}).session(session);
        const template = config?.mensajeRechazoConflicto || 'Lo sentimos {nombre}, el espacio para {fecha} a las {hora} ya no está disponible por un conflicto de agenda.';
        
        const fechaStr = targetDate;
        const msg = template
          .replace(/{nombre}/g, appt.clientName)
          .replace(/{fecha}/g, fechaStr)
          .replace(/{hora}/g, targetTime);
        
        if (!appt.whatsappLog) appt.whatsappLog = [];
        appt.whatsappLog.push({ message: msg, date: new Date(), status: 'pending_whatsapp' });
        
        await appt.save({ session });
        await session.commitTransaction();
        session.endSession();

        return res.status(409).json({
          success: false,
          message: `Conflicto: ${err.message}. Esta solicitud ha sido marcada como Rechazada y el cliente notificado.`,
          data: appt
        });
      }
    }

    // ── LÓGICA DE ENDTIME Y PRECIO ──
    if (updates.timeSlot || updates.service || updates.date || updates.employee) {
      if (!isTransitioningToConfirmed) {
        const newTimeSlot = updates.timeSlot || appt.timeSlot;
        const newServiceId = updates.service || appt.service;
        const newEmployeeId = updates.employee || appt.employee;
        const newDate = updates.date || appt.date;

        try {
          const svc = await checkSlotAvailable(newEmployeeId, newServiceId, newDate, newTimeSlot, appt._id, session);
          const startMin = timeToMinutes(newTimeSlot);
          updates.endTime = minutesToTime(startMin + svc.duracion);
          
          if (req.body.service && req.body.service !== appt.service.toString()) {
            updates.priceSnapshot = svc.precio || 0;
          }
        } catch (err) {
          await session.abortTransaction();
          session.endSession();
          return res.status(409).json({ success: false, message: err.message });
        }
      } else {
        const svcId = updates.service || appt.service;
        const svc = await Service.findById(svcId).session(session);
        const startMin = timeToMinutes(updates.timeSlot || appt.timeSlot);
        if (svc) {
          updates.endTime = minutesToTime(startMin + svc.duracion);
        }
      }
    }

    Object.assign(appt, updates);
    await appt.save({ session });
    await session.commitTransaction();
    session.endSession();

    await appt.populate([
      { path: 'employee', select: 'nombre foto' },
      { path: 'service', select: 'nombre precio duracion' },
    ]);

    res.json({ success: true, data: appt });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// ─── DELETE /api/appointments/:id (cancelar) ─────────────────────────────────
// Sin restricción de horas (cancellationHoursLimit = 0)
const cancel = async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.id)
    if (!appt) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' })
    }

    // BLOCKER 1: Validación para cancelación pública
    // Si no tiene token (req.user no existe), validamos que el cuerpo traiga el teléfono
    if (!req.user) {
      const { clientPhone } = req.body
      if (!clientPhone || normalizePhone(clientPhone) !== appt.clientPhone) {
        return res.status(403).json({ success: false, message: 'No tienes permiso para cancelar esta cita. El número de teléfono no coincide.' })
      }
    } else {
      // Si tiene token, pero es "empleada" solo puede cancelar las suyas
      if (req.user.role === 'empleada' && appt.employee.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Acceso denegado — no eres el especialista asignado' })
      }
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
    const isEmployee = req.user?.role === 'empleada'
    const now = new Date()
    // first day of current month
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    // first day of next month
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // 2. Base Match for MongoDB Aggregations
    const baseMatch = {
      date: { $gte: start, $lt: end }
    }

    if (isEmployee) {
      if (!req.user.isObjectId) {
        return res.status(400).json({ success: false, message: 'ID de empleada inválido' })
      }
      baseMatch.employee = new mongoose.Types.ObjectId(req.user.id)
    }

    // 3. Dynamic Filter for Today Count (matching getAll logic)
    const todayFilter = {
      date: {
        $gte: dateOnly(now),
        $lt: new Date(dateOnly(now).getTime() + 24 * 60 * 60 * 1000),
      },
      status: { $nin: ['cancelled'] },
      ...(isEmployee && { employee: new mongoose.Types.ObjectId(req.user.id) })
    }

    const [globalStats, topServices, todayCount] = await Promise.all([
      Appointment.aggregate([
        { 
          $match: {
            ...(isEmployee && { employee: new mongoose.Types.ObjectId(req.user.id) })
          }
        },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Appointment.aggregate([
        {
          $match: {
            ...baseMatch,
            status: { $nin: ['cancelled'] }
          }
        },
        { $group: { _id: '$service', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
        { $unwind: '$service' },
        { $project: { serviceName: '$service.nombre', count: 1 } },
      ]),
      Appointment.countDocuments(todayFilter),
    ])

    res.json({
      success: true,
      data: { globalStats, topServices, todayCount, monthlyStats: [] },
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

    if (!appt.whatsappLog) appt.whatsappLog = [];
    appt.whatsappLog.push({
      message,
      date: new Date(),
      status: 'pending_whatsapp'
    });

    await appt.save();

    await appt.populate([
      { path: 'employee', select: 'nombre foto' },
      { path: 'service', select: 'nombre precio duracion' },
    ]);

    res.json({ success: true, message: 'Cita reagendada exitosamente', data: appt });
  } catch (error) {
    next(error);
  }
}

// ─── PATCH /api/appointments/:id/complete ──────────────────
const complete = async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    // Authorization check for Specialist
    if (req.user?.role === 'empleada' && appt.employee.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Acceso denegado' })
    }

    const { finalPrice } = req.body;

    appt.status = 'completed';
    if (finalPrice !== undefined) {
      appt.finalPrice = finalPrice;
    }
    await appt.save();

    await appt.populate([
      { path: 'employee', select: 'nombre foto' },
      { path: 'service', select: 'nombre precio duracion' },
    ]);

    res.json({ success: true, message: 'Cita completada', data: appt });
  } catch (error) {
    next(error);
  }
};


/**
 * GET /api/appointments/itinerary/:employeeId/:date
 * Retorna el itinerario completo de un especialista para un día específico,
 * calculando gaps y unificando citas con bloqueos manuales.
 */
const getItinerary = async (req, res, next) => {
  try {
    const { employeeId, date } = req.params;
    
    // 1. Permisos: Especialista solo ve lo suyo, Admin ve todo
    if (req.user?.role === 'empleada' && employeeId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Acceso denegado a itinerarios ajenos.' });
    }

    // 2. Normalización de zona horaria (Bogotá UTC-5)
    // El helper dateOnly construye el inicio del día en UTC para evitar saltos de fecha
    const targetDate = dateOnly(new Date(date));
    const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    // 3. Consultas en paralelo para optimizar performance
    const [appointments, blockedSlots, settings] = await Promise.all([
      Appointment.find({
        employee: employeeId,
        date: { $gte: targetDate, $lt: nextDay }
      }).populate('service', 'nombre duracion precio'),
      
      require('../models/BlockedSlot').find({
        $or: [
          { employee: employeeId },
          { employee: 'all' },
          { isGlobal: true }
        ],
        date: { $gte: targetDate, $lt: nextDay }
      }),
      
      Settings.getSettings()
    ]);

    const timelineItems = [];

    // 4. Procesar Citas
    appointments.forEach(appt => {
      const startMin = timeToMinutes(appt.timeSlot);
      const duration = appt.service?.duracion || 60; // Fallback defensivo: 60min
      timelineItems.push({
        id: appt._id,
        type: 'appointment',
        status: appt.status,
        startTime: appt.timeSlot,
        startMin,
        duration,
        endTime: minutesToTime(startMin + duration),
        endMin: startMin + duration,
        title: appt.service?.nombre || 'Servicio',
        client: appt.clientName || appt.client?.nombre || 'Cliente',
        clientPhone: appt.clientPhone || appt.client?.telefono,
        price: appt.finalPrice || appt.service?.precio,
        // Solo confirmed y completed ocupan espacio real para gaps
        isGapReducer: ['confirmed', 'completed'].includes(appt.status)
      });
    });

    // 5. Procesar Bloqueos Manuales
    blockedSlots.forEach(block => {
      if (block.isFullDay) {
        timelineItems.push({
          id: block._id,
          type: 'block',
          isFullDay: true,
          reason: block.reason || 'Bloqueo día completo',
          isGapReducer: true
        });
      } else if (block.timeSlot) {
        const startMin = timeToMinutes(block.timeSlot);
        const duration = 60; // Bloqueo manual estándar de 1 hora
        timelineItems.push({
          id: block._id,
          type: 'block',
          isFullDay: false,
          startTime: block.timeSlot,
          startMin,
          duration,
          endTime: minutesToTime(startMin + duration),
          endMin: startMin + duration,
          reason: block.reason || 'Bloqueo manual',
          isGapReducer: true
        });
      }
    });

    // Ordenar cronológicamente
    timelineItems.sort((a, b) => (a.startMin || 0) - (b.startMin || 0));

    // 6. Cálculo de Gaps (Tiempos Libres Disponibles)
    // Filtrar solo los elementos que consumen tiempo y no son de día completo
    const gapReducers = timelineItems
      .filter(item => item.isGapReducer && !item.isFullDay)
      .sort((a, b) => a.startMin - b.startMin);

    const gaps = [];
    const { inicio: bizStart, fin: bizEnd } = settings.businessHours;
    let currentCursor = timeToMinutes(bizStart);
    const dayEndLimit = timeToMinutes(bizEnd);

    const isGlobalBlock = timelineItems.some(item => item.type === 'block' && item.isFullDay);
    
    if (!isGlobalBlock) {
      gapReducers.forEach(reducer => {
        // Si hay espacio entre el cursor actual y el inicio de la cita/bloqueo, es un gap
        if (reducer.startMin > currentCursor) {
          gaps.push({
            start: minutesToTime(currentCursor),
            end: minutesToTime(reducer.startMin),
            duration: reducer.startMin - currentCursor
          });
        }
        // Avanzar el cursor al final de la ocupación
        if (reducer.endMin > currentCursor) {
          currentCursor = reducer.endMin;
        }
      });

      // Gap final: desde el último movimiento hasta el cierre del salón
      if (currentCursor < dayEndLimit) {
        gaps.push({
          start: minutesToTime(currentCursor),
          end: minutesToTime(dayEndLimit),
          duration: dayEndLimit - currentCursor
        });
      }
    }

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        employeeId,
        timeline: timelineItems,
        gaps,
        businessHours: settings.businessHours,
        isFullDayBlocked: isGlobalBlock
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getOne, create, createBulk, update, cancel, reschedule, getStats, getClients, complete, getItinerary }
