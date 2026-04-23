import { useNavigate } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { serviceService, galleryService, employeeService, siteConfigService, settingsService } from '../services/api';
import type { Employee, Service, SiteConfig } from '../types';

/* ─────────────────────────────────────────────────
   Design Tokens
 ───────────────────────────────────────────────── */
const T = {
  fontHeadline: "'Noto Serif', serif",
  fontBody: "'Plus Jakarta Sans', sans-serif",
  primary: 'var(--color-primary, #944555)',
  primaryContainer: '#e8899a',
  primaryFixed: '#ffd9de',
  onPrimary: '#ffffff',
  surface: 'var(--color-accent, #fdf8f5)',
  surfaceContainerLow: '#f8f3f0',
  surfaceContainerLowest: '#ffffff',
  onSurface: 'var(--color-secondary, #1c1b1a)',
  onSurfaceVariant: '#534245',
  outlineVariant: '#d9c1c3',
};

/* ─────────────────────────────────────────────────
   Business Data
 ───────────────────────────────────────────────── */
const SERVICES = [
  { icon: '🎨', title: 'Coloración & Tintes', desc: 'Colorimetría profesional, mechas y balayage con productos de alta gama.' },
  { icon: '✂️', title: 'Cepillado Profesional', desc: 'Keratinas, alisados y cepillado para un cabello impecable y brillante.' },
  { icon: '💅', title: 'Manicure & Pedicura', desc: 'Tradicional, semipermanente y diseños artísticos en Softgel.' },
  { icon: '✨', title: 'Diseño de Cejas', desc: 'Depilación e iluminación para unas cejas perfectamente definidas.' },
  { icon: '👁️', title: 'Extensión de Pestañas', desc: 'Volumen clásico, híbrido y megavolumen para una mirada irresistible.' },
  { icon: '💎', title: 'Uñas Artísticas', desc: 'Diseños vanguardistas en Softgel de acabado duradero y profesional.' },
];

/* ─────────────────────────────────────────────────
   Reusable Styles
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
   LANDING PAGE
 ───────────────────────────────────────────────── */
