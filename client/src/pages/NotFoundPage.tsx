import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';

const T = {
  fontHeadline: "'Noto Serif', serif",
  fontBody: "'Plus Jakarta Sans', sans-serif",
  primary: '#944555',
  primaryContainer: '#e8899a',
  primaryFixed: '#ffd9de',
  surface: '#fdf8f5',
  onSurface: '#1c1b1a',
  onSurfaceVariant: '#534245',
  outlineVariant: '#d9c1c3',
};

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        fontFamily: T.fontBody,
        color: T.onSurface,
        backgroundColor: T.surface,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
      }}
    >
      <SEOHead
        title="Página No Encontrada (404)"
        description="La página que estás buscando no existe o se ha movido. Regresa al inicio o agenda tu cita en L'Élixir Salon."
      />

      <Navbar />

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '120px',
          paddingBottom: '80px',
          paddingLeft: '20px',
          paddingRight: '20px',
          position: 'relative',
        }}
      >
        {/* Glowing background blobs */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '320px',
            height: '320px',
            backgroundColor: T.primaryFixed,
            borderRadius: '9999px',
            filter: 'blur(80px)',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />

        {/* Glassmorphism Card */}
        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '28px',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(148, 69, 85, 0.12)',
            border: `1px solid ${T.outlineVariant}40`,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 217, 222, 0.5)',
              marginBottom: '20px',
            }}
          >
            <span
              style={{
                fontFamily: T.fontBody,
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: T.primary,
              }}
            >
              Error 404
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: T.fontHeadline,
              fontStyle: 'italic',
              fontSize: 'clamp(36px, 6vw, 54px)',
              fontWeight: 700,
              color: T.onSurface,
              lineHeight: 1.1,
              marginBottom: '16px',
            }}
          >
            Esta página <span style={{ color: T.primary }}>no existe</span>
          </h1>

          <p
            style={{
              fontFamily: T.fontBody,
              fontSize: '16px',
              color: T.onSurfaceVariant,
              lineHeight: 1.7,
              marginBottom: '36px',
              fontWeight: 300,
            }}
          >
            Lo sentimos, el enlace que intentaste abrir no está disponible o ha cambiado de lugar.
            Te invitamos a explorar nuestros servicios o agendar tu cita.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={() => navigate('/')}
              style={{
                fontFamily: T.fontBody,
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                backgroundColor: T.primary,
                color: '#FFFFFF',
                padding: '16px 32px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 12px 30px rgba(148, 69, 85, 0.20)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.backgroundColor = '#772e3e';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.backgroundColor = T.primary;
              }}
            >
              Volver al Inicio
            </button>

            <button
              onClick={() => navigate('/chatbot')}
              style={{
                fontFamily: T.fontBody,
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                backgroundColor: 'transparent',
                color: T.primary,
                padding: '16px 32px',
                borderRadius: '9999px',
                border: `1.5px solid ${T.primary}`,
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = T.primaryFixed;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Agendar Cita
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
