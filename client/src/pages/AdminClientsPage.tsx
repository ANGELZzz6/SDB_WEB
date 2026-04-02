import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { clientService } from '../services/api';

interface RealClient {
  id: string; // phone
  name: string;
  email: string;
  phone: string;
  visits: number;
  lastDate: string;
  lastService: string;
  favoriteEmployee: string;
  isActive?: boolean;
}

const getTier = (visits: number) => {
  if (visits >= 10) return { label: 'PLATINO', color: '#772e3e' };
  if (visits >= 5)  return { label: 'ORO', color: '#7a532e' };
  if (visits > 1)   return { label: 'REGULAR', color: `${T.onSurfaceVariant}90` };
  return { label: 'NUEVA', color: `${T.onSurfaceVariant}70` };
};

export default function AdminClientsPage() {
  const navigate = useNavigate();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [clients, setClients] = useState<RealClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await clientService.getAll();
      if (res.success && res.data) {
        // Ordenar: Activos (true o undefined) primero, Inactivos (false) al final
        const sorted = [...res.data].sort((a, b) => {
          const activeA = a.isActive !== false;
          const activeB = b.isActive !== false;
          if (activeA === activeB) return 0;
          return activeA ? -1 : 1;
        });
        setClients(sorted);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async () => {
    alert('No es posible eliminar un cliente. El historial de citas y el LTV deben preservarse por integridad del negocio.');
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.phone || '').includes(search) || 
      (c.email || '').toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const formatLastDate = (dateStr: string) => {
    if (!dateStr) return 'Desconocido';
    return new Date(dateStr).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const activeThisMonth = clients.filter(c => {
    if(!c.lastDate) return false;
    const d = new Date(c.lastDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <AdminLayout
      searchPlaceholder="Buscar clientes por nombre, teléfono..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div style={{ padding: '40px 48px 80px' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: T.primary, display: 'block', marginBottom: '4px' }}>Gestión de</span>
            <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '40px', color: T.onSurface, letterSpacing: '-0.02em', fontWeight: 400 }}>Clientes</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[{ label: 'Total Clientes', value: clients.length, c: T.primary }, { label: 'Activos este mes', value: activeThisMonth, c: T.onSecondaryContainer }].map(({ label, value, c }) => (
              <div key={label} style={{ backgroundColor: T.surfaceContainerLow, padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.onSurfaceVariant }}>{label}</span>
                <span style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: c, fontWeight: 700 }}>{value}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Table */}
        <section style={{ backgroundColor: T.surfaceContainerLowest, borderRadius: '16px', boxShadow: '0 12px 40px rgba(62,2,21,0.06)', overflow: 'hidden', marginBottom: '28px' }}>
          <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.surfaceContainerLow}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '18px', color: T.onSurface }}>Base de Datos de Clientes</h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: `${T.surfaceContainerLow}80` }}>
                  {['Cliente', 'Contacto', 'Visitas', 'Última Cita', 'Artista Favorito', 'Acciones'].map((h, i) => (
                    <th key={i} style={{ padding: '14px 24px', fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: T.onSurfaceVariant, textAlign: (i >= 2) ? 'center' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '64px', textAlign: 'center', color: T.onSurfaceVariant, fontFamily: T.fontBody, fontSize: '14px' }}>
                      Cargando historial de clientes...
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '64px', textAlign: 'center', color: T.onSurfaceVariant, fontFamily: T.fontBody, fontSize: '14px' }}>
                      {search ? 'Sin resultados para la búsqueda.' : 'No hay clientes registrados aún.'}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((c, index) => {
                    const tier = getTier(c.visits);
                    // Avatar determinístico basado en ID
                    const avatarId = (c.name.length + index) % 70 + 1;
                    return (
                      <tr key={c.id}
                        onMouseEnter={() => setHoveredRow(c.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onClick={() => navigate(`/admin/clientes/${c.phone}`)}
                        style={{ 
                          backgroundColor: hoveredRow === c.id ? 'rgba(255,217,222,0.3)' : 'transparent', 
                          transition: 'background 0.2s', 
                          borderTop: `1px solid ${T.surfaceContainerLow}`,
                          cursor: 'pointer'
                        }}
                      >
                        <td style={{ padding: '18px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ position: 'relative' }}>
                              <img src={`https://i.pravatar.cc/50?img=${avatarId}`} alt={c.name} style={{ width: '40px', height: '40px', borderRadius: '9999px', objectFit: 'cover', border: `2px solid ${T.surface}` }} />
                            </div>
                            <div>
                              <p style={{ fontFamily: T.fontBody, fontSize: '14px', fontWeight: 600, color: T.onSurface }}>{c.name}</p>
                              <p style={{ fontFamily: T.fontBody, fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: tier.color }}>{tier.label}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '18px 24px' }}>
                          {c.email && <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>✉ {c.email}</p>}
                          <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant, marginTop: c.email ? '3px' : '0' }}>📞 {c.phone}</p>
                        </td>
                        <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '9999px', backgroundColor: T.surfaceContainer, fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, color: T.primary }}>{c.visits || 0}</span>
                        </td>
                        <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                          <p style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 600, color: T.onSurface }}>{c.lastDate ? formatLastDate(c.lastDate) : 'S/I'}</p>
                          <p style={{ fontFamily: T.fontBody, fontSize: '11px', color: T.onSurfaceVariant, marginTop: '2px' }}>{c.lastService || 'Nueva'}</p>
                        </td>
                        <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                           <p style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 600, color: T.primary }}>{c.favoriteEmployee || 'S/I'}</p>
                        </td>
                         <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete();
                              }}
                              style={{ 
                                border: 'none', background: 'none', cursor: 'not-allowed', 
                                fontSize: '18px', color: T.error, padding: '8px', 
                                borderRadius: '50%', transition: 'background-color 0.2s',
                                opacity: 0.5
                              }}
                              title="No es posible eliminar un cliente por integridad de datos"
                            >
                               🗑️
                            </button>
                         </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '14px 24px', backgroundColor: `${T.surfaceContainerLow}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant }}>Mostrando {filteredClients.length} clientes</p>
          </div>
        </section>

        {/* Insight Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '24px' }}>
          <div style={{ backgroundColor: T.surfaceContainerHigh, borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
            <h4 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: T.primary, marginBottom: '12px' }}>Fidelización & Tendencias</h4>
            <p style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, lineHeight: 1.8, maxWidth: '600px' }}>
              Los clientes son la base de tu salón. Identificar a tus miembros Platino y Oro te permite brindar experiencias únicas y altamente personalizadas al interactuar con ellos por teléfono o WhatsApp.
            </p>
            <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '80px', opacity: 0.05, userSelect: 'none' }}>✨</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
