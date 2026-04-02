import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { galleryService } from '../services/api';
import type { GalleryCategory, GalleryItem } from '../types';

/* ─────────────────────────────────────────────────
   Design Tokens
───────────────────────────────────────────────── */
const T = {
  fontHeadline: "'Noto Serif', serif",
  fontBody: "'Plus Jakarta Sans', sans-serif",
  primary: '#944555',
  primaryContainer: '#e8899a',
  primaryFixed: '#ffd9de',
  onPrimary: '#ffffff',
  surface: '#fdf8f5',
  surfaceContainerLow: '#f8f3f0',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer: '#f2edea',
  onSurface: '#1c1b1a',
  onSurfaceVariant: '#534245',
  outlineVariant: '#d9c1c3',
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
   Gallery Data
───────────────────────────────────────────────── */
// Ya no hardcodeado, dependemos del servidor

/* ─────────────────────────────────────────────────
   Shared Navbar
───────────────────────────────────────────────── */
function Navbar({ navigate, location }: { navigate: ReturnType<typeof useNavigate>; location: ReturnType<typeof useLocation> }) {
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
          Beauty Salon
        </span>
        <div className="nav-links" style={{ alignItems: 'center', gap: '40px' }}>
          {links.map(({ label, path }) => {
            const active = location.pathname === path;
            return (
              <button key={label} onClick={() => navigate(path)} style={{
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
function Footer() {
  return (
    <footer style={{ backgroundColor: T.surfaceContainer, paddingTop: '64px', paddingBottom: '32px' }}>
      <div style={{ ...wrap, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
        <span style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.primary }}>Beauty Salon de Belleza</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '32px' }}>
          {['Instagram', 'WhatsApp', 'Contacto', 'Privacidad'].map((l) => (
            <a key={l} href="#" style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, textDecoration: 'none', opacity: 0.8, transition: 'opacity 0.3s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.4')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.8')}
            >{l}</a>
          ))}
        </div>
        <div style={{ width: '100%', height: '1px', backgroundColor: `${T.outlineVariant}30`, margin: '8px 0' }} />
        <p style={{ fontFamily: T.fontBody, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: `${T.onSurfaceVariant}80` }}>
          © {new Date().getFullYear()} Beauty Salon. El Arte de Cuidarte.
        </p>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────
   GALLERY PAGE
───────────────────────────────────────────────── */
export default function GalleryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState('Todas');

  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // By default API items fetch only actives. Same with categories.
        const [catRes, itemRes] = await Promise.all([
          galleryService.getCategories(),
          galleryService.getItems()
        ]);
        if (catRes.success) setCategories(catRes.data || []);
        if (itemRes.success) setItems(itemRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const CATEGORIES = ['Todas', ...categories.map(c => c.name)];

  const filtered = activeFilter === 'Todas'
    ? items
    : items.filter((i) => {
        const catName = typeof i.categoryId === 'string' ? '' : (i.categoryId as any).name;
        return catName === activeFilter;
      });

  return (
    <div style={{ fontFamily: T.fontBody, color: T.onSurface, backgroundColor: T.surface, overflowX: 'hidden' }}>
      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: #ffd9de; color: #944555; }
        .nav-links { display: none; }
        @media (min-width: 768px) { .nav-links { display: flex; } }

        /* Masonry */
        .masonry-grid {
          column-count: 1;
          column-gap: 24px;
          width: 100%;
        }
        @media (min-width: 480px) { .masonry-grid { column-count: 2; } }
        @media (min-width: 1024px) { .masonry-grid { column-count: 3; } }

        .masonry-item {
          width: 100%;
          min-width: 0;
          break-inside: avoid;
          margin-bottom: 24px;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          background: ${T.surfaceContainerLow};
        }

        .masonry-item img {
          width: 100%;
          height: auto;
          display: block;
          filter: grayscale(20%);
          transition: filter 0.7s, transform 0.7s;
        }
        .masonry-item:hover img {
          filter: grayscale(0%);
          transform: scale(1.05);
        }
        .masonry-item .overlay {
          position: absolute;
          inset: 0;
          background: rgba(148,69,85,0.45);
          backdrop-filter: blur(2px);
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.5s;
        }
        .masonry-item:hover .overlay { opacity: 1; }
        .masonry-item .overlay span {
          font-family: 'Noto Serif', serif;
          font-style: italic;
          font-size: 28px;
          color: #ffffff;
          transform: translateY(12px);
          transition: transform 0.5s;
        }
        .masonry-item:hover .overlay span { transform: translateY(0); }

        .filter-btn {
          padding: 10px 28px;
          border-radius: 9999px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }
        .filter-btn.active {
          background: ${T.primaryContainer};
          color: #ffffff;
        }
        .filter-btn.inactive {
          background: ${T.surfaceContainer};
          color: ${T.onSurfaceVariant};
        }
        .filter-btn.inactive:hover {
          background: ${T.primaryFixed};
          color: ${T.primary};
        }

        .floating-bar {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          width: calc(100% - 32px);
          max-width: 520px;
        }
      `}</style>

      <Navbar navigate={navigate} location={location} />

      <main style={{ paddingTop: '128px', paddingBottom: '80px' }}>
        <div style={wrap}>

          {/* ── Editorial Header ── */}
          <header style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h1 style={{
              fontFamily: T.fontHeadline,
              fontSize: 'clamp(48px, 8vw, 88px)',
              color: T.primary,
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
              marginBottom: '24px',
              fontWeight: 700,
            }}>
              Portafolio de <em style={{ fontStyle: 'italic' }}>Belleza</em>
            </h1>
            <p style={{ fontFamily: T.fontBody, fontSize: '18px', color: T.onSurfaceVariant, maxWidth: '560px', margin: '0 auto', lineHeight: 1.8, fontWeight: 300 }}>
              Cada detalle es una obra de arte. Explora nuestras transformaciones diseñadas para resaltar tu esencia con elegancia.
            </p>
          </header>

          {/* ── Filter Pills ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginBottom: '64px' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`filter-btn ${activeFilter === cat ? 'active' : 'inactive'}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ── Masonry Gallery ── */}
          <div className="masonry-grid">
            {loading ? (
              <p style={{ fontFamily: T.fontBody, color: T.onSurfaceVariant, textAlign: 'center', gridColumn: '1 / -1', padding: '64px' }}>Cargando galería...</p>
            ) : filtered.length === 0 ? (
              <p style={{ fontFamily: T.fontBody, color: T.onSurfaceVariant, textAlign: 'center', gridColumn: '1 / -1', padding: '64px' }}>No hay imágenes en esta categoría aún.</p>
            ) : (
              filtered.map(({ _id, url, caption, categoryId }) => (
                <div key={_id} className="masonry-item">
                  <img src={url} alt={caption || 'Galería'} />
                  <div className="overlay">
                    <span>{caption || ((categoryId as any).name)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── CTA Section ── */}
          <section style={{
            marginTop: '96px',
            padding: '64px 48px',
            backgroundColor: T.surfaceContainerLow,
            borderRadius: '28px',
            textAlign: 'center',
          }}>
            <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: 'clamp(28px, 4vw, 40px)', color: T.primary, marginBottom: '20px', letterSpacing: '-0.02em', fontWeight: 400 }}>
              ¿Lista para tu propia transformación?
            </h2>
            <p style={{ fontFamily: T.fontBody, fontSize: '17px', color: T.onSurfaceVariant, maxWidth: '480px', margin: '0 auto 40px', lineHeight: 1.8, fontWeight: 300 }}>
              Nuestras especialistas están listas para crear un look personalizado que hable de ti.
            </p>
            <button
              onClick={() => navigate('/chatbot')}
              style={{
                fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                backgroundColor: T.primary, color: '#FFFFFF',
                padding: '18px 48px', borderRadius: '9999px', border: 'none',
                cursor: 'pointer', transition: 'all 0.3s',
                boxShadow: '0 16px 40px rgba(148,69,85,0.20)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#772e3e'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.primary; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Agendar una Consulta
            </button>
          </section>

        </div>
      </main>

      <Footer />

      {/* Floating Booking Bar */}
      <div className="floating-bar">
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.80)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '9999px', padding: '16px 28px',
          boxShadow: '0 20px 40px rgba(62,2,21,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px',
        }}>
          <div>
            <span style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: `${T.onSurfaceVariant}80`, display: 'block' }}>
              ¿Lista para brillar?
            </span>
            <span style={{ fontFamily: T.fontBody, fontSize: '14px', fontWeight: 600, color: T.onSurface }}>
              Reserva tu experiencia hoy
            </span>
          </div>
          <button
            onClick={() => navigate('/chatbot')}
            style={{
              fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              backgroundColor: T.primary, color: '#FFFFFF',
              padding: '12px 24px', borderRadius: '9999px', border: 'none',
              cursor: 'pointer', transition: 'box-shadow 0.3s',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(148,69,85,0.30)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            Agendar
          </button>
        </div>
      </div>

    </div>
  );
}
