import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { galleryService, siteConfigService } from '../services/api';
import type { GalleryCategory, GalleryItem, SiteConfig } from '../types';
import SEOHead from '../components/SEOHead';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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
   GALLERY PAGE
───────────────────────────────────────────────── */
export default function GalleryPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Todas');

  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const salonName = siteConfig?.nombreSalon || "L'Élixir Salon";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, itemRes, configRes] = await Promise.all([
          galleryService.getCategories(),
          galleryService.getItems(),
          siteConfigService.get()
        ]);
        if (catRes.success) setCategories(catRes.data || []);
        if (itemRes.success) setItems(itemRes.data || []);
        if (configRes.success && configRes.data) setSiteConfig(configRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const CATEGORIES = ['Todas', ...categories.map((c: any) => c.name)];

  const filtered = activeFilter === 'Todas'
    ? items
    : items.filter((i: any) => {
        const catName = typeof i.categoryId === 'string' ? '' : (i.categoryId as any).name;
        return catName === activeFilter;
      });

  return (
    <div style={{ fontFamily: T.fontBody, color: T.onSurface, backgroundColor: T.surface, minHeight: '100vh', overflowX: 'hidden' }}>
      <SEOHead title="Galería de Trabajos" description="Explora nuestro portafolio de resultados reales: cortes, tinte, mechas balayage, extensión de pestañas y uñas artísticas." />
      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: #ffd9de; color: #944555; }
        .nav-links { display: none; }
        .hamburger { display: flex; }
        @media (min-width: 768px) { 
          .nav-links { display: flex; } 
          .hamburger { display: none !important; }
        }

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

      <Navbar salonName={salonName} />

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
              filtered.map(({ _id, url, caption, categoryId }: any) => (
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

      <Footer config={siteConfig} dark={false} />

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
