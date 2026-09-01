import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, siteConfigService } from '../services/api';
import type { Product, SiteConfig } from '../types';
import CartModal from '../components/CartModal';
import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';

/* ─────────────────────────────────────────────────
   Design Tokens
 ───────────────────────────────────────────────── */
const T = {
  fontHeadline: "'Noto Serif', serif",
  fontBody: "'Plus Jakarta Sans', sans-serif",
  primary: 'var(--color-primary, #944555)',
  primaryFixed: '#ffd9de',
  primaryContainer: '#e8899a',
  onPrimary: '#ffffff',
  surface: 'var(--color-accent, #fdf8f5)',
  surfaceContainerLow: '#f8f3f0',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer: '#f2edea',
  surfaceContainerHigh: '#ece7e4',
  surfaceVariant: '#e6e2df',
  onSurface: 'var(--color-secondary, #1c1b1a)',
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
   Cart helpers (localStorage)
 ───────────────────────────────────────────────── */
export interface CartItem { product: Product; qty: number }
export function getCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem('sdb_cart') || '[]'); } catch { return []; }
}
export function saveCart(items: CartItem[]) {
  localStorage.setItem('sdb_cart', JSON.stringify(items));
}

/* ─────────────────────────────────────────────────
   PRODUCTS PAGE (Catálogo público)
 ───────────────────────────────────────────────── */
