import { useState, useEffect, useRef } from 'react';
import { getCart, saveCart } from '../pages/ProductsPage';
import type { CartItem } from '../pages/ProductsPage';
import { productService } from '../services/api';
import type { SiteConfig } from '../types';

/* ─────────────────────────────────────────────────
   Design Tokens — mirror de ProductsPage
 ───────────────────────────────────────────────── */
const T = {
  fontHeadline: "'Noto Serif', serif",
  fontBody: "'Plus Jakarta Sans', sans-serif",
  primary: 'var(--color-primary, #944555)',
  primaryFixed: '#ffd9de',
  onPrimary: '#ffffff',
  surface: 'var(--color-accent, #fdf8f5)',
  surfaceContainerLow: '#f8f3f0',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer: '#f2edea',
  surfaceVariant: '#e6e2df',
  onSurface: 'var(--color-secondary, #1c1b1a)',
  onSurfaceVariant: '#534245',
  outlineVariant: '#d9c1c3',
};

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SiteConfig | null;
}

export default function CartModal({ isOpen, onClose, config }: CartModalProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [validating, setValidating] = useState(false);
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  /* ── Animación de entrada / salida ─────────────────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      setCartItems(getCart());
      // pequeño tick para que la transición CSS sea visible
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  /* ── Cerrar con Escape ─────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  /* ── Bloquear scroll del body mientras está abierto ───────────────────── */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* ── Click fuera del modal ─────────────────────────────────────────────── */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  /* ── Operaciones del carrito ───────────────────────────────────────────── */
  const updateQty = (id: string, newQty: number) => {
    let updated = [...cartItems];
    if (newQty <= 0) {
      updated = updated.filter(item => item.product._id !== id);
    } else {
      const idx = updated.findIndex(item => item.product._id === id);
      if (idx >= 0) updated[idx] = { ...updated[idx], qty: newQty };
    }
    setCartItems(updated);
    saveCart(updated);
    window.dispatchEvent(new Event('sdb_cart_updated'));
  };

  const remove = (id: string) => updateQty(id, 0);

  const fmt = (price: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);

  const getPrice = (item: CartItem) =>
    item.product.precioOferta && item.product.precioOferta > 0
      ? item.product.precioOferta
      : item.product.precio;

  const total = cartItems.reduce((acc, item) => acc + getPrice(item) * item.qty, 0);

  /* ── Checkout con validación de stock ─────────────────────────────────── */
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setValidating(true);

    try {
      // 1. Validar stock real en tiempo real
      const results = await Promise.all(
        cartItems.map(item => productService.getById(item.product._id))
      );

      const discrepancies: string[] = [];
      let validCart: CartItem[] = [];

      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const res = results[i];

        if (res.success && res.data) {
          const p = res.data;
          if (p.rastrearStock && p.stock < item.qty) {
            if (p.stock === 0) {
              discrepancies.push(`• ${p.nombre} (Agotado)`);
            } else {
              discrepancies.push(`• ${p.nombre} (Solo quedan ${p.stock} uds.)`);
              validCart.push({ ...item, qty: p.stock });
            }
          } else {
            validCart.push(item);
          }
        } else {
          discrepancies.push(`• ${item.product.nombre} (No disponible)`);
        }
      }

      if (discrepancies.length > 0) {
        alert(`Atención, el stock de algunos productos ha cambiado:\n\n${discrepancies.join('\n')}\n\nHemos ajustado tu bolsa. Por favor revísala antes de confirmar.`);
        setCartItems(validCart);
        saveCart(validCart);
        window.dispatchEvent(new Event('sdb_cart_updated'));
        setValidating(false);
        return;
      }

      // 2. Registrar movimientos pendientes en backend
      await productService.checkout(
        cartItems.map(i => ({ productId: i.product._id, qty: i.qty }))
      );

      // 3. Abrir WhatsApp
      const salonName = config?.nombreSalon || "L'Élixir Salon";
      const waNumber = config?.whatsapp?.replace(/\D/g, '') || '573000000000';
      const itemsText = cartItems
        .map(i => `• ${i.product.nombre} (x${i.qty}) — ${fmt(getPrice(i) * i.qty)}`)
        .join('\n');
      const msg = `Hola ${salonName}! 🌸\n\nMe gustaría pedir los siguientes productos:\n\n${itemsText}\n\n*Total: ${fmt(total)}*\n\n¿Tienen disponibilidad? Gracias!`;
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');

    } catch (err) {
      alert('Hubo un problema al verificar el inventario. Por favor intenta de nuevo.');
      console.error(err);
    } finally {
      setValidating(false);
    }
  };

  if (!isOpen && !visible) return null;

  return (
    <>
      <style>{`
        @keyframes cart-modal-in {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .cart-modal-panel {
          animation: cart-modal-in 0.30s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .cart-scroll::-webkit-scrollbar { width: 4px; }
        .cart-scroll::-webkit-scrollbar-track { background: transparent; }
        .cart-scroll::-webkit-scrollbar-thumb {
          background: #d9c1c3;
          border-radius: 9999px;
        }
        .cart-scroll::-webkit-scrollbar-thumb:hover { background: #944555; }
        .cart-item-row { transition: background 0.15s; }
        .cart-item-row:hover { background: rgba(148,69,85,0.03); }
        .cart-qty-btn { transition: background 0.15s, color 0.15s; }
        .cart-qty-btn:hover {
          background: #944555 !important;
          color: #fff !important;
        }
        .cart-remove-btn { transition: color 0.15s; }
        .cart-remove-btn:hover { color: #944555; }
        .cart-checkout-btn { transition: background 0.2s, transform 0.15s, box-shadow 0.2s; }
        .cart-checkout-btn:hover:not(:disabled) {
          background: #7a3845 !important;
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(148,69,85,0.40) !important;
        }
        .cart-checkout-btn:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>

      {/* ── Overlay con glassmorphism ─────────────────────────────────────── */}
      <div
        onClick={handleOverlayClick}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(28, 10, 15, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          boxSizing: 'border-box',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      >
        {/* ── Panel del Modal ───────────────────────────────────────────── */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Tu bolsa de compras"
          className="cart-modal-panel"
          style={{
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            borderRadius: '24px',
            backgroundColor: T.surfaceContainerLowest,
            boxShadow: '0 32px 80px rgba(62, 2, 21, 0.20)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: `1px solid ${T.outlineVariant}40`,
            fontFamily: T.fontBody,
            color: T.onSurface,
          }}
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 28px 20px',
            borderBottom: `1px solid ${T.outlineVariant}30`,
            flexShrink: 0,
          }}>
            <div>
              <h2 style={{
                fontFamily: T.fontHeadline,
                fontStyle: 'italic',
                fontSize: '22px',
                fontWeight: 600,
                color: T.onSurface,
                margin: 0,
                letterSpacing: '-0.02em',
              }}>
                Tu Bolsa
              </h2>
              {cartItems.length > 0 && (
                <p style={{
                  fontFamily: T.fontBody,
                  fontSize: '12px',
                  color: T.onSurfaceVariant,
                  margin: '2px 0 0',
                }}>
                  {cartItems.reduce((acc, i) => acc + i.qty, 0)} artículo(s)
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar bolsa"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: T.surfaceContainerLow,
                border: `1px solid ${T.outlineVariant}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                color: T.onSurfaceVariant,
                transition: 'background 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.surfaceVariant)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = T.surfaceContainerLow)}
            >
              ✕
            </button>
          </div>

          {/* ── Lista de productos ─────────────────────────────────────── */}
          <div
            className="cart-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: T.onSurfaceVariant }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px' }}>🛒</p>
                <p style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '18px', color: T.onSurfaceVariant }}>
                  Tu bolsa está vacía
                </p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  Agrega productos de nuestra colección para comenzar.
                </p>
              </div>
            ) : (
              cartItems.map((item, idx) => {
                const p = item.product;
                const price = getPrice(item);
                return (
                  <div
                    key={`${p._id}-${idx}`}
                    className="cart-item-row"
                    style={{
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                      padding: '12px',
                      borderRadius: '16px',
                      border: `1px solid ${T.outlineVariant}30`,
                    }}
                  >
                    {/* Imagen */}
                    <div style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: T.surfaceContainerLow,
                    }}>
                      <img
                        src={p.imagenes?.[0] || 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=200&h=200&fit=crop'}
                        alt={p.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.12em',
                        color: T.onSurfaceVariant, margin: '0 0 2px',
                      }}>
                        {p.marca}
                      </p>
                      <p style={{
                        fontFamily: T.fontHeadline, fontStyle: 'italic',
                        fontSize: '15px', color: T.onSurface,
                        margin: '0 0 8px', lineHeight: 1.3,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {p.nombre}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Controles de cantidad */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: `1px solid ${T.outlineVariant}50`,
                          borderRadius: '9999px',
                          overflow: 'hidden',
                          backgroundColor: T.surfaceContainerLowest,
                        }}>
                          <button
                            className="cart-qty-btn"
                            onClick={() => updateQty(p._id, item.qty - 1)}
                            style={{
                              width: '30px', height: '30px',
                              border: 'none', background: 'none',
                              color: T.onSurfaceVariant, cursor: 'pointer',
                              fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: '9999px',
                            }}
                          >
                            −
                          </button>
                          <span style={{
                            minWidth: '24px', textAlign: 'center',
                            fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700,
                            color: T.onSurface,
                          }}>
                            {item.qty}
                          </span>
                          <button
                            className="cart-qty-btn"
                            onClick={() => updateQty(p._id, item.qty + 1)}
                            style={{
                              width: '30px', height: '30px',
                              border: 'none', background: 'none',
                              color: T.onSurfaceVariant, cursor: 'pointer',
                              fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: '9999px',
                            }}
                          >
                            +
                          </button>
                        </div>

                        {/* Precio total de la línea */}
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontFamily: T.fontBody, fontSize: '15px', fontWeight: 700,
                            color: T.onSurface,
                          }}>
                            {fmt(price * item.qty)}
                          </span>
                          {item.qty > 1 && (
                            <p style={{ fontSize: '10px', color: T.onSurfaceVariant, margin: '1px 0 0' }}>
                              {fmt(price)} / u
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botón quitar */}
                    <button
                      className="cart-remove-btn"
                      onClick={() => remove(p._id)}
                      aria-label={`Quitar ${p.nombre}`}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        border: `1px solid ${T.outlineVariant}40`,
                        background: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', color: T.onSurfaceVariant,
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Footer con total y CTA ──────────────────────────────────── */}
          {cartItems.length > 0 && (
            <div style={{
              padding: '20px 28px 28px',
              borderTop: `1px solid ${T.outlineVariant}30`,
              backgroundColor: T.surfaceContainerLow,
              flexShrink: 0,
            }}>
              {/* Desglose */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '16px',
              }}>
                <span style={{
                  fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.15em',
                  color: T.onSurfaceVariant,
                }}>
                  Total estimado
                </span>
                <span style={{
                  fontFamily: T.fontHeadline, fontSize: '26px',
                  color: T.onSurface, fontWeight: 600,
                }}>
                  {fmt(total)}
                </span>
              </div>

              {/* Nota */}
              <p style={{
                fontFamily: T.fontBody, fontSize: '11px', color: T.onSurfaceVariant,
                lineHeight: 1.6, marginBottom: '16px',
              }}>
                El precio final puede variar según disponibilidad. Te confirmaremos por WhatsApp.
              </p>

              {/* Botón CTA */}
              <button
                className="cart-checkout-btn"
                onClick={handleCheckout}
                disabled={validating}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-primary, #944555)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '16px 24px',
                  borderRadius: '9999px',
                  fontFamily: T.fontBody,
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  cursor: validating ? 'not-allowed' : 'pointer',
                  opacity: validating ? 0.7 : 1,
                  boxShadow: '0 8px 24px rgba(148,69,85,0.30)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {validating ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                    Verificando...
                  </>
                ) : (
                  <>
                    <span>💬</span>
                    Confirmar por WhatsApp
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
