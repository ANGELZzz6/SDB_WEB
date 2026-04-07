import { useState, useEffect, useMemo } from 'react';
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
  if (!dateStr || !timeStr) return ''; // Defensive check for flexible flow
  try {
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
  } catch (e) {
    return '';
  }
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
  const [step, setStep] = useState(0); // Start at flow selection
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
  
  // --- Flexible Flow States ---
  const [flowType, setFlowType] = useState<'standard' | 'flexible'>('standard');
  const [selectedFlexDates, setSelectedFlexDates] = useState<string[]>([]);
  const [flexibleAvailabilities, setFlexibleAvailabilities] = useState<any[]>([]);

  // Cart States
  const [cart, setCart] = useState<any[]>([]);
  
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
    setServiceId(''); setDate(''); // Reset downstream
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
    setDate('');
    setStep(3);
  };

  const handleSelectDate = (d: string) => {
    setDate(d);
    setStep(4);
  };

  const handleSelectFlexDates = (dates: string[]) => {
    setSelectedFlexDates(dates);
    // Inicializar flexibleAvailabilities
    const initial = dates.map(d => ({
      date: d,
      isFullDay: true,
      startTime: '08:00',
      endTime: '18:00'
    }));
    setFlexibleAvailabilities(initial);
  };

  const toggleFullDay = (index: number) => {
    const updated = [...flexibleAvailabilities];
    updated[index].isFullDay = !updated[index].isFullDay;
    setFlexibleAvailabilities(updated);
  };

  const updateFlexTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...flexibleAvailabilities];
    updated[index][field] = value;
    setFlexibleAvailabilities(updated);
  };

  const handleSelectTime = (t: string) => {
    // Check for intra-cart overlap
    const startMin = timeToMinutes(t);
    const endMin = startMin + selectedServiceDuration;
    
    const overlap = cart.find(item => {
      if (item.date !== date) return false;
      const iStart = timeToMinutes(item.timeSlot);
      const iEnd = iStart + item.duration;
      return (startMin < iEnd && endMin > iStart);
    });

    if (overlap) {
      alert(`Este horario se cruza con tu servicio de "${overlap.serviceName}". Por favor selecciona otra hora.`);
      return;
    }

    // Add to cart
    const newItem = {
      employee: employeeId,
      employeeName: selectedEmployeeName,
      employeeImage: selectedEmployeeImage,
      service: serviceId,
      serviceName: selectedServiceName,
      price: selectedServicePrice,
      precioTipo: selectedServicePrecioTipo,
      precioDesde: selectedServicePrecioDesde,
      precioHasta: selectedServicePrecioHasta,
      duration: selectedServiceDuration,
      date,
      timeSlot: t
    };

    setCart([...cart, newItem]);
    setStep(4.5);
  };

  const handleAddFlexToCart = () => {
    setSubmitting(true); // Immediate visual feedback
    setTimeout(() => {
      const newItem = {
        employee: employeeId,
        employeeName: selectedEmployeeName,
        employeeImage: selectedEmployeeImage,
        service: serviceId,
        serviceName: selectedServiceName,
        price: selectedServicePrice,
        precioTipo: selectedServicePrecioTipo,
        precioDesde: selectedServicePrecioDesde,
        precioHasta: selectedServicePrecioHasta,
        duration: selectedServiceDuration,
        isFlexible: true
      };
      setCart([...cart, newItem]);
      setStep(4.5);
      setSubmitting(false);
    }, 10); // Yield to main thread for a frame
  };

  const handleRemoveFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    if (newCart.length === 0) setStep(1);
  };

  const timeToMinutes = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await appointmentService.createBulk({
        clientName,
        clientPhone,
        clientEmail,
        appointments: cart.map(item => ({
          employee: item.employee,
          service: item.service,
          date: item.date,
          timeSlot: item.timeSlot,
          serviceName: item.serviceName // For error messages
        })),
        isFlexible: flowType === 'flexible',
        flexibleAvailabilities: flowType === 'flexible' ? flexibleAvailabilities : []
      });
      if (res.success) {
        setStep(6);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('429')) {
        alert('Has alcanzado el límite de citas permitidas (4 cada 30 min).');
      } else {
        alert(err.message || 'Error al agendar. Es posible que el horario ya esté ocupado.');
      }
      setStep(4.5); // Regresar al carrito para ajustar
    } finally {
      setSubmitting(false);
    }
  };

  const restartWizard = () => {
    setStep(1);
    setCart([]);
    setEmployeeId(''); setServiceId(''); setDate('');
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
            Paso {step === 4.5 ? '4.5' : (step > 4 ? step - 0.5 : step)}/5.5
          </span>
        ) : <div style={{ width: '24px' }} />}
      </header>

      {/* Progress Bar */}
      {step < 6 && (
        <div style={{ width: '100%', height: '4px', backgroundColor: T.surfaceContainerHigh }}>
          <div style={{ 
            width: `${((step > 4 ? step - 0.5 : step) / 5.5) * 100}%`, height: '100%', 
            backgroundColor: T.primary, transition: 'width 0.4s ease-in-out' 
          }} />
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        
        {/* STEP 0: FLUJO SELECTION */}
        {step === 0 && (
          <div className="fade-in">
            <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '28px', color: T.primary, marginBottom: '12px', textAlign: 'center' }}>
              ¡Hola! ✨
            </h2>
            <p style={{ textAlign: 'center', fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant, marginBottom: '32px' }}>
              ¿Cómo prefieres agendar tu cita hoy?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <button
                onClick={() => { setFlowType('standard'); setStep(1); }}
                style={{
                  padding: '24px', backgroundColor: '#fff', border: `1px solid ${T.outlineVariant}`,
                  borderRadius: '20px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.outlineVariant; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>📅</span>
                  <h3 style={{ margin: 0, fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface }}>Horario Específico</h3>
                </div>
                <p style={{ margin: 0, fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>
                  Elige un día y hora exacta en el calendario. Ideal si ya sabes cuándo venir.
                </p>
              </button>

              <button
                onClick={() => { setFlowType('flexible'); setStep(1); }}
                style={{
                  padding: '24px', backgroundColor: '#fff', border: `1px solid ${T.outlineVariant}`,
                  borderRadius: '20px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.outlineVariant; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>✨</span>
                  <h3 style={{ margin: 0, fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface }}>Disponibilidad Flexible</h3>
                </div>
                <p style={{ margin: 0, fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>
                  Dinos qué días podrías venir y nosotros te asignamos el mejor espacio. ¡Sin complicaciones!
                </p>
              </button>
            </div>
          </div>
        )}

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
                    onClick={() => {
                      if (cart.find(item => item.service === svc._id)) {
                        alert('Ya has seleccionado este servicio en tu carrito.');
                        return;
                      }
                      handleSelectService(svc);
                    }}
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

        {/* STEP 3: FECHA (Standard vs Flexible) */}
        {step === 3 && (
          <div className="fade-in">
             <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, marginBottom: '8px', textAlign: 'center' }}>
              {flowType === 'flexible' ? '¿Qué días estás disponible?' : '¿Qué día quieres venir?'}
            </h2>
            <p style={{ textAlign: 'center', fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, marginBottom: '24px' }}>
              {flowType === 'flexible' ? 'Puedes seleccionar varios días' : 'Selecciona una fecha en el calendario'}
            </p>
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
              {flowType === 'flexible' ? (
                <div>
                  <MultiCalendar 
                    selectedDates={selectedFlexDates}
                    onToggleDate={(d) => {
                      const newDates = selectedFlexDates.includes(d) 
                        ? selectedFlexDates.filter(x => x !== d)
                        : [...selectedFlexDates, d];
                      handleSelectFlexDates(newDates);
                    }}
                    maxDaysInAdvance={settings?.maxDaysInAdvance || 30}
                  />
                  <div style={{ marginTop: '24px' }}>
                    <button
                      disabled={selectedFlexDates.length === 0}
                      onClick={() => setStep(4)}
                      style={{
                        width: '100%', padding: '16px', borderRadius: '9999px', border: 'none',
                        backgroundColor: T.primary, color: '#fff', fontFamily: T.fontBody, fontWeight: 700,
                        cursor: 'pointer', opacity: selectedFlexDates.length === 0 ? 0.5 : 1
                      }}
                    >
                      Continuar ({selectedFlexDates.length} días)
                    </button>
                  </div>
                </div>
              ) : (
                <Calendar 
                  onSelect={handleSelectDate} 
                  maxDaysInAdvance={settings?.maxDaysInAdvance || 30} 
                />
              )}
            </div>
          </div>
        )}

        {/* STEP 4: HORA (Standard) vs AJUSTE (Flexible) */}
        {step === 4 && flowType === 'standard' && (
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

        {/* STEP 4: AJUSTE FLEXIBLE */}
        {step === 4 && flowType === 'flexible' && (
          <div className="fade-in">
            <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, marginBottom: '8px', textAlign: 'center' }}>
              Ajusta tus horarios
            </h2>
            <p style={{ textAlign: 'center', fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, marginBottom: '32px' }}>
              Dinos en qué rango horario podrías venir cada día.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {flexibleAvailabilities.map((item, idx) => (
                <div key={idx} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', border: `1px solid ${T.outlineVariant}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '18px', color: T.onSurface }}>
                      {formatFancyDate(item.date)}
                    </span>
                    <button
                      onClick={() => toggleFullDay(idx)}
                      style={{
                        padding: '6px 14px', borderRadius: '9999px', border: 'none',
                        backgroundColor: item.isFullDay ? T.primaryFixed : T.surfaceContainerHigh,
                        color: item.isFullDay ? T.primary : T.onSurfaceVariant,
                        fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {item.isFullDay ? 'Todo el día' : 'Rango específico'}
                    </button>
                  </div>

                  {!item.isFullDay && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: T.onSurfaceVariant, marginBottom: '4px' }}>Desde</label>
                        <select 
                          value={item.startTime}
                          onChange={(e) => updateFlexTime(idx, 'startTime', e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody }}
                        >
                          {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: T.onSurfaceVariant, marginBottom: '4px' }}>Hasta</label>
                        <select 
                          value={item.endTime}
                          onChange={(e) => updateFlexTime(idx, 'endTime', e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody }}
                        >
                          {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
               onClick={handleAddFlexToCart}
               disabled={submitting}
               style={{
                 width: '100%', padding: '18px', borderRadius: '9999px', border: 'none',
                 backgroundColor: T.primary, color: '#fff', fontFamily: T.fontBody, fontWeight: 700,
                 cursor: 'pointer', marginTop: '32px', boxShadow: '0 8px 16px rgba(148,69,85,0.2)',
                 opacity: submitting ? 0.7 : 1
               }}
            >
              {submitting ? 'Procesando...' : 'Confirmar estos horarios'}
            </button>
          </div>
        )}

        {/* STEP 4.5: CARRITO / RESUMEN */}
        {step === 4.5 && (
          <div className="fade-in">
            <h2 style={{ fontFamily: T.fontBody, fontSize: '22px', fontWeight: 700, color: T.onSurface, marginBottom: '8px', textAlign: 'center' }}>
              Tu Selección
            </h2>
            <p style={{ textAlign: 'center', fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, marginBottom: '24px' }}>
              Puedes añadir hasta 3 servicios por sesión.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {cart.map((item, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    backgroundColor: '#fff', padding: '16px', borderRadius: '16px', 
                    border: `1px solid ${T.outlineVariant}`, display: 'flex', alignItems: 'center', gap: '16px',
                    position: 'relative'
                  }}
                >
                  {item.employeeImage ? (
                    <img src={item.employeeImage} alt={item.employeeName} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: T.surfaceContainerHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: T.onSurfaceVariant }}>
                      {item.employeeName?.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '15px', color: T.onSurface }}>{item.serviceName}</h4>
                    <p style={{ margin: '2px 0 0', fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>
                      con <b>{item.employeeName}</b>
                    </p>
                    <p style={{ margin: '4px 0 0', fontFamily: T.fontBody, fontSize: '12px', color: T.primary, fontWeight: 700 }}>
                      {item.isFlexible ? (
                        <span>✨ Horario Flexible ({flexibleAvailabilities.length} días)</span>
                      ) : (
                        <span>{formatFancyDate(item.date)} @ {item.timeSlot}</span>
                      )}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleRemoveFromCart(idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: T.error, padding: '8px' }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cart.length < 3 && (
                <button 
                  onClick={() => setStep(1)}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '9999px',
                    backgroundColor: T.surfaceContainerHigh, color: T.onSurface,
                    fontFamily: T.fontBody, fontWeight: 700, border: 'none', cursor: 'pointer'
                  }}
                >
                  + Añadir otro servicio
                </button>
              )}
              
              <button 
                onClick={() => setStep(5)}
                style={{
                  width: '100%', padding: '18px', borderRadius: '9999px',
                  backgroundColor: T.primary, color: '#fff',
                  fontFamily: T.fontBody, fontWeight: 700, border: 'none', cursor: 'pointer',
                  boxShadow: '0 8px 16px rgba(148,69,85,0.2)'
                }}
              >
                Confirmar y continuar
              </button>

              <p style={{ textAlign: 'center', fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant }}>
                Tiempo estimado total: {cart.reduce((acc, curr) => acc + curr.duration, 0)} min
              </p>
            </div>
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

              <div style={{ backgroundColor: T.surfaceContainerLow, padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <p style={{ margin: 0, fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant, fontWeight: 700 }}>Resumen de tu sesión:</p>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < cart.length-1 ? `1px solid ${T.outlineVariant}` : 'none', paddingBottom: idx < cart.length-1 ? '8px' : 0 }}>
                    <div>
                      <p style={{ margin: 0, fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '14px', color: T.onSurface }}>{item.serviceName}</p>
                      <p style={{ margin: 0, fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant }}>
                        {item.employeeName} - {item.isFlexible ? 'Horario Flexible' : item.timeSlot}
                      </p>
                    </div>
                    <span style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, color: T.primary }}>
                      {renderPriceInfo(item.precioTipo, item.price, item.precioDesde, item.precioHasta)}
                    </span>
                  </div>
                ))}
                <div style={{ borderTop: `2px solid ${T.outlineVariant}`, paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ fontFamily: T.fontBody, fontSize: '14px', fontWeight: 800 }}>Total Servicios:</span>
                   <span style={{ fontFamily: T.fontBody, fontSize: '14px', fontWeight: 800 }}>{cart.length}</span>
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
            <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '28px', color: T.primary, marginBottom: '16px' }}>
              ¡Solicitud recibida, {clientName.split(' ')[0]}! ✨
            </h2>
            <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant, marginBottom: '40px' }}>
              Tu reserva está <b>PENDIENTE DE CONFIRMACIÓN</b>. Nuestro equipo validará el espacio y te enviaremos una notificación por WhatsApp en breve con la respuesta final.
            </p>

             <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '24px', boxShadow: '0 12px 32px rgba(0,0,0,0.06)', textAlign: 'left', marginBottom: '40px' }}>
                <h3 style={{ fontFamily: T.fontBody, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, marginBottom: '20px' }}>Tus Servicios Agendados</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '16px', borderBottom: idx < cart.length-1 ? `1px solid ${T.outlineVariant}` : 'none', paddingBottom: idx < cart.length-1 ? '16px' : 0 }}>
                  {item.employeeImage ? (
                    <img src={item.employeeImage} alt="Staff" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: T.surfaceContainerLow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: T.onSurfaceVariant }}>
                      {item.employeeName?.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontFamily: T.fontBody, fontSize: '14px', fontWeight: 700, color: T.onSurface }}>{item.serviceName}</span>
                        <span style={{ display: 'block', fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>con {item.employeeName}</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                          <span style={{ fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700, color: T.primary }}>
                            {item.isFlexible ? '✨ Solicitud Flexible' : `${formatFancyDate(item.date)} @ ${item.timeSlot}`}
                          </span>
                          <span style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant }}>{item.duration} min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(!flowType || flowType === 'standard') && !cart[0]?.isFlexible && (
                <a 
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Cita+Salon+L'Elixir&dates=${formatGoogleCalendarDate(cart[0]?.date || '', cart[0]?.timeSlot || '', cart[0]?.duration || 30)}&details=Reserva+multiple+en+Salon+L'Elixir`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    padding: '16px', borderRadius: '9999px', backgroundColor: T.surfaceContainerLowest,
                    color: T.onSurface, border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody,
                    fontSize: '15px', fontWeight: 700, textDecoration: 'none', transition: 'background 0.2s',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)', textAlign: 'center'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.surfaceContainer)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = T.surfaceContainerLowest)}
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" style={{ width: '24px', height: '24px' }} />
                  Añadir a Google Calendar
                </a>
              )}

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

// ─── CUSTOM VISUAL CALENDAR (MULTI) ──────────────────────────────────────────────────

function MultiCalendar({ selectedDates, onToggleDate, maxDaysInAdvance }: { selectedDates: string[], onToggleDate: (d: string) => void, maxDaysInAdvance: number }) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const [baseDate, setBaseDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDaysInAdvance);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const paddingDays = firstDay === 0 ? 6 : firstDay - 1; 

  const daysArr = useMemo(() => {
    const days = Array(paddingDays).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  }, [paddingDays, daysInMonth, year, month]);

  const toISOLocal = (dateObj: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
  };

  const monthName = baseDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setBaseDate(new Date(year, month - 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: T.onSurfaceVariant }}>‹</button>
        <span style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '18px', color: T.onSurface, textTransform: 'capitalize' }}>{monthName}</span>
        <button onClick={() => setBaseDate(new Date(year, month + 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: T.onSurfaceVariant }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(dw => (
          <div key={dw} style={{ textAlign: 'center', fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700, color: T.onSurfaceVariant, marginBottom: '8px' }}>{dw}</div>
        ))}
        {daysArr.map((d, i) => {
          if (!d) return <div key={i} />;
          const hoyBogota = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
          const dStr = toISOLocal(d);
          const isPast = dStr < hoyBogota;
          const isTooFar = d.getTime() > maxDate.getTime();
          const disabled = isPast || isTooFar;
          const isSelected = selectedDates.includes(dStr);

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onToggleDate(dStr)}
              style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', border: 'none',
                background: isSelected ? T.primary : 'none',
                fontFamily: T.fontBody, fontSize: '14px', fontWeight: isSelected ? 800 : 500,
                color: disabled ? `${T.onSurfaceVariant}40` : (isSelected ? '#fff' : T.onSurface),
                cursor: disabled ? 'default' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
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
