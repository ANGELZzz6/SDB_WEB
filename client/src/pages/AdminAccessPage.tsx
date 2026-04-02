import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { employeeService, authService } from '../services/api';
import type { Employee } from '../types';

const PERMISSION_LABELS: { key: string; label: string; fixed?: boolean }[] = [
  { key: 'citas', label: 'Dashboard / Citas', fixed: true },
  { key: 'calendario', label: 'Calendario', fixed: true },
  { key: 'clientes', label: 'Clientes' },
  { key: 'servicios', label: 'Servicios' },
  { key: 'especialistas', label: 'Especialistas' },
  { key: 'accesos', label: 'Accesos' },
  { key: 'galeria', label: 'Galería' },
  { key: 'configuracion', label: 'Configuración' },
  { key: 'liquidaciones', label: 'Liquidaciones' },
];

const DEFAULT_PERMS = {
  citas: true, calendario: true, clientes: false,
  servicios: false, especialistas: false, accesos: false,
  galeria: false, configuracion: false, liquidaciones: false,
};

export default function AdminAccessPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [isReset, setIsReset] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>(DEFAULT_PERMS);
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getAll(true);
      if (res.success && res.data) {
        const sorted = (res.data as Employee[]).sort((a, b) => {
          if (a.isActive === b.isActive) return 0;
          return a.isActive ? -1 : 1;
        });
        setEmployees(sorted);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleOpen = (emp: Employee) => {
    setSelectedEmp(emp);
    setFormEmail(emp.email || '');
    setFormPassword('');
    setIsReset(!!emp.email);
    const empPerms: Record<string, boolean> = { ...DEFAULT_PERMS, ...(emp as any).permissions };
    setPermissions(empPerms);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedEmp) return;
    try {
      setSubmitting(true);
      if (!isReset) {
        await authService.createEmployeeAccount({
          employeeId: selectedEmp._id,
          email: formEmail,
          password: formPassword,
        });
      } else {
        if (formEmail !== selectedEmp.email) {
          await employeeService.update(selectedEmp._id, { email: formEmail });
        }
        if (formPassword) {
          await authService.resetEmployeePassword({
            employeeId: selectedEmp._id,
            newPassword: formPassword,
          });
        }
      }
      // Always save permissions
      await employeeService.update(selectedEmp._id, { permissions } as any);
      setShowModal(false);
      fetchEmployees();
    } catch (e: any) {
      alert(e.message || 'Error guardando accesos');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePerm = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AdminLayout searchPlaceholder="Buscar especialista...">
      <style>{`
        @media (max-width: 768px) {
          .admin-access-container { padding: 24px 16px 120px !important; }
          .admin-access-header { flex-direction: column; align-items: flex-start !important; gap: 16px; margin-bottom: 24px !important; }
          .admin-access-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .admin-access-modal { padding: 24px !important; width: 95% !important; margin: 10px !important; }
        }
      `}</style>
      <div className="admin-access-container" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '64px', padding: '40px 24px' }}>
        <header className="admin-access-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: 'clamp(28px, 5vw, 36px)', color: T.primary, margin: 0 }}>
              Control de Accesos
            </h1>
            <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant }}>
              Gestiona los correos, contraseñas y permisos de tu equipo
            </p>
          </div>
        </header>

        {loading ? (
          <p style={{ fontFamily: T.fontBody, color: T.onSurfaceVariant }}>Cargando empleados...</p>
        ) : (
          <div className="admin-access-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '20px' }}>
            {employees.map(emp => (
              <div key={emp._id} style={{
                backgroundColor: T.surfaceContainerLowest,
                borderRadius: '16px', padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                border: `1px solid ${T.outlineVariant}40`,
                display: 'flex', flexDirection: 'column', gap: '16px',
                opacity: emp.isActive ? 1 : 0.6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {emp.foto ? (
                    <img src={emp.foto} alt={emp.nombre} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>Sin foto</div>
                  )}
                  <div>
                    <h3 style={{ fontFamily: T.fontBody, fontSize: '18px', fontWeight: 700, color: T.onSurface }}>{emp.nombre}</h3>
                    {!emp.isActive && <span style={{ fontSize: '10px', backgroundColor: T.errorContainer, color: T.error, padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>INACTIVA</span>}
                  </div>
                </div>

                <div style={{ backgroundColor: T.surfaceContainerLow, padding: '12px', borderRadius: '12px' }}>
                  <p style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.onSurfaceVariant, marginBottom: '2px' }}>Email de Acceso</p>
                  <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: emp.email ? T.primary : T.onSurfaceVariant }}>
                    {emp.email || 'Sin correo asignado'}
                  </p>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <button
                    onClick={() => handleOpen(emp)}
                    style={{ width: '100%', padding: '12px', borderRadius: '9999px', border: `1px solid ${T.primary}`, backgroundColor: 'transparent', color: T.primary, fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = T.primary; e.currentTarget.style.color = '#FFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = T.primary; }}
                  >
                    {emp.email ? 'Gestionar Acceso' : 'Habilitar Acceso'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL */}
        {showModal && selectedEmp && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="admin-access-modal" style={{ backgroundColor: T.surface, width: '100%', maxWidth: '460px', padding: '32px', borderRadius: '24px', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, marginBottom: '8px' }}>
                Accesos para {selectedEmp.nombre}
              </h3>
              <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant, marginBottom: '24px' }}>
                {isReset ? 'Actualiza su correo o resetea su contraseña.' : 'Crea sus credenciales de acceso iniciales.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurface, marginBottom: '6px' }}>Correo Electrónico</label>
                  <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="empleada@salon.com" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurface, marginBottom: '6px' }}>
                    {isReset ? 'Nueva Contraseña (Dejar en blanco para no cambiar)' : 'Contraseña Inicial'}
                  </label>
                  <input type="text" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody, boxSizing: 'border-box' }} />
                </div>

                {/* Permissions */}
                <div style={{ backgroundColor: T.surfaceContainerLow, padding: '16px', borderRadius: '12px' }}>
                  <p style={{ fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.onSurfaceVariant, marginBottom: '12px' }}>
                    Permisos de la especialista
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {PERMISSION_LABELS.map(({ key, label, fixed }) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: fixed ? 'not-allowed' : 'pointer', opacity: fixed ? 0.6 : 1 }}>
                        <input
                          type="checkbox"
                          checked={permissions[key] ?? false}
                          disabled={fixed}
                          onChange={() => !fixed && togglePerm(key)}
                          style={{ width: '16px', height: '16px', accentColor: T.primary }}
                        />
                        <span style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface }}>
                          {label} {fixed && <span style={{ fontSize: '10px', color: T.onSurfaceVariant }}>(siempre activo)</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', border: `1px solid ${T.outlineVariant}`, borderRadius: '9999px', background: 'none', cursor: 'pointer', fontFamily: T.fontBody, fontWeight: 700, color: T.onSurface }}>Cancelar</button>
                <button
                  onClick={handleSave}
                  disabled={submitting || (!isReset && (!formEmail || !formPassword))}
                  style={{ flex: 1, padding: '12px', backgroundColor: T.primary, color: 'white', border: 'none', borderRadius: '9999px', cursor: 'pointer', fontFamily: T.fontBody, fontWeight: 700, opacity: submitting || (!isReset && (!formEmail || !formPassword)) ? 0.6 : 1 }}
                >
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
