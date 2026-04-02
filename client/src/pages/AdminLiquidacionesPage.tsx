import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { settlementService, employeeService } from '../services/api';
import type { Employee } from '../types';

interface GlobalStats {
  totalSettlements: number;
  totalPaidOut: number;
  salonNetRevenue: number;
}

interface PendingData {
  appointments: any[];
  totalRevenue: number;
  commissionPercentage: number;
  totalCommission: number;
}

export default function AdminLiquidacionesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [pendingData, setPendingData] = useState<PendingData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLiquidating, setIsLiquidating] = useState(false);

  useEffect(() => {
    employeeService.getAll().then(res => {
      if (res.success) setEmployees(res.data || []);
    });
    fetchGlobalStats();
  }, []);

  useEffect(() => {
    if (selectedEmpId) {
      fetchSpecialistData(selectedEmpId);
    } else {
      setPendingData(null);
      setHistory([]);
    }
  }, [selectedEmpId]);

  const fetchGlobalStats = async () => {
    try {
      const res = await settlementService.getStats();
      if (res.success) setGlobalStats(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchSpecialistData = async (id: string) => {
    setLoading(true);
    try {
      const [pending, hist] = await Promise.all([
        settlementService.getPending(id),
        settlementService.getHistory(id)
      ]);
      if (pending.success) setPendingData(pending.data);
      if (hist.success) setHistory(hist.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreateSettlement = async () => {
    if (!pendingData || pendingData.appointments.length === 0) return;
    if (!confirm(`¿Confirmas la liquidación por $${pendingData.totalCommission.toLocaleString()}?`)) return;

    setIsLiquidating(true);
    try {
      await settlementService.create({
        specialistId: selectedEmpId,
        appointmentIds: pendingData.appointments.map(a => a._id),
        totalRevenue: pendingData.totalRevenue,
        commissionPercentage: pendingData.commissionPercentage,
        totalCommission: pendingData.totalCommission,
        dateRange: {
          from: pendingData.appointments[pendingData.appointments.length - 1].date,
          to: pendingData.appointments[0].date
        },
        notes: `Liquidación generada el ${new Date().toLocaleDateString()}`
      });
      fetchSpecialistData(selectedEmpId);
      fetchGlobalStats();
    } catch (e: any) {
      alert(e.message || 'Error al liquidar');
    }
    setIsLiquidating(false);
  };

  return (
    <AdminLayout>
      <div style={{ padding: '40px 48px 80px' }}>
        
        {/* Header & Global Stats */}
        <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <h1 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '42px', color: T.onSurface, margin: 0 }}>
              Liquidaciones y Comisiones
            </h1>
            <p style={{ fontFamily: T.fontBody, fontSize: '16px', color: T.onSurfaceVariant, marginTop: '8px' }}>
              Gestión contable de las ganancias de especialistas y el salón.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
             <div style={{ backgroundColor: T.surfaceContainerLowest, padding: '16px 24px', borderRadius: '20px', border: `1px solid ${T.surfaceContainerLow}`, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <p style={{ fontSize: '10px', fontWeight: 800, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Pagado a Staff</p>
                <p style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, margin: 0 }}>
                  ${(globalStats?.totalPaidOut || 0).toLocaleString()}
                </p>
             </div>
             <div style={{ backgroundColor: T.surfaceContainerLowest, padding: '16px 24px', borderRadius: '20px', border: `1px solid ${T.surfaceContainerLow}`, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <p style={{ fontSize: '10px', fontWeight: 800, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Neto Salón</p>
                <p style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: '#1b5e20', margin: 0 }}>
                  ${(globalStats?.salonNetRevenue || 0).toLocaleString()}
                </p>
             </div>
          </div>
        </header>

        {/* Selection Area */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', alignItems: 'center' }}>
          <div style={{ flex: 1, maxWidth: '320px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.onSurfaceVariant, textTransform: 'uppercase', marginBottom: '8px' }}>Seleccionar Especialista</label>
            <select 
              value={selectedEmpId} 
              onChange={e => setSelectedEmpId(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${T.outlineVariant}`, backgroundColor: T.surfaceContainerLowest, fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface }}
            >
              <option value="">-- Elige una especialista --</option>
              {employees.filter(e => e.isActive).map(e => (
                <option key={e._id} value={e._id}>{e.nombre}</option>
              ))}
            </select>
          </div>
          {selectedEmpId && pendingData && (
             <div style={{ padding: '14px 24px', backgroundColor: T.primaryFixed, color: T.primary, borderRadius: '16px', marginTop: '24px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Comisión Configurada: {pendingData.commissionPercentage}%</span>
             </div>
          )}
        </div>

        {selectedEmpId ? (
          loading ? (
            <div style={{ textAlign: 'center', padding: '100px', color: T.onSurfaceVariant, fontFamily: T.fontBody }}>Analizando registros...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '32px' }}>
              
              {/* Left Column: Pending Table */}
              <div>
                <section style={{ backgroundColor: T.surfaceContainerLowest, borderRadius: '24px', border: `1px solid ${T.surfaceContainerLow}`, boxShadow: '0 8px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                  <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.surfaceContainerLow}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: T.onSurface, margin: 0 }}>Citas Pendientes de Liquidar</h3>
                    <span style={{ backgroundColor: T.onSurface + '10', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{pendingData?.appointments.length || 0} Sesiones</span>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: `${T.surfaceContainerLow}40` }}>
                          {['Fecha', 'Servicio', 'Precio Final', 'Acción'].map(h => (
                            <th key={h} style={{ padding: '16px 32px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, color: T.onSurfaceVariant }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pendingData?.appointments.map((a: any) => (
                          <tr key={a._id} style={{ borderTop: `1px solid ${T.surfaceContainerLow}` }}>
                            <td style={{ padding: '16px 32px', fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface }}>{new Date(a.date).toLocaleDateString('es-CO')}</td>
                            <td style={{ padding: '16px 32px', fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface }}>{a.serviceName || a.service?.nombre}</td>
                            <td style={{ padding: '16px 32px', fontFamily: T.fontBody, fontSize: '14px', fontWeight: 700, color: T.primary }}>${(a.finalPrice || a.priceSnapshot || 0).toLocaleString()}</td>
                            <td style={{ padding: '16px 32px' }}>
                               <span style={{ fontSize: '10px', color: T.onSurfaceVariant, opacity: 0.5 }}>✓ Completada</span>
                            </td>
                          </tr>
                        ))}
                        {(!pendingData || pendingData.appointments.length === 0) && (
                          <tr><td colSpan={4} style={{ padding: '48px', textAlign: 'center', opacity: 0.5, fontStyle: 'italic' }}>Todo al día. No hay citas pendientes por liquidar.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ padding: '32px', backgroundColor: `${T.primary}05`, borderTop: `1px solid ${T.surfaceContainerLow}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: T.onSurfaceVariant, textTransform: 'uppercase', marginBottom: '4px' }}>Total Generado (Bruto)</p>
                        <p style={{ fontSize: '28px', fontFamily: T.fontHeadline, fontStyle: 'italic', margin: 0, color: T.onSurface }}>${(pendingData?.totalRevenue || 0).toLocaleString()}</p>
                     </div>
                     <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: T.primary, textTransform: 'uppercase', marginBottom: '4px' }}>A Pagar (Comisión {pendingData?.commissionPercentage}%)</p>
                        <p style={{ fontSize: '32px', fontFamily: T.fontHeadline, fontStyle: 'italic', margin: 0, color: T.primary, fontWeight: 800 }}>${(pendingData?.totalCommission || 0).toLocaleString()}</p>
                     </div>
                  </div>
                  
                  {pendingData && pendingData.appointments.length > 0 && (
                    <div style={{ padding: '24px 32px', textAlign: 'center' }}>
                       <button 
                         onClick={handleCreateSettlement}
                         disabled={isLiquidating}
                         style={{ width: '100%', padding: '18px', backgroundColor: T.primary, color: 'white', border: 'none', borderRadius: '9999px', fontFamily: T.fontBody, fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: '0 8px 24px rgba(148,69,85,0.2)' }}
                       >
                         {isLiquidating ? 'PROCESANDO...' : 'GENERAR LIQUIDACIÓN Y MARCAR COMO PAGADO'}
                       </button>
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column: History */}
              <aside>
                <div style={{ position: 'sticky', top: '100px' }}>
                   <h4 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface, marginBottom: '20px' }}>Historial del Especialista</h4>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {history.map(h => (
                        <div key={h._id} style={{ backgroundColor: T.surfaceContainerLowest, padding: '16px', borderRadius: '16px', border: `1px solid ${T.surfaceContainerLow}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <div>
                              <p style={{ fontSize: '12px', fontWeight: 700, color: T.onSurface, margin: 0 }}>{new Date(h.createdAt).toLocaleDateString()}</p>
                              <p style={{ fontSize: '11px', color: T.onSurfaceVariant, margin: 0 }}>{h.appointments.length} citas liquidadas</p>
                           </div>
                           <p style={{ fontSize: '14px', fontWeight: 800, color: '#1b5e20' }}>+${h.totalCommission.toLocaleString()}</p>
                        </div>
                      ))}
                      {history.length === 0 && (
                        <p style={{ fontSize: '13px', color: T.onSurfaceVariant, opacity: 0.5, textAlign: 'center', padding: '20px' }}>No hay registros previos.</p>
                      )}
                   </div>
                </div>
              </aside>

            </div>
          )
        ) : (
          <div style={{ border: `2px dashed ${T.outlineVariant}50`, borderRadius: '32px', padding: '100px', textAlign: 'center', backgroundColor: `${T.surfaceContainerLow}20` }}>
             <p style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.onSurfaceVariant }}>Selecciona una especialista para ver su estado financiero</p>
             <p style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, opacity: 0.7 }}>Podrás liquidar citas, ver comisiones y el historial de pagos.</p>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
