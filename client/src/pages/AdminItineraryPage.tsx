import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { appointmentService, employeeService } from '../services/api';
import { sendApptNotification, formatHora12 } from '../utils/whatsappMessages';
import type { Employee } from '../types';
import type { SiteConfig } from '../types';

export default function AdminItineraryPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Complete appointment modal state
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedApptToComplete, setSelectedApptToComplete] = useState<any>(null);
  const [finalPriceInput, setFinalPriceInput] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [notification, setNotification] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showNotif = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // User auth info
  const rawUser = localStorage.getItem('adminUser');
  const user = rawUser ? JSON.parse(rawUser) : null;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      employeeService.getAll().then(res => {
        if (res.success && res.data && res.data.length > 0) {
          setEmployees(res.data);
          // If admin, default to first specialist if not already set or if it was 'admin'
          if (!selectedEmployeeId || selectedEmployeeId === 'admin') {
            setSelectedEmployeeId(res.data[0]._id);
          }
        }
      });
    } else {
      setSelectedEmployeeId(user?.id || '');
    }
  }, [isAdmin, user?.id]);

  const fetchItinerary = async () => {
    if (!selectedEmployeeId || selectedEmployeeId === 'admin' || !selectedDate) return;
    setLoading(true);
    setError(null);
    try {
      const [itinRes, configRes] = await Promise.all([
        appointmentService.getItinerary(selectedEmployeeId, selectedDate),
        import('../services/api').then(m => m.siteConfigService.get())
      ]);
      if (itinRes.success) setItinerary(itinRes.data);
      if (configRes?.success && configRes?.data) setSiteConfig(configRes.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el itinerario');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (item: any) => {
    setSelectedApptToComplete(item);
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
        showNotif('✅ Cita marcada como completada', 'ok');
        setShowPriceModal(false);
        sendApptNotification('complete', selectedApptToComplete, siteConfig);
        fetchItinerary();
      }
    } catch (error: any) {
      showNotif(error.message || 'Error al completar la cita', 'err');
    } finally {
      setIsCompleting(false);
    }
  };

  useEffect(() => {
    fetchItinerary();
  }, [selectedEmployeeId, selectedDate]);

  const handleDateShortcut = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: '#dcfce7', color: '#166534', label: 'Confirmada' };
      case 'pending':   return { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' };
      case 'completed': return { bg: '#f3f4f6', color: '#374151', label: 'Completada' };
      case 'cancelled': return { bg: '#fee2e2', color: '#991b1b', label: 'Cancelada' };
      case 'rejected':  return { bg: '#fee2e2', color: '#991b1b', label: 'Rechazada' };
      default: return { bg: '#f3f4f6', color: '#374151', label: status };
    }
  };

  return (
    <AdminLayout searchPlaceholder="Buscar en el itinerario...">
      <style>{`
        @media (max-width: 768px) {
          .itinerary-container { padding: 24px 16px 100px !important; }
          .itinerary-header-flex { flex-direction: column !important; align-items: stretch !important; gap: 24px !important; }
          .itinerary-selectors { width: 100% !important; flex-direction: column !important; gap: 16px !important; }
          .itinerary-selector-item { width: 100% !important; }
          .itinerary-selector-item select, .itinerary-selector-item input { width: 100% !important; box-sizing: border-box !important; }
          .itinerary-timeline { padding-left: 0 !important; border-left: none !important; margin-left: 0 !important; }
          .itinerary-time-column { position: static !important; width: 100% !important; text-align: left !important; margin-bottom: 8px !important; display: flex !important; gap: 8px !important; align-items: center !important; }
          .itinerary-time-column p { margin: 0 !important; }
          .itinerary-dot { display: none !important; }
          .itinerary-card { padding: 16px !important; flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .itinerary-card-right { text-align: left !important; width: 100% !important; display: flex !important; justify-content: space-between !important; align-items: center !important; border-top: 1px solid rgba(0,0,0,0.05) !important; padding-top: 12px !important; }
        }
      `}</style>
      <div className="itinerary-container" style={{ padding: '32px 40px', maxWidth: '1000px', margin: '0 auto', minHeight: 'calc(100vh - 72px)' }}>
        
        {/* Header Section */}
        <header style={{ marginBottom: '40px' }}>
          <div className="itinerary-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '32px', color: T.primary, marginBottom: '8px' }}>
                Itinerario Diario
              </h2>
              <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant }}>
                Visualiza y organiza la jornada de trabajo.
              </p>
            </div>

            <div className="itinerary-selectors" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {isAdmin && (
                <div className="itinerary-selector-item" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Especialista</label>
                  <select 
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    style={{ padding: '10px 16px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px', backgroundColor: '#fff' }}
                  >
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="itinerary-selector-item" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ padding: '10px 16px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px' }}
                  />
                  <button onClick={() => handleDateShortcut(0)} style={{ padding: '8px 12px', borderRadius: '10px', border: `1px solid ${T.outlineVariant}`, background: '#fff', fontSize: '12px', cursor: 'pointer' }}>Hoy</button>
                  <button onClick={() => handleDateShortcut(1)} style={{ padding: '8px 12px', borderRadius: '10px', border: `1px solid ${T.outlineVariant}`, background: '#fff', fontSize: '12px', cursor: 'pointer' }}>Mañana</button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Loading / Error States */}
        {loading && <div style={{ textAlign: 'center', padding: '100px' }}><p>Cargando itinerario...</p></div>}
        {error && <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '12px', marginBottom: '24px' }}>{error}</div>}

        {/* Itinerary Timeline */}
        {!loading && itinerary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            
            {itinerary.isFullDayBlocked && (
              <div style={{ backgroundColor: '#f3f4f6', padding: '40px', borderRadius: '20px', textAlign: 'center', border: `2px dashed ${T.outlineVariant}`, marginBottom: '32px' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🌸</span>
                <h3 style={{ fontFamily: T.fontHeadline, color: T.onSurfaceVariant }}>Día Bloqueado</h3>
                <p style={{ color: T.onSurfaceVariant, fontSize: '14px' }}>Esta empleada no tiene disponibilidad hoy por un bloqueo de jornada completa.</p>
              </div>
            )}

            {!itinerary.isFullDayBlocked && itinerary.timeline.length === 0 && (
              <div style={{ textAlign: 'center', padding: '100px', color: T.onSurfaceVariant }}>
                <span style={{ fontSize: '48px' }}>✨</span>
                <p style={{ marginTop: '16px' }}>No hay citas agendadas para este día.</p>
              </div>
            )}

            {!itinerary.isFullDayBlocked && (
              <div className="itinerary-timeline" style={{ position: 'relative', paddingLeft: '80px', borderLeft: `2px solid ${T.surfaceContainerHigh}`, marginLeft: '20px' }}>
                
                {/* Visual Gaps & Items */}
                {itinerary.timeline.map((item: any, idx: number) => {
                  
                  // Check if there's a gap before this item
                  const prevItem = idx === 0 ? null : itinerary.timeline.slice(0, idx).reverse().find((it: any) => it.isGapReducer && !it.isFullDay);
                  const bizStartMin = parseInt(itinerary.businessHours.inicio.split(':')[0]) * 60 + parseInt(itinerary.businessHours.inicio.split(':')[1]);
                  const itemStartMin = item.startMin;
                  
                  let gapBefore = null;
                  if (item.isFullDay) return null; // No renderizamos bloqueos de día completo aquí

                  if (idx === 0 && itemStartMin > bizStartMin) {
                    gapBefore = { start: itinerary.businessHours.inicio, end: item.startTime, duration: itemStartMin - bizStartMin };
                  } else if (prevItem && itemStartMin > prevItem.endMin) {
                     gapBefore = { start: prevItem.endTime, end: item.startTime, duration: itemStartMin - prevItem.endMin };
                  }

                  const status = getStatusStyle(item.status);

                  return (
                    <div key={item.id}>
                      {/* Gap Indicator */}
                      {gapBefore && gapBefore.duration > 5 && (
                        <div style={{ margin: '12px 0', padding: '12px 24px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', border: `1px dashed ${T.outlineVariant}50` }}>
                          <span style={{ fontSize: '14px' }}>⏸️</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Tiempo Libre: {gapBefore.duration >= 60 ? `${Math.floor(gapBefore.duration/60)}h ${gapBefore.duration%60}m` : `${gapBefore.duration} min`}
                          </span>
                          <span style={{ fontSize: '11px', color: `${T.onSurfaceVariant}70` }}>({gapBefore.start} - {gapBefore.end})</span>
                        </div>
                      )}

                      {/* Timeline Item */}
                      <div style={{ position: 'relative', marginBottom: '24px' }}>
                        {/* Time label on the left */}
                        <div className="itinerary-time-column" style={{ position: 'absolute', left: '-100px', top: '12px', textAlign: 'right', width: '70px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 800, color: T.primary }}>{formatHora12(item.startTime)}</p>
                          <p style={{ fontSize: '11px', color: T.onSurfaceVariant }}>{formatHora12(item.endTime)}</p>
                        </div>

                        {/* Dot on the line */}
                        <div className="itinerary-dot" style={{ position: 'absolute', left: '-82px', top: '18px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.type === 'block' ? '#94a3b8' : T.primary, border: '3px solid #fff', boxShadow: '0 0 0 2px rgba(0,0,0,0.05)', zIndex: 10 }} />

                        {/* Content Card */}
                        <div className="itinerary-card" style={{ 
                          backgroundColor: item.type === 'block' ? '#f8fafc' : '#fff',
                          padding: '20px 24px',
                          borderRadius: '16px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                          border: `1px solid ${item.type === 'block' ? '#e2e8f0' : T.outlineVariant + '40'}`,
                          borderLeft: `6px solid ${item.type === 'block' ? '#64748b' : (item.status === 'confirmed' ? '#22c55e' : (item.status === 'pending' ? '#f59e0b' : T.primary))}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '20px',
                          backgroundImage: item.type === 'block' ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)' : 'none'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                              <h4 style={{ fontFamily: T.fontBody, fontSize: '17px', fontWeight: 700, color: T.onSurface }}>{item.title || item.reason}</h4>
                              {item.type === 'appointment' && (
                                <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: status.bg, color: status.color }}>
                                  {status.label}
                                </span>
                              )}
                              {item.type === 'block' && (
                                <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', backgroundColor: '#e2e8f0', color: '#475569' }}>
                                  Bloqueo
                                </span>
                              )}
                            </div>
                            
                            {item.type === 'appointment' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <p style={{ fontSize: '14px', color: T.onSurface }}><strong>Cliente:</strong> {item.client}</p>
                                <p style={{ fontSize: '13px', color: `${T.onSurfaceVariant}80` }}>🕒 {formatHora12(item.startTime)} - {formatHora12(item.endTime)} · {item.price ? `$${item.price.toLocaleString()}` : ''}</p>
                              </div>
                            )}
                            {item.type === 'block' && (
                               <p style={{ fontSize: '14px', color: `${T.onSurfaceVariant}80` }}>{item.reason}</p>
                            )}
                          </div>

                          <div className="itinerary-card-right" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                             <p style={{ fontSize: '12px', fontWeight: 700, color: T.onSurfaceVariant }}>{item.duration} min</p>
                             {item.type === 'appointment' && (
                               <button 
                                 onClick={() => window.open(`https://wa.me/${item.clientPhone?.replace(/\D/g,'')}`, '_blank')}
                                 style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#25D366', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                               >
                                 WhatsApp
                               </button>
                             )}
                             {item.type === 'appointment' && item.status === 'confirmed' && (
                               <button
                                 onClick={() => handleComplete(item)}
                                 style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#22c55e', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
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

                {/* Final Gap to Business End */}
                {(() => {
                   const lastReducer = itinerary.timeline.slice().reverse().find((it: any) => it.isGapReducer && !it.isFullDay);
                   const bizEndMin = parseInt(itinerary.businessHours.fin.split(':')[0]) * 60 + parseInt(itinerary.businessHours.fin.split(':')[1]);
                   const cursor = lastReducer ? lastReducer.endMin : (parseInt(itinerary.businessHours.inicio.split(':')[0]) * 60 + parseInt(itinerary.businessHours.inicio.split(':')[1]));
                   
                   if (cursor < bizEndMin) {
                    return (
                      <div style={{ margin: '12px 0 32px', padding: '12px 24px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', border: `1px dashed ${T.outlineVariant}50` }}>
                        <span style={{ fontSize: '14px' }}>⏸️</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Cierre del Día: { (bizEndMin - cursor) >= 60 ? `${Math.floor((bizEndMin-cursor)/60)}h ${(bizEndMin-cursor)%60}m` : `${bizEndMin-cursor} min`} libre
                        </span>
                        <span style={{ fontSize: '11px', color: `${T.onSurfaceVariant}70` }}>({minutesToTime(cursor)} - {itinerary.businessHours.fin})</span>
                      </div>
                    );
                   }
                   return null;
                })()}

              </div>
            )}
          </div>
        )}
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '24px', zIndex: 999,
          backgroundColor: notification.type === 'ok' ? '#22c55e' : '#ba1a1a',
          color: '#fff', padding: '14px 24px', borderRadius: '12px',
          fontFamily: T.fontBody, fontSize: '14px', fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}>
          {notification.msg}
        </div>
      )}

      {/* FINAL PRICE MODAL */}
      {showPriceModal && selectedApptToComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, marginBottom: '8px' }}>¿Cuánto se cobró?</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedApptToComplete.title} · {selectedApptToComplete.client}</p>
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
    </AdminLayout>
  );
}

function minutesToTime(mins: number) {
  const hh = String(Math.floor(mins / 60)).padStart(2, '0');
  const mm = String(mins % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}
