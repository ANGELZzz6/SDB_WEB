import { useNavigate, useLocation } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { serviceService, siteConfigService } from '../services/api';
import type { Service, SiteConfig } from '../types';

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
  surfaceContainerHigh: '#ece7e4',
  onSurface: 'var(--color-secondary, #1c1b1a)',
  onSurfaceVariant: '#534245',
  outlineVariant: '#d9c1c3',
};

/* ─────────────────────────────────────────────────
   Shared container style
 ───────────────────────────────────────────────── */
const wrap: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  paddingLeft: '16px',
  paddingRight: '16px',
  width: '100%',
  boxSizing: 'border-box',
};

/* ─────────────────────────────────────────────────
   SERVICES PAGE
 ───────────────────────────────────────────────── */
export default function ServicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState<Service[]>([]);
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

    serviceService.getAll().then(res => {
      if (res.success && res.data) {
        setServices(res.data.filter((s:any) => s.isActive));
      }
      setLoading(false);
    });
  }, []);

  const renderPriceInfo = (svc: any) => {
    const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });
    const pType = svc.precioTipo || 'fijo';
    if (pType === 'consultar') return 'Consultar';
    if (pType === 'rango') {
      const pDesde = svc.precioDesde ? formatter.format(svc.precioDesde).replace(',00', '') : '';
      const pHasta = svc.precioHasta ? formatter.format(svc.precioHasta).replace(',00', '') : '';
      return `${pDesde} - ${pHasta}`;
    }
    return formatter.format(svc.precio || 0).replace(',00', '');
  };

  const navLinks = [
    { label: 'Servicios', path: '/servicios' },
    { label: 'Especialistas', path: '/especialistas' },
    { label: 'Galería', path: '/galeria' },
  ];

  return (
    <div style={{ fontFamily: T.fontBody, color: T.onSurface, backgroundColor: T.surface, overflowX: 'hidden' }}>

      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::selection { background: #ffd9de; color: #944555; }

        .nav-links { display: none; }
        @media (min-width: 768px) { .nav-links { display: flex; } }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
          gap: 24px;
          width: 100%;
        }

        .service-card {
          width: 100%;
          min-width: 0;
          overflow: hidden;
          background: ${T.surfaceContainerLowest};
          border-radius: 16px;
          padding: 32px;
          transition: all 0.4s ease;
          border: 1px solid transparent;
          display: flex;
          flex-direction: column;
          cursor: default;
        }
        .service-card:hover {
          transform: scale(1.02);
          box-shadow: 0 20px 40px rgba(62,2,21,0.07);
          border-color: rgba(255,217,222,0.4);
        }
        .service-card:hover .icon-circle {
          background-color: ${T.primaryFixed} !important;
        }

        .editorial-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: center;
        }
        @media (min-width: 768px) {
          .editorial-grid { grid-template-columns: repeat(2, 1fr); gap: 64px; }
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 32px;
        }

        .floating-bar {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          width: 90%;
          max-width: 520px;
        }
      `}</style>

      {/* ══════════════════════════════
          NAVBAR
      ══════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        backgroundColor: 'rgba(253,248,245,0.75)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${T.outlineVariant}25`,
      }}>
        <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
          <span
            onClick={() => navigate('/')}
            style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: T.primary, cursor: 'pointer', userSelect: 'none' }}
          >
            {config?.nombreSalon || "L'Élixir Salon"}
          </span>

          <div className="nav-links" style={{ alignItems: 'center', gap: '32px' }}>
            {navLinks.map(({ label, path }) => {
              const isActive = location.pathname === path;
              const isHashLink = path.startsWith('/#');
              return (
                <a
                  key={label}
                  href={isHashLink ? path : undefined}
                  onClick={!isHashLink ? (e) => { e.preventDefault(); navigate(path); } : undefined}
                  style={{
                    fontFamily: T.fontHeadline,
                    fontSize: '16px',
                    letterSpacing: '-0.02em',
                    color: isActive ? T.primary : T.onSurfaceVariant,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    borderBottom: isActive ? `1px solid ${T.primary}40` : 'none',
                    paddingBottom: '2px',
                    transition: 'color 0.3s',
                    fontWeight: isActive ? 600 : 400,
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = T.primary)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = isActive ? T.primary : T.onSurfaceVariant)}
                >
                  {label}
                </a>
              );
            })}
          </div>

          <button
            onClick={() => navigate('/chatbot')}
            style={{
              fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              backgroundColor: T.primary, color: T.onPrimary,
              padding: '12px 24px', borderRadius: '9999px', border: 'none',
              cursor: 'pointer', transition: 'transform 0.2s, opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Agendar Cita
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════
          MAIN CONTENT
      ══════════════════════════════ */}
      <main style={{ paddingTop: '128px', paddingBottom: '128px' }}>
        <div style={wrap}>

          {/* ── Editorial Header ── */}
          <header style={{ textAlign: 'center', marginBottom: '80px' }}>
            <span style={{
              fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.3em', color: T.primary,
              display: 'block', marginBottom: '16px',
            }}>
              Nuestras Experiencias
            </span>
            <h1 style={{
              fontFamily: T.fontHeadline, fontStyle: 'italic',
              fontSize: 'clamp(40px, 6vw, 64px)',
              color: T.onSurfaceVariant,
              lineHeight: 1.1, letterSpacing: '-0.03em',
              fontWeight: 400,
            }}>
              {config?.seccionServiciosTitulo || "Rituales de Belleza"}
            </h1>
            <div style={{ width: '96px', height: '1px', backgroundColor: `${T.outlineVariant}60`, margin: '32px auto 0' }} />
          </header>

          {/* ── Services Bento Grid ── */}
          <div className="services-grid">
            {loading ? (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', fontFamily: T.fontBody, color: T.onSurfaceVariant }}>Cargando experiencias...</p>
            ) : services.length > 0 ? (
              services.map((svc) => (
                <div key={svc._id} className="service-card">

                  {/* Card top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div
                      className="icon-circle"
                      style={{
                        width: '48px', height: '48px', borderRadius: '9999px',
                        backgroundColor: T.surfaceContainer,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '22px', transition: 'background-color 0.3s',
                        flexShrink: 0,
                      }}
                    >
                      ✨
                    </div>
                    <span style={{
                      fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.18em',
                      color: `${T.onSurfaceVariant}80`,
                    }}>
                      Beauty Experince
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontFamily: T.fontHeadline, fontStyle: 'italic',
                    fontSize: '24px', color: '#3D2B1F',
                    marginBottom: '8px', letterSpacing: '-0.01em',
                  }}>
                    {svc.nombre}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontFamily: T.fontBody, fontSize: '14px',
                    color: T.onSurfaceVariant, lineHeight: 1.75,
                    marginBottom: '24px', flex: 1,
                  }}>
                    {svc.descripcion}
                  </p>

                  {/* Specialist tag */}
                  <p style={{
                    fontFamily: T.fontBody, fontSize: '11px', fontWeight: 600,
                    color: T.primaryContainer, marginBottom: '16px',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    con {svc.empleadas && svc.empleadas.length > 0 ? (svc.empleadas as any).map((e:any) => e.nombre).join(' · ') : 'Nuestro Equipo'}
                  </p>

                  {/* Divider */}
                  <div style={{ height: '1px', backgroundColor: `${T.outlineVariant}30`, marginBottom: '16px' }} />

                  {/* Price + Duration */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{
                        fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        color: `${T.onSurfaceVariant}60`, display: 'block',
                      }}>
                        {svc.precioTipo === 'consultar' ? 'Precio' : 'Desde'}
                      </span>
                      <span style={{ fontFamily: T.fontBody, fontSize: '16px', fontWeight: 600, color: T.primary }}>
                        {renderPriceInfo(svc)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: `${T.onSurfaceVariant}70` }}>
                      <Clock style={{ width: '14px', height: '14px' }} />
                      <span style={{ fontFamily: T.fontBody, fontSize: '13px' }}>{svc.duracion} min</span>
                    </div>
                  </div>

                  {/* Book button */}
                  <button
                    onClick={() => navigate('/chatbot')}
                    style={{
                      marginTop: '20px', width: '100%',
                      fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      backgroundColor: 'transparent', color: T.primary,
                      border: `1px solid ${T.primaryFixed}`,
                      padding: '11px 0', borderRadius: '9999px', cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = T.primary;
                      e.currentTarget.style.borderColor = T.primary;
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = T.primaryFixed;
                      e.currentTarget.style.color = T.primary;
                    }}
                  >
                    Reservar
                  </button>
                </div>
              ))
            ) : (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', fontFamily: T.fontBody, color: T.onSurfaceVariant }}>No hay servicios disponibles actualmente.</p>
            )}
          </div>

          {/* ── Editorial Image Section ── */}
          <div className="editorial-grid" style={{ marginTop: '96px' }}>

            {/* Image */}
            <div style={{ position: 'relative', aspectRatio: '4/5', borderRadius: '16px', overflow: 'hidden', backgroundColor: T.surfaceContainerHigh }}>
              <img
                alt="Beauty Salon Atmosphere"
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=700&h=875&fit=crop"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  filter: 'grayscale(20%)', transition: 'filter 1s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.filter = 'grayscale(0%)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.filter = 'grayscale(20%)')}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(253,248,245,0.3), transparent)' }} />
            </div>

            {/* Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <span style={{
                fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.2em', color: T.primary,
              }}>
                Nuestro Compromiso
              </span>

              <h2 style={{
                fontFamily: T.fontHeadline, fontStyle: 'italic',
                fontSize: 'clamp(32px, 4vw, 44px)', color: T.onSurfaceVariant,
                lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400,
              }}>
                Donde el arte se encuentra con el cuidado personal.
              </h2>

              <p style={{
                fontFamily: T.fontBody, fontSize: '17px', fontWeight: 300,
                color: `${T.onSurfaceVariant}CC`, lineHeight: 1.85,
              }}>
                En Beauty Salon, cada servicio es una experiencia diseñada para resaltar tu esencia única. Usamos productos de origen ético y técnicas de vanguardia para resultados que trascienden el tiempo.
              </p>

              {/* Stats mini */}
              <div style={{ display: 'flex', gap: '40px', paddingTop: '8px' }}>
                {[
                  { val: '8', lbl: 'Servicios' },
                  { val: '2', lbl: 'Especialistas' },
                  { val: '15h', lbl: 'De atención' },
                ].map(({ val, lbl }) => (
                  <div key={lbl}>
                    <div style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '28px', color: T.primary }}>{val}</div>
                    <div style={{ fontFamily: T.fontBody, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: `${T.onSurfaceVariant}80`, marginTop: '4px' }}>{lbl}</div>
                  </div>
                ))}
              </div>

              <a
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  fontFamily: T.fontBody, fontSize: '14px', fontWeight: 600,
                  color: T.primary, textDecoration: 'none', cursor: 'pointer',
                  transition: 'gap 0.3s',
                  paddingTop: '8px',
                }}
                onClick={() => navigate('/#especialistas')}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.gap = '14px')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.gap = '8px')}
              >
                Conoce a nuestro equipo
                <span style={{ fontSize: '18px' }}>→</span>
              </a>
            </div>

          </div>

        </div>
      </main>

      {/* ══════════════════════════════
          FOOTER
      ══════════════════════════════ */}
      <footer style={{ backgroundColor: T.surfaceContainer, paddingTop: '64px', paddingBottom: '32px' }}>
        <div style={{ ...wrap, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
          <span style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.primary }}>
            {config?.nombreSalon || "L'Élixir Salon"}
          </span>

          <div className="footer-links">
            {[
              { label: 'Instagram', url: config?.instagram ? `https://instagram.com/${config.instagram.replace('@', '')}` : '#' },
              { label: 'Facebook', url: config?.facebook ? (config.facebook.startsWith('http') ? config.facebook : `https://facebook.com/${config.facebook}`) : '#' },
              { label: 'WhatsApp', url: config?.whatsappLink || `https://wa.me/57${config?.whatsapp.replace(/\D/g, '') || "3000000000"}` },
            ].map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: T.fontBody, fontSize: '11px', fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.15em',
                  color: T.onSurfaceVariant, textDecoration: 'none',
                  transition: 'opacity 0.3s', opacity: 0.8,
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.4')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.8')}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div style={{ width: '100%', height: '1px', backgroundColor: `${T.outlineVariant}30`, margin: '8px 0' }} />

          <p style={{ fontFamily: T.fontBody, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: `${T.onSurfaceVariant}80` }}>
            {config?.footerTexto || `© ${new Date().getFullYear()} L'Élixir Salon. El Arte de Cuidarte.`}
          </p>
        </div>
      </footer>

      {/* ══════════════════════════════
          FLOATING BOOKING BAR
      ══════════════════════════════ */}
      <div className="floating-bar">
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '9999px',
          padding: '16px 28px',
          boxShadow: '0 20px 40px rgba(62,2,21,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '16px',
        }}>
          <div>
            <span style={{
              fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.15em',
              color: `${T.onSurfaceVariant}80`, display: 'block',
            }}>
              ¿Lista para brillar?
            </span>
            <span style={{ fontFamily: T.fontBody, fontSize: '14px', fontWeight: 600, color: T.onSurface }}>
              Reserva tu experiencia hoy
            </span>
          </div>
          <button
            onClick={() => navigate('/chatbot')}
            style={{
              fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              backgroundColor: T.primary, color: '#FFFFFF',
              padding: '12px 24px', borderRadius: '9999px', border: 'none',
              cursor: 'pointer', transition: 'box-shadow 0.3s',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(148,69,85,0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            Agendar
          </button>
        </div>
      </div>

    </div>
  );
}
