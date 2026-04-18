import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function GlobalWakeUp() {
  const [loading, setLoading] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Si la app ya se cargó en esta sesión, podríamos evitar mostrarlo otra vez.
    // Usamos sessionStorage para que solo aparezca una vez por pestaña/visita.
    const hasWokenUp = sessionStorage.getItem('server_woken_up');
    if (hasWokenUp) {
      setLoading(false);
      return;
    }

    const wakeUp = async () => {
      try {
        // Hacemos el ping a la ruta /api/health
        await api.get('/health');
        sessionStorage.setItem('server_woken_up', 'true');
      } catch (err) {
        // Incluso si falla (por ejemplo, timeout), quitamos la pantalla para no bloquear al usuario eternamente.
        console.error("Wake-up check failed, continuing...", err);
      } finally {
        if (isMounted) {
          setFadingOut(true);
          setTimeout(() => {
            if (isMounted) setLoading(false);
          }, 800); // Duración de la transición fade-out
        }
      }
    };

    wakeUp();

    return () => { isMounted = false; };
  }, []);

  if (!loading) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      backgroundColor: 'rgba(253, 248, 245, 0.98)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: fadingOut ? 0 : 1,
      transition: 'opacity 0.8s ease-in-out',
      fontFamily: "'Noto Serif', serif",
      color: '#944555'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '3px solid rgba(148, 69, 85, 0.2)',
        borderTopColor: '#944555',
        borderRadius: '50%',
        animation: 'wakeup-spin 1s linear infinite',
        marginBottom: '24px'
      }}></div>
      <h2 style={{ fontStyle: 'italic', fontSize: '24px', textAlign: 'center', maxWidth: '80%', margin: 0, letterSpacing: '-0.02em' }}>
        Despertando los servidores...
      </h2>
      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', color: '#534245', marginTop: '12px', textAlign: 'center', maxWidth: '80%', fontWeight: 300, lineHeight: 1.6 }}>
        Preparando tu experiencia en L'Élixir.<br/>Esto tomará unos segundos.
      </p>
      <style>
        {`
          @keyframes wakeup-spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
