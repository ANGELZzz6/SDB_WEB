import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../lib/adminTokens';
import { authService } from '../../services/api';

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'empleada'>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Por favor llena todos los campos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await authService.login({ identifier, password, role });
      if (resp.success && resp.data?.token) {
        localStorage.setItem('token', resp.data.token);
        // Store full user data immediately so permissions are available on first load
        if (resp.data.user) {
          localStorage.setItem('adminUser', JSON.stringify(resp.data.user));
        }
        navigate('/admin'); // Redirect a protected area
      }
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: T.surface,
      fontFamily: T.fontBody,
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        backgroundColor: T.surfaceContainerLowest,
        borderRadius: '24px',
        padding: '48px 32px',
        boxShadow: '0 25px 50px -12px rgba(148, 69, 85, 0.15)',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontFamily: T.fontHeadline,
          fontStyle: 'italic',
          color: T.primary,
          fontSize: '32px',
          marginBottom: '8px'
        }}>L'Élixir Salon</h1>
        <p style={{
          color: T.onSurfaceVariant,
          fontSize: '14px',
          marginBottom: '32px'
        }}>Ingresa a tu panel de control</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', backgroundColor: T.surfaceContainerLow, borderRadius: '12px', padding: '4px' }}>
            <button
              type="button"
              onClick={() => setRole('admin')}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                fontFamily: T.fontBody, fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: role === 'admin' ? T.surfaceContainerLowest : 'transparent',
                color: role === 'admin' ? T.primary : T.onSurfaceVariant,
                boxShadow: role === 'admin' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Administrador
            </button>
            <button
              type="button"
              onClick={() => setRole('empleada')}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                fontFamily: T.fontBody, fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: role === 'empleada' ? T.surfaceContainerLowest : 'transparent',
                color: role === 'empleada' ? T.primary : T.onSurfaceVariant,
                boxShadow: role === 'empleada' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Especialista
            </button>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '6px' }}>
              {role === 'admin' ? 'Usuario' : 'Nombre o Correo'}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder={role === 'admin' ? 'admin' : 'Tu nombre'}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '12px',
                border: `1px solid ${T.outlineVariant}`,
                backgroundColor: T.surfaceContainerLowest,
                fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface,
                outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = T.primary}
              onBlur={e => e.target.style.borderColor = T.outlineVariant}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.onSurfaceVariant, marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '12px',
                border: `1px solid ${T.outlineVariant}`,
                backgroundColor: T.surfaceContainerLowest,
                fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface,
                outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = T.primary}
              onBlur={e => e.target.style.borderColor = T.outlineVariant}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: T.errorContainer,
              color: T.error,
              padding: '12px', borderRadius: '12px',
              fontSize: '13px', fontWeight: 600
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
              backgroundColor: T.primary, color: '#fff',
              fontFamily: T.fontBody, fontSize: '15px', fontWeight: 700, letterSpacing: '0.02em',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
              marginTop: '8px'
            }}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
