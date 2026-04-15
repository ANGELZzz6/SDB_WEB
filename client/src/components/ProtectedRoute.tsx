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

      // ── LOCAL JWT CHECK ───────────────────────────────────────────────────
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.warn('Sesión expirada localmente.');
          localStorage.removeItem('token');
          localStorage.removeItem('adminUser');
          setIsAuthenticated(false);
          return;
        }
      } catch (err) {
        console.error('Token inválido estructuralmente.');
        setIsAuthenticated(false);
        return;
      }

      // ── PERMISSION CHECK (Local first for speed) ─────────────────────────
      const cachedUser = localStorage.getItem('adminUser');
      if (cachedUser) {
        const userData = JSON.parse(cachedUser);
        if (requiredPermission) {
          const isAdmin = userData.role === 'admin';
          const userPerms: Record<string, boolean> = userData.permissions || {};
          if (!isAdmin && userPerms[requiredPermission] !== true) {
            setHasPermission(false);
          } else {
            setHasPermission(true);
          }
        }
        setIsAuthenticated(true);
      }

      // ── SERVER VERIFICATION (Sync latest data/permissions) ────────────────
      try {
        const res = await authService.getMe();
        if (res.data) {
          localStorage.setItem('adminUser', JSON.stringify(res.data));
          
          if (requiredPermission) {
            const isAdmin = res.data.role === 'admin';
            const userPerms: Record<string, boolean> = res.data.permissions || {};
            if (!isAdmin && userPerms[requiredPermission] !== true) {
              setHasPermission(false);
            } else {
              setHasPermission(true);
            }
          } else {
            setHasPermission(true);
          }
          setIsAuthenticated(true);
        }
      } catch (error: any) {
        const errMsg = error.response?.data?.message || error.message;

        // PATCH 4: Fallback cuando el servidor falla temporalmente.
        // En lugar de forzar setHasPermission(true), respetamos los permisos
        // almacenados en el cache local para mantener el RBAC íntegro.
        const cachedUserStr = localStorage.getItem('adminUser');
        if (cachedUserStr) {
          console.warn('getMe() falló, usando fallback local con permisos del cache:', errMsg);
          try {
            const cachedUser = JSON.parse(cachedUserStr);
            const isAdmin = cachedUser.role === 'admin';
            const userPerms: Record<string, boolean> = cachedUser.permissions || {};

            // Evaluar el permiso requerido usando los datos del cache, no forzar true
            const fallbackPermission = !requiredPermission || isAdmin || userPerms[requiredPermission] === true;

            setIsAuthenticated(true);
            setHasPermission(fallbackPermission);
          } catch {
            // Si el cache está corrupto, cerramos sesión por seguridad
            localStorage.removeItem('token');
            localStorage.removeItem('adminUser');
            setIsAuthenticated(false);
          }
        } else {
          console.error('getMe() falló y no hay datos locales:', errMsg);
          localStorage.removeItem('token');
          localStorage.removeItem('adminUser');
          setIsAuthenticated(false);
        }
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
