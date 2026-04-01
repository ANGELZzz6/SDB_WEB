import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { settingsService } from '../services/api';
import type { Settings } from '../types';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<Settings>({
    _id: '',
    businessName: '',
    businessHours: { inicio: '06:00', fin: '21:00' },
    bufferBetweenAppointments: 15,
    maxDaysInAdvance: 30,
    cancellationHoursLimit: 2,
    whatsappNumber: '',
    address: '',
    socialMedia: { instagram: '', facebook: '', tiktok: '' }
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await settingsService.get();
        if (res.success && res.data) {
          setSettings(res.data);
          setOriginalSettings(res.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNestedChange = (parent: 'businessHours' | 'socialMedia', field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await settingsService.update(settings);
      if (res.success && res.data) {
        setSettings(res.data);
        setOriginalSettings(res.data);
        setHasChanges(false);
        alert('Ajustes guardados correctamente');
      }
    } catch (error) {
      console.error(error);
      alert('Error al guardar ajustes');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
    }
  };

  const SectionCard = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <section style={{ backgroundColor: T.surfaceContainerLow, borderRadius: '16px', padding: '32px', ...style }}>
      {children}
    </section>
  );

  const SectionTitle = ({ icon, title }: { icon: string; title: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface, fontWeight: 600 }}>{title}</h3>
    </div>
  );

  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: T.onSurfaceVariant, display: 'block', marginBottom: '6px' }}>
      {children}
    </label>
  );

  const UnderlineInput = ({ value, onChange, type = "text" }: { value: string | number, onChange: (v: string) => void, type?: string }) => (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', backgroundColor: 'transparent', border: 'none',
        borderBottom: `1px solid ${T.outlineVariant}40`, padding: '8px 0',
        fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface,
        transition: 'border-color 0.2s',
      }}
      onFocus={(e) => (e.currentTarget.style.borderBottomColor = T.primary)}
      onBlur={(e) => (e.currentTarget.style.borderBottomColor = `${T.outlineVariant}40`)}
    />
  );

  if (loading) {
    return (
      <AdminLayout searchPlaceholder="Buscar ajustes...">
        <div style={{ padding: '64px', textAlign: 'center', color: T.onSurfaceVariant }}>
           Cargando configuración...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout searchPlaceholder="Buscar ajustes...">
      <style>{`
        .settings-two-col {
          display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
        }
        @media (max-width: 900px) { .settings-two-col { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ padding: '40px 48px 140px', maxWidth: '900px' }}>
        {/* Page header */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '40px', color: T.primary, letterSpacing: '-0.02em', fontWeight: 700, marginBottom: '6px' }}>Configuración</h2>
          <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant }}>Personaliza la experiencia de tu salón y gestiona las reglas de operación.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Business Info */}
          <SectionCard>
            <SectionTitle icon="🏪" title="Información del Negocio" />
            <div className="settings-two-col">
              <div>
                <FieldLabel>Nombre del Salón</FieldLabel>
                <UnderlineInput value={settings.businessName} onChange={(v) => handleChange('businessName', v)} />
              </div>
              <div>
                <FieldLabel>Dirección</FieldLabel>
                <UnderlineInput value={settings.address} onChange={(v) => handleChange('address', v)} />
              </div>
              
              <div>
                <FieldLabel>Número WhatsApp (con código de país, ej: +57300...)</FieldLabel>
                <UnderlineInput value={settings.whatsappNumber} onChange={(v) => handleChange('whatsappNumber', v)} type="tel" />
              </div>

              <div>
                <FieldLabel>Días Máximos de Reserva Adelantada</FieldLabel>
                <UnderlineInput value={settings.maxDaysInAdvance} onChange={(v) => handleChange('maxDaysInAdvance', Number(v))} type="number" />
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <FieldLabel>Horarios Generales de Atención</FieldLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '8px' }}>
                   <div>
                      <FieldLabel>Hora Apertura</FieldLabel>
                      <UnderlineInput type="time" value={settings.businessHours.inicio} onChange={(v) => handleNestedChange('businessHours', 'inicio', v)} />
                   </div>
                   <div>
                      <FieldLabel>Hora Cierre</FieldLabel>
                      <UnderlineInput type="time" value={settings.businessHours.fin} onChange={(v) => handleNestedChange('businessHours', 'fin', v)} />
                   </div>
                </div>
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <FieldLabel>Redes Sociales</FieldLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '8px' }}>
                   <div>
                      <FieldLabel>Instagram</FieldLabel>
                      <UnderlineInput value={settings.socialMedia.instagram || ''} onChange={(v) => handleNestedChange('socialMedia', 'instagram', v)} />
                   </div>
                   <div>
                      <FieldLabel>Facebook</FieldLabel>
                      <UnderlineInput value={settings.socialMedia.facebook || ''} onChange={(v) => handleNestedChange('socialMedia', 'facebook', v)} />
                   </div>
                   <div>
                      <FieldLabel>TikTok</FieldLabel>
                      <UnderlineInput value={settings.socialMedia.tiktok || ''} onChange={(v) => handleNestedChange('socialMedia', 'tiktok', v)} />
                   </div>
                </div>
              </div>

            </div>
          </SectionCard>

          {/* Booking Rules */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <SectionCard>
              <SectionTitle icon="📋" title="Reglas de Reserva" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {/* Buffer time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <p style={{ fontFamily: T.fontBody, fontSize: '15px', fontWeight: 600, color: T.onSurface }}>Tiempo de Cortesía (Buffer)</p>
                    <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant, marginTop: '3px' }}>Minutos entre citas para preparación y limpieza.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => handleChange('bufferBetweenAppointments', Math.max(0, settings.bufferBetweenAppointments - 5))} style={{ width: '32px', height: '32px', borderRadius: '9999px', border: `1px solid ${T.outlineVariant}`, background: 'none', cursor: 'pointer', fontSize: '18px', color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontFamily: T.fontBody, fontWeight: 700, fontSize: '15px', width: '40px', textAlign: 'center', color: T.onSurface }}>{settings.bufferBetweenAppointments}m</span>
                    <button onClick={() => handleChange('bufferBetweenAppointments', Math.min(60, settings.bufferBetweenAppointments + 5))} style={{ width: '32px', height: '32px', borderRadius: '9999px', border: `1px solid ${T.outlineVariant}`, background: 'none', cursor: 'pointer', fontSize: '18px', color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>

                {/* Cancel policy */}
                <div>
                  <p style={{ fontFamily: T.fontBody, fontSize: '15px', fontWeight: 600, color: T.onSurface, marginBottom: '14px' }}>Límite de Cancelación</p>
                  <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant, marginBottom: '16px' }}>Horas previas a la cita en la que los clientes pueden cancelar.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { val: 2, label: 'Flexible', desc: 'Cancelación hasta 2h antes' },
                      { val: 24, label: 'Estricta', desc: 'Cancelación hasta 24h antes' },
                    ].map(({ val, label, desc }) => (
                      <label key={val} onClick={() => handleChange('cancellationHoursLimit', val)} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                        borderRadius: '12px', backgroundColor: T.surfaceContainer,
                        cursor: 'pointer', border: `1px solid ${settings.cancellationHoursLimit === val ? T.primaryFixed : 'transparent'}`,
                        transition: 'border-color 0.2s',
                      }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '9999px', border: `2px solid ${settings.cancellationHoursLimit === val ? T.primary : T.outlineVariant}`, backgroundColor: settings.cancellationHoursLimit === val ? T.primary : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {settings.cancellationHoursLimit === val && <div style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#fff' }} />}
                        </div>
                        <div>
                          <span style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 600, color: T.onSurface, display: 'block' }}>{label}</span>
                          <span style={{ fontFamily: T.fontBody, fontSize: '11px', color: T.onSurfaceVariant }}>{desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Floating Save Bar */}
      {hasChanges && (
        <div style={{
          position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
          marginLeft: '40px', zIndex: 60,
          backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.3)', borderRadius: '9999px',
          padding: '16px 36px', boxShadow: '0 20px 40px rgba(62,2,21,0.12)',
          display: 'flex', alignItems: 'center', gap: '36px', whiteSpace: 'nowrap',
        }}>
          <div>
            <span style={{ fontFamily: T.fontBody, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: T.onSurfaceVariant, display: 'block', marginBottom: '2px' }}>Estado</span>
            <span style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 600, color: '#7d5630' }}>Cambios sin guardar</span>
          </div>
          <div style={{ width: '1px', height: '32px', backgroundColor: `${T.outlineVariant}40` }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button disabled={saving} onClick={handleDiscard} style={{ padding: '10px 20px', borderRadius: '9999px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: T.fontBody, fontSize: '13px', fontWeight: 500, color: T.onSurfaceVariant }}>Descartar</button>
            <button disabled={saving} onClick={handleSave} style={{
              padding: '10px 28px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
              backgroundColor: T.primary, color: '#fff', fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700,
              boxShadow: `0 6px 20px rgba(148,69,85,0.30)`, transition: 'transform 0.2s', opacity: saving ? 0.7 : 1
            }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >{saving ? 'Guardando...' : 'Guardar Ajustes'}</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
