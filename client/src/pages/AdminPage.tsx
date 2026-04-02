import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { appointmentService, employeeService, availabilityService } from '../services/api';
import type { Employee } from '../types';

/* ─────────────────────────────────────────────────
   Data
───────────────────────────────────────────────── */
type AppStatus = 'Confirmada' | 'Completada' | 'Pendiente' | 'Cancelada';

interface UIAppointment {
  id: string; time: string; client: string; clientPhone: string; clientPhoto: string;
  service: string; serviceId: string; serviceIcon: string; 
  specialist: string; specialistId: string;
  duration: string; status: AppStatus;
  date: string;
}

const mapStatus = (apiStatus: string): AppStatus => {
  switch(apiStatus) {
    case 'confirmed': return 'Confirmada';
    case 'completed': return 'Completada';
    case 'cancelled': return 'Cancelada';
    default: return 'Pendiente';
  }
}

const STATUS_STYLES: Record<AppStatus, { bg: string; color: string }> = {
  'Confirmada': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
  'Completada': { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' },
  'Pendiente':  { bg: 'rgba(240,189,143,0.3)', color: '#623f1b' },
  'Cancelada':  { bg: 'rgba(186,26,26,0.08)',  color: '#ba1a1a' },
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
    date: a.date
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const d = new Date();
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

        const fetchParams: any = { date: dateStr };
        if (isEmpleada) fetchParams.employeeId = user?.id;

        // Fetch today's appointments + stats. Both admin and specialists fetch pending for their scope
        const promises: Promise<any>[] = [
          appointmentService.getAll(fetchParams),
          appointmentService.getStats(),
          appointmentService.getAll({ status: 'pending', ...(isEmpleada ? { employeeId: user?.id } : {}) })
        ];

        const [apptsRes, statsRes, pendingRes, empsRes] = await Promise.all(promises.concat(employeeService.getAll()));

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
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id, user?.role]);

  const handleAction = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
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
        
        showNotif(newStatus === 'confirmed' ? '✅ Cita confirmada' : '❌ Cita rechazada', newStatus === 'confirmed' ? 'ok' : 'err');
      }
    } catch (error) {
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
      }
    } catch (e: any) {
      showNotif(e.message || 'Error reagendando', 'err');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await appointmentService.complete(id);
      if (res.success) {
        setAppointments(prev => prev.map(a => 
          a.id === id ? { ...a, status: 'Completada' } : a
        ));
        showNotif('✅ Cita marcada como completada', 'ok');
      }
    } catch (error) {
      console.error('Error completing appointment', error);
      showNotif('Error al completar la cita', 'err');
    }
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
          50%      { opacity:0.8; box-shadow:0 0 0 6px rgba(34,197,94,0); }
        }
      `}</style>

      <div style={{ padding: '40px 48px 120px', position: 'relative' }}>
        {/* ── Header ── */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: 'clamp(28px,4vw,40px)', color: T.primary, marginBottom: '6px', letterSpacing: '-0.02em' }}>
              Bienvenida, {user?.nombre || 'Admin'}
            </h2>
            <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant }}>
              {todayFormatted} · {isEmpleada ? 'Tienes' : 'Salón tiene'} {confirmedCount} citas confirmadas hoy.
            </p>
          </div>
          {/* Search inline in body */}
          <div style={{ backgroundColor: T.surfaceContainerLow, padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', marginBottom: '56px' }}>
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
          <section style={{ marginBottom: '56px', backgroundColor: '#fff8e1', padding: '24px', borderRadius: '16px', border: '1px solid #ffe082' }}>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: '#5d4037', marginBottom: '20px' }}>
              ⏳ Citas Pendientes de Confirmación ({pendingAppointments.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {pendingAppointments.map(appt => (
                <div key={appt.id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderLeft: `4px solid ${T.primary}` }}>
                  <h4 style={{ fontFamily: T.fontBody, fontSize: '16px', fontWeight: 700, color: T.onSurface, margin: '0 0 4px' }}>{appt.client}</h4>
                  <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant, margin: '0 0 2px' }}>📞 {appt.clientPhone}</p>
                  <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant, margin: '0 0 2px' }}>💎 {appt.service} · {appt.duration}</p>
                  <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant, margin: '0 0 16px' }}>👩‍🎨 {appt.specialist} · {appt.time}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleAction(appt.id, 'confirmed')}
                      style={{ flex: 1, padding: '10px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '9999px', cursor: 'pointer', fontFamily: T.fontBody, fontWeight: 700, fontSize: '13px', transition: 'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      ✓ Confirmar
                    </button>
                    <button
                      onClick={() => openReschedule(appt)}
                      style={{ flex: 1, padding: '10px', backgroundColor: T.secondaryContainer, color: T.onSecondaryContainer, border: 'none', borderRadius: '9999px', cursor: 'pointer', fontFamily: T.fontBody, fontWeight: 700, fontSize: '13px', transition: 'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      🕒 Reagendar
                    </button>
                    <button
                      onClick={() => handleAction(appt.id, 'cancelled')}
                      style={{ flex: 1, padding: '10px', backgroundColor: T.errorContainer, color: T.error, border: 'none', borderRadius: '9999px', cursor: 'pointer', fontFamily: T.fontBody, fontWeight: 700, fontSize: '13px', transition: 'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      ✕ Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Calendar Section ── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filtered.map((appt) => {
                const statusStyle = STATUS_STYLES[appt.status];
                return (
                  <div key={appt.id} className="appt-card" style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
                    <div style={{ width: '56px', paddingTop: '20px', textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700, color: `${T.onSurfaceVariant}55`, letterSpacing: '0.05em' }}>{appt.time}</span>
                    </div>
                    <div style={{ flex: 1, padding: '20px 24px', backgroundColor: appt.status === 'Completada' ? T.surfaceContainerLow : T.surfaceContainerLowest, borderRadius: '14px', borderLeft: `4px solid ${appt.status === 'Completada' ? T.surfaceContainerHighest : T.primary}`, boxShadow: `0 16px 40px rgba(62,2,21,${appt.status === 'Completada' ? '0.02' : '0.04'})`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: appt.status === 'Completada' ? 0.85 : 1, gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: 0 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img src={appt.clientPhoto} alt={appt.client} style={{ width: '48px', height: '48px', borderRadius: '9999px', objectFit: 'cover', filter: appt.status === 'Completada' ? 'grayscale(60%)' : 'none' }} />
                          {appt.status !== 'Completada' && <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '14px', height: '14px', backgroundColor: '#22c55e', border: '2px solid white', borderRadius: '9999px' }} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ fontFamily: T.fontBody, fontSize: '16px', fontWeight: 700, color: T.onSurface, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appt.client}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>{appt.serviceIcon} {appt.service}</span>
                            <span style={{ width: '4px', height: '4px', borderRadius: '9999px', backgroundColor: T.outlineVariant, display: 'inline-block' }} />
                            <span style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>👤 {appt.specialist}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right', opacity: appt.status === 'Completada' ? 0.6 : 1 }}>
                          <p style={{ fontFamily: T.fontBody, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: `${T.onSurfaceVariant}70`, marginBottom: '2px' }}>Duración</p>
                          <p style={{ fontFamily: T.fontBody, fontSize: '14px', fontWeight: 700, color: T.onSurface }}>{appt.duration}</p>
                        </div>
                        <span style={{ fontFamily: T.fontBody, fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', backgroundColor: statusStyle.bg, color: statusStyle.color, padding: '6px 14px', borderRadius: '9999px', whiteSpace: 'nowrap' }}>{appt.status}</span>
                        {appt.status === 'Confirmada' && (
                          <button
                            onClick={() => handleComplete(appt.id)}
                            style={{
                              fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.1em',
                              backgroundColor: '#22c55e', color: '#fff',
                              padding: '8px 16px', borderRadius: '9999px', border: 'none',
                              cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#16a34a';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#22c55e';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            ✓ Completar
                          </button>
                        )}
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

      {/* Floating Status Bar */}
      <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', zIndex: 60, backgroundColor: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '14px 32px', borderRadius: '9999px', boxShadow: '0 20px 40px rgba(62,2,21,0.10)', border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '32px', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#22c55e', display: 'inline-block', animation: 'pulse-green 2s infinite' }} />
          <p style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurface }}>Salón Abierto</p>
        </div>
        <div style={{ width: '1px', height: '20px', backgroundColor: `${T.outlineVariant}40` }} />
        <div style={{ display: 'flex', gap: '28px' }}>
          {[{ label: 'Especialistas Totales', val: '2' }, { label: 'Citas HOY', val: stats.today.toString() }].map(({ label, val }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: T.fontBody, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: `${T.onSurfaceVariant}70`, marginBottom: '2px' }}>{label}</p>
              <p style={{ fontFamily: T.fontBody, fontSize: '14px', fontWeight: 700, color: T.primary }}>{val}</p>
            </div>
          ))}
        </div>
        <button style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', backgroundColor: T.primary, color: '#FFF', padding: '10px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >Actualizar</button>
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
                  onChange={e => setReschForm({...reschForm, employeeId: e.target.value, timeSlot: ''})}
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
                  onChange={e => setReschForm({...reschForm, date: e.target.value, timeSlot: ''})} 
                  min={formatISO(new Date())} 
                  style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface, backgroundColor: T.surfaceContainerLowest }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, fontFamily: T.fontBody, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Nueva Hora:</label>
                <select
                  value={reschForm.timeSlot}
                  onChange={e => setReschForm({...reschForm, timeSlot: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface, backgroundColor: T.surfaceContainerLowest, cursor: 'pointer' }}
                >
                  <option value="">Selecciona hora...</option>
                  {availableSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {availableSlots.length === 0 && reschForm.date && <p style={{ fontSize: '11px', color: T.error, marginTop: '6px', fontWeight: 600 }}>No hay disponibilidad en esta fecha</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, fontFamily: T.fontBody, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Motivo:</label>
                <textarea 
                  rows={2} 
                  value={reschForm.reason} 
                  onChange={e => setReschForm({...reschForm, reason: e.target.value})} 
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
    </AdminLayout>
  );
}
