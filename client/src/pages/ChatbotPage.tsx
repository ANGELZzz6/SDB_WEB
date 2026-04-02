import { useState, useEffect } from 'react';
import { T } from '../lib/adminTokens';
import {
  employeeService,
  serviceService,
  availabilityService,
  settingsService,
  appointmentService
} from '../services/api';
import type { Employee, Service, Settings } from '../types';

function formatGoogleCalendarDate(dateStr: string, timeStr: string, durationMin: number) {
  const [yyyy, MM, dd] = dateStr.split('-');
  
  const isPM = timeStr.toLowerCase().includes('pm');
  const isAM = timeStr.toLowerCase().includes('am');
  let hhRaw = parseInt(timeStr.split(':')[0]);
  const mmRaw = parseInt(timeStr.split(':')[1].replace(/\D/g, ''));

  if (isPM && hhRaw < 12) hhRaw += 12;
  if (isAM && hhRaw === 12) hhRaw = 0;

  const start = new Date(parseInt(yyyy), parseInt(MM) - 1, parseInt(dd), hhRaw, mmRaw);
  const end = new Date(start.getTime() + durationMin * 60000);

  const fmt = (d: Date) => {
    const tpad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${tpad(d.getMonth() + 1)}${tpad(d.getDate())}T${tpad(d.getHours())}${tpad(d.getMinutes())}00`;
  };
  return `${fmt(start)}/${fmt(end)}`;
}

export default function ChatbotPage() {
  
  // Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  // Loading states
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');

  // Wizard States
  const [step, setStep] = useState(1);
  const [employeeId, setEmployeeId] = useState('');
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [selectedEmployeeImage, setSelectedEmployeeImage] = useState('');
  
  const [serviceId, setServiceId] = useState('');
  const [selectedServiceName, setSelectedServiceName] = useState('');
  const [selectedServicePrice, setSelectedServicePrice] = useState(0);
  const [selectedServicePrecioTipo, setSelectedServicePrecioTipo] = useState<'fijo'|'rango'|'consultar'>('fijo');
  const [selectedServicePrecioDesde, setSelectedServicePrecioDesde] = useState(0);
  const [selectedServicePrecioHasta, setSelectedServicePrecioHasta] = useState(0);
  const [selectedServiceDuration, setSelectedServiceDuration] = useState(0);

  const [date, setDate] = useState(''); // YYYY-MM-DD
  const [timeSlot, setTimeSlot] = useState(''); // HH:mm AM

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // 1. Initial Load
  useEffect(() => {
    Promise.all([
      employeeService.getAll(),
      settingsService.get()
    ]).then(([empRes, setRes]) => {
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data.filter(e => e.isActive));
      }
      if (setRes.success && setRes.data) {
        setSettings(setRes.data);
      }
    }).finally(() => setLoadingInitial(false));
  }, []);

  // 2. Load services when moving to step 2
  useEffect(() => {
    if (step === 2 && employeeId) {
      setLoadingServices(true);
      serviceService.getAll(employeeId).then(res => {
        if (res.success && res.data) {
          // Solamente activos
          setServices(res.data.filter(s => s.isActive));
        }
      }).finally(() => setLoadingServices(false));
    }
  }, [step, employeeId]);

  // 4. Load availability when moving to step 4
  useEffect(() => {
    if (step === 4 && employeeId && serviceId && date) {
      setLoadingSlots(true);
      setBlockMessage('');
      availabilityService.getSlots(employeeId, serviceId, date)
        .then(res => {
          if (res.success && res.data) {
            setAvailableSlots(res.data);
            if (res.data.length === 0 && res.message) {
              setBlockMessage(res.message);
            }
          }
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [step, employeeId, serviceId, date]);

  // Handlers
  const handleSelectEmployee = (emp: Employee) => {
    setEmployeeId(emp._id);
    setSelectedEmployeeName(emp.nombre);
    setSelectedEmployeeImage(emp.foto || '');
    setServiceId(''); setDate(''); setTimeSlot(''); // Reset downstream
    setStep(2);
  };

  const handleSelectService = (svc: Service) => {
    setServiceId(svc._id);
    setSelectedServiceName(svc.nombre);
    setSelectedServicePrice(svc.precio);
    setSelectedServicePrecioTipo(svc.precioTipo || 'fijo');
    setSelectedServicePrecioDesde(svc.precioDesde || 0);
    setSelectedServicePrecioHasta(svc.precioHasta || 0);
    setSelectedServiceDuration(svc.duracion);
    setDate(''); setTimeSlot('');
    setStep(3);
  };

  const handleSelectDate = (d: string) => {
    setDate(d);
    setTimeSlot('');
    setStep(4);
  };

  const handleSelectTime = (t: string) => {
    setTimeSlot(t);
    setStep(5);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await appointmentService.create({
        employee: employeeId,
        service: serviceId,
        date,
        timeSlot,
        clientName,
        clientPhone,
        clientEmail
      });
      if (res.success) {
        setStep(6);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 429) {
        alert(err.response.data?.message || 'Has alcanzado el límite de citas permitidas (4 cada 30 min). Por favor intenta más tarde.');
      } else {
        alert(err.message || 'Error al agendar. Es posible que el horario ya esté ocupado.');
      }
      setStep(4); // Regresar al selector de horas
    } finally {
      setSubmitting(false);
    }
  };

  const restartWizard = () => {
    setStep(1);
    setEmployeeId(''); setServiceId(''); setDate(''); setTimeSlot('');
    setClientName(''); setClientPhone(''); setClientEmail('');
  };

  const renderPriceInfo = (pType: string, precio: number, desde?: number, hasta?: number) => {
    const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });
    if (pType === 'consultar') return 'Consultar precio';
    if (pType === 'rango') {
      const pDesde = desde ? formatter.format(desde).replace(',00', '') : '';
      const pHasta = hasta ? formatter.format(hasta).replace(',00', '') : '';
      return `${pDesde} - ${pHasta}`;
    }
    return formatter.format(precio || 0).replace(',00', '');
  };

  const formatFancyDate = (isoStr: string) => {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return dateObj.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loadingInitial) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontBody }}>Cargando asistente...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fdfbfb', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header */}
      <header style={{ 
        backgroundColor: '#fff', padding: '16px 24px', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 10 
      }}>
        {step > 1 && step < 6 ? (
          <button 
            onClick={() => setStep(step - 1)}
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: T.onSurfaceVariant 
            }}
          >
            ←
          </button>
        ) : <div style={{ width: '24px' }} />}

        <h1 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, fontWeight: 700, margin: 0 }}>
          L'Élixir Agendamiento
        </h1>
        
        {step < 6 ? (
          <span style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 600, color: T.onSurfaceVariant }}>
            Paso {step}/5
          </span>
        ) : <div style={{ width: '24px' }} />}
      </header>

      {/* Progress Bar */}
      {step < 6 && (
        <div style={{ width: '100%', height: '4px', backgroundColor: T.surfaceContainerHigh }}>
          <div style={{ 
            width: `${(step / 5) * 100}%`, height: '100%', 
            backgroundColor: T.primary, transition: 'width 0.4s ease-in-out' 
          }} />
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        
        {/* STEP 1: EMBLEADAS */}
        {step === 1 && (
          <div className="fade-in">
            <h2 style={{ fontFamily: T.fontBody, fontSize: '22px', fontWeight: 700, color: T.onSurface, marginBottom: '24px', textAlign: 'center' }}>
              ¿Con quién deseas atenderte?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {employees.length === 0 ? (
                <p style={{ textAlign: 'center', color: T.onSurfaceVariant, fontFamily: T.fontBody }}>No hay empleadas activas en este momento.</p>
              ) : employees.map(emp => (
                <button
                  key={emp._id}
                  onClick={() => handleSelectEmployee(emp)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                    backgroundColor: '#fff', border: `1px solid ${T.outlineVariant}`, borderRadius: '16px',
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.outlineVariant; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {emp.foto ? (
                    <img src={emp.foto} alt={emp.nombre} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div className="bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-xs" style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>Sin imagen</div>
                  )}
                  <div>
                    <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '18px', color: T.onSurface, margin: '0 0 4px' }}>{emp.nombre}</h3>
                    <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant, margin: 0 }}>
                      {emp.especialidades.join(', ')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: SERVICIOS */}
        {step === 2 && (
          <div className="fade-in">
             <h2 style={{ fontFamily: T.fontBody, fontSize: '22px', fontWeight: 700, color: T.onSurface, marginBottom: '24px', textAlign: 'center' }}>
              Selecciona tu servicio
            </h2>
            {loadingServices ? (
               <p style={{ textAlign: 'center', fontFamily: T.fontBody, color: T.onSurfaceVariant }}>Cargando servicios de {selectedEmployeeName}...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {services.length === 0 && (
                  <p style={{ textAlign: 'center', color: T.onSurfaceVariant, fontFamily: T.fontBody }}>Esta especialista no tiene servicios asignados.</p>
                )}
                {services.map(svc => (
                  <button
                    key={svc._id}
                    onClick={() => handleSelectService(svc)}
                    style={{
                      display: 'flex', gap: '20px', padding: '16px',
                      backgroundColor: '#fff', border: `1px solid ${T.outlineVariant}`, borderRadius: '16px',
                      cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', alignItems: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.outlineVariant; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {svc.imagen ? (
                      <img src={svc.imagen} alt={svc.nombre} style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div className="bg-gray-200 text-gray-500 rounded-xl flex items-center justify-center text-xs" style={{ width: '90px', height: '90px', borderRadius: '12px', backgroundColor: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>Sin imagen</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '18px', color: T.onSurface, margin: '0 0 6px' }}>{svc.nombre}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: T.fontBody, fontSize: '16px', fontWeight: 800, color: T.primary }}>{renderPriceInfo(svc.precioTipo || 'fijo', svc.precio, svc.precioDesde, svc.precioHasta)}</span>
                        <span style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 600, color: T.onSurfaceVariant, backgroundColor: T.surfaceContainer, padding: '4px 10px', borderRadius: '8px' }}>
                          ⏱ {svc.duracion} min
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: FECHA */}
        {step === 3 && (
          <div className="fade-in">
             <h2 style={{ fontFamily: T.fontBody, fontSize: '22px', fontWeight: 700, color: T.onSurface, marginBottom: '24px', textAlign: 'center' }}>
              ¿Qué día te gustaría venir?
            </h2>
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
               <Calendar 
                 onSelect={handleSelectDate} 
                 maxDaysInAdvance={settings?.maxDaysInAdvance || 30} 
               />
            </div>
          </div>
        )}

        {/* STEP 4: HORA */}
        {step === 4 && (
          <div className="fade-in">
            <h2 style={{ fontFamily: T.fontBody, fontSize: '22px', fontWeight: 700, color: T.onSurface, marginBottom: '12px', textAlign: 'center' }}>
              ¿A qué hora?
            </h2>
            <p style={{ textAlign: 'center', fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, marginBottom: '32px' }}>
              Mostrando disponibilidad de <b>{selectedEmployeeName}</b> el {formatFancyDate(date)}
            </p>

            {loadingSlots ? (
              <p style={{ textAlign: 'center', fontFamily: T.fontBody, color: T.onSurfaceVariant }}>Buscando espacios libres...</p>
            ) : availableSlots.length === 0 ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.error, marginBottom: '24px' }}>
                  {blockMessage ? `Este día no está disponible: ${blockMessage}` : 'No hay horarios disponibles para este día, por favor selecciona otra fecha.'}
                </p>
                <button 
                  onClick={() => setStep(3)}
                  style={{
                    backgroundColor: T.primaryContainer, color: '#fff',
                    padding: '12px 24px', borderRadius: '9999px', border: 'none',
                    fontFamily: T.fontBody, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Cambiar Fecha
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
                {availableSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => handleSelectTime(time)}
                    style={{
                      padding: '16px', backgroundColor: T.surfaceContainerLowest, border: `1px solid ${T.outlineVariant}`,
                      borderRadius: '12px', cursor: 'pointer', fontFamily: T.fontBody, fontSize: '15px', fontWeight: 600,
                      color: T.onSurface, transition: 'all 0.2s', textAlign: 'center'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.primaryContainer; e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.surfaceContainerLowest; e.currentTarget.style.borderColor = T.outlineVariant; e.currentTarget.style.color = T.onSurface; }}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 5: INFO CLIENTE */}
        {step === 5 && (
          <div className="fade-in">
            <h2 style={{ fontFamily: T.fontBody, fontSize: '22px', fontWeight: 700, color: T.onSurface, marginBottom: '8px', textAlign: 'center' }}>
              Tus Datos Mágicos
            </h2>
            <p style={{ textAlign: 'center', fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, marginBottom: '32px' }}>
              Ya casi terminamos. Completa tus datos para reservar.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, color: T.onSurface, marginBottom: '8px' }}>
                  Nombre Completo *
                </label>
                <input 
                  type="text" 
                  required 
                  minLength={3}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. María Pérez"
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '15px', outlineColor: T.primary, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, color: T.onSurface, marginBottom: '8px' }}>
                  Teléfono Celular *
                </label>
                <input 
                  type="tel" 
                  required 
                  pattern="3[0-9]{9}"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="300XXXXXXX (10 dígitos)"
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '15px', outlineColor: T.primary, boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '11px', color: T.onSurfaceVariant, marginTop: '4px', display: 'block' }}>Formato válido para Colombia (Ej: 3101234567)</span>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, color: T.onSurface, marginBottom: '8px' }}>
                  Correo Electrónico (Opcional)
                </label>
                <input 
                  type="email" 
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="maria@ejemplo.com"
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '15px', outlineColor: T.primary, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ backgroundColor: T.surfaceContainerLow, padding: '20px', borderRadius: '16px', display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
                <img src={selectedEmployeeImage} alt={selectedEmployeeName} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                   <p style={{ margin: 0, fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>Resumen de cita:</p>
                   <p style={{ margin: '4px 0 0', fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '16px', color: T.onSurface, fontWeight: 700 }}>
                     {selectedServiceName}
                   </p>
                   <p style={{ margin: '2px 0 0', fontFamily: T.fontBody, fontSize: '13px', color: T.primary, fontWeight: 700 }}>
                     {formatFancyDate(date)} a las {timeSlot}
                   </p>
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting || clientName.length < 3 || !/^3[0-9]{9}$/.test(clientPhone)}
                style={{
                  width: '100%', padding: '18px', borderRadius: '9999px', border: 'none',
                  backgroundColor: T.primary, color: '#fff', fontSize: '16px', fontWeight: 700,
                  fontFamily: T.fontBody, cursor: 'pointer', transition: 'all 0.2s', marginTop: '16px',
                  boxShadow: '0 8px 24px rgba(148,69,85,0.3)', opacity: (clientName.length < 3 || !/^3[0-9]{9}$/.test(clientPhone) || submitting) ? 0.6 : 1
                }}
              >
                {submitting ? 'Creando cita...' : 'Confirmar Cita'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 6: DONE */}
        {step === 6 && (
          <div className="fade-in" style={{ textAlign: 'center', paddingTop: '32px' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 24px' }}>
              ✨
            </div>
            <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '32px', color: T.primary, marginBottom: '16px' }}>
              ¡Tu cita fue agendada exitosamente, {clientName.split(' ')[0]}!
            </h2>
            <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant, marginBottom: '40px' }}>
              La confirmaremos en los próximos minutos. Recibirás una notificación cuando esté confirmada.
            </p>

            <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '24px', boxShadow: '0 12px 32px rgba(0,0,0,0.06)', textAlign: 'left', marginBottom: '40px' }}>
               <h3 style={{ fontFamily: T.fontBody, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, marginBottom: '16px' }}>Detalles de la Cita</h3>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <img src={selectedEmployeeImage} alt="Staff" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <span style={{ display: 'block', fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>Profesional</span>
                    <span style={{ fontFamily: T.fontBody, fontSize: '16px', fontWeight: 700, color: T.onSurface }}>{selectedEmployeeName}</span>
                  </div>
               </div>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                 <div>
                    <span style={{ display: 'block', fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>Servicio</span>
                    <span style={{ display: 'block', fontFamily: T.fontBody, fontSize: '15px', fontWeight: 700, color: T.onSurface }}>{selectedServiceName}</span>
                    <span style={{ display: 'block', fontFamily: T.fontBody, fontSize: '14px', fontWeight: 600, color: T.primary }}>{renderPriceInfo(selectedServicePrecioTipo, selectedServicePrice, selectedServicePrecioDesde, selectedServicePrecioHasta)}</span>
                 </div>
                 <div>
                    <span style={{ display: 'block', fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>Horario</span>
                    <span style={{ display: 'block', fontFamily: T.fontBody, fontSize: '15px', fontWeight: 700, color: T.onSurface, textTransform: 'capitalize' }}>{formatFancyDate(date)}</span>
                    <span style={{ display: 'block', fontFamily: T.fontBody, fontSize: '15px', fontWeight: 600, color: T.onSurface }}>{timeSlot} ({selectedServiceDuration} min)</span>
                 </div>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <a 
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Cita+Salon+L'Elixir+-+${encodeURIComponent(selectedServiceName)}&dates=${formatGoogleCalendarDate(date, timeSlot, selectedServiceDuration)}&details=Cita+para+${encodeURIComponent(clientName)}+con+la+profesional+${encodeURIComponent(selectedEmployeeName)}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                  padding: '16px', borderRadius: '9999px', backgroundColor: T.surfaceContainerLowest,
                  color: T.onSurface, border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody,
                  fontSize: '15px', fontWeight: 700, textDecoration: 'none', transition: 'background 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.surfaceContainer)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = T.surfaceContainerLowest)}
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" style={{ width: '24px', height: '24px' }} />
                Añadir a Google Calendar
              </a>

              <button
                onClick={() => window.location.href = '/'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '16px', borderRadius: '9999px', backgroundColor: T.primary,
                  color: '#fff', border: 'none', fontFamily: T.fontBody,
                  fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Volver al inicio
              </button>

              <button 
                onClick={restartWizard}
                style={{ 
                  background: 'none', border: 'none', fontFamily: T.fontBody, 
                  fontSize: '14px', fontWeight: 600, color: T.primary, cursor: 'pointer', padding: '16px' 
                }}
              >
                Agendar otra cita
              </button>
            </div>
          </div>
        )}

      </main>

      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── CUSTOM VISUAL CALENDAR ────────────────────────────────────────────────────────

function Calendar({ onSelect, maxDaysInAdvance }: { onSelect: (dateISO: string) => void, maxDaysInAdvance: number }) {
  const today = new Date();
  today.setHours(0,0,0,0);

  const [baseDate, setBaseDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDaysInAdvance);

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  // Convert JS day (Sun=0) to Mon=1, Sun=7 logic for array padding
  const paddingDays = firstDay === 0 ? 6 : firstDay - 1; 

  const daysArr = Array(paddingDays).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    daysArr.push(new Date(year, month, d));
  }

  const toISOLocal = (dateObj: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
  };

  const navMonth = (offset: number) => {
    setBaseDate(new Date(year, month + offset, 1));
  };

  const monthName = baseDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: T.onSurfaceVariant, padding: '8px' }}>
           ‹
        </button>
        <span style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '18px', color: T.onSurface, textTransform: 'capitalize' }}>
           {monthName}
        </span>
        <button onClick={() => navMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: T.onSurfaceVariant, padding: '8px' }}>
           ›
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(dw => (
          <div key={dw} style={{ textAlign: 'center', fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700, color: T.onSurfaceVariant, marginBottom: '8px' }}>
            {dw}
          </div>
        ))}
        
        {daysArr.map((d, i) => {
          if (!d) return <div key={i} />;
          const hoyBogota = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
          const dStr = toISOLocal(d);
          const isPast = dStr < hoyBogota;
          const isTooFar = d.getTime() > maxDate.getTime();
          const disabled = isPast || isTooFar;
          const isToday = dStr === hoyBogota;

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onSelect(toISOLocal(d))}
              style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', border: 'none', background: 'none',
                fontFamily: T.fontBody, fontSize: '14px', fontWeight: isToday ? 800 : 500,
                color: disabled ? `${T.onSurfaceVariant}40` : (isToday ? T.primary : T.onSurface),
                cursor: disabled ? 'default' : 'pointer',
                transition: 'all 0.2s', position: 'relative'
              }}
              onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.backgroundColor = T.primaryContainer; e.currentTarget.style.color = T.primary; } }}
              onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = isToday ? T.primary : T.onSurface; } }}
            >
              {d.getDate()}
              {isToday && <div style={{ position: 'absolute', bottom: '2px', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: T.primary }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
