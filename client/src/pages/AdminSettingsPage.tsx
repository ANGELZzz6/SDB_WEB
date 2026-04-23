import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { settingsService, siteConfigService } from '../services/api';
import type { Settings, SiteConfig } from '../types';
import { WA_MESSAGES } from '../utils/whatsappMessages';

/* ─────────────────────────────────────────────────
   REUSABLE UTILITY COMPONENTS
   (Defined outside to prevent re-mounting on state updates)
───────────────────────────────────────────────── */
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

const UnderlineInput = ({ value, onChange, type = "text", placeholder = "" }: { value: string | number, onChange: (v: string) => void, type?: string, placeholder?: string }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
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

const UnderlineTextarea = ({ value, onChange, rows = 3, placeholder = "" }: { value: string, onChange: (v: string) => void, rows?: number, placeholder?: string }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={rows}
    placeholder={placeholder}
    style={{
      width: '100%', backgroundColor: 'transparent', border: 'none',
      borderBottom: `1px solid ${T.outlineVariant}40`, padding: '8px 0',
      fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface,
      transition: 'border-color 0.2s', resize: 'none'
    }}
    onFocus={(e) => (e.currentTarget.style.borderBottomColor = T.primary)}
    onBlur={(e) => (e.currentTarget.style.borderBottomColor = `${T.outlineVariant}40`)}
  />
);

const UnderlineSelect = ({ value, onChange, options }: { value: string | number, onChange: (v: string) => void, options: { value: string | number, label: string }[] }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      width: '100%', backgroundColor: 'transparent', border: 'none',
      borderBottom: `2px solid ${T.outlineVariant}40`, padding: '10px 0',
      fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface,
      cursor: 'pointer', appearance: 'none', outline: 'none',
      transition: 'border-color 0.2s',
    }}
    onFocus={(e) => (e.currentTarget.style.borderBottomColor = T.primary)}
    onBlur={(e) => (e.currentTarget.style.borderBottomColor = `${T.outlineVariant}40`)}
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cmsTab, setCmsTab] = useState<'negocio' | 'redes' | 'textos' | 'imagenes' | 'colores' | 'whatsapp'>('negocio');
  
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

  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    nombreSalon: '',
    telefono: '',
    whatsapp: '',
    direccion: '',
    horario: '',
    instagram: '',
    facebook: '',
    whatsappLink: '',
    heroTitulo: '',
    heroSubtitulo: '',
    heroBotonTexto: '',
    seccionServiciosTitulo: '',
    seccionEspecialistasTitulo: '',
    footerTexto: '',
    colorPrimario: '#944555',
    colorSecundario: '#3e0215',
    colorAcento: '#fdf8f9',
    heroImagenUrl: '',
    heroVideoUrl: '',
    fondoImagenUrl: '',
    mensajeConfirmacion: '',
    mensajeCancelacion: '',
    mensajeReagendamiento: '',
    mensajeRechazoConflicto: '',
    mensajeCompletada: '',
    horaAperturaAgendamiento: '08:00',
    horaCierreAgendamiento: '19:00',
    duracionSlot: 30
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [hasCmsChanges, setHasCmsChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<Settings | null>(null);
  const [originalCms, setOriginalCms] = useState<SiteConfig | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [resSettings, resConfig] = await Promise.all([
          settingsService.get(),
          siteConfigService.get()
        ]);

        if (resSettings.success && resSettings.data) {
          setSettings(resSettings.data);
          setOriginalSettings(resSettings.data);
        }
        if (resConfig.success && resConfig.data) {
          setSiteConfig(resConfig.data);
          setOriginalCms(resConfig.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleChange = (field: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleCmsChange = (field: keyof SiteConfig, value: any) => {
    setSiteConfig(prev => ({ ...prev, [field]: value }));
    setHasCmsChanges(true);
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
      const promises = [];
      
      if (hasChanges) {
        promises.push(settingsService.update(settings));
      }
      if (hasCmsChanges) {
        promises.push(siteConfigService.update(siteConfig));
      }

      const results = await Promise.all(promises);
      
      // Check if all were successful
      const allSuccess = results.every(r => r.success);
      if (allSuccess) {
        if (hasChanges) {
          const res = results[0]; // First one if both changed
          if (res.data) {
            setSettings(res.data as Settings);
            setOriginalSettings(res.data as Settings);
          }
        }
        if (hasCmsChanges) {
          const res = hasChanges ? results[1] : results[0];
          if (res.data) {
            setSiteConfig(res.data as SiteConfig);
            setOriginalCms(res.data as SiteConfig);
          }
        }
        setHasChanges(false);
        setHasCmsChanges(false);
        alert('Cambios guardados correctamente');
      }
    } catch (error) {
      console.error(error);
      alert('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
    }
    if (originalCms) {
      setSiteConfig(originalCms);
      setHasCmsChanges(false);
    }
  };

  const openCloudinary = (field: 'heroImagenUrl' | 'fondoImagenUrl' | 'heroVideoUrl') => {
    if (!(window as any).cloudinary) {
      alert('Cloudinary widget is not loaded yet. Please wait.');
      return;
    }
    const myWidget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName: 'dz1gbtqnc',
        apiKey: '512765153651593',
        uploadPreset: 'salon_uploads',
        sources: ['local', 'camera', 'url'],
        multiple: false
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          handleCmsChange(field, result.info.secure_url);
        }
      }
    );
    myWidget.open();
  };

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
        @media (max-width: 768px) {
          .admin-settings-container { padding: 24px 16px 160px !important; }
          .admin-settings-header { margin-bottom: 24px !important; }
          .admin-settings-header h2 { font-size: 32px !important; }
          .settings-two-col { grid-template-columns: 1fr !important; gap: 20px !important; }
          .settings-inner-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .settings-social-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .cms-tabs-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .floating-save-bar { bottom: 90px !important; width: 90% !important; padding: 12px 20px !important; gap: 16px !important; flex-direction: column !important; border-radius: 20px !important; left: 5% !important; transform: none !important; margin-left: 0 !important; }
          .floating-save-bar > div:first-child { display: none; }
          .floating-save-bar > div:nth-child(2) { display: none; }
          .floating-save-bar > div:last-child { width: 100%; display: flex; gap: 8px; }
          .floating-save-bar button { flex: 1; padding: 10px !important; font-size: 11px !important; }
        }
        .settings-two-col {
          display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
        }
      `}</style>

      <div className="admin-settings-container" style={{ padding: '40px 48px 140px', maxWidth: '900px' }}>
        {/* Page header */}
        <div className="admin-settings-header" style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '40px', color: T.primary, letterSpacing: '-0.02em', fontWeight: 700, marginBottom: '6px' }}>Configuración</h2>
          <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant }}>Personaliza la experiencia de tu salón y gestiona las reglas de operación.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Business Info */}
          <SectionCard>
            <SectionTitle icon="🏪" title="Operación del Negocio" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div>
                <FieldLabel>Días Máximos de Reserva Adelantada</FieldLabel>
                <UnderlineInput value={settings.maxDaysInAdvance} onChange={(v) => handleChange('maxDaysInAdvance', Number(v))} type="number" />
              </div>

              <div>
                <FieldLabel>Horarios Generales de Atención</FieldLabel>
                <div className="settings-inner-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '8px' }}>
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

          {/* CMS SECTION — PERSONALIZACIÓN */}
          <SectionCard style={{ marginTop: '16px' }}>
            <SectionTitle icon="🎨" title="Personalización del Sitio" />
            
            {/* CMS Tabs */}
            <div className="cms-tabs-container" style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: `1px solid ${T.outlineVariant}20`, paddingBottom: '12px' }}>
              {[
                { id: 'negocio', label: 'Negocio', icon: '🏢' },
                { id: 'redes', label: 'Redes', icon: '📱' },
                { id: 'textos', label: 'Textos Landing', icon: '✍️' },
                { id: 'imagenes', label: 'Imágenes', icon: '🖼️' },
                { id: 'colores', label: 'Colores', icon: '✨' },
                { id: 'whatsapp', label: 'WhatsApp', icon: '📲' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCmsTab(tab.id as any)}
                  className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold shrink-0"
                  style={{
                    border: 'none',
                    backgroundColor: cmsTab === tab.id ? T.primary : 'transparent',
                    color: cmsTab === tab.id ? 'white' : T.onSurfaceVariant,
                    fontFamily: T.fontBody,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>

            <div className="settings-inner-grid">
              
              {/* TAB 1: NEGOCIO */}
              <div style={{ display: cmsTab === 'negocio' ? 'block' : 'none', width: '100%' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div>
                    <FieldLabel>Nombre Comercial</FieldLabel>
                    <UnderlineInput value={siteConfig.nombreSalon} onChange={(v) => handleCmsChange('nombreSalon', v)} />
                  </div>
                  <div>
                    <FieldLabel>Teléfono Público</FieldLabel>
                    <UnderlineInput value={siteConfig.telefono} onChange={(v) => handleCmsChange('telefono', v)} />
                  </div>
                  <div>
                    <FieldLabel>WhatsApp (Solo números)</FieldLabel>
                    <UnderlineInput value={siteConfig.whatsapp} onChange={(v) => handleCmsChange('whatsapp', v)} />
                  </div>
                  <div>
                    <FieldLabel>Dirección Física</FieldLabel>
                    <UnderlineInput value={siteConfig.direccion} onChange={(v) => handleCmsChange('direccion', v)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700, color: T.onSurfaceVariant, marginBottom: '6px' }}>Enlace del Mapa (Google Maps Embed URL)</label>
                    <UnderlineInput 
                      value={siteConfig.mapaUrl || ''} 
                      onChange={(v) => handleCmsChange('mapaUrl', v)} 
                      placeholder="https://www.google.com/maps/embed?..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel>Horario de Atención (Texto)</FieldLabel>
                    <UnderlineTextarea value={siteConfig.horario} onChange={(v) => handleCmsChange('horario', v)} rows={2} />
                  </div>

                  <div className="md:col-span-2" style={{ marginTop: '24px', borderTop: `1px solid ${T.outlineVariant}20`, paddingTop: '32px' }}>
                    <SectionTitle icon="🕐" title="Horario de Agendamiento" />
                    <p style={{ fontSize: '13px', color: T.onSurfaceVariant, marginBottom: '24px', marginTop: '-16px' }}>
                      Define el rango de horas en que los clientes pueden agendar citas
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <FieldLabel>Hora de Apertura</FieldLabel>
                        <UnderlineInput type="time" value={siteConfig.horaAperturaAgendamiento || '08:00'} onChange={(v) => handleCmsChange('horaAperturaAgendamiento', v)} />
                      </div>
                      <div>
                        <FieldLabel>Hora de Cierre</FieldLabel>
                        <UnderlineInput type="time" value={siteConfig.horaCierreAgendamiento || '19:00'} onChange={(v) => handleCmsChange('horaCierreAgendamiento', v)} />
                      </div>
                      <div>
                        <FieldLabel>Duración de cada Turno (Slot)</FieldLabel>
                        <UnderlineSelect 
                          value={siteConfig.duracionSlot || 30} 
                          onChange={(v) => handleCmsChange('duracionSlot', Number(v))}
                          options={[
                            { value: 15, label: '15 minutos' },
                            { value: 30, label: '30 minutos' },
                            { value: 45, label: '45 minutos' },
                            { value: 60, label: '60 minutos (1 hora)' },
                          ]}
                        />
                      </div>
                    </div>
                    
                    <p style={{ fontSize: '12px', color: T.onSurfaceVariant, marginTop: '20px', fontStyle: 'italic', opacity: 0.8 }}>
                      ⚠️ Estos cambios afectan la generación de turnos disponibles. Las citas ya agendadas no se verán afectadas.
                    </p>
                  </div>
                </div>
              </div>

              {/* TAB 2: REDES */}
              <div style={{ display: cmsTab === 'redes' ? 'block' : 'none', width: '100%' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div>
                    <FieldLabel>Instagram (@handle)</FieldLabel>
                    <UnderlineInput value={siteConfig.instagram} onChange={(v) => handleCmsChange('instagram', v)} />
                  </div>
                  <div>
                    <FieldLabel>Facebook (Handle o URL)</FieldLabel>
                    <UnderlineInput value={siteConfig.facebook} onChange={(v) => handleCmsChange('facebook', v)} />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel>Link Directo WhatsApp (Opcional)</FieldLabel>
                    <UnderlineInput value={siteConfig.whatsappLink} onChange={(v) => handleCmsChange('whatsappLink', v)} placeholder="https://wa.me/..." />
                  </div>
                </div>
              </div>

              {/* TAB 3: TEXTOS LANDING */}
              <div style={{ display: cmsTab === 'textos' ? 'block' : 'none', width: '100%' }}>
                <div className="grid grid-cols-1 gap-6 w-full">
                  <div>
                    <FieldLabel>Título Principal (Hero)</FieldLabel>
                    <UnderlineInput value={siteConfig.heroTitulo} onChange={(v) => handleCmsChange('heroTitulo', v)} />
                  </div>
                  <div>
                    <FieldLabel>Subtítulo (Hero)</FieldLabel>
                    <UnderlineTextarea value={siteConfig.heroSubtitulo} onChange={(v) => handleCmsChange('heroSubtitulo', v)} rows={2} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <FieldLabel>Texto Botón Hero</FieldLabel>
                      <UnderlineInput value={siteConfig.heroBotonTexto} onChange={(v) => handleCmsChange('heroBotonTexto', v)} />
                    </div>
                    <div>
                      <FieldLabel>Título Sección Servicios</FieldLabel>
                      <UnderlineInput value={siteConfig.seccionServiciosTitulo} onChange={(v) => handleCmsChange('seccionServiciosTitulo', v)} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Título Sección Especialistas</FieldLabel>
                    <UnderlineInput value={siteConfig.seccionEspecialistasTitulo} onChange={(v) => handleCmsChange('seccionEspecialistasTitulo', v)} />
                  </div>
                  <div>
                    <FieldLabel>Texto Footer / Copyright</FieldLabel>
                    <UnderlineTextarea value={siteConfig.footerTexto} onChange={(v) => handleCmsChange('footerTexto', v)} rows={2} />
                  </div>
                </div>
              </div>

              {/* TAB 4: IMÁGENES & MEDIOS */}
              <div style={{ display: cmsTab === 'imagenes' ? 'block' : 'none', width: '100%' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                  <div>
                    <FieldLabel>Imagen Hero (Principal)</FieldLabel>
                    <div style={{ position: 'relative', height: '180px', borderRadius: '12px', overflow: 'hidden', backgroundColor: T.surfaceContainerHighest, marginBottom: '12px' }}>
                      {siteConfig.heroImagenUrl ? (
                        <img src={siteConfig.heroImagenUrl} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>Sin imagen</div>
                      )}
                    </div>
                    <button type="button" onClick={() => openCloudinary('heroImagenUrl')} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, background: T.surface, cursor: 'pointer', fontFamily: T.fontBody, fontWeight: 700, fontSize: '12px' }}>
                      {siteConfig.heroImagenUrl ? 'Reemplazar Imagen' : 'Subir Imagen'}
                    </button>
                  </div>
                  <div>
                    <FieldLabel>Video Hero (Secuencial)</FieldLabel>
                    <div style={{ position: 'relative', height: '180px', borderRadius: '12px', overflow: 'hidden', backgroundColor: T.surfaceContainerHighest, marginBottom: '12px' }}>
                      {siteConfig.heroVideoUrl ? (
                        <video src={siteConfig.heroVideoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>Sin video</div>
                      )}
                    </div>
                    <button type="button" onClick={() => openCloudinary('heroVideoUrl')} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, background: T.surface, cursor: 'pointer', fontFamily: T.fontBody, fontWeight: 700, fontSize: '12px' }}>
                      {siteConfig.heroVideoUrl ? 'Reemplazar Video' : 'Subir Video'}
                    </button>
                  </div>
                  <div>
                    <FieldLabel>Imagen Fondo / Textura</FieldLabel>
                    <div style={{ position: 'relative', height: '180px', borderRadius: '12px', overflow: 'hidden', backgroundColor: T.surfaceContainerHighest, marginBottom: '12px' }}>
                      {siteConfig.fondoImagenUrl ? (
                        <img src={siteConfig.fondoImagenUrl} alt="Fondo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>Sin imagen</div>
                      )}
                    </div>
                    <button type="button" onClick={() => openCloudinary('fondoImagenUrl')} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, background: T.surface, cursor: 'pointer', fontFamily: T.fontBody, fontWeight: 700, fontSize: '12px' }}>
                      {siteConfig.fondoImagenUrl ? 'Reemplazar Fondo' : 'Subir Fondo'}
                    </button>
                  </div>
                </div>
              </div>

              {/* TAB 5: COLORES */}
              <div style={{ display: cmsTab === 'colores' ? 'block' : 'none', width: '100%' }}>
                <div className="w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div>
                      <FieldLabel>Color Primario</FieldLabel>
                      <input type="color" value={siteConfig.colorPrimario} onChange={(e) => handleCmsChange('colorPrimario', e.target.value)} style={{ width: '100%', height: '44px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}40`, padding: '2px', cursor: 'pointer' }} />
                    </div>
                    <div>
                      <FieldLabel>Color Secundario</FieldLabel>
                      <input type="color" value={siteConfig.colorSecundario} onChange={(e) => handleCmsChange('colorSecundario', e.target.value)} style={{ width: '100%', height: '44px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}40`, padding: '2px', cursor: 'pointer' }} />
                    </div>
                    <div>
                      <FieldLabel>Color Acento</FieldLabel>
                      <input type="color" value={siteConfig.colorAcento} onChange={(e) => handleCmsChange('colorAcento', e.target.value)} style={{ width: '100%', height: '44px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}40`, padding: '2px', cursor: 'pointer' }} />
                    </div>
                  </div>

                  <FieldLabel>Vista previa de marca</FieldLabel>
                  <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: siteConfig.colorAcento, border: `1px solid ${T.outlineVariant}20`, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                     <h4 style={{ color: siteConfig.colorSecundario, fontFamily: T.fontHeadline, fontSize: '24px', margin: 0 }}>{siteConfig.nombreSalon}</h4>
                     <button type="button" style={{ backgroundColor: siteConfig.colorPrimario, color: 'white', border: 'none', padding: '12px 24px', borderRadius: '9999px', fontFamily: T.fontBody, fontWeight: 700 }}>{siteConfig.heroBotonTexto}</button>
                  </div>
                </div>
              </div>

              {/* TAB 6: WHATSAPP MESSAGES */}
              {cmsTab === 'whatsapp' && (
                <div className="grid grid-cols-1 gap-10 w-full animate-fadeIn" style={{ paddingBottom: '20px' }}>
                  <div style={{ backgroundColor: T.surfaceContainerHighest + '40', padding: '20px', borderRadius: '16px', borderLeft: `4px solid ${T.primary}` }}>
                    <p style={{ fontSize: '13px', color: T.onSurface, fontWeight: 700, marginBottom: '8px' }}>🚀 Potencia tus mensajes con variables</p>
                    <p style={{ fontSize: '12px', color: T.onSurfaceVariant, lineHeight: '1.5' }}>
                      Copia y pega estos comodines en tus plantillas para personalizarlos automáticamente:<br/>
                      <code style={{ background: T.surfaceVariant, padding: '2px 6px', borderRadius: '4px', marginRight: '4px' }}>{'{nombre}'}</code>
                      <code style={{ background: T.surfaceVariant, padding: '2px 6px', borderRadius: '4px', marginRight: '4px' }}>{'{servicio}'}</code>
                      <code style={{ background: T.surfaceVariant, padding: '2px 6px', borderRadius: '4px', marginRight: '4px' }}>{'{fecha}'}</code>
                      <code style={{ background: T.surfaceVariant, padding: '2px 6px', borderRadius: '4px', marginRight: '4px' }}>{'{hora}'}</code>
                      <code style={{ background: T.surfaceVariant, padding: '2px 6px', borderRadius: '4px' }}>{'{especialista}'}</code>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <FieldLabel>✅ Mensaje de Confirmación</FieldLabel>
                      <UnderlineTextarea 
                        value={siteConfig.mensajeConfirmacion} 
                        onChange={(v) => handleCmsChange('mensajeConfirmacion', v)} 
                        rows={3}
                        placeholder={WA_MESSAGES.confirmacion('{nombre}', '{servicio}', '{fecha}', '{hora}')}
                      />
                      <p style={{ fontSize: '11px', color: T.onSurfaceVariant, marginTop: '8px' }}>Se envía al confirmar una cita pendiente.</p>
                    </div>

                    <div>
                      <FieldLabel>🕒 Mensaje de Reagendamiento</FieldLabel>
                      <UnderlineTextarea 
                        value={siteConfig.mensajeReagendamiento} 
                        onChange={(v) => handleCmsChange('mensajeReagendamiento', v)} 
                        rows={3}
                        placeholder={WA_MESSAGES.reagendamiento('{nombre}', '{servicio}', '{fecha}', '{hora}')}
                      />
                      <p style={{ fontSize: '11px', color: T.onSurfaceVariant, marginTop: '8px' }}>Se envía al cambiar fecha, hora o especialista.</p>
                    </div>

                    <div>
                      <FieldLabel>✕ Mensaje de Cancelación</FieldLabel>
                      <UnderlineTextarea 
                        value={siteConfig.mensajeCancelacion} 
                        onChange={(v) => handleCmsChange('mensajeCancelacion', v)} 
                        rows={3}
                        placeholder={WA_MESSAGES.rechazo('{nombre}', '{fecha}')}
                      />
                      <p style={{ fontSize: '11px', color: T.onSurfaceVariant, marginTop: '8px' }}>Se envía cuando una cita es cancelada por el admin o usuario.</p>
                    </div>

                    <div>
                      <FieldLabel>⚠️ Mensaje de Rechazo por Conflicto</FieldLabel>
                      <UnderlineTextarea 
                        value={siteConfig.mensajeRechazoConflicto} 
                        onChange={(v) => handleCmsChange('mensajeRechazoConflicto', v)} 
                        rows={3}
                        placeholder="Lo sentimos {nombre}, el espacio para {fecha} a las {hora} ya no está disponible..."
                      />
                      <p style={{ fontSize: '11px', color: T.onSurfaceVariant, marginTop: '8px' }}>Se envía automáticamente si el espacio se ocupa antes de confirmar.</p>
                    </div>

                    <div className="md:col-span-2">
                      <FieldLabel>✨ Mensaje de Cita Finalizada (Completada)</FieldLabel>
                      <UnderlineTextarea 
                        value={siteConfig.mensajeCompletada} 
                        onChange={(v) => handleCmsChange('mensajeCompletada', v)} 
                        rows={3}
                        placeholder="¡Hola {nombre}! Gracias por visitarnos hoy..."
                      />
                      <p style={{ fontSize: '11px', color: T.onSurfaceVariant, marginTop: '8px' }}>Se envía al marcar una cita como finalizada/cobrada.</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </SectionCard>
        </div>
      </div>

      {/* Floating Save Bar */}
      {(hasChanges || hasCmsChanges) && (
        <div className="floating-save-bar" style={{
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
            <button type="button" disabled={saving} onClick={handleDiscard} style={{ padding: '10px 20px', borderRadius: '9999px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: T.fontBody, fontSize: '13px', fontWeight: 500, color: T.onSurfaceVariant }}>Descartar</button>
            <button type="button" disabled={saving} onClick={(e) => { e.preventDefault(); handleSave(); }} style={{
              padding: '10px 28px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
              backgroundColor: T.primary, color: '#fff', fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700,
              boxShadow: `0 6px 20px rgba(148,69,85,0.30)`, transition: 'transform 0.2s', opacity: saving ? 0.7 : 1
            }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
