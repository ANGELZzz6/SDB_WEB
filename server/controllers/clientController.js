const Client = require('../models/Client')
const Appointment = require('../models/Appointment')
const { normalizePhone } = require('../utils/normalize')

/**
 * Obtener todos los clientes activos.
 * Mezcla datos de la colección Client (fuente de verdad) con Appointment (fallback histórico).
 */
exports.getAll = async (req, res) => {
  try {
    // 1. Obtener todos los registros de la colección Client (activos e inactivos)
    const clientsFromDB = await Client.find().lean()

    // 2. Obtener estadísticas reales desde Appointments (Agregación BI)
    // Filtramos solo citas con status 'completed' para las métricas
    const clientStats = await Appointment.aggregate([
      { $match: { status: 'completed' } },
      { 
        $group: {
          _id: "$clientPhone",
          name: { $first: "$clientName" },
          visits: { $sum: 1 },
          lastDate: { $max: "$date" },
          ltv: { 
            $sum: { $ifNull: ["$finalPrice", { $ifNull: ["$priceSnapshot", 0] }] } 
          },
          // Para el artista favorito: guardamos los conteos de especialistas en un array
          specialists: { $push: "$employee" }
        }
      }
    ]);

    // Procesar especialistas favoritos (esto es más eficiente hacerlo en JS tras el group si el volumen es manejable, 
    // o con otro pipeline. Lo haremos aquí para precisión).
    // También obtenemos los nombres de los empleados para no mostrar IDs.
    const allEmployeeIds = [...new Set(clientStats.flatMap(s => s.specialists.map(id => id?.toString()).filter(Boolean)))];
    const employeesData = await require('../models/Employee').find({ _id: { $in: allEmployeeIds } }).select('nombre').lean();
    const empMap = new Map(employeesData.map(e => [e._id.toString(), e.nombre]));

    const statsMap = new Map();
    clientStats.forEach(s => {
      // Calcular favorito de la lista
      const counts = {};
      let favoriteId = null;
      let max = 0;
      s.specialists.forEach(id => {
        if (!id) return;
        const idStr = id.toString();
        counts[idStr] = (counts[idStr] || 0) + 1;
        if (counts[idStr] > max) {
          max = counts[idStr];
          favoriteId = idStr;
        }
      });

      statsMap.set(normalizePhone(s._id), {
        visits: s.visits,
        lastDate: s.lastDate,
        ltv: s.ltv,
        favoriteEmployee: favoriteId ? empMap.get(favoriteId) : 'S/I'
      });
    });

    // 3. Mezclar usando un Map (Identificador: teléfono normalizado)
    const clientMap = new Map()

    // Primero poblamos con el historial y estadísticas
    clientStats.forEach(c => {
      const phone = normalizePhone(c._id)
      if (phone) {
        const stats = statsMap.get(phone);
        clientMap.set(phone, {
          id: phone,
          phone: phone,
          name: c.name || 'Cliente sin nombre',
          visits: stats?.visits || 0,
          lastDate: stats?.lastDate || null,
          ltv: stats?.ltv || 0,
          favoriteEmployee: stats?.favoriteEmployee || 'S/I',
          isActive: true
        })
      }
    })

    // Luego sobrescribimos/complementamos con la colección Client (Prioridad DB)
    clientsFromDB.forEach(c => {
      const phone = normalizePhone(c.phone)
      if (phone) {
        const existing = clientMap.get(phone);
        clientMap.set(phone, {
          id: phone,
          phone: phone,
          name: c.name || existing?.name || 'Cliente sin nombre',
          visits: existing?.visits || 0,
          lastDate: existing?.lastDate || null,
          ltv: existing?.ltv || 0,
          favoriteEmployee: existing?.favoriteEmployee || 'S/I',
          isActive: c.isActive
        })
      }
    })

    // 4. Filtrar y convertir a array
    // Solo retornamos los que no están marcados explícitamente como inactivos (isActive !== false)
    const result = Array.from(clientMap.values())
      .filter(c => c.isActive !== false)
      .sort((a, b) => a.name.localeCompare(b.name))

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Obtener detalle de un cliente específico (CRM Advanced Analytics & BI).
 */
exports.getOne = async (req, res) => {
  try {
    const rawPhone = req.params.phone
    const phone = normalizePhone(rawPhone)

    if (!phone) {
      return res.status(400).json({ success: false, message: 'ID de cliente inválido' })
    }

    // 1. Obtener datos básicos de la colección Client
    const clientData = await Client.findOne({ phone }).lean()

    // 2. Obtener historial de citas (Excluimos canceladas para las métricas reales)
    const appointments = await Appointment.find({ 
      clientPhone: phone,
      status: { $ne: 'cancelled' }
    })
    .populate('service', 'nombre precio')
    .populate('employee', 'nombre')
    .sort({ date: -1 })
    .lean()

    // 3. Cálculos de Estadísticas Base
    const totalVisits = appointments.length
    const lastVisitDate = appointments[0]?.date || null
    
    // Cálculo de Gasto Total (con finalPrice como prioridad absoluta, fallback a priceSnapshot)
    const totalSpent = appointments.reduce((acc, appt) => {
      const price = appt.finalPrice ?? appt.priceSnapshot ?? appt.service?.precio ?? 0
      return acc + price
    }, 0)

    const averageTicket = totalVisits > 0 ? Math.round(totalSpent / totalVisits) : 0
    
    // 4. Business Intelligence (BI) Metrics
    
    // 4.1 Frecuencia de Visita (Corrected Formula)
    let visitFrequency = null
    if (totalVisits >= 2) {
      const firstVisit = new Date(appointments[appointments.length - 1].date)
      const lastVisit = new Date(appointments[0].date)
      const totalDaysBetween = (lastVisit - firstVisit) / (1000 * 60 * 60 * 24)
      visitFrequency = Math.floor(totalDaysBetween / (totalVisits - 1))
    }

    // 4.2 Retención & Riesgo (Días desde última visita)
    let daysSinceLastVisit = null
    let isAtRisk = false
    if (lastVisitDate) {
      const msPerDay = 1000 * 60 * 60 * 24
      daysSinceLastVisit = Math.floor((Date.now() - new Date(lastVisitDate)) / msPerDay)
      
      // Riesgo Inteligente: 2 veces su frecuencia habitual, o 30 días default
      const riskThreshold = (visitFrequency && visitFrequency > 0) ? (visitFrequency * 2) : 30
      isAtRisk = daysSinceLastVisit > riskThreshold
    }

    // 4.3 Segmentación (Tiers) - Umbrales para Colombia
    let clientTier = 'Básico'
    if (totalSpent >= 300000) clientTier = 'VIP'
    else if (totalSpent >= 100000) clientTier = 'Medio'

    // 4.4 Servicio Favorito (Agregación por nombre)
    const serviceCount = {}
    appointments.forEach(a => {
      const name = a.service?.nombre || a.serviceName || 'Desconocido'
      serviceCount[name] = (serviceCount[name] || 0) + 1
    })
    const favoriteService = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ninguno'

    // 4.5 Predicción de Próxima Visita (Clamped para evitar ruido)
    let nextSuggestedVisit = null
    if (visitFrequency && visitFrequency > 0 && visitFrequency < 120 && lastVisitDate) {
      nextSuggestedVisit = new Date(
        new Date(lastVisitDate).getTime() + visitFrequency * 24 * 60 * 60 * 1000
      )
    }

    // 4.6 Business Intelligence (BI) Metrics — Final formatting
    const finalData = {
      // ─── Estructura Plana (Soporte para tests y listado) ───
      id: phone,
      phone: phone,
      name: clientData?.name || appointments[0]?.clientName || 'Cliente sin nombre',
      email: clientData?.email || appointments[0]?.clientEmail || '',
      ltv: totalSpent,
      tier: clientTier,
      visits: totalVisits,
      lastDate: lastVisitDate,
      favoriteEmployee: favoriteService, // Reutilizamos favoriteService para consistencia
      isActive: clientData ? clientData.isActive : true,

      // ─── Estructura Anidada (Soporte para UI legado/actual) ───
      client: {
        phone: phone,
        name: clientData?.name || appointments[0]?.clientName || 'Cliente sin nombre',
        email: clientData?.email || appointments[0]?.clientEmail || '',
        tier: clientTier,
      },
      stats: {
        totalVisits,
        lastVisit: lastVisitDate,
        totalSpent,
        averageTicket,
        isFrequent: totalVisits >= 5 && totalSpent >= 100000,
        isAtRisk,
        daysSinceLastVisit,
        clientTier,
        visitFrequency,
        favoriteService,
        nextSuggestedVisit
      },
      appointments: appointments.map(a => ({
        _id: a._id,
        date: a.date,
        serviceName: a.service?.nombre || 'Servicio eliminado',
        employeeName: a.employee?.nombre || 'Especialista',
        status: a.status,
        price: a.finalPrice ?? a.priceSnapshot ?? a.service?.precio ?? 0,
        isFinal: a.finalPrice !== undefined
      }))
    }

    res.json({
      success: true,
      data: finalData
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Desactiva un cliente de forma definitiva (idempotente).
 */
exports.deactivate = async (req, res) => {
  try {
    const rawPhone = req.params.phone
    const phone = normalizePhone(rawPhone)

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Número de teléfono inválido o no proporcionado' })
    }

    // Upsert con isActive: false para persistir la eliminación
    await Client.findOneAndUpdate(
      { phone },
      { isActive: false },
      { upsert: true, new: true }
    )

    res.json({ success: true, message: 'Cliente desactivado correctamente' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
