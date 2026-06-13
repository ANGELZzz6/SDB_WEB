import { useState, useEffect } from 'react';

/* ─────────────────────────────────────────────────
   Design Tokens — coherentes con el resto del sitio
 ───────────────────────────────────────────────── */
const T = {
  fontHeadline: "'Noto Serif', serif",
  fontBody: "'Plus Jakarta Sans', sans-serif",
  primary: '#944555',
  primaryFixed: '#ffd9de',
  primaryDark: '#7a3845',
  onPrimary: '#ffffff',
  surface: '#fdf8f5',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f8f3f0',
  surfaceVariant: '#e6e2df',
  onSurface: '#1c1b1a',
  onSurfaceVariant: '#534245',
  outlineVariant: '#d9c1c3',
};

const STORAGE_KEY = 'sdb_cookie_consent';

type ConsentState = 'accepted' | 'declined' | null;

/**
 * Banner de cookies/privacidad.
 *
 * ¿Por qué es necesario?
 * - Google Fonts (fonts.googleapis.com) envía la IP del usuario a servidores de Google → dato personal bajo GDPR/Ley 1581.
 * - Cloudinary widget (upload-widget.cloudinary.com) es un script de tercero que puede establecer cookies propias.
 * - localStorage almacena el carrito y la sesión de admin.
 *
 * La categoría es "funcional + terceros necesarios", no publicidad.
 * Por eso ofrecemos aceptar/rechazar sin bloquear el acceso al sitio.
 */
