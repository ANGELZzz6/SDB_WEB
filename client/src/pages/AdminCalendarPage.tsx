import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { appointmentService, blockedSlotService, employeeService, availabilityService } from '../services/api';
import type { Appointment, BlockedSlot, Employee } from '../types';

export default function AdminCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Modals state
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ date: Date, appts: Appointment[], blocks: BlockedSlot[] } | null>(null);
  
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({ employee: 'all', isFullDay: true, timeSlot: '08:00', reason: '' });

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [reschForm, setReschForm] = useState({ date: '', timeSlot: '', employeeId: '', reason: '' });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Fetch data
  const loadData = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const [resApps, resBlocks, resEmps] = await Promise.all([
        appointmentService.getAll(), // Ideally pass from/to to backend, but getAll handles up to limit 50. Wait, AdminPage uses getAll with ?date= or without for all. 
        // We will just filter client side for now, assuming small dataset. The endpoint can receive from/to according to the controller!
        appointmentService.getAll({ from: startOfMonth.toISOString(), to: endOfMonth.toISOString(), limit: 1000 } as any),
        blockedSlotService.getAll(),
        employeeService.getAll()
      ]);

      if (resApps.success) setAppointments((resApps.data as unknown as Appointment[]) || []);
      if (resBlocks.success) setBlockedSlots((resBlocks.data as unknown as BlockedSlot[]) || []);
      if (resEmps.success) setEmployees((resEmps.data as unknown as Employee[]) || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

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
  const formatISO = (d: Date | string) => {
    if (typeof d === 'string') return d.split('T')[0];
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Modals operations
  const handleCreateBlock = async () => {
    if (!selectedDayInfo) return;
    try {
      await blockedSlotService.create({
        date: formatISO(selectedDayInfo.date),
        ...blockForm
      });
      setShowBlockModal(false);
      loadData();
      setSelectedDayInfo(null);
    } catch (e: any) {
      alert(e.message || 'Error bloqueando horario');
    }
  };

  const handleRemoveBlock = async (id: string) => {
    if(!confirm('¿Eliminar este bloqueo?')) return;
    try {
      await blockedSlotService.delete(id);
      loadData();
      setSelectedDayInfo(null);
    } catch (e) {
      console.error(e);
    }
  }

  // Reschedule
  const openReschedule = (appt: Appointment) => {
    setRescheduleTarget(appt);
    setReschForm({
      date: formatISO(new Date(appt.date)),
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
      setSelectedDayInfo(null);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Error reagendando');
    }
  };

  return (
    <AdminLayout searchPlaceholder="Buscar fecha o cita...">
      <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '64px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '36px', color: T.primary }}>
              Calendario General
            </h1>
            <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant }}>
              Administra todas las citas y bloqueos de agenda
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: T.surfaceContainerLowest, padding: '8px', borderRadius: '9999px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
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

        {/* Matrix */}
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
            const dayAppts = appointments.filter(a => formatISO(a.date) === iso);
            const dayBlocks = blockedSlots.filter(b => formatISO(b.date) === iso);
            
            const isToday = formatISO(new Date()) === iso;

            return (
              <div 
                key={i} 
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
                  {dayAppts.map((a, idx) => (
                    <div key={`apt-${idx}`} style={{ fontSize: '10px', fontFamily: T.fontBody, fontWeight: 700, backgroundColor: a.status==='cancelled' ? T.surfaceVariant : T.primaryFixed, color: a.status==='cancelled'? T.onSurfaceVariant : T.primary, padding: '4px 6px', borderRadius: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: a.status==='cancelled'?'line-through':'none' }}>
                      {a.timeSlot} {a.clientName}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* DAY MODAL */}
      {selectedDayInfo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(28,27,26,0.6)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: T.surface, width: '100%', maxWidth: '560px', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
            
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

            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              {selectedDayInfo.appts.map(a => (
                <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.surfaceContainerLowest, padding: '16px', borderRadius: '16px', opacity: a.status === 'cancelled' ? 0.6 : 1 }}>
                  <div>
                    <span style={{ fontFamily: T.fontBody, fontSize: '15px', fontWeight: 800, color: T.primary }}>{a.timeSlot}</span>
                    <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface, fontWeight: 600 }}>{a.clientName}</p>
                    <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>{(a.service as any)?.nombre || 'Servicio'} con {(a.employee as any)?.nombre}</p>
                    <span style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, color: a.status === 'cancelled' ? T.error : T.primary }}>{a.status.toUpperCase()}</span>
                  </div>
                  
                  {a.status !== 'cancelled' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button onClick={() => openReschedule(a)} style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, backgroundColor: T.secondaryContainer, color: T.onSecondaryContainer, padding: '8px 16px', borderRadius: '9999px', border: 'none', cursor: 'pointer' }}>REAGENDAR</button>
                    </div>
                  )}
                </div>
              ))}
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
                  <input type="checkbox" checked={blockForm.isFullDay} onChange={e => setBlockForm({...blockForm, isFullDay: e.target.checked})} />
                  Bloquear todo el día
                </label>
              </div>
              
              {!blockForm.isFullDay && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700 }}>Hora a bloquear:</label>
                  <input type="time" value={blockForm.timeSlot} onChange={e => setBlockForm({...blockForm, timeSlot: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}` }} />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700 }}>¿A quién aplica?</label>
                <select value={blockForm.employee} onChange={e => setBlockForm({...blockForm, employee: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}` }}>
                  <option value="all">Toda la peluquería (Cerrar)</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700 }}>Motivo (Visible interno):</label>
                <input type="text" value={blockForm.reason} onChange={e => setBlockForm({...blockForm, reason: e.target.value})} placeholder="Ej: Festivo, Doctor..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}` }} />
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
                  onChange={e => setReschForm({...reschForm, employeeId: e.target.value, timeSlot: ''})}
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
                <input type="date" value={reschForm.date} onChange={e => setReschForm({...reschForm, date: e.target.value, timeSlot: ''})} min={formatISO(new Date())} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface, backgroundColor: T.surfaceContainerLowest, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurface, marginBottom: '6px' }}>Nueva Hora:</label>
                <select
                  value={reschForm.timeSlot}
                  onChange={e => setReschForm({...reschForm, timeSlot: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface, backgroundColor: T.surfaceContainerLowest, minHeight: '46px', appearance: 'auto', boxSizing: 'border-box' }}
                >
                  <option value="">Selecciona hora...</option>
                  {availableSlots.map(t => <option key={t} value={t} style={{ fontFamily: T.fontBody }}>{t}</option>)}
                </select>
                {availableSlots.length === 0 && reschForm.date && <span style={{ fontSize: '11px', color: T.error, fontFamily: T.fontBody }}>No hay disponibilidad en esta fecha</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurface, marginBottom: '6px' }}>Motivo del reagendamiento (Visible al cliente en WhatsApp):</label>
                <textarea rows={3} value={reschForm.reason} onChange={e => setReschForm({...reschForm, reason: e.target.value})} placeholder="Ej: Inconvenientes técnicos en local..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, resize: 'none', fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface, boxSizing: 'border-box' }} />
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

    </AdminLayout>
  );
}
