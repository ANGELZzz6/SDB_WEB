import { useState, useEffect } from 'react';
import { T } from '../lib/adminTokens';
import { availabilityService, api } from '../services/api';
import { sendApptNotification } from '../utils/whatsappMessages';

interface FlexibleAvailability {
  date: string;
  startTime: string;
  endTime: string;
  isFullDay: boolean;
}

interface UIAppointment {
  id: string;
  client: string;
  clientPhone: string;
  service: string;
  serviceId: string;
  specialistId: string;
  specialist?: string;
  flexibleAvailabilities?: FlexibleAvailability[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointment: UIAppointment | null;
  siteConfig: any;
  onSuccess: (data: any) => void;
}

export default function FlexibleConfirmationModal({ isOpen, onClose, appointment, siteConfig, onSuccess }: Props) {
  const [flexForm, setFlexForm] = useState({ date: '', timeSlot: '' });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (isOpen && appointment) {
      setFlexForm({ date: '', timeSlot: '' });
      setAvailableSlots([]);
    }
  }, [isOpen, appointment]);

  useEffect(() => {
    if (isOpen && flexForm.date && appointment) {
      setLoadingSlots(true);
      availabilityService.getSlots(appointment.specialistId, appointment.serviceId, flexForm.date)
        .then(res => setAvailableSlots(res.data || []))
        .finally(() => setLoadingSlots(false));
    }
  }, [flexForm.date, appointment, isOpen]);

  const formatFlexibleDate = (dateString: string) => {
    if (!dateString) return 'Fecha no definida';
    const cleanStr = dateString.split('T')[0];
    const parsedDate = new Date(cleanStr + 'T12:00:00');
    if (isNaN(parsedDate.getTime())) return 'Fecha inválida';
    return parsedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleConfirm = async () => {
    if (!appointment || !flexForm.date || !flexForm.timeSlot) return;
    try {
      setIsConfirming(true);
      
      const payload = {
        status: 'confirmed',
        date: flexForm.date, // Formato YYYY-MM-DD del input/button
        timeSlot: String(flexForm.timeSlot).trim() // Formato HH:mm de los chips
      };

      console.log('DEBUG: Intentando confirmar cita flexible:', appointment.id);
      console.log('Payload a enviar:', payload);

      const res = await api.put<any>(`/appointments/${appointment.id}`, payload);

      if (res.success) {
        if (appointment) {
          const updatedAppt = { 
            ...appointment, 
            date: res.data?.date || flexForm.date, 
            time: res.data?.timeSlot || flexForm.timeSlot 
          };
          sendApptNotification('confirm', updatedAppt, siteConfig);
        }
        onSuccess(res.data);
        onClose();
      }
    } catch (error: any) {
      alert(error.message || 'Error al confirmar cita');
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="flex-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <style>{`
        @media (max-width: 768px) {
          .flex-modal-overlay { align-items: flex-end !important; padding: 0 !important; }
          .flex-modal-container { 
            border-radius: 24px 24px 0 0 !important; 
            max-height: 92vh !important;
            height: auto !important;
          }
          .flex-modal-body { flex-direction: column !important; overflow-y: auto !important; }
          .flex-modal-side { 
            border-right: none !important; 
            border-bottom: 1px solid ${T.outlineVariant} !important;
            padding: 20px 16px !important;
            flex: none !important;
            overflow-y: visible !important;
          }
          .flex-modal-main { padding: 20px 16px !important; overflow-y: visible !important; }
          .flex-modal-header { padding: 20px 16px !important; }
          .flex-modal-header h3 { font-size: 20px !important; }
          .flex-modal-header p { font-size: 13px !important; }
        }
      `}</style>
      <div className="flex-modal-container" style={{ backgroundColor: '#fff', width: '100%', maxWidth: '800px', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 32px 120px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="flex-modal-header" style={{ padding: '32px', backgroundColor: T.primary, color: '#fff', position: 'relative' }}>
           <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '28px', margin: 0 }}>Convertir Solicitud Flexible</h3>
           <p style={{ fontFamily: T.fontBody, fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>Asignando espacio para {appointment.client}</p>
           <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>
        
        <div className="flex-modal-body" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Disponibilidades del cliente */}
          <div className="flex-modal-side" style={{ flex: 1, padding: '32px', backgroundColor: T.surfaceContainerLow, borderRight: `1px solid ${T.outlineVariant}`, overflowY: 'auto' }}>
            <h4 style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.primary, marginBottom: '20px' }}>Opciones del Cliente:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {appointment.flexibleAvailabilities?.map((opt, i) => (
                <div key={i} style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '16px', border: `1px solid ${T.outlineVariant}` }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', textTransform: 'capitalize' }}>
                    {formatFlexibleDate(opt.date)}
                  </div>
                  <div style={{ fontSize: '12px', color: T.onSurfaceVariant }}>
                    {opt.isFullDay ? '✅ Todo el día' : `🕒 ${opt.startTime} - ${opt.endTime}`}
                  </div>
                  <button 
                    onClick={() => setFlexForm({ ...flexForm, date: opt.date.split('T')[0] })}
                    style={{ marginTop: '12px', width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${T.primary}`, backgroundColor: flexForm.date === opt.date.split('T')[0] ? T.primary : 'transparent', color: flexForm.date === opt.date.split('T')[0] ? '#fff' : T.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {flexForm.date === opt.date.split('T')[0] ? '✓ Seleccionado' : 'Usar esta fecha'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario de confirmación */}
          <div className="flex-modal-main" style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
            <h4 style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.primary, marginBottom: '20px' }}>Espacio Definitivo:</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '8px', color: T.onSurfaceVariant }}>Fecha de Cita:</label>
                <input 
                  type="date" 
                  value={flexForm.date} 
                  onChange={e => setFlexForm({ ...flexForm, date: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '12px', color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horarios Disponibles:</label>
                
                {loadingSlots ? (
                  <div style={{ padding: '20px', textAlign: 'center', backgroundColor: T.surfaceContainerLow, borderRadius: '12px' }}>
                    <p style={{ fontSize: '12px', color: T.onSurfaceVariant, margin: 0 }}>Consultando agenda...</p>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="flex-time-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '10px' }}>
                    {availableSlots.map(s => (
                      <button
                        key={s}
                        onClick={() => setFlexForm({ ...flexForm, timeSlot: s })}
                        style={{
                          padding: '12px 4px',
                          borderRadius: '12px',
                          border: `1px solid ${flexForm.timeSlot === s ? T.primary : T.outlineVariant}`,
                          backgroundColor: flexForm.timeSlot === s ? T.primary : '#fff',
                          color: flexForm.timeSlot === s ? '#fff' : T.onSurface,
                          fontFamily: T.fontBody,
                          fontSize: '14px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : flexForm.date ? (
                  <div style={{ padding: '20px', textAlign: 'center', backgroundColor: T.errorContainer + '20', borderRadius: '12px', border: `1px dashed ${T.error}` }}>
                    <p style={{ fontSize: '12px', color: T.error, fontWeight: 700, margin: 0 }}>Sin turnos libres para esta fecha.</p>
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', border: `1px dashed ${T.outlineVariant}`, borderRadius: '12px' }}>
                    <p style={{ fontSize: '12px', color: T.onSurfaceVariant, margin: 0 }}>Selecciona una fecha primero.</p>
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: T.surfaceContainerHighest, padding: '16px', borderRadius: '16px', marginTop: '12px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: T.onSurfaceVariant }}>
                  Al confirmar, la cita pasará a estado <strong>Confirmada</strong> y se notificará automáticamente al cliente.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
               <button 
                 onClick={onClose}
                 style={{ flex: 1, padding: '14px', borderRadius: '9999px', border: `1px solid ${T.outlineVariant}`, background: 'none', fontWeight: 700, cursor: 'pointer' }}
               >
                 Cancelar
               </button>
               <button 
                 disabled={!flexForm.date || !flexForm.timeSlot || isConfirming}
                 onClick={handleConfirm}
                 style={{ flex: 1, padding: '14px', borderRadius: '9999px', border: 'none', backgroundColor: T.primary, color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: (!flexForm.date || !flexForm.timeSlot) ? 0.5 : 1 }}
               >
                 {isConfirming ? 'Confirmando...' : 'Confirmar Cita'}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