export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Solo se muestra en rutas públicas (no en /admin/*)
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ConsentState;
    if (saved) {
      setConsent(saved);
    } else {
      // Pequeño delay para no solaparse con la carga inicial de la página
      const t = setTimeout(() => {
        setMounted(true);
        requestAnimationFrame(() => setVisible(true));
      }, 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setConsent('accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setConsent('declined');
    setVisible(false);
    // Si declina, eliminamos datos no esenciales del carrito
    localStorage.removeItem('sdb_cart');
  };

  // No mostrar si ya hay consentimiento, si está en admin, o si no está montado
  if (consent !== null || isAdminRoute || !mounted) return null;

  return (
    <>
      <style>{`
        @keyframes cookie-slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cookie-banner {
          animation: cookie-slide-up 0.40s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .cookie-accept-btn {
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .cookie-accept-btn:hover {
          background: ${T.primaryDark} !important;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(148,69,85,0.35) !important;
        }
        .cookie-decline-btn {
          transition: background 0.2s, border-color 0.2s;
        }
        .cookie-decline-btn:hover {
          background: ${T.surfaceVariant} !important;
        }
        .cookie-details-toggle {
          transition: color 0.15s;
        }
        .cookie-details-toggle:hover {
          color: ${T.primary} !important;
        }
        .cookie-details-panel {
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
        }
      `}</style>

      {/* ── Overlay semitransparente (NO bloquea el scroll, solo visual) ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 9999,
          padding: '16px',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none', // el overlay no intercepta clicks
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        {/* ── Banner principal ─────────────────────────────────────────── */}
        <div
          className="cookie-banner"
          style={{
            pointerEvents: 'all', // el panel sí intercepta
            width: '100%',
            maxWidth: '860px',
            backgroundColor: T.surfaceContainerLowest,
            borderRadius: '20px',
            border: `1px solid ${T.outlineVariant}50`,
            boxShadow: '0 24px 64px rgba(62, 2, 21, 0.12), 0 4px 16px rgba(62, 2, 21, 0.06)',
            padding: '24px 28px',
            fontFamily: T.fontBody,
            color: T.onSurface,
          }}
        >
          {/* ── Fila principal ─────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '20px',
            flexWrap: 'wrap',
          }}>
            {/* Icono decorativo */}
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: T.primaryFixed,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0,
            }}>
              🍪
            </div>

            {/* Texto */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h3 style={{
                fontFamily: T.fontHeadline,
                fontStyle: 'italic',
                fontSize: '17px',
                fontWeight: 600,
                color: T.onSurface,
                margin: '0 0 6px',
                letterSpacing: '-0.01em',
              }}>
                Privacidad & Cookies
              </h3>
              <p style={{
                fontFamily: T.fontBody,
                fontSize: '13px',
                lineHeight: 1.7,
                color: T.onSurfaceVariant,
                margin: 0,
              }}>
                Usamos almacenamiento local para tu carrito y sesión, y cargamos fuentes y recursos de{' '}
                <strong style={{ color: T.onSurface, fontWeight: 600 }}>Google Fonts</strong> y{' '}
                <strong style={{ color: T.onSurface, fontWeight: 600 }}>Cloudinary</strong> (subida de imágenes).
                No usamos cookies de publicidad ni rastreo de terceros.{' '}
                <button
                  className="cookie-details-toggle"
                  onClick={() => setShowDetails(v => !v)}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    fontFamily: T.fontBody, fontSize: '13px',
                    color: T.onSurfaceVariant, cursor: 'pointer',
                    textDecoration: 'underline', textDecorationStyle: 'dotted',
                  }}
                >
                  {showDetails ? 'Ocultar detalle' : 'Ver detalle'}
                </button>
              </p>

              {/* ── Panel de detalle expandible ────────────────────────── */}
              <div
                className="cookie-details-panel"
                style={{
                  maxHeight: showDetails ? '400px' : '0',
                  opacity: showDetails ? 1 : 0,
                }}
              >
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: T.surfaceContainerLow,
                  borderRadius: '12px',
                  border: `1px solid ${T.outlineVariant}30`,
                }}>
                  <p style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant, marginBottom: '12px' }}>
                    Detalle de almacenamiento y servicios de terceros
                  </p>
                  {[
                    {
                      name: 'Carrito de compras',
                      key: 'sdb_cart',
                      type: 'LocalStorage · Funcional',
                      desc: 'Guarda temporalmente los productos que agregas a tu bolsa. Se borra al vaciar el carrito.',
                      icon: '🛍️',
                      required: false,
                    },
                    {
                      name: 'Sesión de administrador',
                      key: 'token / adminUser',
                      type: 'LocalStorage · Estrictamente necesario',
                      desc: 'Token JWT de autenticación para el panel de administración. Solo se usa si ingresas como administrador.',
                      icon: '🔐',
                      required: true,
                    },
                    {
                      name: 'Google Fonts',
                      key: 'fonts.googleapis.com',
                      type: 'Recurso externo · Funcional',
                      desc: 'Cargamos tipografías Noto Serif y Plus Jakarta Sans. Google puede registrar la solicitud (IP, fecha/hora).',
                      icon: '🔤',
                      required: false,
                    },
                    {
                      name: 'Cloudinary (Widget de imágenes)',
                      key: 'upload-widget.cloudinary.com',
                      type: 'Script de tercero · Funcional',
                      desc: 'Script usado exclusivamente por el administrador para subir imágenes de productos y servicios.',
                      icon: '☁️',
                      required: false,
                    },
                  ].map(item => (
                    <div key={item.name} style={{
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      marginBottom: '12px', paddingBottom: '12px',
                      borderBottom: `1px solid ${T.outlineVariant}20`,
                    }}>
                      <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                          <span style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, color: T.onSurface }}>{item.name}</span>
                          <span style={{
                            fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            padding: '2px 7px', borderRadius: '9999px',
                            backgroundColor: item.required ? '#e2f0d9' : T.primaryFixed,
                            color: item.required ? '#2e7d32' : T.primary,
                          }}>
                            {item.required ? 'Necesario' : 'Funcional'}
                          </span>
                        </div>
                        <p style={{ fontFamily: T.fontBody, fontSize: '11px', color: T.onSurfaceVariant, margin: '0 0 2px', fontStyle: 'italic' }}>{item.type}</p>
                        <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontFamily: T.fontBody, fontSize: '11px', color: T.onSurfaceVariant, margin: '8px 0 0', lineHeight: 1.6 }}>
                    De acuerdo con la <strong>Ley 1581 de 2012</strong> (Colombia) y los principios del RGPD europeo.
                    Puedes cambiar tu preferencia en cualquier momento borrando los datos del sitio en tu navegador.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Botones de acción ───────────────────────────────────── */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minWidth: '160px',
              flexShrink: 0,
            }}>
              <button
                className="cookie-accept-btn"
                onClick={handleAccept}
                style={{
                  backgroundColor: T.primary,
                  color: T.onPrimary,
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '9999px',
                  fontFamily: T.fontBody,
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(148,69,85,0.25)',
                  whiteSpace: 'nowrap',
                }}
              >
                Aceptar todo
              </button>
              <button
                className="cookie-decline-btn"
                onClick={handleDecline}
                style={{
                  backgroundColor: 'transparent',
                  color: T.onSurfaceVariant,
                  border: `1px solid ${T.outlineVariant}`,
                  padding: '11px 20px',
                  borderRadius: '9999px',
                  fontFamily: T.fontBody,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Solo necesarias
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