/** Convierte "07:00" → "7am", "20:00" → "8pm" */
function formatHour(time: string): string {
  const [hStr] = time.split(':');
  const h = parseInt(hStr, 10);
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalServicesCount, setTotalServicesCount] = useState<number | null>(null);
  const [totalEmployeesCount, setTotalEmployeesCount] = useState<number | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [businessHours, setBusinessHours] = useState<{ inicio: string; fin: string } | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    // Cargar configuración CMS
    siteConfigService.get().then(res => {
      if (res.success && res.data) {
        setConfig(res.data);
        if (res.data.heroVideoUrl) {
          setIsVideoPlaying(true);
        }
        // Inyectar colores dinámicos
        document.documentElement.style.setProperty('--color-primary', res.data.colorPrimario);
        document.documentElement.style.setProperty('--color-secondary', res.data.colorSecundario);
        document.documentElement.style.setProperty('--color-accent', res.data.colorAcento);
      }
    });

    // Cargar horarios generales de atención
    settingsService.get().then(res => {
      if (res.success && res.data?.businessHours) {
        setBusinessHours(res.data.businessHours);
      }
    }).catch(() => { /* Silencioso — el fallback es el texto por defecto */ });

    serviceService.getAll().then(res => {
      if (res.success && res.data) {
        const active = res.data.filter((s:any) => s.isActive);
        setTotalServicesCount(active.length);
        setServices(active.slice(0, 6));
      }
    });
    employeeService.getAll().then(res => {
      if (res.success && res.data) {
        const active = res.data.filter((e:any) => e.isActive);
        setTotalEmployeesCount(active.length);
        setEmployees(active);
      }
    });
    galleryService.getItems().then(res => {
      if (res.success && res.data) {
        setGallery(res.data.map(i => i.url).slice(0, 6));
      }
    });
  }, []);

  const renderPriceInfo = (svc: any) => {
    const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });
    const pType = svc.precioTipo || 'fijo';
    if (pType === 'consultar') return 'Consultar precio';
    if (pType === 'rango') {
      const pDesde = svc.precioDesde ? formatter.format(svc.precioDesde).replace(',00', '') : '';
      const pHasta = svc.precioHasta ? formatter.format(svc.precioHasta).replace(',00', '') : '';
      return `${pDesde} - ${pHasta}`;
    }
    if (!svc.precio || svc.precio === 0) return 'Previa consulta';
    return formatter.format(svc.precio || 0).replace(',00', '');
  };

  const calculateHours = () => {
    if (!businessHours) return '12h';
    const [startH] = businessHours.inicio.split(':').map(Number);
    const [endH] = businessHours.fin.split(':').map(Number);
    const diff = endH - startH;
    return diff > 0 ? `${diff}h` : '12h';
  };

  return (
    <div style={{ fontFamily: T.fontBody, color: T.onSurface, backgroundColor: T.surface, overflowX: 'hidden' }}>

      {/* ══════════════════
          GLOBAL STYLES
      ══════════════════ */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: #ffd9de; color: #944555; }

        /* Navbar responsive */
        .nav-links { display: none; }
        @media (min-width: 768px) { .nav-links { display: flex; } }

        .hamburger {
          display: flex; flex-direction: column; gap: 4px; cursor: pointer; padding: 10px; z-index: 100;
        }
        .hamburger span { width: 24px; height: 2px; background: ${T.primary}; transition: 0.3s; }
        @media (min-width: 768px) { .hamburger { display: none; } }

        .mobile-menu {
          position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
          background: ${T.surface}; z-index: 90;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 32px; transition: transform 0.4s ease-in-out;
          transform: translateY(-100%);
        }
        .mobile-menu.open { transform: translateY(0); }
        .mobile-menu a, .mobile-menu button {
          font-family: ${T.fontHeadline}; font-style: italic; font-size: 28px; color: ${T.primary}; text-decoration: none; background: none; border: none; cursor: pointer;
        }

        /* Hero layout */
        .hero-layout {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 64px;
        }
        @media (min-width: 900px) {
          .hero-layout {
            flex-direction: row;
            align-items: center;
          }
        }

        /* Services grid */
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
          gap: 20px;
          width: 100%;
        }

        /* Specialists grid */
        .specialists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
          gap: 32px;
          width: 100%;
        }

        /* Essence layout */
        .essence-layout {
          display: flex;
          flex-direction: column;
          gap: 48px;
        }
        @media (min-width: 768px) {
          .essence-layout { flex-direction: row; align-items: center; gap: 80px; }
          .essence-left { width: 35% !important; flex-shrink: 0; }
          .essence-right { flex: 1; }
        }

        /* Hero refinements */
        @media (max-width: 768px) {
          .hero-layout { gap: 40px !important; }
          .hero-stats { justify-content: flex-start !important; gap: 20px !important; }
          .hero-stats > div { padding-right: 0 !important; }
          .hero-stats-divider { display: none !important; }
          .hero-bg-blob { display: none !important; }
          .hero-text-container { align-items: flex-start !important; text-align: left !important; }
          .hero-buttons { flex-direction: column !important; align-items: stretch !important; width: 100% !important; }
          .hero-buttons button { width: 100% !important; text-align: center !important; }
          .floating-bar { width: 95% !important; bottom: 12px !important; border-radius: 20px !important; padding: 12px 16px !important; }
          .floating-bar p { font-size: 10px !important; }
          .floating-bar button { padding: 10px 16px !important; font-size: 11px !important; }
        }

        /* Gallery grid */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr));
          gap: 16px;
          width: 100%;
        }

        /* Contact grid */
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          align-items: center;
        }
        @media (min-width: 768px) {
          .contact-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* Footer links */
        .footer-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          text-align: center;
        }
        @media (min-width: 768px) {
          .footer-inner { flex-direction: row; justify-content: space-between; }
        }

        /* Card hover */
        .service-card { transition: all 0.4s; }
        .service-card:hover { background: #ffffff !important; transform: translateY(-4px); box-shadow: 0 16px 48px rgba(148,69,85,0.10) !important; }

        .specialist-card { transition: all 0.3s; }
        .specialist-card:hover { box-shadow: 0 20px 60px rgba(148,69,85,0.15) !important; }

        .gallery-item { transition: transform 0.4s; overflow: hidden; }
        .gallery-item:hover img { transform: scale(1.06); }
        .gallery-item img { transition: transform 0.4s; }

        /* Floating bar */
        .floating-bar {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          width: 90%;
          max-width: 640px;
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 9999px;
          padding: 16px 28px;
          border: 1px solid rgba(255,255,255,0.4);
          box-shadow: 0 20px 60px rgba(148,69,85,0.15);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Hero gradient */
        .hero-bg {
          background:
            radial-gradient(circle at 20% 30%, #ffd9de 0%, transparent 45%),
            radial-gradient(circle at 80% 70%, #f2edea 0%, transparent 40%);
        }
      `}</style>


      {/* ══════════════════════════════
          1. NAVBAR
      ══════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        backgroundColor: 'rgba(253,248,245,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.outlineVariant}30`,
      }}>
        <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px', paddingLeft: '24px', paddingRight: '24px' }}>
          {/* Logo */}
          <span
            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setIsMenuOpen(false); }}
            style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: T.primary, cursor: 'pointer', userSelect: 'none', letterSpacing: '-0.01em' }}
          >
            {config?.nombreSalon || "L'Élixir Salon"}
          </span>

          {/* Nav links (Desktop) */}
          <div className="nav-links" style={{ alignItems: 'center', gap: '40px' }}>
            {[
              { label: 'Servicios', path: '/servicios' },
              { label: 'Especialistas', path: '/especialistas' },
              { label: 'Galería', path: '/galeria' },
            ].map(({ label, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                style={{
                  fontFamily: T.fontHeadline, fontSize: '16px', letterSpacing: '-0.02em',
                  color: T.onSurfaceVariant, background: 'none', border: 'none',
                  cursor: 'pointer', transition: 'color 0.3s', padding: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = T.onSurfaceVariant)}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => navigate('/chatbot')}
              style={{
                fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                backgroundColor: T.primary, color: T.onPrimary,
                padding: '12px 24px', borderRadius: '9999px', border: 'none',
                cursor: 'pointer', transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Agendar Cita
            </button>
          </div>

          {/* Hamburger button (Mobile) */}
          <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ display: 'flex', flexDirection: 'column', gap: '5px', cursor: 'pointer', zIndex: 100, padding: '8px' }}>
            <div style={{ width: '24px', height: '2px', backgroundColor: T.primary, transform: isMenuOpen ? 'translateY(7px) rotate(45deg)' : 'none', transition: 'all 0.3s ease' }}></div>
            <div style={{ width: '24px', height: '2px', backgroundColor: T.primary, opacity: isMenuOpen ? 0 : 1, transition: 'all 0.3s ease' }}></div>
            <div style={{ width: '24px', height: '2px', backgroundColor: T.primary, transform: isMenuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none', transition: 'all 0.3s ease' }}></div>
          </div>
        </div>

        {/* Mobile menu overlay */}
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
           {[
              { label: 'Servicios', path: '/servicios' },
              { label: 'Especialistas', path: '/especialistas' },
              { label: 'Galería', path: '/galeria' },
              { label: 'Agendar Cita', path: '/chatbot' },
            ].map(({ label, path }) => (
              <button
                key={label}
                onClick={() => { navigate(path); setIsMenuOpen(false); }}
                style={{ fontSize: '28px', fontFamily: T.fontHeadline, fontStyle: 'italic', color: T.primary, background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {label}
              </button>
            ))}
            <button onClick={() => setIsMenuOpen(false)} style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em', marginTop: '60px', opacity: 0.5, color: T.onSurfaceVariant, background: 'none', border: 'none', cursor: 'pointer' }}>CERRAR</button>
        </div>
      </nav>


      {/* ══════════════════════════════
          2. HERO
      ══════════════════════════════ */}
        <section
          id="inicio"
          className="hero-bg"
          style={{ 
            minHeight: '100vh', 
            position: 'relative', 
            overflow: 'hidden',
            backgroundImage: config?.fondoImagenUrl ? `url(${config.fondoImagenUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
        {/* Floating ambient blobs */}
        <div className="hero-bg-blob" style={{ position: 'absolute', top: '25%', right: '-80px', width: '384px', height: '384px', backgroundColor: '#ffd9de', borderRadius: '9999px', filter: 'blur(60px)', opacity: 0.4, zIndex: 0 }} />
        <div className="hero-bg-blob" style={{ position: 'absolute', bottom: '25%', left: '-80px', width: '320px', height: '320px', backgroundColor: '#ece7e4', borderRadius: '9999px', filter: 'blur(60px)', opacity: 0.4, zIndex: 0 }} />

        <div style={{ ...wrap, paddingTop: '140px', paddingBottom: '80px', position: 'relative', zIndex: 1 }}>
          <div className="hero-layout">

            {/* Left: Editorial Text */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Luxury badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '6px 16px', borderRadius: '9999px',
                backgroundColor: 'rgba(255,217,222,0.4)', alignSelf: 'flex-start',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: T.primary, display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.primary }}>
                  Experiencia de Lujo
                </span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontFamily: T.fontHeadline,
                fontStyle: 'italic',
                fontSize: 'clamp(52px, 7vw, 88px)',
                fontWeight: 700,
                color: T.onSurface,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
              }}>
                {config?.heroTitulo.split(',')[0]}<br />
                <span style={{ color: T.primary }}>{config?.heroTitulo.split(',')[1] || config?.heroTitulo}</span>
              </h1>

              <p style={{
                fontFamily: T.fontBody, fontSize: '18px', fontWeight: 300,
                color: T.onSurfaceVariant, maxWidth: '460px', lineHeight: 1.8,
              }}>
                {config?.heroSubtitulo || "Un espacio diseñado para resaltar tu luz propia con servicios de lujo y atención personalizada. Cada detalle pensado para tu bienestar."}
              </p>

              {/* CTAs */}
              <div className="hero-buttons" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', paddingTop: '8px' }}>
                <button
                  id="hero-cta"
                  onClick={() => navigate('/chatbot')}
                  style={{
                    fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryContainer})`,
                    color: '#FFFFFF', padding: '18px 40px',
                    borderRadius: '9999px', border: 'none', cursor: 'pointer',
                    boxShadow: `0 20px 50px rgba(148,69,85,0.20)`,
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 28px 60px rgba(148,69,85,0.30)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(148,69,85,0.20)'; }}
                >
                  {config?.heroBotonTexto || "Agendar Cita"}
                </button>
                <button
                  onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{
                    fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: T.primary, backgroundColor: 'transparent',
                    padding: '18px 24px', border: 'none',
                    borderBottom: `1px solid ${T.primaryFixed}`,
                    cursor: 'pointer', transition: 'background-color 0.3s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.surfaceContainerLow)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Ver Servicios
                </button>
              </div>

              {/* Stats */}
              <div className="hero-stats" style={{ display: 'flex', alignItems: 'center', gap: '0', paddingTop: '24px', flexWrap: 'wrap' }}>
                {[
                  { value: totalServicesCount ? `${totalServicesCount}+` : '6+', label: 'Servicios' },
                  { value: totalEmployeesCount ? `${totalEmployeesCount}` : '2', label: 'Especialistas' },
                  { value: calculateHours(), label: 'De atención' },
                ].map(({ value, label }, i) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ paddingRight: i < 2 ? '32px' : 0 }}>
                      <div style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '28px', color: T.primary }}>{value}</div>
                      <div style={{ fontFamily: T.fontBody, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant, marginTop: '2px' }}>{label}</div>
                    </div>
                    {i < 2 && <div className="hero-stats-divider" style={{ width: '1px', height: '32px', backgroundColor: `${T.outlineVariant}40`, marginRight: '32px' }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Image */}
            <div style={{ flex: 1, position: 'relative', width: '100%', maxWidth: '520px' }}>
              {/* Main image / video */}
              <div style={{ width: '100%', aspectRatio: '4/5', borderRadius: '28px', overflow: 'hidden', boxShadow: `0 40px 80px rgba(148,69,85,0.12)` }}>
                {isVideoPlaying && config?.heroVideoUrl ? (
                  <video
                    src={config.heroVideoUrl}
                    autoPlay
                    muted
                    playsInline
                    onEnded={() => setIsVideoPlaying(false)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <img
                    src={config?.heroImagenUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&h=875&fit=crop"}
                    alt={config?.nombreSalon || "Salón de belleza de lujo"}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}
                {/* Glassmorphism badge on image */}
                <div style={{
                  position: 'absolute', bottom: '32px', left: '32px',
                  padding: '20px 24px',
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  backgroundColor: 'rgba(255,255,255,0.45)',
                  borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)',
                  maxWidth: '200px',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
                  <p style={{ fontFamily: T.fontBody, fontSize: '12px', fontWeight: 500, color: T.onSurface, lineHeight: 1.5 }}>
                    Tratamientos exclusivos con productos de alta gama.
                  </p>
                </div>
              </div>

              {/* Floating circular image — desktop only */}
              <div style={{
                position: 'absolute', bottom: '-40px', left: '-48px',
                width: '180px', height: '180px',
                borderRadius: '9999px', overflow: 'hidden',
                border: '10px solid #fdf8f5',
                boxShadow: '0 16px 48px rgba(148,69,85,0.15)',
                display: 'none',
              }} className="hero-float-img">
                <img
                  src="https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=300&h=300&fit=crop"
                  alt="Detalle de servicio"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Decorative circle */}
              <div style={{
                position: 'absolute', top: '-24px', right: '-24px',
                width: '80px', height: '80px',
                borderRadius: '9999px', border: `2px solid ${T.primaryFixed}`,
                opacity: 0.6,
              }} />
            </div>
          </div>
        </div>

        <style>{`
          @media (min-width: 900px) {
            .hero-float-img { display: block !important; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </section>


      {/* ══════════════════════════════
          3. NUESTRA ESENCIA / SERVICIOS
      ══════════════════════════════ */}
      <section id="servicios" style={{ backgroundColor: T.surfaceContainerLow, paddingTop: '96px', paddingBottom: '96px' }}>
        <div style={wrap}>
          <div className="essence-layout">

            {/* Left: Section intro */}
            <div className="essence-left">
              <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: 'clamp(36px, 4vw, 48px)', color: T.onSurface, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                {config?.seccionServiciosTitulo || "Nuestros Servicios"}
              </h2>
              <div style={{ width: '48px', height: '1px', backgroundColor: T.primary, margin: '24px 0 28px' }} />
              <p style={{ fontFamily: T.fontBody, fontSize: '16px', color: T.onSurfaceVariant, lineHeight: 1.8 }}>
                Cada servicio es una experiencia pensada para realzar tu belleza natural con técnicas de vanguardia y productos premium.
              </p>
              <button
                onClick={() => navigate('/chatbot')}
                style={{
                  marginTop: '32px',
                  fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  backgroundColor: T.primary, color: '#FFFFFF',
                  padding: '14px 28px', borderRadius: '9999px', border: 'none',
                  cursor: 'pointer', transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Reservar
              </button>
            </div>

            {/* Right: Cards grid */}
            <div className="essence-right">
              <div className="services-grid">
                {services.length > 0 ? services.map((svc) => (
                  <div
                    key={svc._id}
                    className="service-card"
                    style={{
                      backgroundColor: T.surfaceContainerLowest,
                      padding: '36px 28px',
                      borderRadius: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      display: 'flex', flexDirection: 'column', gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '32px', lineHeight: 1 }}>✨</span>
                      <span style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 800, color: T.primary, backgroundColor: T.primaryFixed, padding: '4px 10px', borderRadius: '8px' }}>
                        {renderPriceInfo(svc)}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface, letterSpacing: '-0.01em' }}>{svc.nombre}</h3>
                    <p style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, lineHeight: 1.75, flex: 1 }}>{svc.descripcion}</p>
                  </div>
                )) : SERVICES.map(({ icon, title, desc }) => (
                  <div
                    key={title}
                    className="service-card"
                    style={{
                      backgroundColor: T.surfaceContainerLowest,
                      padding: '36px 28px',
                      borderRadius: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      display: 'flex', flexDirection: 'column', gap: '16px',
                    }}
                  >
                    <span style={{ fontSize: '36px', lineHeight: 1 }}>{icon}</span>
                    <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface, letterSpacing: '-0.01em' }}>{title}</h3>
                    <p style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, lineHeight: 1.75 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ══════════════════════════════
          4. ESPECIALISTAS
      ══════════════════════════════ */}
      <section id="especialistas" style={{ backgroundColor: T.surface, paddingTop: '96px', paddingBottom: '96px' }}>
        <div style={wrap}>

          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: T.primaryContainer, marginBottom: '12px' }}>El Equipo</p>
            <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: 'clamp(36px, 4vw, 48px)', color: T.onSurface, letterSpacing: '-0.02em' }}>
              {config?.seccionEspecialistasTitulo || "Conoce a Nuestras Especialistas"}
            </h2>
          </div>

          <div className="specialists-grid">
            {employees.length > 0 ? employees.map((emp) => (
              <div
                key={emp._id}
                className="specialist-card"
                style={{
                  backgroundColor: T.surfaceContainerLowest,
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(148,69,85,0.08)',
                }}
              >
                {/* Image header */}
                <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                  <img
                    src={emp.foto || "https://i.pravatar.cc/400?img=1"}
                    alt={emp.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  {/* Gradient overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(148,69,85,0.5) 0%, transparent 50%)' }} />
                  {/* Name overlay */}
                  <div style={{ position: 'absolute', bottom: '24px', left: '28px' }}>
                    <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '32px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>{emp.nombre}</h3>
                    <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                      {(emp.especialidades && emp.especialidades.length > 0) ? emp.especialidades.join(' · ') : 'Especialista'}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '28px 32px 32px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                    {emp.especialidades && emp.especialidades.length > 0 ? emp.especialidades.map((esp: string, idx: number) => (
                      <span key={idx} style={{
                        fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.12em',
                        backgroundColor: T.primaryFixed, color: T.primary,
                        padding: '5px 14px', borderRadius: '9999px',
                        display: 'inline-block',
                      }}>
                        {esp}
                      </span>
                    )) : (
                      <span style={{
                        fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.12em',
                        backgroundColor: T.primaryFixed, color: T.primary,
                        padding: '5px 14px', borderRadius: '9999px',
                        display: 'inline-block',
                      }}>
                        Beauty Expert
                      </span>
                    )}
                  </div>

                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px', minHeight: '100px' }}>
                    {emp.servicios && (emp.servicios as any).filter((s:any) => s.isActive !== false).length > 0 ? (emp.servicios as any).filter((s:any) => s.isActive !== false).slice(0, 4).map((s: any) => (
                      <li key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                           <span style={{ width: '4px', height: '4px', borderRadius: '9999px', backgroundColor: T.primary, flexShrink: 0 }} />
                           <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nombre}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: T.primary, flexShrink: 0 }}>{renderPriceInfo(s)}</span>
                      </li>
                    )) : (
                      <li style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant, opacity: 0.6, fontStyle: 'italic' }}>
                        Expert Artist con múltiples especialidades.
                      </li>
                    )}
                  </ul>

                  <button
                    onClick={() => navigate('/chatbot')}
                    style={{
                      width: '100%', fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      padding: '14px 0', borderRadius: '9999px',
                      border: `2px solid ${T.outlineVariant}`,
                      backgroundColor: 'transparent', color: T.onSurface,
                      cursor: 'pointer', transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.primary; e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = '#FFFFFF'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = T.outlineVariant; e.currentTarget.style.color = T.onSurface; }}
                  >
                    Agendar con {emp.nombre}
                  </button>
                </div>
              </div>
            )) : (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', fontFamily: T.fontBody, color: T.onSurfaceVariant }}>Cargando especialistas...</p>
            )}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════
          5. GALERÍA
      ══════════════════════════════ */}
      <section id="galeria" style={{ backgroundColor: T.surfaceContainerLow, paddingTop: '96px', paddingBottom: '96px' }}>
        <div style={wrap}>

          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: T.primaryContainer, marginBottom: '12px' }}>Portfolio</p>
            <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: 'clamp(36px, 4vw, 48px)', color: T.onSurface, letterSpacing: '-0.02em' }}>
              Galería de <span style={{ color: T.primary }}>Trabajos</span>
            </h2>
          </div>

          <div className="gallery-grid">
            {gallery.length > 0 ? gallery.map((src, i) => (
              <div key={i} className="gallery-item" style={{ aspectRatio: '1', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <img src={src} alt={`Trabajo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            )) : (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', fontFamily: T.fontBody, color: T.onSurfaceVariant }}>Cargando galería...</p>
            )}
          </div>

        </div>
      </section>


      {/* ══════════════════════════════
          6. CONTACTO
      ══════════════════════════════ */}
      <section id="contacto" style={{ backgroundColor: '#2f1314', paddingTop: '96px', paddingBottom: '120px' }}>
        <div style={wrap}>

          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: 'clamp(36px, 4vw, 52px)', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Visítanos en <span style={{ color: T.primaryContainer }}>Bogotá</span>
            </h2>
          </div>

          <div className="contact-grid">
            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255,185,198,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin style={{ color: T.primaryContainer, width: '22px', height: '22px' }} />
                </div>
                <div>
                  <p style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)', marginBottom: '6px' }}>Ubicación</p>
                  <p style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: '#FFFFFF' }}>{config?.direccion || "Carrera 102 #70-50, Bogotá"}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255,185,198,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock style={{ color: T.primaryContainer, width: '22px', height: '22px' }} />
                </div>
                <div>
                  <p style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)', marginBottom: '6px' }}>Horario</p>
                  <p style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: '#FFFFFF' }}>
                    {businessHours
                      ? `${formatHour(businessHours.inicio)} – ${formatHour(businessHours.fin)}`
                      : config?.horario || 'Lun-Sab 9am-8pm'}
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ fontFamily: T.fontBody, fontSize: '17px', fontWeight: 300, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
                Escríbenos por WhatsApp y te agendamos al instante. Atención personalizada todos los días.
              </p>
              <a
                href={config?.whatsappLink || `https://wa.me/57${config?.whatsapp.replace(/\D/g, '') || "3000000000"}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '12px',
                  fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  backgroundColor: '#25D366', color: '#FFFFFF',
                  padding: '18px 36px', borderRadius: '9999px',
                  textDecoration: 'none', transition: 'all 0.3s',
                  alignSelf: 'flex-start', boxShadow: '0 12px 32px rgba(37,211,102,0.25)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1aab52'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#25D366'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
              >
                <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Escríbenos por WhatsApp
              </a>
            </div>
          </div>

          {/* Mapa Embebido */}
          {config?.mapaUrl && config.mapaUrl.startsWith('https://') && (
            <div style={{ marginTop: '64px', width: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <iframe
                src={config.mapaUrl}
                width="100%"
                height="400"
                style={{ border: 0, display: 'block', minHeight: '350px' }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación del salón"
              ></iframe>
            </div>
          )}

        </div>
      </section>


      {/* ══════════════════════════════
          7. FOOTER
      ══════════════════════════════ */}
      <footer style={{ backgroundColor: '#2f1314', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '40px', paddingBottom: '28px' }}>
        <div style={wrap}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>

            <span style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.primaryContainer }}>{config?.nombreSalon || "L'Élixir Salon"}</span>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px' }}>
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
                  style={{ fontFamily: T.fontBody, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'opacity 0.3s' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = '1')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.6')}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />

            <p style={{ fontFamily: T.fontBody, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>
              {config?.footerTexto || `© ${new Date().getFullYear()} L'Élixir Salon. El Arte de Cuidarte.`}
            </p>
          </div>
        </div>
      </footer>


      {/* ══════════════════════════════
          FLOATING BOOKING BAR
      ══════════════════════════════ */}
      <div className="floating-bar" style={{ width: 'calc(100% - 32px)', maxWidth: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🕐</span>
          <div>
            <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant }}>
              Atención hoy
            </p>
            <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.primary, fontWeight: 600 }}>
              {businessHours
                ? `${formatHour(businessHours.inicio)} – ${formatHour(businessHours.fin)}`
                : config?.horario || 'Lun-Sab 9am-8pm'}
            </p>
          </div>
        </div>
        <button
          id="fab-agendar"
          onClick={() => navigate('/chatbot')}
          style={{
            fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            backgroundColor: T.primary, color: '#FFFFFF',
            padding: '12px 24px', borderRadius: '9999px', border: 'none',
            cursor: 'pointer', transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#772e3e')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = T.primary)}
        >
          Agendar ahora
        </button>
      </div>

    </div>
  );
}
