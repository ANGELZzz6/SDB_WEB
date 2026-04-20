import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { appointmentService, blockedSlotService, employeeService, availabilityService, siteConfigService } from '../services/api';
import FlexibleConfirmationModal from '../components/FlexibleConfirmationModal';
import type { Appointment, BlockedSlot, Employee, SiteConfig } from '../types';
import { waLink, WA_MESSAGES, formatFecha, formatHora12, buildMessage } from '../utils/whatsappMessages';

export default function AdminCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [citasPendientes, setCitasPendientes] = useState<Appointment[]>([]);

  // Modals state
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ date: Date, appts: Appointment[], blocks: BlockedSlot[] } | null>(null);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({ employee: 'all', isFullDay: true, startTime: '08:00', endTime: '10:00', reason: '' });

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [reschForm, setReschForm] = useState({ date: '', timeSlot: '', employeeId: '', reason: '' });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedApptToComplete, setSelectedApptToComplete] = useState<Appointment | null>(null);
  const [finalPriceInput, setFinalPriceInput] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [waModal, setWaModal] = useState<{ link: string, mensaje: string } | null>(null);

  // Flexible confirmation state
  const [selectedFlexibleAppt, setSelectedFlexibleAppt] = useState<Appointment | null>(null);

  // User auth info
  const rawUser = localStorage.getItem('adminUser');
  const user = rawUser ? JSON.parse(rawUser) : null;
  const isAdmin = user?.role === 'admin';

  // Employee filter: admins default to 'all' (global view), empleadas are locked to their own ID
  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    isAdmin ? 'all' : (user?.id || 'all')
  );


  // Fetch data
  const loadData = async (showLoading = true, employeeFilter?: string) => {
    try {
      if (showLoading) setLoading(true);
      // No mostrar loading spinner en el polling para no interrumpir
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Solo enviar employeeId si se seleccionó una especialista específica
      const empFilter = employeeFilter ?? selectedEmployee;
      const empParam = (empFilter && empFilter !== 'all') ? empFilter : undefined;

      const [resApps, resBlocks, resEmps, resConfig] = await Promise.all([
        appointmentService.getAll({ from: startOfMonth.toISOString(), to: endOfMonth.toISOString(), limit: 1000, ...(empParam ? { employeeId: empParam } : {}) }),
        blockedSlotService.getAll(),
        employeeService.getAll(),
        siteConfigService.get()
      ]);

      if (resApps.success) setAppointments((resApps.data as unknown as Appointment[]) || []);
      if (resBlocks.success) setBlockedSlots((resBlocks.data as unknown as BlockedSlot[]) || []);
      if (resEmps.success) setEmployees((resEmps.data as unknown as Employee[]) || []);
      if (resConfig.success) setSiteConfig(resConfig.data || null);

      // Cargar citas pendientes globales para la restricción
      const resPend = await appointmentService.getAll({ status: 'pending' });
      if (resPend.success) setCitasPendientes(resPend.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Polling cada 30 segundos
    const interval = setInterval(() => {
      loadData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentDate.getMonth(), currentDate.getFullYear(), selectedEmployee]);

  // Calendar logic
  const getDaysInMonth = (year: number, month: number) => {
    const list = [];
    const d = new Date(year, month, 1);
    while (d.getMonth() === month) {
      list.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return list;
  };

  const daysThisMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayIndex = daysThisMonth[0].getDay(); // 0 (Sun) to 6 (Sat)
  // Let's start week on Monday:
  const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const blanks = Array.from({ length: offset });

  // Helpers
  const formatISO = (d: Date | string | null | undefined) => {
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    // Forzado a Bogotá para evitar desfases de medianoche
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  };

  const isMultiSession = (bulkId?: string) => {
    if (!bulkId) return false;
    return appointments.filter(a => a.bulkId === bulkId).length > 1 || citasPendientes.filter(a => a.bulkId === bulkId).length > 1;
  };

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Modals operations
  const handleCreateBlock = async () => {
    if (!selectedDayInfo) return;

    // Validación previa en el cliente antes de llamar a la API
    if (!blockForm.isFullDay && blockForm.startTime >= blockForm.endTime) {
      alert('La hora de inicio debe ser anterior a la hora de fin.');
      return;
    }

    try {
      const payload: Record<string, any> = {
        date: formatISO(selectedDayInfo.date),
        isFullDay: blockForm.isFullDay,
        employee: blockForm.employee,
        reason: blockForm.reason,
      };

      if (!blockForm.isFullDay) {
        // Siempre enviamos rango (startTime + endTime). El backend lo maneja.
        payload.startTime = blockForm.startTime;
        payload.endTime   = blockForm.endTime;
      }

      await blockedSlotService.create(payload);
      setShowBlockModal(false);
      loadData(false);
      setSelectedDayInfo(null);
    } catch (e: any) {
      alert(e.message || 'Error bloqueando horario');
    }
  };

  const handleRemoveBlock = async (id: string) => {
    if (!confirm('¿Eliminar este bloqueo?')) return;
    try {
      await blockedSlotService.delete(id);
      loadData(false);
      setSelectedDayInfo(null);
    } catch (e) {
      console.error(e);
    }
  }

  // Reschedule
  const openReschedule = (appt: Appointment) => {
    setRescheduleTarget(appt);
    setReschForm({
      date: formatISO(new Date()), // Iniciar en hoy para evitar errores de fecha pasada 400
      timeSlot: appt.timeSlot,
      employeeId: typeof appt.employee === 'string' ? appt.employee : appt.employee._id,
      reason: ''
    });
    setAvailableSlots([]);
    setShowRescheduleModal(true);
  };

  useEffect(() => {
    if (showRescheduleModal && reschForm.date && reschForm.employeeId && rescheduleTarget) {
      availabilityService.getSlots(
        reschForm.employeeId,
        typeof rescheduleTarget.service === 'string' ? rescheduleTarget.service : rescheduleTarget.service._id,
        reschForm.date
      ).then(res => setAvailableSlots(res.data || []));
    }
  }, [reschForm.date, reschForm.employeeId, rescheduleTarget]);

  const handleConfirmReschedule = async () => {
    if (!rescheduleTarget) return;
    try {
      await appointmentService.reschedule(rescheduleTarget._id, {
        date: reschForm.date,
        timeSlot: reschForm.timeSlot,
        employeeId: reschForm.employeeId,
        reason: reschForm.reason
      } as any);
      setShowRescheduleModal(false);

      const updatedAppt = { ...rescheduleTarget, date: reschForm.date, timeSlot: reschForm.timeSlot };
      const serviceName = typeof updatedAppt.service === 'string' ? updatedAppt.service : (updatedAppt.service as any)?.nombre || 'Servicio';

      // Actualización optimista
      setAppointments(prev => prev.map(a => a._id === updatedAppt._id ? updatedAppt : a));
      if (selectedDayInfo) {
        setSelectedDayInfo({
          ...selectedDayInfo,
          appts: selectedDayInfo.appts
            .map(a => a._id === updatedAppt._id ? updatedAppt : a)
            .filter(a => formatISO(a.date) === formatISO(selectedDayInfo.date))
        });
      }

      // Abrir modal WA directamente
      const msg = siteConfig?.mensajeReagendamiento
        ? buildMessage(siteConfig.mensajeReagendamiento, { nombre: updatedAppt.clientName, servicio: serviceName, fecha: formatFecha(updatedAppt.date), hora: formatHora12(updatedAppt.timeSlot) })
        : WA_MESSAGES.reagendamiento(updatedAppt.clientName, serviceName, formatFecha(updatedAppt.date), formatHora12(updatedAppt.timeSlot));
      setWaModal({ link: waLink(updatedAppt.clientPhone, msg), mensaje: msg });

      loadData(false);
    } catch (e: any) {
      alert(e.message || 'Error reagendando');
    }
  };

  const handleStatusChange = async (appt: Appointment, newStatus: 'confirmed' | 'cancelled' | 'rejected') => {
    try {
      const res = await appointmentService.updateStatus(appt._id, newStatus);
      if (res.success) {
        const fullAppt = res.data || appt;
        const serviceName = typeof fullAppt.service === 'string' ? fullAppt.service : (fullAppt.service as any)?.nombre || 'Servicio';

        // Abrir modal WA directamente con el mensaje correcto
        let msg = '';
        if (newStatus === 'confirmed') {
          msg = siteConfig?.mensajeConfirmacion
            ? buildMessage(siteConfig.mensajeConfirmacion, { nombre: fullAppt.clientName, servicio: serviceName, fecha: formatFecha(fullAppt.date), hora: formatHora12(fullAppt.timeSlot) })
            : WA_MESSAGES.confirmacion(fullAppt.clientName, serviceName, formatFecha(fullAppt.date), formatHora12(fullAppt.timeSlot));
        } else {
          msg = siteConfig?.mensajeRechazoConflicto
            ? buildMessage(siteConfig.mensajeRechazoConflicto, { nombre: fullAppt.clientName, fecha: formatFecha(fullAppt.date), hora: formatHora12(fullAppt.timeSlot) })
            : WA_MESSAGES.rechazoConflicto(fullAppt.clientName, formatFecha(fullAppt.date), formatHora12(fullAppt.timeSlot));
        }
        setWaModal({ link: waLink(fullAppt.clientPhone, msg), mensaje: msg });

        loadData(false);
        // Actualizar localmente la vista del modal
        if (selectedDayInfo) {
          setSelectedDayInfo({
            ...selectedDayInfo,
            appts: selectedDayInfo.appts.map(a => a._id === appt._id ? { ...(res.data || a), status: newStatus } : a)
          });
        }
      }
    } catch (e: any) {
      if (e.response?.status === 409) {
        alert(e.response.data?.message || 'Conflicto: El horario ya no está disponible.');
        loadData(true);
        if (selectedDayInfo) setSelectedDayInfo(null);
        return;
      }
      alert(e.message || 'Error actualizando estado');
    }
  };

  const handleCancelar = async (appt: Appointment) => {
    if (!window.confirm(`¿Cancelar la cita de ${appt.clientName}? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await appointmentService.updateStatus(appt._id, 'cancelled');
      if (res.success) {
        const fullAppt = res.data || appt;

        // Abrir modal WA elegante — el admin decide si enviar o no desde ahí
        const msg = siteConfig?.mensajeCancelacion
          ? buildMessage(siteConfig.mensajeCancelacion, { nombre: fullAppt.clientName, fecha: formatFecha(fullAppt.date) })
          : WA_MESSAGES.rechazo(fullAppt.clientName, formatFecha(fullAppt.date));
        setWaModal({ link: waLink(fullAppt.clientPhone, msg), mensaje: msg });

        loadData(false);
        if (selectedDayInfo) {
          setSelectedDayInfo({
            ...selectedDayInfo,
            appts: selectedDayInfo.appts.filter(a => a._id !== appt._id)
          });
        }
      }
    } catch (e: any) {
      alert(e.message || 'Error al cancelar la cita');
    }
  };

  const openPriceModal = (appt: Appointment) => {
    setSelectedApptToComplete(appt);
    setFinalPriceInput(appt.priceSnapshot?.toString() || '');
    setShowPriceModal(true);
  };

  const handleFinalComplete = async () => {
    if (!selectedApptToComplete) return;
    if (!finalPriceInput || Number(finalPriceInput) <= 0) {
      alert('Por favor ingresa el valor cobrado');
      return;
    }

    try {
      setIsCompleting(true);
      await appointmentService.complete(selectedApptToComplete._id, { finalPrice: Number(finalPriceInput) });
      setShowPriceModal(false);

      // Abrir modal WA directamente con agradecimiento
      const serviceName = typeof selectedApptToComplete.service === 'string'
        ? selectedApptToComplete.service
        : (selectedApptToComplete.service as any)?.nombre || 'Servicio';
      const msg = siteConfig?.mensajeCompletada
        ? buildMessage(siteConfig.mensajeCompletada, { nombre: selectedApptToComplete.clientName, servicio: serviceName })
        : `¡Hola ${selectedApptToComplete.clientName}! Gracias por visitarnos hoy para tu servicio de ${serviceName}. ¡Esperamos verte pronto! 💅 — L'Élixir Salon`;
      setWaModal({ link: waLink(selectedApptToComplete.clientPhone, msg), mensaje: msg });

      setSelectedDayInfo(null);
      loadData(false);
    } catch (e: any) {
      alert(e.message || 'Error al completar cita');
    } finally {
      setIsCompleting(false);
    }
  };

  const hayPendientes = citasPendientes.length > 0;

  return (
    <AdminLayout searchPlaceholder="Buscar fecha o cita...">
      <style>{`
        @media (max-width: 768px) {
          .admin-calendar-container { padding: 12px 12px 100px !important; width: 100% !important; max-width: 100% !important; }
          .admin-calendar-header { margin-bottom: 24px !important; }
          .admin-calendar-header h1 { font-size: 24px !important; font-weight: 800 !important; }
          .admin-calendar-nav { border-radius: 12px !important; }
          .calendar-scroll-wrapper { 
            overflow-x: auto; 
            margin: 0 -12px; 
            padding: 0 12px 12px; 
            -webkit-overflow-scrolling: touch; 
            display: flex !important;
            flex-direction: column;
            width: calc(100% + 24px) !important;
          }
          .calendar-matrix { min-width: 900px; gap: 4px !important; flex-shrink: 0; }
          .calendar-day-cell { min-height: 120px !important; padding: 6px !important; border-radius: 10px !important; }
          .day-modal-content { 
            width: 100% !important; 
            height: auto !important;
            max-height: 90vh !important;
            margin-top: auto !important;
            border-radius: 24px 24px 0 0 !important;
            padding: 24px 16px !important;
          }
          .day-modal-overlay { align-items: flex-end !important; padding: 0 !important; }
        }
      `}</style>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 72px)' }}>
        <div className="admin-calendar-container" style={{ flex: 1, maxWidth: '1000px', margin: '0 auto', paddingBottom: '64px', padding: '40px 24px', position: 'relative' }}>



          <div className="admin-calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '36px', color: T.primary }}>
                Calendario General
              </h1>
              <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant }}>
                Administra todas las citas y bloqueos de agenda
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Filtro de especialista — solo visible para admins */}
              {isAdmin && employees.length > 0 && (
                <select
                  id="admin-calendar-employee-filter"
                  value={selectedEmployee}
                  onChange={e => {
                    setSelectedEmployee(e.target.value);
                    // loadData se ejecuta automáticamente por el useEffect que depende de selectedEmployee
                  }}
                  style={{
                    fontFamily: T.fontBody, fontSize: '14px', fontWeight: 600,
                    padding: '10px 16px', borderRadius: '9999px',
                    border: `1.5px solid ${T.outlineVariant}`,
                    backgroundColor: T.surfaceContainerLowest,
                    color: T.onSurface, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    outline: 'none'
                  }}
                >
                  <option value="all">👩‍💼 Todas las especialistas</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.nombre}</option>
                  ))}
                </select>
              )}

              <div className="admin-calendar-nav" style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: T.surfaceContainerLowest, padding: '8px', borderRadius: '9999px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: '16px', borderRadius: '9999px', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = T.surfaceContainerLow} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  ←
                </button>
                <span style={{ fontFamily: T.fontBody, fontSize: '16px', fontWeight: 700, minWidth: '120px', textAlign: 'center', textTransform: 'capitalize' }}>
                  {currentDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: '16px', borderRadius: '9999px', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = T.surfaceContainerLow} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  →
                </button>
              </div>
            </div>
          </div>

          {/* Matrix */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px', color: T.onSurfaceVariant, fontFamily: T.fontBody }}>
              Cargando calendario...
            </div>
          ) : (
            <div className="calendar-scroll-wrapper">
              <div className="calendar-matrix">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', marginBottom: '12px' }}>
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                    <div key={d} style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 800, color: T.onSurfaceVariant, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {d}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
                  {blanks.map((_, i) => <div key={`blank-${i}`} style={{ minHeight: '120px', borderRadius: '16px', backgroundColor: 'transparent' }} />)}

                  {daysThisMonth.map((day, i) => {
                    const iso = formatISO(day);

                    // LÓGICA MULTI-DÍA: Filtrar citas normales y flexibles que coincidan con este día
                    const dayAppts = appointments.filter(a => {
                      const dayISO = formatISO(day);

                      // Caso 1: Citas estándar con fecha asignada
                      if (!a.isFlexible && a.date && formatISO(a.date) === dayISO) return true;

                      // Caso 2: Citas flexibles PENDIENTES (buscamos en sus opciones)
                      if (a.isFlexible && a.status === 'pending') {
                        return a.flexibleAvailabilities?.some(opt => formatISO(opt.date) === dayISO);
                      }

                      // Caso 3: Citas flexibles ya CONFIRMADAS (tienen fecha propia)
                      if (a.isFlexible && (a.status === 'confirmed' || a.status === 'completed') && a.date && formatISO(a.date) === dayISO) return true;

                      return false;
                    });

                    const dayBlocks = blockedSlots.filter(b => formatISO(b.date) === iso);
                    const isToday = formatISO(new Date()) === iso;

                    return (
                      <div
                        key={i}
                        className="calendar-day-cell"
                        onClick={() => setSelectedDayInfo({ date: day, appts: dayAppts, blocks: dayBlocks })}
                        style={{
                          minHeight: '120px', backgroundColor: T.surfaceContainerLowest, borderRadius: '16px',
                          padding: '12px', boxSizing: 'border-box', border: isToday ? `2px solid ${T.primary}` : `1px solid ${T.outlineVariant}40`,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)', cursor: 'pointer', display: 'flex', flexDirection: 'column'
                        }}
                      >
                        <div style={{ fontFamily: T.fontBody, fontSize: '16px', fontWeight: isToday ? 800 : 500, color: isToday ? T.primary : T.onSurface, marginBottom: '8px' }}>
                          {day.getDate()}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
                          {dayBlocks.map((b, idx) => (
                            <div key={`blk-${idx}`} style={{ fontSize: '10px', fontFamily: T.fontBody, fontWeight: 700, backgroundColor: T.errorContainer, color: T.error, padding: '4px 6px', borderRadius: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              🚫 {b.isFullDay ? 'DÍA BLOQUEADO' : b.timeSlot}
                            </div>
                          ))}
                          {dayAppts.map((a, idx) => {
                            const isFlex = a.isFlexible && a.status === 'pending';
                            return (
                              <div
                                key={`apt-${idx}`}
                                style={{
                                  fontSize: '10px', fontFamily: T.fontBody, fontWeight: 700,
                                  backgroundColor: a.status === 'cancelled' ? T.surfaceVariant : (isFlex ? '#fff9e6' : T.primaryFixed),
                                  color: a.status === 'cancelled' ? T.onSurfaceVariant : (isFlex ? '#b08b00' : T.primary),
                                  padding: '4px 6px', borderRadius: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                  textDecoration: a.status === 'cancelled' ? 'line-through' : 'none',
                                  border: isFlex ? '1px dashed #ffdca8' : 'none'
                                }}
                              >
                                {isFlex ? '✨ ' : (isMultiSession(a.bulkId) ? '🔗 ' : '')}
                                {(!(a.service as any).allowSimultaneous && !isFlex) ? '' : '⚡ '}
                                {isFlex ? 'Flexible' : formatHora12(a.timeSlot)} {a.clientName}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DAY MODAL */}
      {selectedDayInfo && (
        <div className="day-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(28,27,26,0.6)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="day-modal-content" style={{ backgroundColor: T.surface, width: '100%', maxWidth: '560px', maxHeight: '85vh', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '28px', color: T.primary }}>Agenda del Día</h3>
                <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant }}>{selectedDayInfo.date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <button onClick={() => setSelectedDayInfo(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: T.onSurfaceVariant }}>✕</button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={() => setShowBlockModal(true)}
                style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, backgroundColor: T.errorContainer, color: T.error, padding: '10px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer' }}
              >
                + Bloquear Horario Este Día
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', paddingBottom: '16px' }}>
              {selectedDayInfo.blocks.length === 0 && selectedDayInfo.appts.length === 0 && (
                <p style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant }}>No hay movimientos este día.</p>
              )}

              {/* Bloqueos */}
              {selectedDayInfo.blocks.map(b => (
                <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.surfaceContainerLowest, padding: '16px', borderRadius: '16px', borderLeft: `4px solid ${T.error}` }}>
                  <div>
                    <span style={{ fontFamily: T.fontBody, fontSize: '12px', fontWeight: 800, color: T.error }}>BLOQUEO {b.isFullDay ? 'TODO EL DÍA' : b.timeSlot}</span>
                    <p style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface }}>{b.reason || 'Sin motivo'}</p>
                    <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant }}>Especialista: {b.employee === 'all' ? 'Toda la peluquería' : employees.find(e => e._id === b.employee)?.nombre}</p>
                  </div>
                  <button onClick={() => handleRemoveBlock(b._id)} style={{ color: T.error, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700 }}>ELIMINAR</button>
                </div>
              ))}

              {/* Citas */}
              {selectedDayInfo.appts.map(a => {
                const isFlex = a.isFlexible && a.status === 'pending';
                // Encontrar la disponibilidad específica para este día
                const currentDayISO = formatISO(selectedDayInfo.date);
                const dayOpt = a.flexibleAvailabilities?.find(opt => formatISO(opt.date) === currentDayISO);
                const availabilityText = dayOpt ? (dayOpt.isFullDay ? 'Todo el día' : `${dayOpt.startTime || ''} - ${dayOpt.endTime || ''}`) : 'Flexible';

                return (
                  <div
                    key={a._id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      backgroundColor: isFlex ? '#fffcf0' : T.surfaceContainerLowest,
                      padding: '16px', borderRadius: '16px',
                      opacity: a.status === 'cancelled' ? 0.6 : 1,
                      border: isFlex ? '1px dashed #ffdca8' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: T.fontBody, fontSize: '15px', fontWeight: 800, color: isFlex ? '#b08b00' : T.primary }}>
                          {isFlex ? `✨ ${availabilityText}` : formatHora12(a.timeSlot)}
                        </span>
                        {isFlex && (
                          <span style={{ fontSize: '10px', backgroundColor: '#ffdca8', color: '#623f1b', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700, textTransform: 'uppercase' }}>
                            Solicitud Flexible
                          </span>
                        )}
                      </div>
                      <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface, fontWeight: 600 }}>{a.clientName}</p>
                      <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>{(a.service as any)?.nombre || 'Servicio'} con {(a.employee as any)?.nombre}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontFamily: T.fontBody, fontSize: '9px', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.15em',
                            backgroundColor:
                              a.status === 'confirmed' ? 'rgba(34, 197, 94, 0.1)' :
                                a.status === 'completed' ? 'rgba(107, 114, 128, 0.1)' :
                                  a.status === 'pending' ? 'rgba(240, 189, 143, 0.3)' :
                                    'rgba(186, 26, 26, 0.08)',
                            color:
                              a.status === 'confirmed' ? '#22c55e' :
                                a.status === 'completed' ? '#6b7280' :
                                  a.status === 'pending' ? '#623f1b' :
                                    '#ba1a1a',
                            padding: '4px 10px', borderRadius: '9999px', whiteSpace: 'nowrap'
                          }}
                        >
                          {a.status === 'confirmed' ? 'Confirmada' :
                            a.status === 'completed' ? 'Completada' :
                              a.status === 'pending' ? 'Pendiente' :
                                a.status === 'rejected' ? 'Rechazada' :
                                  'Cancelada'}
                        </span>
                        {isMultiSession(a.bulkId) && (
                          <span style={{ fontFamily: T.fontBody, fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', backgroundColor: T.primaryContainer, color: T.primary, padding: '4px 10px', borderRadius: '9999px', whiteSpace: 'nowrap' }}>
                            🔗 Sesión Múltiple
                          </span>
                        )}
                        {(a.service as any).allowSimultaneous && (
                          <span style={{ fontFamily: T.fontBody, fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', backgroundColor: '#e0f2f1', color: '#00796b', padding: '4px 10px', borderRadius: '9999px', whiteSpace: 'nowrap', border: '1px solid #b2dfdb' }}>
                            ⚡ Simultáneo
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 w-full">
                        {a.status === 'confirmed' && (
                          <button
                            onClick={() => openPriceModal(a)}
                            className="text-[13px] font-bold py-2.5 px-3 rounded-xl border-none cursor-pointer uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            style={{ fontFamily: T.fontBody, backgroundColor: '#22c55e', color: 'white' }}
                          >
                            ✓ COMPLETAR
                          </button>
                        )}

                        {isFlex && (
                          <button
                            onClick={() => {
                              setSelectedDayInfo(null);
                              setSelectedFlexibleAppt(a);
                            }}
                            className="text-[13px] font-bold py-2.5 px-3 rounded-xl border-none cursor-pointer uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            style={{ fontFamily: T.fontBody, backgroundColor: T.primary, color: 'white' }}
                          >
                            ✨ AGENDAR
                          </button>
                        )}

                        {a.status === 'pending' && !isFlex && (
                          <button
                            onClick={() => handleStatusChange(a, 'confirmed')}
                            className="text-[13px] font-bold py-2.5 px-3 rounded-xl border-none cursor-pointer uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            style={{ fontFamily: T.fontBody, backgroundColor: '#22c55e', color: 'white' }}
                          >
                            ✓ CONFIRMAR
                          </button>
                        )}

                        {(a.status === 'pending' || a.status === 'confirmed') && (
                          <button
                            onClick={() => handleCancelar(a)}
                            className="text-[13px] font-bold py-2.5 px-3 rounded-xl border-none cursor-pointer uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            style={{ fontFamily: T.fontBody, backgroundColor: T.errorContainer, color: T.error }}
                          >
                            ✕ CANCELAR
                          </button>
                        )}

                        {a.status !== 'cancelled' && a.status !== 'completed' && !isFlex && (
                          <button
                            onClick={() => openReschedule(a)}
                            disabled={!isAdmin && hayPendientes && a.status !== 'pending'}
                            title={!isAdmin && hayPendientes && a.status !== 'pending' ? "Debes gestionar las citas pendientes primero" : ""}
                            className="text-[13px] font-bold py-2.5 px-3 rounded-xl border-none cursor-pointer uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            style={{
                              fontFamily: T.fontBody,
                              backgroundColor: (!isAdmin && hayPendientes && a.status !== 'pending') ? T.outlineVariant : T.secondaryContainer,
                              color: (!isAdmin && hayPendientes && a.status !== 'pending') ? '#999' : T.onSecondaryContainer,
                              opacity: (!isAdmin && hayPendientes && a.status !== 'pending') ? 0.6 : 1
                            }}
                          >
                            🕒 REAGENDAR
                          </button>
                        )}
                      </div>


                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CREATE BLOCK MODAL */}
      {showBlockModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: T.surface, width: '400px', padding: '32px', borderRadius: '24px' }}>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, marginBottom: '24px' }}>Nuevo Bloqueo</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: T.fontBody, fontSize: '14px' }}>
                  <input type="checkbox" checked={blockForm.isFullDay} onChange={e => setBlockForm({ ...blockForm, isFullDay: e.target.checked })} />
                  Bloquear todo el día
                </label>
              </div>

              {!blockForm.isFullDay && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurface }}>
                    Rango horario a bloquear:
                  </p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '11px', color: T.onSurfaceVariant, marginBottom: '4px', fontFamily: T.fontBody }}>Hora inicio</label>
                      <input
                        type="time"
                        value={blockForm.startTime}
                        onChange={e => setBlockForm({ ...blockForm, startTime: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, boxSizing: 'border-box' }}
                      />
                    </div>
                    <span style={{ fontSize: '18px', color: T.onSurfaceVariant, paddingTop: '16px' }}>→</span>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '11px', color: T.onSurfaceVariant, marginBottom: '4px', fontFamily: T.fontBody }}>Hora fin</label>
                      <input
                        type="time"
                        value={blockForm.endTime}
                        onChange={e => setBlockForm({ ...blockForm, endTime: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  {blockForm.startTime >= blockForm.endTime && (
                    <p style={{ margin: 0, fontSize: '12px', color: T.error, fontFamily: T.fontBody }}>
                      ⚠️ La hora de inicio debe ser anterior a la hora de fin
                    </p>
                  )}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700 }}>¿A quién aplica?</label>
                <select value={blockForm.employee} onChange={e => setBlockForm({ ...blockForm, employee: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}` }}>
                  <option value="all">Toda la peluquería (Cerrar)</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700 }}>Motivo (Visible interno):</label>
                <input type="text" value={blockForm.reason} onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })} placeholder="Ej: Festivo, Doctor..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}` }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setShowBlockModal(false)} style={{ flex: 1, padding: '12px', border: `1px solid ${T.outlineVariant}`, borderRadius: '9999px', background: 'none' }}>Cancelar</button>
              <button onClick={handleCreateBlock} style={{ flex: 1, padding: '12px', backgroundColor: T.error, color: 'white', border: 'none', borderRadius: '9999px' }}>Bloquear</button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {showRescheduleModal && rescheduleTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: T.surface, width: '400px', padding: '32px', borderRadius: '24px' }}>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, marginBottom: '24px' }}>Reagendar Cita</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurface, marginBottom: '6px' }}>Especialista:</label>
                <select
                  value={reschForm.employeeId}
                  onChange={e => setReschForm({ ...reschForm, employeeId: e.target.value, timeSlot: '' })}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface, backgroundColor: T.surfaceContainerLowest, minHeight: '46px', appearance: 'auto', boxSizing: 'border-box' }}
                >
                  <option value="">Selecciona especialista...</option>
                  {employees.filter(e => e.isActive).map(e => (
                    <option key={e._id} value={e._id} style={{ padding: '8px', fontFamily: T.fontBody }}>{e.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurface, marginBottom: '6px' }}>Nueva Fecha:</label>
                <input type="date" value={reschForm.date} onChange={e => setReschForm({ ...reschForm, date: e.target.value, timeSlot: '' })} min={formatISO(new Date())} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface, backgroundColor: T.surfaceContainerLowest, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurface, marginBottom: '6px' }}>Nueva Hora:</label>
                <select
                  value={reschForm.timeSlot}
                  onChange={e => setReschForm({ ...reschForm, timeSlot: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface, backgroundColor: T.surfaceContainerLowest, minHeight: '46px', appearance: 'auto', boxSizing: 'border-box' }}
                >
                  <option value="">Selecciona hora...</option>
                  {availableSlots.map(t => <option key={t} value={t} style={{ fontFamily: T.fontBody }}>{formatHora12(t)}</option>)}
                </select>
                {availableSlots.length === 0 && reschForm.date && <span style={{ fontSize: '11px', color: T.error, fontFamily: T.fontBody }}>No hay disponibilidad en esta fecha</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurface, marginBottom: '6px' }}>Motivo del reagendamiento (Visible al cliente en WhatsApp):</label>
                <textarea rows={3} value={reschForm.reason} onChange={e => setReschForm({ ...reschForm, reason: e.target.value })} placeholder="Ej: Inconvenientes técnicos en local..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, resize: 'none', fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface, boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setShowRescheduleModal(false)} style={{ flex: 1, padding: '12px', border: `1px solid ${T.outlineVariant}`, borderRadius: '9999px', background: 'none' }}>Cancelar</button>
              <button
                onClick={handleConfirmReschedule}
                disabled={!reschForm.timeSlot}
                style={{ flex: 1, padding: '12px', backgroundColor: reschForm.timeSlot ? T.primary : T.outlineVariant, color: 'white', border: 'none', borderRadius: '9999px' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRICE COMPLETION MODAL */}
      {showPriceModal && selectedApptToComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, marginBottom: '8px' }}>¿Cuánto se cobró?</h3>
            <p className="text-sm text-gray-500 mb-4">
              {(selectedApptToComplete.service as any)?.nombre || 'Servicio'} · {selectedApptToComplete.clientName}
            </p>
            <input
              type="number"
              value={finalPriceInput}
              onChange={e => setFinalPriceInput(e.target.value)}
              placeholder="Ej: 85000"
              className="w-full border rounded-xl p-3 text-lg mb-4"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleFinalComplete()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowPriceModal(false)}
                className="flex-1 py-3 rounded-xl border font-bold"
                style={{ fontFamily: T.fontBody }}
                disabled={isCompleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleFinalComplete}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold"
                style={{ fontFamily: T.fontBody }}
                disabled={isCompleting}
              >
                {isCompleting ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP CONFIRMATION MODAL */}
      {waModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: T.surface, width: '100%', maxWidth: '400px', padding: '32px', borderRadius: '24px', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, marginBottom: '12px' }}>¿Enviar mensaje?</h3>
            <p style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, marginBottom: '20px' }}>
              Se abrirá WhatsApp con este mensaje:
            </p>
            <div style={{ backgroundColor: T.surfaceContainerLow, padding: '16px', borderRadius: '16px', fontFamily: T.fontBody, fontSize: '13px', color: T.onSurface, fontStyle: 'italic', marginBottom: '24px', borderLeft: `4px solid #25D366` }}>
              "{waModal.mensaje}"
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setWaModal(null)}
                style={{ flex: 1, padding: '14px', border: `1px solid ${T.outlineVariant}`, borderRadius: '9999px', background: 'none', fontFamily: T.fontBody, fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
              >
                No enviar
              </button>
              <a
                href={waModal.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWaModal(null)}
                style={{ flex: 1, padding: '14px', backgroundColor: '#25D366', color: 'white', borderRadius: '9999px', textAlign: 'center', textDecoration: 'none', fontFamily: T.fontBody, fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                📲 Abrir WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* FLEXIBLE CONFIRMATION MODAL */}
      {selectedFlexibleAppt && (
        <FlexibleConfirmationModal
          isOpen={!!selectedFlexibleAppt}
          appointment={{
            id: selectedFlexibleAppt._id,
            client: selectedFlexibleAppt.clientName,
            clientPhone: selectedFlexibleAppt.clientPhone,
            service: (selectedFlexibleAppt.service as any)?.nombre || 'Servicio',
            serviceId: typeof selectedFlexibleAppt.service === 'string' ? selectedFlexibleAppt.service : selectedFlexibleAppt.service._id,
            specialistId: typeof selectedFlexibleAppt.employee === 'string' ? selectedFlexibleAppt.employee : selectedFlexibleAppt.employee._id,
            flexibleAvailabilities: selectedFlexibleAppt.flexibleAvailabilities as any
          }}
          siteConfig={siteConfig}
          onClose={() => setSelectedFlexibleAppt(null)}
          onSuccess={() => {
            setSelectedFlexibleAppt(null);
            loadData(false);
          }}
        />
      )}
    </AdminLayout>
  );
}
