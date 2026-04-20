import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { appointmentService, employeeService, availabilityService, siteConfigService } from '../services/api';
import FlexibleConfirmationModal from '../components/FlexibleConfirmationModal';
import type { Employee, SiteConfig } from '../types';
import { waLink, WA_MESSAGES, formatFecha, formatHora12, buildMessage, sendApptNotification } from '../utils/whatsappMessages';

/* ─────────────────────────────────────────────────
   Data
───────────────────────────────────────────────── */
type AppStatus = 'Confirmada' | 'Completada' | 'Pendiente' | 'Cancelada' | 'Rechazada';

interface UIAppointment {
  id: string; time: string; client: string; clientPhone: string; clientPhoto: string;
  service: string; serviceId: string; serviceIcon: string;
  specialist: string; specialistId: string;
  duration: string; status: AppStatus;
  date: string; bulkId?: string;
  isFlexible?: boolean;
  flexibleAvailabilities?: any[];
}

const mapStatus = (apiStatus: string): AppStatus => {
  switch (apiStatus) {
    case 'confirmed': return 'Confirmada';
    case 'completed': return 'Completada';
    case 'cancelled': return 'Cancelada';
    case 'rejected': return 'Rechazada';
    default: return 'Pendiente';
  }
}

const STATUS_STYLES: Record<AppStatus, { bg: string; color: string }> = {
  'Confirmada': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
  'Completada': { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' },
  'Pendiente': { bg: 'rgba(240,189,143,0.3)', color: '#623f1b' },
  'Cancelada': { bg: 'rgba(186,26,26,0.08)', color: '#ba1a1a' },
  'Rechazada': { bg: 'rgba(186,26,26,0.08)', color: '#ba1a1a' },
};

/* ─────────────────────────────────────────────────
   ADMIN PAGE — Citas
───────────────────────────────────────────────── */
export default function AdminPage() {
  const [activeView, setActiveView] = useState<'agenda' | 'semana'>('agenda');
  const [search, setSearch] = useState('');

  const [appointments, setAppointments] = useState<UIAppointment[]>([]);
  const [stats, setStats] = useState({ today: 0, pending: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1);

  // User auth info
  const rawUser = localStorage.getItem('adminUser');
  const user = rawUser ? JSON.parse(rawUser) : null;
  const isEmpleada = user?.role === 'empleada';

  const [pendingAppointments, setPendingAppointments] = useState<UIAppointment[]>([]);
  const [notification, setNotification] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showNotif = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Reagendar Modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<UIAppointment | null>(null);
  const [reschForm, setReschForm] = useState({ date: '', timeSlot: '', employeeId: '', reason: '' });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  // Price Modal state
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedApptToComplete, setSelectedApptToComplete] = useState<UIAppointment | null>(null);
  const [finalPriceInput, setFinalPriceInput] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [lastAction, setLastAction] = useState<{ id: string, type: 'confirmed' | 'cancelled' | 'rescheduled' | 'rejected', appt: any } | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [waModal, setWaModal] = useState<{ link: string, mensaje: string } | null>(null);



  // Flexible Modal state (Refactored to shared component)
  const [showFlexModal, setShowFlexModal] = useState(false);
  const [flexTarget, setFlexTarget] = useState<UIAppointment | null>(null);

  // Botón de WA desaparece después de 30 segundos
  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => setLastAction(null), 30000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  const formatISO = (d: Date | string) => {
    if (typeof d === 'string') return d.split('T')[0];
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  };

  const mapAppt = (a: any, index: number): UIAppointment => ({
    id: a._id,
    time: a.timeSlot,
    client: a.clientName,
    clientPhone: a.clientPhone || '',
    clientPhoto: `https://i.pravatar.cc/100?img=${(index % 70) + 1}`,
    service: a.service?.nombre || 'General',
    serviceId: a.service?._id || '',
    serviceIcon: '✨',
    specialist: a.employee?.nombre || 'Admin',
    specialistId: a.employee?._id || '',
    duration: a.service?.duracion ? `${a.service.duracion}m` : '30m',
    status: mapStatus(a.status),
    date: a.date,
    bulkId: a.bulkId,
    isFlexible: a.isFlexible,
    flexibleAvailabilities: a.flexibleAvailabilities
  });

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const d = new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const fetchParams: any = { date: dateStr };
      if (isEmpleada) fetchParams.employeeId = user?.id;

      // Fetch today's appointments + stats. Both admin and specialists fetch pending for their scope
      const promises: Promise<any>[] = [
        appointmentService.getAll(fetchParams),
        appointmentService.getStats(),
        appointmentService.getAll({ status: 'pending', ...(isEmpleada ? { employeeId: user?.id } : {}) })
      ];

      const [apptsRes, statsRes, pendingRes, empsRes, configRes] = await Promise.all(promises.concat([employeeService.getAll(), siteConfigService.get()]));

      if (configRes?.success && configRes?.data) {
        setSiteConfig(configRes.data);
      }

      if (empsRes?.success && empsRes?.data) {
        setAllEmployees(empsRes.data);
      }

      // Filter stats for empleada
      if (isEmpleada && apptsRes.success && apptsRes.data) {
        const empleadaAppts = apptsRes.data;
        const pending = empleadaAppts.filter((a: any) => a.status === 'pending').length;
        const completed = empleadaAppts.filter((a: any) => a.status === 'completed').length;
        const cancelled = empleadaAppts.filter((a: any) => a.status === 'cancelled').length;
        setStats({
          today: empleadaAppts.length,
          pending,
          completed,
          cancelled,
        });
      }

      if (apptsRes.success && apptsRes.data) {
        const mapped = apptsRes.data.map(mapAppt);
        mapped.sort((x: UIAppointment, y: UIAppointment) => x.time.localeCompare(y.time));
        setAppointments(mapped);
      }

      if (!isEmpleada && statsRes.success && statsRes.data) {
        const { globalStats, todayCount } = statsRes.data;
        const pendingCount = globalStats?.find((s: any) => s._id === 'pending')?.count || 0;
        const completedCount = globalStats?.find((s: any) => s._id === 'completed')?.count || 0;
        const cancelledCount = globalStats?.find((s: any) => s._id === 'cancelled')?.count || 0;
        setStats({
          today: todayCount || 0,
          pending: pendingCount,
          completed: completedCount,
          cancelled: cancelledCount,
        });
      }

      if (pendingRes?.success && pendingRes?.data) {
        setPendingAppointments(pendingRes.data.map(mapAppt));
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Polling cada 30 segundos para evitar inconsistencias multisesión
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, user?.role]);

  const handleAction = async (id: string, newStatus: 'confirmed' | 'rejected') => {
    try {
      const res = await appointmentService.updateStatus(id, newStatus);
      if (res.success) {
        setPendingAppointments(prev => prev.filter(a => a.id !== id));
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: mapStatus(newStatus) } : a));

        // Actualizar stats locales
        if (newStatus === 'confirmed') {
          setStats(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1) }));
        } else {
          setStats(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1), cancelled: prev.cancelled + 1 }));
        }

        showNotif(newStatus === 'confirmed' ? '✅ Cita confirmada' : '❌ Solicitud rechazada', newStatus === 'confirmed' ? 'ok' : 'err');

        // WhatsApp notification trigger
        const affectedAppt = pendingAppointments.find(a => a.id === id);
        if (affectedAppt) {
          sendApptNotification(
            newStatus === 'confirmed' ? 'confirm' : 'reject',
            affectedAppt,
            siteConfig
          );
        }

        fetchData(false); // Refrescar para asegurar sincronía
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        showNotif(error.response.data?.message || 'Conflicto: El horario ya no está disponible.', 'err');
        fetchData(true);
        return;
      }
      console.error('Error updating appointment', error);
      showNotif('Error al actualizar la cita', 'err');
    }
  };

  const openReschedule = (appt: UIAppointment) => {
    setRescheduleTarget(appt);
    setReschForm({
      date: formatISO(appt.date),
      timeSlot: appt.time,
      employeeId: appt.specialistId,
      reason: ''
    });
    setAvailableSlots([]);
    setShowRescheduleModal(true);
  };

  useEffect(() => {
    if (showRescheduleModal && reschForm.date && reschForm.employeeId && rescheduleTarget) {
      availabilityService.getSlots(
        reschForm.employeeId,
        rescheduleTarget.serviceId,
        reschForm.date
      ).then(res => setAvailableSlots(res.data || []));
    }
  }, [reschForm.date, reschForm.employeeId, rescheduleTarget, showRescheduleModal]);

  const handleConfirmReschedule = async () => {
    if (!rescheduleTarget) return;
    try {
      const res = await appointmentService.reschedule(rescheduleTarget.id, {
        date: reschForm.date,
        timeSlot: reschForm.timeSlot,
        employeeId: reschForm.employeeId,
        reason: reschForm.reason
      } as any);

      if (res.success) {
        setShowRescheduleModal(false);
        // Actualizar la lista de pendientes localmente
        setPendingAppointments(prev => prev.map(a =>
          a.id === rescheduleTarget.id
            ? { ...a, date: reschForm.date, time: reschForm.timeSlot, specialistId: reschForm.employeeId, specialist: allEmployees.find(e => e._id === reschForm.employeeId)?.nombre || a.specialist }
            : a
        ));
        showNotif('✅ Cita reagendada exitosamente (sigue pendiente)');

        const updatedAppt = { ...rescheduleTarget, date: reschForm.date, time: reschForm.timeSlot };
        sendApptNotification('reschedule', updatedAppt, siteConfig);

        fetchData(false);
      }
    } catch (e: any) {
      showNotif(e.message || 'Error reagendando', 'err');
    }
  };

  const handleComplete = (appt: UIAppointment) => {
    setSelectedApptToComplete(appt);
    setFinalPriceInput('');
    setShowPriceModal(true);
  };

  const handleFinalComplete = async () => {
    if (!selectedApptToComplete) return;
    if (!finalPriceInput || Number(finalPriceInput) <= 0) {
      showNotif('Por favor ingresa el valor cobrado', 'err');
      return;
    }

    try {
      setIsCompleting(true);
      const res = await appointmentService.complete(selectedApptToComplete.id, { finalPrice: Number(finalPriceInput) });
      if (res.success) {
        setAppointments(prev => prev.map(a =>
          a.id === selectedApptToComplete.id ? { ...a, status: 'Completada' } : a
        ));
        showNotif('✅ Cita marcada como completada', 'ok');
        setShowPriceModal(false);

        sendApptNotification('complete', selectedApptToComplete, siteConfig);

        fetchData(false);
      }
    } catch (error: any) {
      console.error('Error completing appointment', error);
      showNotif(error.message || 'Error al completar la cita', 'err');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleOpenFlexModal = (appt: UIAppointment) => {
    setFlexTarget(appt);
    setShowFlexModal(true);
  };

  const isMultiSession = (bulkId?: string) => {
    if (!bulkId) return false;
    return appointments.filter(a => a.bulkId === bulkId).length > 1 || pendingAppointments.filter(a => a.bulkId === bulkId).length > 1;
  };

  const confirmedCount = appointments.filter((a) => a.status === 'Confirmada').length;

  const filtered = appointments.filter((a) =>
    search === '' ||
    a.client.toLowerCase().includes(search.toLowerCase()) ||
    a.service.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout searchPlaceholder="Buscar cliente o servicio...">
      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '24px', zIndex: 999,
          backgroundColor: notification.type === 'ok' ? '#22c55e' : T.error,
          color: '#fff', padding: '14px 24px', borderRadius: '12px',
          fontFamily: T.fontBody, fontSize: '14px', fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', animation: 'fadeIn 0.3s ease'
        }}>
          {notification.msg}
        </div>
      )}
      <style>{`
        .appt-card { transition: transform 0.3s ease; }
        .appt-card:hover { transform: translateX(4px); }
        .stat-card-rose:hover  { background: rgba(255,217,222,0.55) !important; }
        .stat-card-amber:hover { background: rgba(255,220,191,0.55) !important; }
        .stat-card-neutral:hover { background: ${T.surfaceContainerHighest} !important; }
        .view-btn-active   { background: ${T.surfaceContainerLowest}; color: ${T.primary}; font-weight:700; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
        .view-btn-inactive { background: transparent; color: ${T.onSurfaceVariant}; }
        .view-btn-inactive:hover { color: ${T.primary}; }
        .right-panel { display: none; }
        @media (min-width: 1400px) { .right-panel { display: block; } }
        @keyframes pulse-green {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(34,197,94,0.4); }
        }
        @media (max-width: 768px) {
          .admin-dashboard-container { padding: 24px 16px 120px !important; }
          .admin-dashboard-header { flex-direction: column; align-items: flex-start !important; gap: 16px; margin-bottom: 32px !important; }
          .admin-stats-grid { grid-template-columns: 1fr !important; gap: 16px !important; margin-bottom: 40px !important; }
          .admin-search-inline { width: 100% !important; }
          .admin-search-inline input { width: 100% !important; }
          .pending-citas-grid { grid-template-columns: 1fr !important; }
          .calendar-header-row { flex-direction: column; align-items: flex-start !important; gap: 16px; }
          .appt-card { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
          .appt-card > div:first-child { width: 100% !important; text-align: left !important; padding: 0 !important; }
          .appt-card-content { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .appt-card-actions { width: 100% !important; justify-content: space-between !important; margin-top: 8px; border-top: 1px solid ${T.outlineVariant}30; padding-top: 12px; }
          .admin-floating-status { width: 95% !important; gap: 12px !important; padding: 10px 20px !important; }
          .admin-floating-status-stats { display: none !important; }
        }
      `}</style>

      <div className="admin-dashboard-container" style={{ padding: '40px 48px 120px', position: 'relative' }}>
        {/* ── Header ── */}
        <header className="admin-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: 'clamp(28px,4vw,40px)', color: T.primary, marginBottom: '6px', letterSpacing: '-0.02em' }}>
              Bienvenida, {user?.nombre || 'Admin'}
            </h2>
            <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant }}>
              {todayFormatted} · {isEmpleada ? 'Tienes' : 'Salón tiene'} {confirmedCount} citas confirmadas hoy.
            </p>
          </div>
          {/* Search inline in body */}
          <div className="admin-search-inline" style={{ backgroundColor: T.surfaceContainerLow, padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Buscar cliente o servicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ backgroundColor: 'transparent', border: 'none', fontFamily: T.fontBody, fontSize: '13px', color: T.onSurface, width: '200px' }}
            />
          </div>
        </header>

        {/* ── Stats bento ── */}
        <section className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', marginBottom: '56px' }}>
          {[
            { className: 'stat-card-rose', bg: 'rgba(255,217,222,0.35)', icon: '📆', badge: 'Total Hoy', badgeColor: T.onPrimary, label: 'Citas Hoy', value: stats.today.toString(), valColor: '#3e0215' },
            { className: 'stat-card-amber', bg: 'rgba(255,220,191,0.35)', icon: '⏳', badge: 'Atención', badgeColor: '#623f1b', label: 'Pendientes', value: stats.pending.toString(), valColor: '#2d1600' },
            { className: 'stat-card-neutral', bg: T.surfaceContainerHigh, icon: '⭐', badge: 'Histórico', badgeColor: T.onSurfaceVariant, label: 'Completadas Global', value: stats.completed.toString(), valColor: T.onSurface, small: true },
          ].map(({ className, bg, icon, badge, badgeColor, label, value, valColor, small }) => (
            <div key={label} className={className} style={{ backgroundColor: bg, padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px', transition: 'background-color 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '28px' }}>{icon}</span>
                <span style={{ fontFamily: T.fontBody, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: badgeColor, backgroundColor: 'rgba(255,255,255,0.6)', padding: '3px 10px', borderRadius: '9999px' }}>{badge}</span>
              </div>
              <div style={{ marginTop: '24px' }}>
                <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: badgeColor, marginBottom: '4px' }}>{label}</p>
                <p style={{ fontFamily: T.fontHeadline, fontSize: small ? '22px' : '44px', fontWeight: 700, color: valColor, lineHeight: 1.2 }}>{value}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Pending Appointments (Prominent Summary) ── */}
        {pendingAppointments.length > 0 && (
          <section style={{ marginBottom: '24px', backgroundColor: '#fff8e1', padding: '24px', borderRadius: '16px', border: '1px solid #ffe082' }}>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: '#5d4037', marginBottom: '20px' }}>
              ⏳ Citas Pendientes de Confirmación ({pendingAppointments.length})
            </h3>
            <div className="pending-citas-grid grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingAppointments.map(appt => (
                <div key={appt.id} className="w-full min-w-0 rounded-2xl p-4 md:p-5 min-h-0" style={{ backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderLeft: `4px solid ${T.primary}` }}>
                  <div className="flex flex-col gap-1 mb-3">
                    <h4 className="truncate" style={{ fontFamily: T.fontBody, fontSize: '16px', fontWeight: 700, color: T.onSurface, margin: 0 }}>{appt.client}</h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant, margin: 0 }}>📞 {appt.clientPhone}</p>
                      {isMultiSession(appt.bulkId) && (
                        <span style={{ fontSize: '10px', backgroundColor: T.primaryContainer, color: T.primary, padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>🔗 Sesión Múltiple</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <p className="truncate" style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant, margin: 0 }}>💎 {appt.service} · {appt.duration}</p>
                      {appt.isFlexible && <span style={{ fontSize: '10px', backgroundColor: T.primaryFixed, color: T.primary, padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>✨ Flexible</span>}
                    </div>
                    <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant, margin: 0 }}>
                      👩‍🎨 {appt.specialist} · {appt.isFlexible ? 'Horario a convenir' : formatHora12(appt.time)}
                    </p>
                    <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.primary, margin: 0, fontWeight: 600 }}>
                      📅 {formatFecha(appt.date)}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 w-full">
                    <button
                      onClick={() => appt.isFlexible ? handleOpenFlexModal(appt) : handleAction(appt.id, 'confirmed')}
                      className="text-[13px] font-bold py-2.5 px-3 rounded-xl text-center transition-all active:scale-95 shadow-sm"
                      style={{ backgroundColor: appt.isFlexible ? T.primary : '#22c55e', color: 'white', border: 'none', cursor: 'pointer', fontFamily: T.fontBody }}
                    >
                      {appt.isFlexible ? 'Agendar' : 'Confirmar'}
                    </button>
                    <button
                      onClick={() => openReschedule(appt)}
                      className="text-[13px] font-bold py-2.5 px-3 rounded-xl text-center transition-all active:scale-95 shadow-sm"
                      style={{ backgroundColor: T.secondaryContainer, color: T.onSecondaryContainer, border: 'none', cursor: 'pointer', fontFamily: T.fontBody }}
                    >
                      Reagendar
                    </button>
                    <button
                      onClick={() => handleAction(appt.id, 'rejected')}
                      className="text-[13px] font-bold py-2.5 px-3 rounded-xl text-center transition-all active:scale-95 shadow-sm"
                      style={{ backgroundColor: T.errorContainer, color: T.error, border: 'none', cursor: 'pointer', fontFamily: T.fontBody }}
                    >
                      Rechazar
                    </button>
                  </div>

                  {/* WhatsApp Success Button */}
                  {lastAction && lastAction.id === appt.id && (
                    <div className="mt-4 animate-fadeIn">
                      {lastAction.type === 'confirmed' && (
                        <button
                          onClick={() => {
                            const msg = siteConfig?.mensajeConfirmacion
                              ? buildMessage(siteConfig.mensajeConfirmacion, { nombre: appt.client, servicio: appt.service, fecha: formatFecha(appt.date), hora: formatHora12(appt.time) })
                              : WA_MESSAGES.confirmacion(appt.client, appt.service, formatFecha(appt.date), formatHora12(appt.time));
                            setWaModal({ link: waLink(appt.clientPhone, msg), mensaje: msg });
                          }}
                          style={{ backgroundColor: '#25D366', color: 'white', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)' }}
                        >
                          📲 Enviar confirmación por WhatsApp
                        </button>
                      )}
                      {(lastAction.type === 'cancelled' || lastAction.type === 'rejected') && (
                        <button
                          onClick={() => {
                            const msg = lastAction.type === 'rejected' && siteConfig?.mensajeRechazoConflicto
                              ? buildMessage(siteConfig.mensajeRechazoConflicto, { nombre: appt.client, fecha: formatFecha(appt.date), hora: formatHora12(appt.time) })
                              : siteConfig?.mensajeCancelacion
                                ? buildMessage(siteConfig.mensajeCancelacion, { nombre: appt.client, fecha: formatFecha(appt.date) })
                                : lastAction.type === 'rejected'
                                  ? WA_MESSAGES.rechazoConflicto(appt.client, formatFecha(appt.date), formatHora12(appt.time))
                                  : WA_MESSAGES.rechazo(appt.client, formatFecha(appt.date));
                            setWaModal({ link: waLink(appt.clientPhone, msg), mensaje: msg });
                          }}
                          style={{ backgroundColor: '#25D366', color: 'white', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)' }}
                        >
                          📲 Enviar {lastAction.type === 'rejected' ? 'rechazo por conflicto' : 'cancelación'} por WhatsApp
                        </button>
                      )}
                      {lastAction.type === 'rescheduled' && (
                        <button
                          onClick={() => {
                            const msg = siteConfig?.mensajeReagendamiento
                              ? buildMessage(siteConfig.mensajeReagendamiento, { nombre: appt.client, servicio: appt.service })
                              : WA_MESSAGES.reagendamiento(appt.client, appt.service, formatFecha(appt.date), formatHora12(appt.time));
                            setWaModal({ link: waLink(appt.clientPhone, msg), mensaje: msg });
                          }}
                          style={{ backgroundColor: '#25D366', color: 'white', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)' }}
                        >
                          📲 Coordinar reagendamiento por WhatsApp
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Calendar Section ── */}
        <section>
          <div className="calendar-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '26px', color: T.onSurface, letterSpacing: '-0.01em' }}>Hoy</h3>
              {/* View toggle */}
              <div style={{ backgroundColor: T.surfaceContainerLow, padding: '4px', borderRadius: '9999px', display: 'flex' }}>
                {(['agenda', 'semana'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setActiveView(v)}
                    className={activeView === v ? 'view-btn-active' : 'view-btn-inactive'}
                    style={{ padding: '8px 20px', borderRadius: '9999px', border: 'none', fontFamily: T.fontBody, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {v === 'agenda' ? 'Agenda' : 'Semana'}
                  </button>
                ))}
              </div>
            </div>
            {/* Date nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontFamily: T.fontBody, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: T.onSurfaceVariant }}>
              {['‹', 'Hoy', '›'].map((lbl) => (
                <button key={lbl} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: lbl === 'Hoy' ? '11px' : '18px', padding: '6px 10px', borderRadius: '9999px', fontWeight: lbl === 'Hoy' ? 700 : 400, color: T.onSurfaceVariant, transition: 'background 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.surfaceContainer)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >{lbl}</button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '64px', color: T.onSurfaceVariant }}>
              <p style={{ fontFamily: T.fontBody, fontSize: '16px' }}>Cargando citas de hoy...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((appt) => {
                const statusStyle = STATUS_STYLES[appt.status];
                return (
                  <div key={appt.id} className="appt-card flex gap-0 sm:gap-6 items-stretch w-full min-w-0">
                    {/* Time marker hidden on mobile, visible on sm+ */}
                    <div className="hidden sm:block w-14 pt-5 text-right shrink-0">
                      <span style={{ fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700, color: `${T.onSurfaceVariant}55`, letterSpacing: '0.05em' }}>{formatHora12(appt.time)}</span>
                    </div>

                    <div className="appt-card-content w-full min-w-0 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ flex: 1, backgroundColor: appt.status === 'Completada' ? T.surfaceContainerLow : T.surfaceContainerLowest, borderLeft: `4px solid ${appt.status === 'Completada' ? T.surfaceContainerHighest : T.primary}`, boxShadow: `0 16px 40px rgba(62,2,21,${appt.status === 'Completada' ? '0.02' : '0.04'})`, opacity: appt.status === 'Completada' ? 0.85 : 1 }}>

                      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative shrink-0">
                            <img src={appt.clientPhoto} alt={appt.client} className="w-12 h-12 rounded-full object-cover" style={{ filter: appt.status === 'Completada' ? 'grayscale(60%)' : 'none' }} />
                            {appt.status !== 'Completada' && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />}
                          </div>
                          <div className="min-w-0 w-full">
                            <div className="flex items-center justify-between w-full mb-1">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h4 className="truncate" style={{ fontFamily: T.fontBody, fontSize: '16px', fontWeight: 700, color: T.onSurface, marginBottom: 0 }}>{appt.client}</h4>
                                {isMultiSession(appt.bulkId) && (
                                  <span title="Parte de una sesión múltiple" style={{ fontSize: '12px', cursor: 'help' }}>🔗</span>
                                )}
                              </div>
                              <span className="shrink-0 sm:hidden" style={{ fontFamily: T.fontBody, fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', backgroundColor: statusStyle.bg, color: statusStyle.color, padding: '4px 10px', borderRadius: '9999px', whiteSpace: 'nowrap' }}>{appt.status}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="sm:hidden font-bold" style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.primary }}>{formatHora12(appt.time)}</span>
                              <span className="hidden sm:inline" style={{ width: '4px', height: '4px', borderRadius: '9999px', backgroundColor: T.outlineVariant }} />
                              <span style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>{appt.serviceIcon} {appt.service}</span>
                              <span className="hidden sm:inline" style={{ width: '4px', height: '4px', borderRadius: '9999px', backgroundColor: T.outlineVariant }} />
                              <span style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>👤 {appt.specialist}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2 md:mt-0 shrink-0 items-center">
                          <div className="text-left sm:text-right hidden sm:block mr-4">
                            <p style={{ fontFamily: T.fontBody, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: `${T.onSurfaceVariant}70`, marginBottom: '2px' }}>Duración</p>
                            <p style={{ fontFamily: T.fontBody, fontSize: '14px', fontWeight: 700, color: T.onSurface }}>{appt.duration}</p>
                          </div>
                          <span className="shrink-0 hidden sm:inline-block" style={{ fontFamily: T.fontBody, fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', backgroundColor: statusStyle.bg, color: statusStyle.color, padding: '6px 14px', borderRadius: '9999px', whiteSpace: 'nowrap' }}>{appt.status}</span>

                          {(appt.status === 'Confirmada' || appt.status === 'Pendiente') && (
                            <button
                              onClick={() => {
                                const msg = `Hola ${appt.client} 👋, te escribimos desde L'Élixir Salon. ¡Tenemos un espacio disponible ahora mismo! ¿Puedes pasar antes de tu cita de las ${formatHora12(appt.time)}? Te esperamos 💅`;
                                setWaModal({ link: waLink(appt.clientPhone, msg), mensaje: msg });
                              }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                backgroundColor: '#25D366', color: 'white',
                                padding: '6px 14px', borderRadius: '9999px',
                                fontFamily: T.fontBody, fontSize: '11px', fontWeight: 800,
                                textTransform: 'uppercase', letterSpacing: '0.1em',
                                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                                transition: 'opacity 0.2s'
                              }}
                              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                            >
                              📲 Llamar
                            </button>
                          )}

                          {appt.status === 'Confirmada' && (
                            <button
                              onClick={() => handleComplete(appt)}
                              className="text-[11px] font-bold uppercase tracking-wider bg-green-500 text-white px-4 py-2 rounded-full transform transition hover:scale-105 hover:bg-green-600"
                              style={{ border: 'none', cursor: 'pointer', fontFamily: T.fontBody }}
                            >
                              ✓ Completar
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '64px', color: T.onSurfaceVariant }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                  <p style={{ fontFamily: T.fontBody, fontSize: '16px' }}>No hay citas agendadas aún para hoy o para tu búsqueda.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>




      {/* RESCHEDULE MODAL */}
      {showRescheduleModal && rescheduleTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', opacity: 1, backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: T.surface, width: '100%', maxWidth: '420px', padding: '40px', borderRadius: '24px', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '28px', color: T.primary, marginBottom: '8px' }}>Reagendar Cita</h3>
            <p style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, marginBottom: '24px' }}>
              Cambia la fecha o profesional para <strong>{rescheduleTarget.client}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, fontFamily: T.fontBody, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Especialista:</label>
                <select
                  value={reschForm.employeeId}
                  onChange={e => setReschForm({ ...reschForm, employeeId: e.target.value, timeSlot: '' })}
                  style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface, backgroundColor: T.surfaceContainerLowest, cursor: 'pointer' }}
                >
                  <option value="">Selecciona especialista...</option>
                  {allEmployees.filter(e => e.isActive).map(e => (
                    <option key={e._id} value={e._id}>{e.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, fontFamily: T.fontBody, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Nueva Fecha:</label>
                <input
                  type="date"
                  value={reschForm.date}
                  onChange={e => setReschForm({ ...reschForm, date: e.target.value, timeSlot: '' })}
                  min={formatISO(new Date())}
                  style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface, backgroundColor: T.surfaceContainerLowest }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, fontFamily: T.fontBody, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Nueva Hora:</label>
                <select
                  value={reschForm.timeSlot}
                  onChange={e => setReschForm({ ...reschForm, timeSlot: e.target.value })}
                  style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface, backgroundColor: T.surfaceContainerLowest, cursor: 'pointer' }}
                >
                  <option value="">Selecciona hora...</option>
                  {availableSlots.map(t => <option key={t} value={t}>{formatHora12(t)}</option>)}
                </select>
                {availableSlots.length === 0 && reschForm.date && <p style={{ fontSize: '11px', color: T.error, marginTop: '6px', fontWeight: 600 }}>No hay disponibilidad en esta fecha</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, fontFamily: T.fontBody, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Motivo:</label>
                <textarea
                  rows={2}
                  value={reschForm.reason}
                  onChange={e => setReschForm({ ...reschForm, reason: e.target.value })}
                  placeholder="Ej: Cambio solicitado por el cliente..."
                  style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.outlineVariant}`, resize: 'none', fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface, backgroundColor: T.surfaceContainerLowest }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button
                onClick={() => setShowRescheduleModal(false)}
                style={{ flex: 1, padding: '16px', border: `1px solid ${T.outlineVariant}`, borderRadius: '9999px', background: 'none', fontFamily: T.fontBody, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReschedule}
                disabled={!reschForm.timeSlot}
                style={{ flex: 1, padding: '16px', backgroundColor: reschForm.timeSlot ? T.primary : T.outlineVariant, color: 'white', border: 'none', borderRadius: '9999px', fontFamily: T.fontBody, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', opacity: reschForm.timeSlot ? 1 : 0.6 }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* FINAL PRICE MODAL */}
      {showPriceModal && selectedApptToComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, marginBottom: '8px' }}>¿Cuánto se cobró?</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedApptToComplete.service} · {selectedApptToComplete.client}</p>
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
      <FlexibleConfirmationModal
        isOpen={showFlexModal}
        onClose={() => setShowFlexModal(false)}
        appointment={flexTarget}
        siteConfig={siteConfig}
        onSuccess={() => {
          showNotif('✅ Cita confirmada exitosamente.');
          fetchData(false);
        }}
      />
    </AdminLayout>
  );
}
