import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { authService, employeeService } from '../services/api';

declare global {
  interface Window {
    cloudinary?: any;
  }
}

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    foto: '',
    password: '',
    disponibleHoy: true
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await authService.getMe();
      if (res.success && res.data) {
        setFormData({
          nombre: res.data.nombre || '',
          email: res.data.email || '',
          foto: res.data.foto || '',
          password: '',
          disponibleHoy: res.data.disponibleHoy !== false
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      // Solo enviar password si no está vacío
      const payload: any = { ...formData };
      if (!payload.password) delete payload.password;

      await employeeService.updateProfile(payload);
      alert('Perfil actualizado correctamente');
      fetchProfile();
    } catch (error: any) {
      alert(error.message || 'Error actualizando perfil');
    } finally {
      setSaving(false);
    }
  };

  const openCloudinary = () => {
    if (!window.cloudinary) {
      alert('Cloudinary widget not loaded');
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

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '64px', textAlign: 'center', color: T.onSurfaceVariant }}>
          Cargando tu perfil...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: '40px 48px 80px', maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '40px', color: T.primary, fontWeight: 700 }}>
            Mi Perfil
          </h2>
          <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant }}>
            Administra tu información personal y credenciales de acceso.
          </p>
        </header>

        <div style={{ backgroundColor: T.surfaceContainerLowest, borderRadius: '24px', padding: '40px', boxShadow: '0 12px 40px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Foto Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', backgroundColor: T.surfaceContainerLow, padding: '20px', borderRadius: '16px' }}>
              <div style={{ position: 'relative' }}>
                {formData.foto ? (
                  <img src={formData.foto} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${T.surface}` }} />
                ) : (
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: T.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>👤</div>
                )}
                <button 
                  type="button" 
                  onClick={openCloudinary}
                  style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: T.primary, color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                >
                  📷
                </button>
              </div>
              <div>
                <h4 style={{ fontFamily: T.fontBody, fontWeight: 700, fontSize: '14px', color: T.onSurface, marginBottom: '4px' }}>Foto de Perfil</h4>
                <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant }}>Visible en el listado de especialistas y panel administrativo.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '8px' }}>Nombre Completo</label>
                <input 
                  required 
                  type="text" 
                  value={formData.nombre} 
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '8px' }}>Email</label>
                <input 
                  required 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '8px' }}>Nueva Contraseña (Dejar vacío para no cambiar)</label>
              <input 
                type="password" 
                value={formData.password} 
                onChange={e => setFormData({ ...formData, password: e.target.value })} 
                placeholder="••••••••"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, fontSize: '14px', boxSizing: 'border-box' }} 
              />
            </div>

            {/* Disponibilidad Hoy Toggle — Solo para Especialistas */}
            {formData.email !== (import.meta.env.VITE_ADMIN_EMAIL || 'admin@salon.com') && (
              <div style={{ 
                backgroundColor: T.surfaceContainerLow, 
                padding: '20px', 
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: `1px solid ${T.outlineVariant}30`
              }}>
                <div>
                  <h4 style={{ fontFamily: T.fontBody, fontWeight: 700, fontSize: '14px', color: T.onSurface, marginBottom: '4px' }}>¿Estás disponible para citas hoy?</h4>
                  <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant }}>
                    {formData.disponibleHoy 
                      ? "Tu agenda está abierta para nuevas citas hoy." 
                      : "Tu agenda está cerrada para hoy. No aparecerás en el chatbot."}
                  </p>
                </div>
                <label style={{ 
                  position: 'relative', 
                  display: 'inline-block', 
                  width: '52px', 
                  height: '28px',
                  cursor: 'pointer'
                }}>
                  <input 
                    type="checkbox" 
                    checked={formData.disponibleHoy}
                    onChange={async () => {
                      try {
                        const newValue = !formData.disponibleHoy;
                        // Actualizar estado local inmediatamente para feedback visual
                        setFormData(prev => ({ ...prev, disponibleHoy: newValue }));
                        
                        const myProfile = await authService.getMe();
                        if (myProfile.data?.id && myProfile.data.role === 'empleada') {
                          await employeeService.updateAvailability(myProfile.data.id, newValue);
                        }
                      } catch (e: any) {
                        alert(e.message || 'Error actualizando disponibilidad');
                        fetchProfile(); // Revertir en caso de error
                      }
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }} 
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: formData.disponibleHoy ? T.primary : '#ccc',
                    transition: '0.4s',
                    borderRadius: '34px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '20px',
                      width: '20px',
                      left: '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '0.4s',
                      borderRadius: '50%',
                      transform: formData.disponibleHoy ? 'translateX(24px)' : 'translateX(0)'
                    }}></span>
                  </span>
                </label>
              </div>
            )}

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                disabled={saving}
                style={{ 
                  backgroundColor: T.primary, color: 'white', border: 'none', padding: '16px 40px', borderRadius: '9999px',
                  fontFamily: T.fontBody, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '13px',
                  cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'transform 0.2s'
                }}
                onMouseEnter={e => !saving && (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={e => !saving && (e.currentTarget.style.transform = 'scale(1)')}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
