import { useState, useEffect, useCallback } from 'react';
import { T } from '../lib/adminTokens';
import { appointmentService } from '../services/api';
import FlexibleConfirmationModal from './FlexibleConfirmationModal';

interface Props {
  onMutation?: () => void;
}

export default function FlexibleRequestsTray({ onMutation }: Props) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      // Fetcheamos todas las pendientes y filtramos en cliente para asegurar isFlexible
      const res = await appointmentService.getAll({ status: 'pending' });
      if (res.success) {
        const flexOnly = (res.data as any[]).filter(a => a.isFlexible);
        setRequests(flexOnly);
      }
    } catch (err) {
      console.error('Error fetching flexible requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 60000); // Polling cada minuto
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleOpenModal = (req: any) => {
    setSelectedRequest({
      id: req._id,
      client: req.clientName,
      clientPhone: req.clientPhone,
      service: req.service?.nombre || 'Servicio',
      serviceId: req.service?._id || req.service,
      specialistId: req.employee?._id || req.employee,
      flexibleAvailabilities: req.flexibleAvailabilities
    });
    setShowModal(true);
  };

  const handleSuccess = () => {
    fetchRequests();
    if (onMutation) onMutation();
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        style={{ position: 'fixed', right: 0, top: '100px', backgroundColor: T.primary, color: '#fff', border: 'none', padding: '12px', borderRadius: '12px 0 0 12px', cursor: 'pointer', boxShadow: '-4px 0 12px rgba(0,0,0,0.1)', zIndex: 900, display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        ✨ <span style={{ fontSize: '12px', fontWeight: 700 }}>Solicitudes ({requests.length})</span>
      </button>
    );
  }

  return (
    <>
      <aside style={{ 
        width: '320px', 
        backgroundColor: T.surface, 
        borderLeft: `1px solid ${T.outlineVariant}`, 
        height: 'calc(100vh - 64px)', 
        position: 'sticky', 
        top: '64px', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.02)',
        zIndex: 100
      }}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${T.outlineVariant}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.primary, margin: 0 }}>
              ✨ Solicitudes
            </h3>
            <p style={{ margin: 0, fontSize: '11px', color: T.onSurfaceVariant, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Horario Flexible
            </p>
          </div>
          <button onClick={() => setIsVisible(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: T.onSurfaceVariant }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {loading && requests.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '13px', color: T.onSurfaceVariant, marginTop: '20px' }}>Cargando solicitudes...</p>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '40px', padding: '0 20px' }}>
              <span style={{ fontSize: '32px' }}>💎</span>
              <p style={{ fontSize: '13px', color: T.onSurfaceVariant, marginTop: '12px', fontStyle: 'italic' }}>No hay solicitudes flexibles pendientes.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requests.map(req => (
                <div 
                  key={req._id}
                  onClick={() => handleOpenModal(req)}
                  style={{ 
                    backgroundColor: '#fff', 
                    padding: '16px', 
                    borderRadius: '16px', 
                    border: `1px solid ${T.outlineVariant}`, 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = T.primary;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = T.outlineVariant;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', backgroundColor: T.primary }} />
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700 }}>{req.clientName}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: T.primary, fontWeight: 600 }}>{req.service?.nombre}</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: T.onSurfaceVariant }}>
                    📅 {req.flexibleAvailabilities?.length || 0} opciones propuestas
                  </p>
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', backgroundColor: T.primary + '15', color: T.primary, fontWeight: 800, textTransform: 'uppercase' }}>
                      Agendar
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      <FlexibleConfirmationModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        appointment={selectedRequest}
        onSuccess={handleSuccess}
      />
    </>
  );
}
