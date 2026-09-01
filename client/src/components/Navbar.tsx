import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePageVisibility } from '../hooks/usePageVisibility';

const T = {
  fontHeadline: "'Noto Serif', serif",
  fontBody: "'Plus Jakarta Sans', sans-serif",
  primary: '#944555',
  onPrimary: '#ffffff',
  surface: '#fdf8f5',
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

interface NavbarProps {
  salonName?: string;
}

export default function Navbar({ salonName }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isEnabled } = usePageVisibility();
  const chatbotEnabled = isEnabled('chatbot');

  const displaySalonName = salonName || "L'Élixir Salon";

  const navLinks = [
    { label: 'Servicios', path: '/servicios' },
    { label: 'Productos', path: '/productos' },
    { label: 'Especialistas', path: '/especialistas' },
    { label: 'Galería', path: '/galeria' },
  ];

  // Bloquear scroll de body cuando el menú móvil esté abierto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Cerrar menú con la tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogoClick = () => {
    setIsMenuOpen(false);
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const handleNavClick = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <nav
      aria-label="Navegación principal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 50,
        backgroundColor: 'rgba(253,248,245,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.outlineVariant}30`,
      }}
    >
      <div
        style={{
          ...wrap,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        {/* Logo Clickeable */}
        <button
          onClick={handleLogoClick}
          aria-label="Ir al inicio"
          style={{
            fontFamily: T.fontHeadline,
            fontStyle: 'italic',
            fontSize: '22px',
            color: T.primary,
            cursor: 'pointer',
            userSelect: 'none',
            letterSpacing: '-0.01em',
            background: 'none',
            border: 'none',
            padding: 0,
          }}
        >
          {displaySalonName}
        </button>

        {/* Links Desktop */}
        <div className="nav-links" style={{ alignItems: 'center', gap: '36px' }}>
          {navLinks.map(({ label, path }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={label}
                onClick={() => handleNavClick(path)}
                style={{
                  fontFamily: T.fontHeadline,
                  fontSize: '16px',
                  letterSpacing: '-0.02em',
                  color: isActive ? T.primary : T.onSurfaceVariant,
                  fontWeight: isActive ? 700 : 400,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  padding: '4px 0',
                  borderBottom: isActive ? `2px solid ${T.primary}` : '2px solid transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? T.primary : T.onSurfaceVariant)}
              >
                {label}
              </button>
            );
          })}
          {chatbotEnabled && (
            <button
              onClick={() => handleNavClick('/chatbot')}
              style={{
                fontFamily: T.fontBody,
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                backgroundColor: T.primary,
                color: T.onPrimary,
                padding: '12px 24px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s, background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.backgroundColor = '#772e3e';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = T.primary;
              }}
            >
              Agendar Cita
            </button>
          )}
        </div>

        {/* Botón Hamburguesa (Móvil) */}
        <button
          className="hamburger"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMenuOpen}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            cursor: 'pointer',
            zIndex: 100,
            padding: '8px',
            background: 'none',
            border: 'none',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '2px',
              backgroundColor: T.primary,
              transform: isMenuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
              transition: 'all 0.3s ease',
            }}
          />
          <div
            style={{
              width: '24px',
              height: '2px',
              backgroundColor: T.primary,
              opacity: isMenuOpen ? 0 : 1,
              transition: 'all 0.3s ease',
            }}
          />
          <div
            style={{
              width: '24px',
              height: '2px',
              backgroundColor: T.primary,
              transform: isMenuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
              transition: 'all 0.3s ease',
            }}
          />
        </button>
      </div>

      {/* Overlay de Menú Móvil */}
      <div
        className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          backgroundColor: T.surface,
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '28px',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
          pointerEvents: isMenuOpen ? 'auto' : 'none',
        }}
      >
        {[
            ...navLinks,
            ...(chatbotEnabled ? [{ label: 'Agendar Cita', path: '/chatbot' }] : []),
          ].map(({ label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={label}
              onClick={() => handleNavClick(path)}
              style={{
                fontSize: '28px',
                fontFamily: T.fontHeadline,
                fontStyle: 'italic',
                color: isActive ? T.primary : T.onSurface,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                fontWeight: isActive ? 700 : 400,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {label}
            </button>
          );
        })}

        <button
          onClick={() => setIsMenuOpen(false)}
          style={{
            fontSize: '12px',
            fontFamily: T.fontBody,
            fontWeight: 700,
            letterSpacing: '0.2em',
            marginTop: '40px',
            opacity: 0.6,
            color: T.onSurfaceVariant,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 16px',
          }}
        >
          CERRAR
        </button>
      </div>
    </nav>
  );
}
