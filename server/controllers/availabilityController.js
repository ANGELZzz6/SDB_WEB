const Employee  = require('../models/Employee')
const Service   = require('../models/Service')
const Appointment = require('../models/Appointment')
const BlockedSlot = require('../models/BlockedSlot')
const Settings  = require('../models/Settings')

// ─── Utilidades de tiempo ─────────────────────────────────────────────────────

/**
 * Convierte "HH:MM" en minutos desde medianoche
 */
const timeToMinutes = (str) => {
  const [hh, mm] = str.split(':').map(Number)
  return hh * 60 + mm
}

/**
 * Convierte minutos desde medianoche en "HH:MM"
 */
const minutesToTime = (mins) => {
  const hh = String(Math.floor(mins / 60)).padStart(2, '0')
  const mm = String(mins % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

/**
 * Normaliza una fecha a medianoche UTC para comparaciones puras de fecha
 */
const dateOnly = (d) => {
  const dt = new Date(d)
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()))
}

/**
 * Mapa: índice getDay() → nombre en español del horarioPersonalizado
 */
const DAY_MAP = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

// ─── GET /api/availability/:employeeId/:date ─────────────────────────────────
// Query: ?serviceId=... (requerido para saber la duración del servicio)
const getAvailability = async (req, res, next) => {
  try {
    const { employeeId, date } = req.params
    const { serviceId } = req.query

    // ── 1. Validaciones básicas ──────────────────────────────────────────────
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'serviceId es requerido como query param',
      })
    }

    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Fecha inválida' })
    }

    // ── 2. Cargar configuración global ───────────────────────────────────────
    const settings = await Settings.getSettings()
    const { bufferBetweenAppointments, maxDaysInAdvance, businessHours } = settings

    // ── 3. Validar que la fecha esté dentro del rango permitido ─────────────
    const hoyBogota = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
    const targetStr = date.slice(0, 10)

    if (targetStr < hoyBogota) {
      return res.status(400).json({ success: false, message: 'No se puede agendar en fechas pasadas' })
    }

    const diffDays = Math.floor((new Date(targetStr) - new Date(hoyBogota)) / (1000 * 60 * 60 * 24))
    if (diffDays > maxDaysInAdvance) {
      return res.status(400).json({
        success: false,
        message: `Solo se puede agendar con máximo ${maxDaysInAdvance} días de anticipación`,
      })
    }

    // ── 4. Cargar empleada y verificar que existe ────────────────────────────
    const employee = await Employee.findById(employeeId)
    if (!employee || !employee.isActive) {
      return res.status(404).json({ success: false, message: 'Empleada no encontrada o inactiva' })
    }

    // 🔴 FEATURE: ¿Disponible Hoy? (Solo aplica si fecha === hoyBogota)
    if (targetStr === hoyBogota && employee.disponibleHoy === false) {
      return res.json({
        success: true,
        data: [],
        message: 'La especialista ha marcado que no está disponible hoy.',
        bloqueado: true
      })
    }

    // ── 5. Cargar servicio para obtener duración ─────────────────────────────
    const service = await Service.findById(serviceId)
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado o inactivo' })
    }

    // ── 6. Determinar horario disponible para ese día ────────────────────────
    const dayName = DAY_MAP[targetDate.getUTCDay()] // lunes, martes, etc.
    const daySchedule = employee.horarioPersonalizado?.[dayName]

    // Si el día no está activo para la empleada → no disponible
    if (!daySchedule || daySchedule.activo === false) {
      return res.json({
        success: true,
        data: [],
        message: 'La empleada no trabaja ese día',
      })
    }

    // Usar horario de empleada; fallback al horario del negocio
    const dayStart = daySchedule.inicio || businessHours.inicio
    const dayEnd   = daySchedule.fin    || businessHours.fin

    const startMinutes = timeToMinutes(dayStart)
    const endMinutes   = timeToMinutes(dayEnd)

    // ── 7. Verificar si hay bloqueo de día completo ──────────────────────────
    const fullDayBlocks = await BlockedSlot.find({
      $or: [
        { employee: { $in: [employeeId, 'all'] } },
        { isGlobal: true }
      ],
      isFullDay: true,
      date: {
        $gte: dateOnly(targetDate),
        $lt: new Date(dateOnly(targetDate).getTime() + 24 * 60 * 60 * 1000),
      },
    })

    if (fullDayBlocks.length > 0) {
      const reason = fullDayBlocks[0].reason || 'Este día no está disponible por mantenimiento o festivo.';
      return res.json({
        success: true,
        data: [],
        message: reason,
        bloqueado: true
      })
    }

    // ── 8. Cargar slots bloqueados por hora para ese día ─────────────────────
    const hourBlocks = await BlockedSlot.find({
      $or: [
        { employee: { $in: [employeeId, 'all'] } },
        { isGlobal: true }
      ],
      isFullDay: false,
      date: {
        $gte: dateOnly(targetDate),
        $lt: new Date(dateOnly(targetDate).getTime() + 24 * 60 * 60 * 1000),
      },
    })
    const blockedMinutesSet = new Set(
      hourBlocks.map(b => timeToMinutes(b.timeSlot))
    )

    // ── 9. Cargar citas existentes del día (no canceladas) ───────────────────
    const existingAppointments = await Appointment.find({
      employee: employeeId,
      date: {
        $gte: dateOnly(targetDate),
        $lt: new Date(dateOnly(targetDate).getTime() + 24 * 60 * 60 * 1000),
      },
      status: { $nin: ['cancelled'] },
    }).populate('service', 'duracion')

    // Construir intervalos ocupados: [startMin, endMin + buffer]
    const occupiedIntervals = existingAppointments.map(appt => {
      const apptStart = timeToMinutes(appt.timeSlot)
      const apptDuration = appt.service?.duracion || 60
      const apptEnd = apptStart + apptDuration + bufferBetweenAppointments
      return { start: apptStart, end: apptEnd }
    })

    // ── 10. Generar slots disponibles cada 30 minutos ────────────────────────
    const serviceDuration = service.duracion
    const slots = []

    for (let slotStart = startMinutes; slotStart + serviceDuration <= endMinutes; slotStart += 30) {
      const slotEnd = slotStart + serviceDuration + bufferBetweenAppointments

      // ¿El slot coincide con un bloqueo por hora?
      if (blockedMinutesSet.has(slotStart)) continue

      // ¿El slot se solapa con alguna cita existente?
      const overlaps = occupiedIntervals.some(
        interval => slotStart < interval.end && slotEnd > interval.start
      )
      if (overlaps) continue

      // ── 11. Filtrar slots pasados solo si es HOY en Bogotá ──────────────────
      // Obtenemos la fecha actual en America/Bogota (en-CA devuelve YYYY-MM-DD)
      const nowBogota = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' 
      }).format(new Date());
      
      const isToday = date === nowBogota;
      
      if (isToday) {
        // Obtenemos HH:mm actual en Bogotá
        const timeStr = new Intl.DateTimeFormat('en-US', { 
          timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false 
        }).format(new Date());
        
        const [h, m] = timeStr.split(':').map(Number);
        const nowMinutes = h * 60 + m;
        
        if (slotStart <= nowMinutes) continue;
      }

      slots.push(minutesToTime(slotStart))
    }

    res.json({
      success: true,
      data: slots,
      meta: {
        employeeId,
        date,
        serviceId,
        serviceDuration,
        bufferBetweenAppointments,
        daySchedule: { inicio: dayStart, fin: dayEnd },
      },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAvailability, timeToMinutes, minutesToTime, dateOnly, DAY_MAP }
