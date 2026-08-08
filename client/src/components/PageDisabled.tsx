import { useNavigate } from 'react-router-dom';
import type { SinglePageVisibility } from '../types';

interface PageDisabledProps {
  config: SinglePageVisibility;
  /** Icono opcional para mostrar en el encabezado */
  icon?: string;
}

/**
 * Componente reutilizable para mostrar cuando una página está deshabilitada.
 * Muestra un mensaje personalizable con botones de navegación configurados por el admin.
 *
 * CAPA 2/3 de seguridad: renderizado cuando el router o el componente detectan
 * que la página está marcada como inactiva en SiteConfig.
 */
export default function PageDisabled({ config, icon = '🔒' }: PageDisabledProps) {
  const navigate = useNavigate();

  const handleButtonClick = (ruta: string, tipo: string) => {
    if (tipo === 'externo') {
      window.open(ruta, '_blank', 'noopener,noreferrer');
    } else {
      navigate(ruta);
    }
  };

  return (
    <>
      <style>{`
        @keyframes pageDisabledFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pageDisabledFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-disabled-btn {
          transition: all 0.25s ease !important;
          position: relative;
          overflow: hidden;
        }
        .page-disabled-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.08);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .page-disabled-btn:hover::before { opacity: 1; }
        .page-disabled-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 12px 32px rgba(148,69,85,0.30) !important;
        }
        .page-disabled-btn:active { transform: translateY(0) !important; }
        .page-disabled-btn-outline:hover {
          transform: translateY(-2px) !important;
          background: rgba(148,69,85,0.06) !important;
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fdf8f9 0%, #f5e8ec 50%, #fdf8f9 100%)',
          padding: '32px 16px',
          fontFamily: "'Inter', 'Outfit', sans-serif",
        }}
      >
        {/* Fondo decorativo */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 0,
          }}
        >
          <div style={{
            position: 'absolute', top: '-10%', left: '-5%',
            width: '500px', height: '500px', borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(148,69,85,0.06) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', right: '-5%',
            width: '400px', height: '400px', borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(62,2,21,0.05) 0%, transparent 70%)',
          }} />
        </div>

        {/* Card principal */}
        <div
          style={{
            position: 'relative', zIndex: 1,
            maxWidth: '520px', width: '100%',
            backgroundColor: 'rgba(255,255,255,0.80)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '28px',
            border: '1px solid rgba(148,69,85,0.12)',
            boxShadow: '0 24px 64px rgba(62,2,21,0.10), 0 4px 16px rgba(148,69,85,0.06)',
            padding: '48px 40px',
            textAlign: 'center',
            animation: 'pageDisabledFadeIn 0.5s ease both',
          }}
        >
          {/* Icono animado */}
          <div
            style={{
              fontSize: '64px',
              marginBottom: '24px',
              display: 'block',
              animation: 'pageDisabledFloat 3s ease-in-out infinite',
              lineHeight: 1,
            }}
          >
            {icon}
          </div>

          {/* Línea decorativa */}
          <div style={{
            width: '48px', height: '3px',
            background: 'linear-gradient(90deg, #944555, #c47a8a)',
            borderRadius: '9999px',
            margin: '0 auto 24px',
          }} />

          {/* Título */}
          <h1
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontStyle: 'italic',
              fontSize: '28px',
              fontWeight: 700,
              color: '#3e0215',
              marginBottom: '16px',
              lineHeight: 1.2,
            }}
          >
            {config.mensajeTitulo}
          </h1>

          {/* Cuerpo del mensaje */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              color: '#7a5060',
              lineHeight: 1.7,
              marginBottom: '36px',
              maxWidth: '400px',
              margin: '0 auto 36px',
            }}
          >
            {config.mensajeCuerpo}
          </p>

          {/* Botones de navegación */}
          {config.botones && config.botones.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'center',
              }}
            >
              {config.botones.map((btn, idx) => {
                const isPrimary = idx === 0;
                return (
                  <button
                    key={btn._id || idx}
                    onClick={() => handleButtonClick(btn.ruta, btn.tipo)}
                    className={isPrimary ? 'page-disabled-btn' : 'page-disabled-btn page-disabled-btn-outline'}
                    style={{
                      padding: '13px 28px',
                      borderRadius: '9999px',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isPrimary ? 'none' : '1.5px solid rgba(148,69,85,0.30)',
                      backgroundColor: isPrimary ? '#944555' : 'transparent',
                      color: isPrimary ? '#ffffff' : '#944555',
                      boxShadow: isPrimary ? '0 6px 20px rgba(148,69,85,0.25)' : 'none',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {btn.texto}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer sutil */}
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            color: 'rgba(122,80,96,0.50)',
            marginTop: '32px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            L'Élixir Salon
          </p>
        </div>
      </div>
    </>
  );
}
