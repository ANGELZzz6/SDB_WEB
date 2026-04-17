import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { employeeService, siteConfigService } from '../services/api';
import type { Employee, SiteConfig } from '../types';

/* ─────────────────────────────────────────────────
   Design Tokens
 ───────────────────────────────────────────────── */
const T = {
  fontHeadline: "'Noto Serif', serif",
  fontBody: "'Plus Jakarta Sans', sans-serif",
  primary: 'var(--color-primary, #944555)',
  primaryContainer: '#e8899a',
  primaryFixed: '#ffd9de',
  primaryFixedDim: '#ffb2be',
  onPrimary: '#ffffff',
  surface: 'var(--color-accent, #fdf8f5)',
  surfaceContainerLow: '#f8f3f0',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer: '#f2edea',
  onSurface: 'var(--color-secondary, #1c1b1a)',
  onSurfaceVariant: '#534245',
  outlineVariant: '#d9c1c3',
  onSecondaryContainer: '#7a532e',
};

const wrap: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  paddingLeft: '16px',
  paddingRight: '16px',
  width: '100%',
  boxSizing: 'border-box',
};

/* ─────────────────────────────────────────────────
   Shared Navbar
 ───────────────────────────────────────────────── */
function Navbar({ navigate, location, config }: { navigate: ReturnType<typeof useNavigate>; location: ReturnType<typeof useLocation>; config: SiteConfig | null }) {
  const links = [
    { label: 'Servicios', path: '/servicios' },
    { label: 'Especialistas', path: '/especialistas' },
    { label: 'Galería', path: '/galeria' },
  ];
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
      backgroundColor: 'rgba(253,248,245,0.75)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      borderBottom: `1px solid ${T.outlineVariant}20`,
    }}>
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
        <span onClick={() => navigate('/')} style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: T.primary, cursor: 'pointer', userSelect: 'none' }}>
          {config?.nombreSalon || "L'Élixir Salon"}
        </span>
        <div className="nav-links" style={{ alignItems: 'center', gap: '40px' }}>
          {links.map(({ label, path }) => {
            const active = location.pathname === path;
            const isHashLink = path.startsWith('/#');
            return (
              <button key={label} onClick={() => isHashLink ? (window.location.href = path) : navigate(path)} style={{
                fontFamily: T.fontHeadline, fontSize: '16px', letterSpacing: '-0.02em',
                color: active ? T.primary : T.onSurfaceVariant,
                fontWeight: active ? 600 : 400,
                background: 'none', border: 'none',
                borderBottom: active ? `1px solid ${T.primary}35` : 'none',
                paddingBottom: active ? '2px' : 0,
                cursor: 'pointer', transition: 'color 0.3s',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = active ? T.primary : T.onSurfaceVariant)}
              >{label}</button>
            );
          })}
        </div>
        <button onClick={() => navigate('/chatbot')} style={{
          fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          backgroundColor: T.primary, color: '#FFFFFF',
          padding: '12px 24px', borderRadius: '9999px', border: 'none',
          cursor: 'pointer', transition: 'transform 0.2s',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Agendar Cita
        </button>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────────
   Shared Footer
 ───────────────────────────────────────────────── */
function Footer({ config }: { config: SiteConfig | null }) {
  return (
    <footer style={{ backgroundColor: T.surfaceContainer, paddingTop: '64px', paddingBottom: '32px' }}>
      <div style={{ ...wrap, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
        <span style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.primary }}>{config?.nombreSalon || "L'Élixir Salon"}</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '32px' }}>
          {[
            { label: 'Instagram', url: config?.instagram ? `https://instagram.com/${config.instagram.replace('@', '')}` : '#' },
            { label: 'Facebook', url: config?.facebook ? (config.facebook.startsWith('http') ? config.facebook : `https://facebook.com/${config.facebook}`) : '#' },
            { label: 'WhatsApp', url: config?.whatsappLink || `https://wa.me/57${config?.whatsapp.replace(/\D/g, '') || "3000000000"}` },
          ].map((link) => (
            <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, textDecoration: 'none', opacity: 0.8, transition: 'opacity 0.3s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.4')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.8')}
            >{link.label}</a>
          ))}
        </div>
        <div style={{ width: '100%', height: '1px', backgroundColor: `${T.outlineVariant}30`, margin: '8px 0' }} />
        <p style={{ fontFamily: T.fontBody, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: `${T.onSurfaceVariant}80` }}>
          {config?.footerTexto || `© ${new Date().getFullYear()} L'Élixir Salon. El Arte de Cuidarte.`}
        </p>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────
   SPECIALISTS PAGE
 ───────────────────────────────────────────────── */
export default function SpecialistsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    // Cargar configuración CMS
    siteConfigService.get().then(res => {
      if (res.success && res.data) {
        setConfig(res.data);
        // Inyectar colores dinámicos
        document.documentElement.style.setProperty('--color-primary', res.data.colorPrimario);
        document.documentElement.style.setProperty('--color-secondary', res.data.colorSecundario);
        document.documentElement.style.setProperty('--color-accent', res.data.colorAcento);
      }
    });

    employeeService.getAll().then(res => {
      if (res.success && res.data) {
        setEmployees(res.data.filter((e:any) => e.isActive));
      }
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ fontFamily: T.fontBody, color: T.onSurface, backgroundColor: T.surface, overflowX: 'hidden' }}>
      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: #ffd9de; color: #944555; }
        .nav-links { display: none; }
        @media (min-width: 768px) { .nav-links { display: flex; } }

        .specialists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
          gap: 32px;
          width: 100%;
        }
        @media (min-width: 768px) {
          .specialists-grid {
            gap: 96px;
            align-items: start;
          }
          .specialist-card:nth-child(even) {
            margin-top: 64px;
          }
        }

        .specialist-card {
          width: 100%;
          min-width: 0;
          overflow: hidden;
          position: relative;
          background: ${T.surfaceContainerLowest};
          border-radius: 2rem;
          padding: 40px 48px;
          border: 1px solid rgba(217, 193, 195, 0.3);
          border-bottom: 3px solid ${T.primaryFixed};
          box-shadow: 0 8px 32px rgba(148, 69, 85, 0.04);
          transition: all 0.5s;
        }
        .specialist-card::before {
          content: '';
          position: absolute;
          inset: -16px;
          background: rgba(255,217,222,0.25);
          border-radius: 2.5rem;
          z-index: -1;
          filter: blur(24px);
          opacity: 0;
          transition: opacity 0.6s;
        }
        .specialist-card:hover::before { opacity: 1; }
        .specialist-card:hover { 
          transform: translateY(-4px);
          box-shadow: 0 24px 64px rgba(148,69,85,0.12);
          border-color: rgba(255, 217, 222, 0.8);
        }

        .service-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid ${T.outlineVariant}18;
          transition: padding-left 0.3s;
        }
        .service-row:last-child { border-bottom: none; }
        .service-row:hover { padding-left: 8px; }

        .floating-bar {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          width: 90%;
          max-width: 520px;
        }

        @media (max-width: 768px) {
          .specialist-card { padding: 32px 24px; }
          .specialist-header { flex-direction: column !important; align-items: center !important; text-align: center; }
          .specialist-header .name-block { align-items: center !important; }
        }
      `}</style>

      <Navbar navigate={navigate} location={location} config={config} />

      <main style={{ paddingTop: '128px', paddingBottom: '128px' }}>
        <div style={wrap}>

          {/* ── Header ── */}
          <header style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 80px', padding: '0 16px' }}>
            <span style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: T.primary, display: 'block', marginBottom: '16px' }}>
              Nuestro Equipo
            </span>
            <h1 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: 'clamp(40px, 6vw, 56px)', color: T.onSurface, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '20px', fontWeight: 400 }}>
              {config?.seccionEspecialistasTitulo || "Conoce a Nuestras Especialistas"}
            </h1>
            <p style={{ fontFamily: T.fontBody, fontSize: '17px', color: T.onSurfaceVariant, lineHeight: 1.8, fontWeight: 300 }}>
              Cada tratamiento es ejecutado por artistas apasionadas que entienden que la belleza es un ritual personal y único.
            </p>
          </header>

          {/* ── Specialists Grid ── */}
          <div className="specialists-grid">
            {loading ? (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', fontFamily: T.fontBody, color: T.onSurfaceVariant }}>Cargando especialistas...</p>
            ) : employees.length > 0 ? (
              employees.map((emp) => (
                <div key={emp._id} className="specialist-card">

                  {/* Card header: photo + name */}
                  <div className="specialist-header" style={{ display: 'flex', alignItems: 'flex-start', gap: '28px', marginBottom: '36px' }}>
                    {/* Photo */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: '112px', height: '112px', borderRadius: '9999px', overflow: 'hidden', border: `4px solid ${T.surfaceContainer}`, boxShadow: '0 4px 16px rgba(148,69,85,0.12)' }}>
                        <img src={emp.foto || "https://i.pravatar.cc/300?img=1"} alt={emp.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                      {/* Verified badge */}
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: '28px', height: '28px', borderRadius: '9999px',
                        backgroundColor: T.primaryContainer,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(148,69,85,0.25)',
                        fontSize: '14px',
                      }}>
                        ✓
                      </div>
                    </div>

                    {/* Name + role block */}
                    <div className="name-block" style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px' }}>
                      <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '32px', color: T.primary, letterSpacing: '-0.02em', fontWeight: 700, margin: 0 }}>
                        {emp.nombre}
                      </h2>
                      <p style={{ fontFamily: T.fontBody, fontSize: '16px', fontWeight: 500, fontStyle: 'italic', color: T.onSecondaryContainer, margin: 0 }}>
                        Expert Artist
                      </p>
                      {/* Specialty pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {(emp.especialidades || []).slice(0, 3).map((s) => (
                          <span key={s} style={{
                            fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            backgroundColor: T.primaryFixed, color: T.primary,
                            padding: '4px 12px', borderRadius: '9999px',
                          }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Services list */}
                  <div>
                    <h3 style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: `${T.onSurfaceVariant}80`, marginBottom: '8px', paddingBottom: '10px', borderBottom: `1px solid ${T.outlineVariant}25` }}>
                      Servicios Destacados
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', minHeight: '120px' }}>
                      {emp.servicios && emp.servicios.length > 0 ? (emp.servicios as any).map((s: any) => (
                        <li key={s._id} className="service-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: T.primaryFixedDim, flexShrink: 0 }} />
                            <span style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface }}>{s.nombre}</span>
                          </div>
                          <span style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '14px', color: T.primary, fontWeight: 700 }}>
                            ${(s.precio || 0).toLocaleString()}
                          </span>
                        </li>
                      )) : (
                        <li style={{ padding: '20px', textAlign: 'center', color: T.onSurfaceVariant, opacity: 0.5, fontStyle: 'italic', fontSize: '14px' }}>
                          Sin servicios específicos asignados.
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Book button */}
                  <button
                    onClick={() => navigate('/chatbot')}
                    style={{
                      width: '100%', fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                      backgroundColor: T.primary, color: '#FFFFFF',
                      padding: '16px 0', borderRadius: '9999px', border: 'none',
                      cursor: 'pointer', transition: 'all 0.3s',
                      boxShadow: '0 8px 24px rgba(148,69,85,0.20)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#772e3e'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(148,69,85,0.30)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.primary; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(148,69,85,0.20)'; }}
                  >
                    Agendar con {emp.nombre}
                  </button>
                </div>
              ))
            ) : (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', fontFamily: T.fontBody, color: T.onSurfaceVariant }}>Próximamente conocerás a nuestro equipo.</p>
            )}
          </div>

        </div>
      </main>

      <Footer config={config} />

      {/* Floating Booking Bar */}
      <div className="floating-bar">
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${T.primaryFixed}50`,
          borderRadius: '9999px', padding: '14px 24px',
          boxShadow: '0 20px 40px rgba(62,2,21,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          {/* Avatar stack */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            {employees.slice(0, 3).map((emp, i) => (
              <img key={emp._id} src={emp.foto || "https://i.pravatar.cc/300?img=1"} alt={emp.nombre}
                style={{ width: '32px', height: '32px', borderRadius: '9999px', objectFit: 'cover', border: '2px solid #FFFFFF', marginLeft: i > 0 ? '-10px' : 0 }}
              />
            ))}
          </div>
          <p style={{ fontFamily: T.fontBody, fontSize: '14px', fontWeight: 600, color: T.primary, flex: 1 }}>
            ¿Lista para brillar?
          </p>
          <button
            onClick={() => navigate('/chatbot')}
            style={{
              fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              backgroundColor: T.primary, color: '#FFFFFF',
              padding: '10px 20px', borderRadius: '9999px', border: 'none',
              cursor: 'pointer', transition: 'transform 0.2s',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Reservar Ahora
          </button>
        </div>
      </div>
    </div>
  );
}
