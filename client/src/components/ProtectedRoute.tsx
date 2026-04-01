import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

export default function ProtectedRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      
      try {
        const res = await authService.getMe();
        if (res.data) {
          localStorage.setItem('adminUser', JSON.stringify(res.data));
        }
        setIsAuthenticated(true);
      } catch (error) {
        // El interceptor en api.ts ya maneja la eliminación del token y redirección
        setIsAuthenticated(false);
      }
    };
    verifyToken();
  }, [location.pathname]);

  // Pantalla de carga mientras se verifica (opcional, evita flasheos)
  if (isAuthenticated === null) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif' }}>Cargando administrador...</p>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