export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoria, setCategoria] = useState('Todos');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Debounce de búsqueda para no disparar queries con cada tecla
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Contar ítems del carrito
  useEffect(() => {
    const updateCount = () => setCartCount(getCart().reduce((acc, i) => acc + i.qty, 0));
    updateCount();
    window.addEventListener('sdb_cart_updated', updateCount);
    return () => window.removeEventListener('sdb_cart_updated', updateCount);
  }, []);

  // Config CMS
  useEffect(() => {
    siteConfigService.get().then(res => {
      if (res.success && res.data) {
        setConfig(res.data);
        document.documentElement.style.setProperty('--color-primary', res.data.colorPrimario);
        document.documentElement.style.setProperty('--color-secondary', res.data.colorSecundario);
        document.documentElement.style.setProperty('--color-accent', res.data.colorAcento);
      }
    });
  }, []);

  // Categorías dinámicas
  useEffect(() => {
    productService.getCategorias().then(res => {
      if (res.success && res.data) setCategorias(res.data);
    });
  }, []);

  // Productos con filtros
  const loadProducts = useCallback(() => {
    setLoading(true);
    productService.getAll({
      categoria: categoria === 'Todos' ? undefined : categoria,
      search: debouncedSearch || undefined,
    }).then(res => {
      if (res.success && res.data) setProducts(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [categoria, debouncedSearch]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const navLinks = [
    { label: 'Servicios', path: '/servicios' },
    { label: 'Productos', path: '/productos' },
    { label: 'Especialistas', path: '/especialistas' },
    { label: 'Galería', path: '/galeria' },
  ];

  const formatPrice = (p: Product) => {
    const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
    return fmt.format(p.precioOferta && p.precioOferta > 0 ? p.precioOferta : p.precio);
  };

  const addToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const cart = getCart();
    const idx = cart.findIndex(i => i.product._id === product._id);
    if (idx >= 0) {
      cart[idx].qty += 1;
    } else {
      cart.push({ product, qty: 1 });
    }
    saveCart(cart);
    window.dispatchEvent(new Event('sdb_cart_updated'));
  };

  return (
    <div style={{ fontFamily: T.fontBody, color: T.onSurface, backgroundColor: T.surface, minHeight: '100vh', overflowX: 'hidden' }}>
      <SEOHead title="Catálogo de Productos" description="Descubre nuestra tienda de belleza profesional: tratamientos capilares, cuidado facial, manicure y accesorios exclusivos." />
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::selection { background: #ffd9de; color: #944555; }
        .nav-links { display: none; }
        .hamburger { display: flex; }
        @media (min-width: 768px) {
          .nav-links { display: flex; }
          .hamburger { display: none !important; }
        }
        .prod-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (min-width: 640px) { .prod-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; } }
        @media (min-width: 1024px) { .prod-grid { grid-template-columns: repeat(4, 1fr); gap: 32px; } }
        .prod-card { transition: transform 0.3s; cursor: pointer; }
        .prod-card:hover { transform: translateY(-4px); }
        .prod-card:hover .prod-img { transform: scale(1.05); }
        .prod-img { transition: transform 0.6s ease-out; }
        .cat-pill { transition: all 0.2s; white-space: nowrap; cursor: pointer; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (min-width: 768px) {
          .hide-scrollbar::-webkit-scrollbar {
            display: block;
            height: 6px;
          }
          .hide-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .hide-scrollbar::-webkit-scrollbar-thumb {
            background: #d9c1c3;
            border-radius: 9999px;
          }
          .hide-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #944555;
          }
        }
        .glass-btn {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .cat-container {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-left: 16px;
          padding-right: 16px;
          padding-bottom: 8px;
          width: 100%;
        }
        @media (min-width: 768px) {
          .cat-container {
            max-width: 1280px;
            margin: 0 auto;
            padding-left: 16px;
            padding-right: 16px;
            padding-bottom: 0;
            flex-wrap: wrap;
            overflow-x: visible;
          }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        backgroundColor: 'rgba(253,248,245,0.80)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.outlineVariant}25`,
      }}>
        <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
          <span
            onClick={() => navigate('/')}
            style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: T.primary, cursor: 'pointer', userSelect: 'none' }}
          >
            {config?.nombreSalon || "L'Élixir Salon"}
          </span>

          {/* Desktop nav */}
          <div className="nav-links" style={{ alignItems: 'center', gap: '32px' }}>
            {navLinks.map(({ label, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                style={{
                  fontFamily: T.fontHeadline, fontSize: '16px', letterSpacing: '-0.02em',
                  color: path === '/productos' ? T.primary : T.onSurfaceVariant,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontWeight: path === '/productos' ? 600 : 400,
                  borderBottom: path === '/productos' ? `1px solid ${T.primary}40` : 'none',
                  paddingBottom: '2px',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = T.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = path === '/productos' ? T.primary : T.onSurfaceVariant)}
              >{label}</button>
            ))}
            <button onClick={() => navigate('/chatbot')} style={{
              fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              backgroundColor: T.primary, color: '#FFFFFF',
              padding: '12px 24px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
            }}>Agendar Cita</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Carrito */}
            <button
              onClick={() => setIsCartOpen(true)}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: T.primary, padding: '8px' }}
            >
              🛍️
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: '4px', right: '4px',
                  width: '16px', height: '16px', borderRadius: '9999px',
                  backgroundColor: T.primary, color: '#fff',
                  fontSize: '9px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{cartCount}</span>
              )}
            </button>
            {/* Hamburger */}
            <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ flexDirection: 'column', gap: '5px', cursor: 'pointer', padding: '8px' }}>
              <div style={{ width: '24px', height: '2px', backgroundColor: T.primary, transform: isMenuOpen ? 'translateY(7px) rotate(45deg)' : 'none', transition: 'all 0.3s ease' }} />
              <div style={{ width: '24px', height: '2px', backgroundColor: T.primary, opacity: isMenuOpen ? 0 : 1, transition: 'all 0.3s ease' }} />
              <div style={{ width: '24px', height: '2px', backgroundColor: T.primary, transform: isMenuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none', transition: 'all 0.3s ease' }} />
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
          background: T.surface, zIndex: 90,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '32px', transition: 'transform 0.4s ease-in-out',
          transform: isMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
        }}>
          {[...navLinks, { label: 'Agendar Cita', path: '/chatbot' }].map(({ label, path }) => (
            <button key={label} onClick={() => { navigate(path); setIsMenuOpen(false); }} style={{ fontSize: '28px', fontFamily: T.fontHeadline, fontStyle: 'italic', color: T.primary, background: 'none', border: 'none', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
          <button onClick={() => setIsMenuOpen(false)} style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em', marginTop: '60px', opacity: 0.5, color: T.onSurfaceVariant, background: 'none', border: 'none', cursor: 'pointer' }}>CERRAR</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        paddingTop: '108px', paddingBottom: '48px',
        background: `radial-gradient(circle at 20% 50%, #ffd9de20 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${T.surfaceContainerLow} 0%, transparent 50%)`,
      }}>
        <div style={wrap}>
          <p style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: T.primary, marginBottom: '12px' }}>
            {config?.nombreSalon || "L'Élixir Salon"}
          </p>
          <h1 style={{
            fontFamily: T.fontHeadline, fontStyle: 'italic',
            fontSize: 'clamp(36px, 6vw, 64px)', color: T.onSurface,
            lineHeight: 1.1, letterSpacing: '-0.03em', fontWeight: 400,
            marginBottom: '16px',
          }}>
            {config?.seccionProductosTitulo || "Colección Apothecary"}
          </h1>
          <p style={{ fontFamily: T.fontBody, fontSize: '16px', color: T.onSurfaceVariant, lineHeight: 1.8, maxWidth: '560px', marginBottom: '32px' }}>
            {config?.seccionProductosSubtitulo || "Botanicals seleccionados con eficacia clínica formulados para tu tez más radiante y equilibrada."}
          </p>
          {/* Barra de búsqueda */}
          <div style={{ position: 'relative', maxWidth: '480px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', pointerEvents: 'none' }}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, ingrediente..."
              style={{
                width: '100%', paddingLeft: '48px', paddingRight: '16px', paddingTop: '14px', paddingBottom: '14px',
                borderRadius: '12px', border: `1px solid ${T.outlineVariant}40`,
                backgroundColor: T.surfaceContainerLowest, fontFamily: T.fontBody, fontSize: '15px',
                color: T.onSurface, outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = T.primary)}
              onBlur={e => (e.currentTarget.style.borderColor = `${T.outlineVariant}40`)}
            />
          </div>
        </div>
      </section>

      {/* ── CATEGORÍAS ── */}
      <section style={{ paddingBottom: '24px', paddingTop: '4px' }}>
        <div className="cat-container hide-scrollbar">
          {['Todos', ...categorias].map(cat => (
            <button
              key={cat}
              className="cat-pill"
              onClick={() => setCategoria(cat)}
              style={{
                padding: '10px 20px', borderRadius: '9999px', border: 'none',
                fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                backgroundColor: categoria === cat ? T.primary : T.surfaceVariant,
                color: categoria === cat ? T.onPrimary : T.onSurfaceVariant,
                flexShrink: 0,
              }}
            >{cat === 'Todos' ? 'Todos los Rituales' : cat}</button>
          ))}
        </div>
      </section>

      {/* ── GRID DE PRODUCTOS ── */}
      <main style={{ paddingBottom: '96px' }}>
        <div style={{ ...wrap, paddingBottom: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: T.onSurfaceVariant, fontFamily: T.fontBody }}>
              Cargando colección...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: T.onSurfaceVariant, fontFamily: T.fontBody }}>
              <p style={{ fontSize: '40px', marginBottom: '16px' }}>🌸</p>
              <p>No encontramos productos con esos filtros.</p>
            </div>
          ) : (
            <div className="prod-grid">
              {products.map(product => (
                <article key={product._id} className="prod-card" onClick={() => navigate(`/productos/${product._id}`)}>
                  {/* Imagen */}
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', borderRadius: '16px', overflow: 'hidden', backgroundColor: T.surfaceContainerLow, marginBottom: '14px' }}>
                    <img
                      src={product.imagenes?.[0] || 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=500&fit=crop'}
                      alt={product.nombre}
                      className="prod-img"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {/* Badge oferta */}
                    {product.precioOferta && product.precioOferta > 0 && (
                      <div style={{
                        position: 'absolute', bottom: '10px', left: '10px',
                        backgroundColor: T.primary, color: '#fff',
                        padding: '4px 10px', borderRadius: '9999px',
                        fontSize: '10px', fontFamily: T.fontBody, fontWeight: 700, textTransform: 'uppercase',
                      }}>Oferta</div>
                    )}
                  </div>
                  {/* Info */}
                  <div>
                    <p style={{ fontFamily: T.fontBody, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, marginBottom: '4px' }}>
                      {product.marca}
                    </p>
                    <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '18px', color: T.onSurface, lineHeight: 1.2, marginBottom: '8px' }}>
                      {product.nombre}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontFamily: T.fontBody, fontSize: '15px', fontWeight: 600, color: T.primary }}>
                          {formatPrice(product)}
                        </span>
                        {product.precioOferta && product.precioOferta > 0 && (
                          <span style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant, textDecoration: 'line-through', marginLeft: '8px' }}>
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(product.precio)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: T.onSurfaceVariant }}>
                        <span style={{ fontSize: '12px' }}>⭐</span>
                        <span style={{ fontFamily: T.fontBody, fontSize: '12px' }}>{product.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    {/* Botón agregar */}
                    <button
                      onClick={e => addToCart(product, e)}
                      style={{
                        marginTop: '10px', width: '100%',
                        fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        backgroundColor: 'transparent', color: T.primary,
                        border: `1px solid ${T.primaryFixed}`, padding: '10px 0',
                        borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = T.primary; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = T.primary; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = T.primary; e.currentTarget.style.borderColor = T.primaryFixed; }}
                    >+ Agregar</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer config={config} dark={false} />

      {/* ── Botón Flotante Circular del Carrito (Sigue al usuario en la página de productos) ── */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100 }}>
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              backgroundColor: T.primary,
              color: '#fff',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(148,69,85,0.4)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'transform 0.2s, background-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span style={{ fontSize: '24px' }}>🛍️</span>
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              minWidth: '20px',
              height: '20px',
              borderRadius: '10px',
              backgroundColor: '#ffd9de',
              color: '#944555',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>{cartCount}</span>
          </button>
        </div>
      )}

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        config={config}
      />
    </div>
  );
}
