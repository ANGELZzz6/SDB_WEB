import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { clientService } from '../services/api';

interface ClientStats {
  totalVisits: number;
  lastVisit: string | null;
  totalSpent: number;
  averageTicket: number;
  isFrequent: boolean;
  isAtRisk: boolean;
  daysSinceLastVisit: number | null;
  clientTier: string;
  visitFrequency: number | null;
  favoriteService: string;
  nextSuggestedVisit: string | null;
}

interface AppointmentHistory {
  _id: string;
  date: string;
  serviceName: string;
  employeeName: string;
  status: string;
  price: number;
  isFinal: boolean;
}

interface ClientDetail {
  client: {
    phone: string;
    name: string;
    email: string;
    tier: string;
  };
  stats: ClientStats;
  appointments: AppointmentHistory[];
}

export default function AdminClientDetailPage() {
  const { phone } = useParams<{ phone: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!phone) return;
      try {
        setLoading(true);
        const res = await clientService.getOne(phone);
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (error) {
        console.error("Error fetching client detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [phone]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('es-CO', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string, text: string, label: string }> = {
      pending: { bg: '#fff9c4', text: '#fbc02d', label: 'Pendiente' },
      confirmed: { bg: '#e8f5e9', text: '#2e7d32', label: 'Confirmada' },
      completed: { bg: '#f3e5f5', text: '#7b1fa2', label: 'Completada' },
      cancelled: { bg: '#ffebee', text: '#c62828', label: 'Cancelada' }
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{ 
        padding: '4px 10px', 
        borderRadius: '20px', 
        backgroundColor: s.bg, 
        color: s.text, 
        fontSize: '10px', 
        fontWeight: 700, 
        textTransform: 'uppercase' 
      }}>
        {s.label}
      </span>
    );
  };

  const getTierBadge = (tier: string) => {
    const tiers: Record<string, { bg: string, text: string, icon: string }> = {
      'VIP': { bg: '#f3e5f5', text: '#7b1fa2', icon: '🟣' },
      'Medio': { bg: '#e3f2fd', text: '#1976d2', icon: '🔵' },
      'Básico': { bg: '#f5f5f5', text: '#616161', icon: '⚪' }
    };
    const t = tiers[tier] || tiers['Básico'];
    return (
      <span style={{ 
        padding: '6px 14px', borderRadius: '12px', backgroundColor: t.bg, 
        color: t.text, fontSize: '11px', fontWeight: 800, display: 'flex', 
        alignItems: 'center', gap: '6px', border: `1px solid ${t.text}20` 
      }}>
        {t.icon} CLIENTE {tier.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '100px', textAlign: 'center', color: T.onSurfaceVariant, fontFamily: T.fontBody }}>
          Analizando patrones de consumo del cliente...
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div style={{ padding: '100px', textAlign: 'center', color: T.error, fontFamily: T.fontBody }}>
          No se encontró el historial del cliente.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <style>{`
        @media (max-width: 768px) {
          .admin-client-detail-container { padding: 24px 16px 120px !important; }
          .admin-client-detail-header { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; }
          .admin-client-detail-header h2 { font-size: 32px !important; }
        }
      `}</style>
      <div className="admin-client-detail-container" style={{ padding: '40px 48px 80px' }}>
        {/* Navigation & Header */}
        <button 
          onClick={() => navigate('/admin/clientes')}
          style={{ 
            border: 'none', background: 'none', cursor: 'pointer', 
            fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700, 
            color: T.onSurfaceVariant, marginBottom: '24px', display: 'flex', 
            alignItems: 'center', gap: '8px' 
          }}
        >
          ← VOLVER A LA LISTA
        </button>

        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '42px', color: T.onSurface, margin: 0 }}>
                {data?.client?.name || 'Cliente'}
              </h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                {data?.client?.tier && getTierBadge(data.client.tier)}
                {data?.stats?.isFrequent && (
                  <span style={{ 
                    backgroundColor: '#fffbe6', color: '#856404', padding: '6px 12px', 
                    borderRadius: '12px', fontSize: '11px', fontWeight: 800, border: '1px solid #ffe58f'
                  }}>
                    ⭐ FRECUENTE
                  </span>
                )}
                {data?.stats?.isAtRisk && (
                  <span style={{ 
                    backgroundColor: '#fff2f0', color: '#ff4d4f', padding: '6px 14px', 
                    borderRadius: '12px', fontSize: '11px', fontWeight: 800, border: '1px solid #ffccc7',
                    animation: 'pulse 2s infinite'
                  }}>
                    ⚠️ EN RIESGO ({data.stats.daysSinceLastVisit} días sin venir)
                  </span>
                )}
              </div>
            </div>
            <p style={{ fontFamily: T.fontBody, fontSize: '16px', color: T.onSurfaceVariant, margin: 0 }}>
              📞 {data?.client?.phone} {data?.client?.email && ` | ✉ ${data.client.email}`}
            </p>
          </div>
          
          <div style={{ backgroundColor: T.surfaceContainerHigh, padding: '16px 24px', borderRadius: '16px', border: `1px dashed ${T.primary}40` }}>
             <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Próxima Visita Sugerida</p>
             <p style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface, margin: 0 }}>
               {(() => {
                 const v = data?.stats?.totalVisits || 0;
                 if (v === 0) return 'Sin visitas registradas';
                 if (v === 1) return 'Se necesitan 2+ para proyectar';
                 if (!data?.stats?.nextSuggestedVisit) return 'Sin patrón definido';
                 return formatDate(data.stats.nextSuggestedVisit);
               })()}
             </p>
             <p style={{ fontSize: '11px', color: T.onSurfaceVariant, marginTop: '4px', opacity: 0.7 }}>
               {(data?.stats?.totalVisits || 0) < 2 ? 'Basado en frecuencia histórica' : ''}
             </p>
          </div>
        </header>

        {/* Multi-Metric Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {[
            { label: 'Gasto Total', value: `$${(data?.stats?.totalSpent || 0).toLocaleString()}`, sub: 'Vida del cliente', icon: '💰', color: T.primary },
            { label: 'Ticket Promedio', value: `$${(data?.stats?.averageTicket || 0).toLocaleString()}`, sub: 'Por cada sesión', icon: '📊', color: T.onSurface },
            { label: 'Servicio Estrella', value: data?.stats?.favoriteService || 'Ninguno', sub: 'Mayor recurrencia', icon: '⭐', color: '#7b1fa2' },
            { label: 'Frecuencia Real', value: data?.stats?.visitFrequency ? `Cada ${data.stats.visitFrequency} días` : 'N/A', sub: 'Intervalo promedio', icon: '🔄', color: '#1976d2' }
          ].map((s, i) => (
            <div key={i} style={{ 
              backgroundColor: T.surfaceContainerLowest, padding: '24px', borderRadius: '16px', 
              boxShadow: '0 8px 30px rgba(0,0,0,0.03)', border: `1px solid ${T.surfaceContainerLow}`,
              transition: 'transform 0.2s'
            }}>
              <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{s.icon}</span> {s.label}
              </p>
              <p style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '26px', color: s.color, margin: 0, fontWeight: 700 }}>{s.value}</p>
              <p style={{ fontFamily: T.fontBody, fontSize: '11px', color: T.onSurfaceVariant, marginTop: '4px', opacity: 0.7 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* History Table */}
        <section style={{ backgroundColor: T.surfaceContainerLowest, borderRadius: '20px', boxShadow: '0 12px 40px rgba(0,0,0,0.05)', overflow: 'hidden', border: `1px solid ${T.surfaceContainerLow}` }}>
          <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.surfaceContainerLow}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: T.onSurface, margin: 0 }}>Historial Analítico de Servicios</h3>
            <span style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant }}>{data?.stats?.totalVisits || 0} registros válidos</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: `${T.surfaceContainerLow}40` }}>
                  {['Fecha de Atención', 'Servicio Realizado', 'Profesional', 'Precio Cobrado', 'Estado Final'].map((h, i) => (
                    <th key={i} style={{ padding: '16px 32px', fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.appointments || []).map((a) => (
                  <tr key={a._id} style={{ borderTop: `1px solid ${T.surfaceContainerLow}`, transition: 'background 0.2s' }}>
                    <td style={{ padding: '20px 32px' }}>
                      <p style={{ fontFamily: T.fontBody, fontSize: '14px', fontWeight: 600, color: T.onSurface, margin: 0 }}>{formatDate(a.date)}</p>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <p style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface, margin: 0 }}>{a.serviceName}</p>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                       <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant, margin: 0 }}>{a.employeeName}</p>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                       <p style={{ fontFamily: T.fontBody, fontSize: '14px', fontWeight: 700, color: a.isFinal ? T.primary : T.onSurfaceVariant, margin: 0 }}>
                         ${(a.price || 0).toLocaleString()}{!a.isFinal && <span style={{ opacity: 0.5, fontSize: '10px', marginLeft: '4px' }}>*</span>}
                       </p>
                       {!a.isFinal && a.status === 'completed' && <p style={{ fontSize: '9px', color: T.onSurfaceVariant, margin: 0, opacity: 0.6 }}>Precio sugerido</p>}
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      {getStatusBadge(a.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '20px 32px', backgroundColor: `${T.surfaceContainerLow}20`, textAlign: 'center' }}>
            <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant, fontStyle: 'italic' }}>
              Última visita registrada hace {data?.stats?.daysSinceLastVisit || 0} días.
            </p>
          </div>
        </section>
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </AdminLayout>
  );
}
