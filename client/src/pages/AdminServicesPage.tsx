import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { serviceService, employeeService } from '../services/api';
import type { Service, Employee } from '../types';

declare global {
  interface Window {
    cloudinary?: any;
  }
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Service>>({
    nombre: '',
    descripcion: '',
    precio: 0,
    precioTipo: 'fijo',
    precioDesde: 0,
    precioHasta: 0,
    duracion: 30, // Default 30 min
    imagen: '',
    empleadas: [] // Array of employee IDs
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSvc, resEmp] = await Promise.all([
        serviceService.getAll(undefined, true),
        employeeService.getAll(true)
      ]);
      if (resSvc.success && resSvc.data) setServices(resSvc.data);
      if (resEmp.success && resEmp.data) setEmployees(resEmp.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (svc?: Service) => {
    if (svc) {
      setEditingId(svc._id);
      setFormData({
        nombre: svc.nombre,
        descripcion: svc.descripcion,
        precio: svc.precio,
        precioTipo: svc.precioTipo || 'fijo',
        precioDesde: svc.precioDesde || 0,
        precioHasta: svc.precioHasta || 0,
        duracion: svc.duracion,
        imagen: svc.imagen,
        // map full employee objects to IDs for the form
        empleadas: svc.empleadas.map((e: any) => typeof e === 'string' ? e : e._id)
      });
    } else {
      setEditingId(null);
      setFormData({ nombre: '', descripcion: '', precio: 0, precioTipo: 'fijo', precioDesde: 0, precioHasta: 0, duracion: 30, imagen: '', empleadas: [] });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.precioTipo === 'consultar') payload.precio = 0;
      if (payload.precioTipo === 'rango') payload.precio = payload.precioDesde || 0;

      if (editingId) {
        await serviceService.update(editingId, payload);
      } else {
        await serviceService.create(payload as Service);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error guardando servicio');
    }
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      if (currentlyActive) {
        await serviceService.deactivate(id);
      } else {
        await serviceService.reactivate(id);
      }
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error cambiando estado del servicio');
    }
  };

  const toggleEmployeeSelection = (empId: string) => {
    setFormData(prev => {
      const current = prev.empleadas as string[] || [];
      if (current.includes(empId)) return { ...prev, empleadas: current.filter(id => id !== empId) };
      return { ...prev, empleadas: [...current, empId] };
    });
  };

  const openCloudinary = () => {
    if (!window.cloudinary) {
      alert('Cloudinary widget not loaded yet');
      return;
    }
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: 'dz1gbtqnc',
        uploadPreset: 'salon_uploads',
        sources: ['local', 'camera', 'url'],
        multiple: false,
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          setFormData((prev) => ({ ...prev, imagen: result.info.secure_url }));
        }
      }
    );
    widget.open();
  };

  const renderPrice = (svc: Service) => {
    const pType = svc.precioTipo || 'fijo';
    const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });
    if (pType === 'consultar') return 'Consultar precio';
    if (pType === 'rango') {
      const pDesde = svc.precioDesde ? formatter.format(svc.precioDesde).replace(',00', '') : '';
      const pHasta = svc.precioHasta ? formatter.format(svc.precioHasta).replace(',00', '') : '';
      return `${pDesde} - ${pHasta}`;
    }
    return formatter.format(svc.precio || 0).replace(',00', '');
  };

  const filteredServices = services.filter(svc => 
    svc.nombre.toLowerCase().includes(search.toLowerCase()) ||
    svc.descripcion.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout
      searchPlaceholder="Buscar por nombre o descripción..."
      searchValue={search}
      onSearchChange={setSearch}
      topBarRight={
        <button
          onClick={() => openModal()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: T.secondaryContainer, color: T.onSecondaryContainer,
            padding: '10px 20px', borderRadius: '9999px', border: 'none',
            fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer',
            transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(62,2,21,0.08)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0bd8f'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.secondaryContainer; }}
        >
          <span>+</span> Nuevo
        </button>
      }
    >
      <style>{`
        .svc-card { transition: transform 0.3s, box-shadow 0.3s; }
        .svc-card:hover { transform: translateY(-4px); box-shadow: 0 24px 48px rgba(62,2,21,0.08) !important; }
        .svc-card:hover .svc-img { transform: scale(1.05); }
        .svc-img { transition: transform 0.5s; }
        .svc-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        @media (max-width: 1100px) { .svc-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 680px) { .svc-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ padding: '40px 48px 80px' }}>
        {/* Header */}
        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <nav style={{ display: 'flex', gap: '8px', fontFamily: T.fontBody, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: `${T.onSurfaceVariant}65`, marginBottom: '8px' }}>
              <span>Admin</span><span>/</span><span style={{ color: T.primary, fontWeight: 700 }}>Servicios</span>
            </nav>
            <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '40px', color: T.onSurface, letterSpacing: '-0.02em', fontWeight: 700 }}>
              Servicios
            </h2>
          </div>
        </section>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: T.onSurfaceVariant }}>
            <p style={{ fontFamily: T.fontBody, fontSize: '16px' }}>Cargando servicios...</p>
          </div>
        ) : (
          <div className="svc-grid">
            {filteredServices.map((svc) => (
              <div key={svc._id} className="svc-card" style={{
                backgroundColor: T.surfaceContainerLowest, borderRadius: '16px',
                padding: '24px', boxShadow: '0 12px 32px rgba(62,2,21,0.04)',
                overflow: 'hidden', opacity: svc.isActive ? 1 : 0.6
              }}>
                {/* Image */}
                <div style={{ aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px', position: 'relative' }}>
                  {svc.imagen ? (
                    <img src={svc.imagen} alt={svc.nombre} className="svc-img" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div className="bg-gray-200 text-gray-500 rounded-md flex items-center justify-center text-sm font-medium w-full h-full" style={{ backgroundColor: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Sin imagen</div>
                  )}
                  {!svc.isActive && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ backgroundColor: T.error, color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>INACTIVO</span>
                    </div>
                  )}
                </div>

                {/* Title + price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', minHeight: '52px' }}>
                  <div>
                    <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface, marginBottom: '4px' }}>{svc.nombre}</h3>
                    <span style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: `${T.onSurfaceVariant}80` }}>
                      ⏱ {svc.duracion} min
                    </span>
                  </div>
                  <span style={{ fontFamily: T.fontBody, fontWeight: 800, fontSize: '18px', color: T.primary }}>{renderPrice(svc)}</span>
                </div>

                {/* Description */}
                <p style={{ fontFamily: T.fontBody, fontSize: '13px', fontStyle: 'italic', color: T.onSurfaceVariant, lineHeight: 1.7, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '44px' }}>
                  {svc.descripcion}
                </p>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: `1px solid ${T.outlineVariant}25` }}>
                  {/* Specialist count or avatars */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontFamily: T.fontBody, fontSize: '11px', color: T.onSurfaceVariant }}>
                      👥 {svc.empleadas?.length || 0} Especialistas
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => openModal(svc)} style={{ padding: '8px', borderRadius: '9999px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', color: T.onSurfaceVariant, transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.primaryFixed; e.currentTarget.style.color = T.primary; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = T.onSurfaceVariant; }}
                      title="Editar"
                    >✏️</button>
                    <button onClick={() => handleToggleActive(svc._id, svc.isActive)} style={{ padding: '8px', borderRadius: '9999px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', color: svc.isActive ? T.error : '#22c55e', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = svc.isActive ? T.errorContainer : '#dcfce7'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      title={svc.isActive ? "Desactivar" : "Activar"}
                    >{svc.isActive ? '👁️‍🗨️' : '👁️'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && filteredServices.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px', color: T.onSurfaceVariant }}>
            <p style={{ fontFamily: T.fontBody, fontSize: '16px' }}>
              {search ? 'Sin resultados para la búsqueda.' : 'No hay servicios registrados.'}
            </p>
          </div>
        )}
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: T.surfaceContainerLowest, borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', outline: 'none' }}>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, marginBottom: '24px' }}>
              {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '120px', height: '64px', borderRadius: '8px', overflow: 'hidden', backgroundColor: T.surfaceContainer }}>
                  {formData.imagen ? <img src={formData.imagen} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                </div>
                <button type="button" onClick={openCloudinary} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, backgroundColor: 'transparent', fontFamily: T.fontBody, fontSize: '12px', cursor: 'pointer' }}>Subir Imagen (Cloudinary)</button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '6px' }}>Nombre del Servicio</label>
                <input required type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '6px' }}>Descripción</label>
                <textarea required rows={3} value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '6px' }}>Tipo de Precio</label>
                  <select value={formData.precioTipo} onChange={e => setFormData({ ...formData, precioTipo: e.target.value as any })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px', backgroundColor: 'transparent' }}>
                    <option value="fijo">Precio Fijo</option>
                    <option value="rango">Rango de Precios</option>
                    <option value="consultar">Previa Consulta</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '6px' }}>Duración (minutos)</label>
                  <input required type="number" min="5" step="5" value={formData.duracion} onChange={e => setFormData({ ...formData, duracion: Number(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px' }} />
                </div>
              </div>

              {formData.precioTipo === 'fijo' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '6px' }}>Precio Exacto (COP)</label>
                  <input required type="number" min="0" value={formData.precio} onChange={e => setFormData({ ...formData, precio: Number(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px' }} />
                </div>
              )}

              {formData.precioTipo === 'rango' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '6px' }}>Precio Desde (COP)</label>
                    <input required type="number" min="0" value={formData.precioDesde} onChange={e => setFormData({ ...formData, precioDesde: Number(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '6px' }}>Precio Hasta (COP)</label>
                    <input required type="number" min="0" value={formData.precioHasta} onChange={e => setFormData({ ...formData, precioHasta: Number(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px' }} />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '6px' }}>Especialistas Asignadas</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', border: `1px solid ${T.outlineVariant}`, padding: '12px', borderRadius: '8px' }}>
                  {employees.map(emp => {
                    const isAssigned = (formData.empleadas as string[]).includes(emp._id);
                    return (
                      <div key={emp._id} onClick={() => toggleEmployeeSelection(emp._id)} style={{
                        padding: '6px 12px', borderRadius: '9999px', fontSize: '12px', fontFamily: T.fontBody, cursor: 'pointer', border: `1px solid ${isAssigned ? T.primary : T.outlineVariant}`, backgroundColor: isAssigned ? T.primaryFixed : 'transparent', color: isAssigned ? T.onPrimary : T.onSurfaceVariant, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                      }}>
                        {isAssigned && <span>✓</span>} {emp.nombre}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 24px', borderRadius: '9999px', border: 'none', backgroundColor: T.surfaceContainerHigh, color: T.onSurfaceVariant, fontFamily: T.fontBody, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '12px 24px', borderRadius: '9999px', border: 'none', backgroundColor: T.primary, color: '#fff', fontFamily: T.fontBody, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
