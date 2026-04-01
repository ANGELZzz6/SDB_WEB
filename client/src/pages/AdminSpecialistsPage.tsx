import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { employeeService } from '../services/api';
import type { Employee } from '../types';

declare global {
  interface Window {
    cloudinary?: any;
  }
}

export default function AdminSpecialistsPage() {
  const [specialists, setSpecialists] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({
    nombre: '',
    descripcion: '',
    foto: '',
    especialidades: []
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchSpecialists = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getAll(true); // Include inactive to see logic
      if (res.success && res.data) {
        setSpecialists(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialists();
  }, []);

  const openModal = (emp?: Employee) => {
    if (emp) {
      setEditingId(emp._id);
      setFormData({
        nombre: emp.nombre,
        descripcion: emp.descripcion,
        foto: emp.foto,
        especialidades: emp.especialidades
      });
    } else {
      setEditingId(null);
      setFormData({ nombre: '', descripcion: '', foto: '', especialidades: [] });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await employeeService.update(editingId, formData);
      } else {
        await employeeService.create(formData as Employee); // Password will be auto-generated in backend
      }
      setIsModalOpen(false);
      fetchSpecialists();
    } catch (error) {
      console.error(error);
      alert('Error guardando especialista');
    }
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      if (currentlyActive) {
        await employeeService.deactivate(id);
      } else {
        await employeeService.reactivate(id);
      }
      fetchSpecialists();
    } catch (error) {
      console.error(error);
      alert('Error cambiando estado');
    }
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
          setFormData((prev) => ({ ...prev, foto: result.info.secure_url }));
        }
      }
    );
    widget.open();
  };

  const stats = {
    total: specialists.length,
    active: specialists.filter(s => s.isActive).length,
    inactive: specialists.filter(s => !s.isActive).length
  };

  return (
    <AdminLayout
      searchPlaceholder="Buscar especialista..."
      topBarRight={
        <button onClick={() => openModal()} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: T.primary, color: '#FFFFFF',
          padding: '10px 20px', borderRadius: '9999px', border: 'none',
          fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <span>+</span> Nuevo
        </button>
      }
    >
      <style>{`
        .spec-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 24px;
          margin-bottom: 48px;
        }
        @media (max-width: 1100px) { .spec-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 640px)  { .spec-grid { grid-template-columns: 1fr; } }

        .spec-card {
          background: ${T.surfaceContainerLow};
          border-radius: 16px; padding: 32px 24px;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          transition: background-color 0.3s, transform 0.3s;
        }
        .spec-card:hover { background: ${T.surfaceContainerLowest}; transform: translateY(-2px); }

        .stats-bar {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 24px;
        }
        @media (max-width: 768px) { .stats-bar { grid-template-columns: repeat(1,1fr); } }
      `}</style>

      <div style={{ padding: '40px 48px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '44px', color: T.primary, letterSpacing: '-0.03em', fontWeight: 700, marginBottom: '6px' }}>
              Especialistas
            </h2>
            <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant }}>
              Gestiona tu equipo de artistas y profesionales de la belleza.
            </p>
          </div>
        </div>

        {/* Specialist Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: T.onSurfaceVariant }}>
            <p style={{ fontFamily: T.fontBody, fontSize: '16px' }}>Cargando especialistas...</p>
          </div>
        ) : (
          <div className="spec-grid">
            {specialists.map((emp) => {
              const isActive = emp.isActive;
              return (
                <div key={emp._id} className="spec-card" style={{ opacity: isActive ? 1 : 0.65 }}>
                  {/* Photo */}
                  <div style={{ position: 'relative', marginBottom: '20px' }}>
                    {emp.foto ? (
                      <img src={emp.foto} alt={emp.nombre} style={{
                        width: '120px', height: '120px', borderRadius: '9999px', objectFit: 'cover',
                        outline: `4px solid ${isActive ? T.primaryFixedDim : T.surfaceVariant}`,
                        outlineOffset: '2px',
                      }} />
                    ) : (
                      <div style={{
                        width: '120px', height: '120px', borderRadius: '9999px', backgroundColor: '#e5e7eb', color: '#6b7280',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                        outline: `4px solid ${isActive ? T.primaryFixedDim : T.surfaceVariant}`,
                        outlineOffset: '2px',
                      }}>Sin imagen</div>
                    )}
                    {/* Status badge */}
                    <span style={{
                      position: 'absolute', bottom: '2px', right: '2px',
                      fontFamily: T.fontBody, fontSize: '9px', fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      backgroundColor: isActive ? '#green' : T.surfaceContainer,
                      color: isActive ? '#fff' : T.onSurfaceVariant,
                      border: `1px solid ${isActive ? '#22c55e' : T.outlineVariant}`,
                      background: isActive ? '#22c55e' : T.surfaceContainer,
                      padding: '3px 8px', borderRadius: '4px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}>
                      {isActive ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>

                  {/* Name + role */}
                  <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: T.onSurface, marginBottom: '4px' }}>{emp.nombre}</h3>
                  <p style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 500, color: T.primary, marginBottom: '16px', height: '40px', overflow: 'hidden' }}>{emp.descripcion}</p>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', marginBottom: '24px', minHeight: '30px' }}>
                    {emp.especialidades?.map((t: string) => (
                      <span key={t} style={{
                        fontFamily: T.fontBody, fontSize: '11px', fontWeight: 500,
                        backgroundColor: T.surfaceVariant, color: T.onSurfaceVariant,
                        padding: '4px 12px', borderRadius: '9999px',
                      }}>{t}</span>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginTop: 'auto' }}>
                    <button onClick={() => openModal(emp)} style={{
                      padding: '12px 0', borderRadius: '9999px', border: 'none',
                      backgroundColor: T.surfaceContainerHigh, color: T.onSurfaceVariant,
                      fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.outlineVariant)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = T.surfaceContainerHigh)}
                    >Editar</button>
                    <button onClick={() => handleToggleActive(emp._id, emp.isActive)} style={{
                      padding: '12px 0', borderRadius: '9999px',
                      border: `1px solid ${isActive ? T.error : T.primary}`, backgroundColor: 'transparent', color: isActive ? T.error : T.primary,
                      fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isActive ? T.errorContainer : T.primaryFixed)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >{isActive ? 'Inactivar' : 'Activar'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Bar */}
        <div className="stats-bar" style={{
          backgroundColor: T.surfaceContainerLow,
          borderRadius: '16px', padding: '28px 32px',
        }}>
          <div>
            <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: `${T.onSurfaceVariant}80`, marginBottom: '6px' }}>Total Equipo</p>
            <p style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '36px', color: T.primary, fontWeight: 700 }}>{stats.total}</p>
          </div>
          <div>
            <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: `${T.onSurfaceVariant}80`, marginBottom: '6px' }}>En Servicio</p>
            <p style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '36px', color: '#22c55e', fontWeight: 700 }}>{stats.active}</p>
          </div>
          <div>
            <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: `${T.onSurfaceVariant}80`, marginBottom: '6px' }}>Inactivas</p>
            <p style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '36px', color: T.error, fontWeight: 700 }}>{stats.inactive}</p>
          </div>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: T.surfaceContainerLowest, borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', outline: 'none' }}>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, marginBottom: '24px' }}>
              {editingId ? 'Editar Especialista' : 'Nuevo Especialista'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                {formData.foto ? (
                  <img src={formData.foto} alt="preview" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-xs" style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>Sin imagen</div>
                )}
                <button type="button" onClick={openCloudinary} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, backgroundColor: 'transparent', fontFamily: T.fontBody, fontSize: '12px', cursor: 'pointer' }}>Subir Foto (Cloudinary)</button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '6px' }}>Nombre completo</label>
                <input required type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '6px' }}>Rol / Descripción</label>
                <input required type="text" value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '6px' }}>Especialidades (separadas por coma)</label>
                <input required type="text" value={formData.especialidades?.join(', ')} onChange={e => setFormData({ ...formData, especialidades: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px' }} />
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
