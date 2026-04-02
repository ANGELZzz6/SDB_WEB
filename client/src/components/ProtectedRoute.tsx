import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

interface ProtectedRouteProps {
  requiredPermission?: string;
}

export default function ProtectedRoute({ requiredPermission }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(true);
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
          
          // Check permissions if required
          if (requiredPermission) {
            const isAdmin = res.data.role === 'admin';
            const userPerms: Record<string, boolean> = res.data.permissions || {};
            // Admin always has access; specialist needs explicit true
            if (!isAdmin && userPerms[requiredPermission] !== true) {
              setHasPermission(false);
            } else {
              setHasPermission(true);
            }
          } else {
            // No specific permission required - all authenticated users get access
            setHasPermission(true);
          }
        }
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    verifyToken();
  }, [location.pathname, requiredPermission]);

  if (isAuthenticated === null) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif' }}>Cargando administrador...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!hasPermission) {
    // Redirect to dashboard if no permission
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
