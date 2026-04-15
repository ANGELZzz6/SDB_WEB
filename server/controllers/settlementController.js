const Settlement = require('../models/Settlement');
const Appointment = require('../models/Appointment');
const Employee = require('../models/Employee');

/**
 * Obtener citas pendientes de liquidar para un especialista específico.
 */
exports.getPending = async (req, res) => {
  try {
    const { specialistId } = req.params;
    
    const specialist = await Employee.findById(specialistId);
    if (!specialist) return res.status(404).json({ success: false, message: 'Especialista no encontrado' });

    const appointments = await Appointment.find({
      employee: specialistId,
      status: 'completed',
      settled: false
    }).populate('service', 'nombre precio');

    const totalRevenue = appointments.reduce((acc, appt) => acc + (appt.finalPrice || appt.priceSnapshot || 0), 0);
    const commission = (totalRevenue * (specialist.comisionPorcentaje || 0)) / 100;

    res.json({
      success: true,
      data: {
        appointments,
        totalRevenue,
        commissionPercentage: specialist.comisionPorcentaje || 0,
        totalCommission: commission
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Crear una nueva liquidación y marcar citas como liquidadas.
 */
exports.create = async (req, res) => {
  try {
    const { specialistId, appointmentIds, totalRevenue, commissionPercentage, totalCommission, notes, dateRange } = req.body;

    if (!specialistId || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos (specialistId, appointmentIds)' });
    }

    // ─── PATCH 5: Validar ownership y estado antes de liquidar ───────────────
    // Prevenimos que alguien liquide citas de otro especialista o que no estén completas.
    const validAppts = await Appointment.find({
      _id: { $in: appointmentIds },
      employee: specialistId,   // 🔒 Deben pertenecer al especialista indicado
      status: 'completed',      // 🔒 Solo citas completadas
      settled: false            // 🔒 No reliquidar citas ya liquidadas
    }).select('_id');

    if (validAppts.length !== appointmentIds.length) {
      return res.status(400).json({
        success: false,
        message: `Validación fallida: ${appointmentIds.length - validAppts.length} cita(s) no son válidas para liquidar (no pertenecen al especialista, no están completadas o ya fueron liquidadas).`
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const settlement = new Settlement({
      specialist: specialistId,
      appointments: appointmentIds,
      totalRevenue,
      commissionPercentage,
      totalCommission,
      notes,
      dateRange
    });

    await settlement.save();

    // Marcar citas como liquidadas (settled: true)
    await Appointment.updateMany(
      { _id: { $in: appointmentIds } },
      { settled: true }
    );

    res.json({ success: true, data: settlement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtener historial de liquidaciones de un especialista.
 */
exports.getHistory = async (req, res) => {
  try {
    const { specialistId } = req.params;
    const history = await Settlement.find({ specialist: specialistId })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtener resumen global de liquidaciones (Admin Dashboard).
 */
exports.getGlobalStats = async (req, res) => {
  try {
    const settlements = await Settlement.find();
    
    const totalPaid = settlements.reduce((acc, s) => acc + s.totalCommission, 0);
    const totalSalonRevenue = settlements.reduce((acc, s) => acc + (s.totalRevenue - s.totalCommission), 0);

    res.json({
      success: true,
      data: {
        totalSettlements: settlements.length,
        totalPaidOut: totalPaid,
        salonNetRevenue: totalSalonRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
