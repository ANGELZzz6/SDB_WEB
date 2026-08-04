import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, siteConfigService } from '../services/api';
import type { Product, SiteConfig } from '../types';
import { getCart, saveCart } from './ProductsPage';
import CartModal from '../components/CartModal';

const T = {
  fontHeadline: "'Noto Serif', serif",
  fontBody: "'Plus Jakarta Sans', sans-serif",
  primary: 'var(--color-primary, #944555)',
  primaryFixed: '#ffd9de',
  primaryContainer: '#e8899a',
  onPrimary: '#ffffff',
  surface: 'var(--color-accent, #fdf8f5)',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f8f3f0',
  surfaceVariant: '#e6e2df',
  onSurface: 'var(--color-secondary, #1c1b1a)',
  onSurfaceVariant: '#534245',
  outlineVariant: '#d9c1c3',
};

const wrap: React.CSSProperties = {
  maxWidth: '1280px', margin: '0 auto', paddingLeft: '16px', paddingRight: '16px', width: '100%', boxSizing: 'border-box',
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  useEffect(() => {
    const updateCount = () => setCartCount(getCart().reduce((acc, i) => acc + i.qty, 0));
    updateCount();
    window.addEventListener('sdb_cart_updated', updateCount);
    return () => window.removeEventListener('sdb_cart_updated', updateCount);
  }, []);

  useEffect(() => {
    if (id) {
      productService.getById(id).then(res => {
        if (res.success && res.data) setProduct(res.data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id]);

  const navLinks = [
    { label: 'Servicios', path: '/servicios' },
    { label: 'Productos', path: '/productos' },
    { label: 'Especialistas', path: '/especialistas' },
    { label: 'Galería', path: '/galeria' },
  ];

  const handleAddToCart = () => {
    if (!product) return;
    const cart = getCart();
    const idx = cart.findIndex(i => i.product._id === product._id);
    if (idx >= 0) {
      cart[idx].qty += qty;
    } else {
      cart.push({ product, qty });
    }
    saveCart(cart);
    window.dispatchEvent(new Event('sdb_cart_updated'));
    setQty(1); // reset after adding
  };

  const handleBuyNow = () => {
    if (!product) return;
    const cart = getCart();
    const idx = cart.findIndex(i => i.product._id === product._id);
    if (idx >= 0) {
      cart[idx].qty += qty;
    } else {
      cart.push({ product, qty });
    }
    saveCart(cart);
    window.dispatchEvent(new Event('sdb_cart_updated'));
    setIsCartOpen(true); // Open the drawer instead of WhatsApp directly
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontBody, color: T.onSurfaceVariant, backgroundColor: T.surface }}>Cargando producto...</div>;
  }

  if (!product) {
    return <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontBody, color: T.onSurfaceVariant, backgroundColor: T.surface }}>
      <p style={{ fontSize: '48px', marginBottom: '16px' }}>🌸</p>
      <p>Producto no encontrado.</p>
      <button onClick={() => navigate('/productos')} style={{ marginTop: '24px', padding: '12px 24px', borderRadius: '9999px', backgroundColor: T.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>Volver al Catálogo</button>
    </div>;
  }

  const formatPrice = (price: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
  const isOutOfStock = product.stock <= 0 && product.rastrearStock;

  return (
    <div style={{ fontFamily: T.fontBody, color: T.onSurface, backgroundColor: T.surface, overflowX: 'hidden', minHeight: '100vh' }}>
      <style>{`
        * { box-sizing: border-box; }
        .nav-links { display: none; }
        .hamburger { display: flex; }
        @media (min-width: 768px) {
          .nav-links { display: flex; }
          .hamburger { display: none !important; }
        }
        .detail-layout { display: flex; flex-direction: column; gap: 40px; }
        @media (min-width: 900px) { .detail-layout { flex-direction: row; gap: 64px; align-items: flex-start; } }
        .qty-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; cursor: pointer; font-size: 18px; color: ${T.onSurface}; }
        .qty-btn:disabled { color: ${T.outlineVariant}; cursor: not-allowed; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        backgroundColor: 'rgba(253,248,245,0.80)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.outlineVariant}25`,
      }}>
        <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
          <span onClick={() => navigate('/')} style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: T.primary, cursor: 'pointer', userSelect: 'none' }}>
            {config?.nombreSalon || "L'Élixir Salon"}
          </span>
          <div className="nav-links" style={{ alignItems: 'center', gap: '32px' }}>
            {navLinks.map(({ label, path }) => (
              <button key={label} onClick={() => navigate(path)} style={{
                fontFamily: T.fontHeadline, fontSize: '16px', letterSpacing: '-0.02em',
                color: path === '/productos' ? T.primary : T.onSurfaceVariant,
                background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: path === '/productos' ? 600 : 400,
                borderBottom: path === '/productos' ? `1px solid ${T.primary}40` : 'none', paddingBottom: '2px',
              }}>{label}</button>
            ))}
            <button onClick={() => navigate('/chatbot')} style={{
              fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
              backgroundColor: T.primary, color: '#FFFFFF', padding: '12px 24px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
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
                  position: 'absolute', top: '4px', right: '4px', width: '16px', height: '16px', borderRadius: '9999px',
                  backgroundColor: T.primary, color: '#fff', fontSize: '9px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{cartCount}</span>
              )}
            </button>
            <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ flexDirection: 'column', gap: '5px', cursor: 'pointer', padding: '8px' }}>
              <div style={{ width: '24px', height: '2px', backgroundColor: T.primary, transform: isMenuOpen ? 'translateY(7px) rotate(45deg)' : 'none', transition: 'all 0.3s ease' }} />
              <div style={{ width: '24px', height: '2px', backgroundColor: T.primary, opacity: isMenuOpen ? 0 : 1, transition: 'all 0.3s ease' }} />
              <div style={{ width: '24px', height: '2px', backgroundColor: T.primary, transform: isMenuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none', transition: 'all 0.3s ease' }} />
            </div>
          </div>
        </div>
      </nav>

      {/* ── BREADCRUMBS ── */}
      <div style={{ ...wrap, paddingTop: '100px', paddingBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: T.onSurfaceVariant }}>
        <span onClick={() => navigate('/productos')} style={{ cursor: 'pointer' }}>Colección Apothecary</span>
        <span>/</span>
        <span>{product.categoria}</span>
        <span>/</span>
        <span style={{ color: T.primary, fontWeight: 600 }}>{product.nombre}</span>
      </div>

      <main style={{ ...wrap, paddingBottom: '96px' }}>
        <div className="detail-layout">
          {/* GALERÍA */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: T.surfaceContainerLow, borderRadius: '24px', overflow: 'hidden' }}>
              {/* Imagen de fondo difuminada */}
              <img
                src={product.imagenes?.[activeImg] || 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=1000&fit=crop'}
                alt=""
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'blur(20px) brightness(0.95)',
                  transform: 'scale(1.1)',
                  opacity: 0.65,
                }}
              />
              {/* Imagen frontal nítida */}
              <img
                src={product.imagenes?.[activeImg] || 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=1000&fit=crop'}
                alt={product.nombre}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  zIndex: 1,
                }}
              />
            </div>
            {product.imagenes && product.imagenes.length > 1 && (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                {product.imagenes.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{
                      width: '80px', height: '100px', flexShrink: 0,
                      borderRadius: '12px', border: i === activeImg ? `2px solid ${T.primary}` : '2px solid transparent',
                      padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s',
                    }}
                  >
                    <img src={img} alt={`Thumb ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DETALLES */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '520px' }}>
            <div>
              <p style={{ fontFamily: T.fontBody, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, marginBottom: '8px' }}>
                {product.marca}
              </p>
              <h1 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: 'clamp(32px, 5vw, 48px)', color: T.onSurface, lineHeight: 1.1, marginBottom: '16px' }}>
                {product.nombre}
              </h1>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '16px' }}>
                <span style={{ fontFamily: T.fontBody, fontSize: '24px', fontWeight: 600, color: T.primary }}>
                  {formatPrice(product.precioOferta && product.precioOferta > 0 ? product.precioOferta : product.precio)}
                </span>
                {product.precioOferta && product.precioOferta > 0 && (
                  <span style={{ fontFamily: T.fontBody, fontSize: '16px', color: T.onSurfaceVariant, textDecoration: 'line-through' }}>
                    {formatPrice(product.precio)}
                  </span>
                )}
              </div>
              <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant, lineHeight: 1.8 }}>
                {product.descripcion || 'Una fórmula especializada para el cuidado personal.'}
              </p>
            </div>

            <div style={{ width: '100%', height: '1px', backgroundColor: `${T.outlineVariant}40` }} />

            {/* Selector Cantidad & CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: `1px solid ${T.outlineVariant}80`, borderRadius: '9999px',
                  backgroundColor: T.surfaceContainerLowest,
                }}>
                  <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1 || isOutOfStock}>−</button>
                  <span style={{ width: '32px', textAlign: 'center', fontSize: '15px', fontWeight: 600 }}>{qty}</span>
                  <button className="qty-btn" onClick={() => setQty(qty + 1)} disabled={isOutOfStock || (product.rastrearStock && qty >= product.stock)}>+</button>
                </div>
                {product.rastrearStock && (
                  <span style={{ fontSize: '13px', color: isOutOfStock ? '#d32f2f' : T.onSurfaceVariant }}>
                    {isOutOfStock ? 'Agotado temporalmente' : `${product.stock} unidades disponibles`}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  style={{
                    flex: 1, minWidth: '200px',
                    padding: '16px 32px', borderRadius: '9999px',
                    fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                    backgroundColor: isOutOfStock ? T.surfaceVariant : 'transparent',
                    color: isOutOfStock ? T.onSurfaceVariant : T.primary,
                    border: isOutOfStock ? 'none' : `1px solid ${T.primary}`,
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  }}
                >
                  Agregar a la bolsa
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  style={{
                    flex: 1, minWidth: '200px',
                    padding: '16px 32px', borderRadius: '9999px',
                    fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                    backgroundColor: isOutOfStock ? T.surfaceVariant : T.primary,
                    color: isOutOfStock ? T.onSurfaceVariant : '#fff',
                    border: 'none',
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  }}
                >
                  Comprar ahora
                </button>
              </div>
            </div>

            {/* Bento Grid Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
              <div style={{ backgroundColor: T.surfaceContainerLow, padding: '24px', borderRadius: '20px' }}>
                <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '18px', color: T.onSurface, marginBottom: '12px' }}>Ingredientes Clave</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {product.ingredientes && product.ingredientes.length > 0 ? product.ingredientes.map((ing, i) => (
                    <li key={i} style={{ fontSize: '13px', color: T.onSurfaceVariant, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: T.primary }}>✦</span> {ing}
                    </li>
                  )) : (
                    <li style={{ fontSize: '13px', color: T.onSurfaceVariant }}>Fórmula secreta exclusiva.</li>
                  )}
                </ul>
              </div>
              <div style={{ backgroundColor: T.surfaceContainerLow, padding: '24px', borderRadius: '20px' }}>
                <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '18px', color: T.onSurface, marginBottom: '12px' }}>Beneficios</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {product.beneficios && product.beneficios.length > 0 ? product.beneficios.map((ben, i) => (
                    <li key={i} style={{ fontSize: '13px', color: T.onSurfaceVariant, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: T.primary }}>✓</span> {ben}
                    </li>
                  )) : (
                    <li style={{ fontSize: '13px', color: T.onSurfaceVariant }}>Nutrición profunda.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CartModal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        config={config} 
      />
    </div>
  );
}
