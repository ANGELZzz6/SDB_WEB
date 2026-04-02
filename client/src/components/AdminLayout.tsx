import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { T, ADMIN_NAV } from '../lib/adminTokens';

interface AdminLayoutProps {
  children: ReactNode;
  searchPlaceholder?: string;
  topBarRight?: ReactNode;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export default function AdminLayout({ 
  children, 
  searchPlaceholder = 'Buscar...', 
  topBarRight,
  searchValue,
  onSearchChange
}: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [internalSearch, setInternalSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const search = searchValue !== undefined ? searchValue : internalSearch;
  const setSearch = onSearchChange || setInternalSearch;

  // Determine user role and permissions
  const rawUser = localStorage.getItem('adminUser');
  const user = rawUser ? JSON.parse(rawUser) : null;
  const isAdmin = user?.role === 'admin';
  const userPermissions: Record<string, boolean> = user?.permissions ?? {};

  // Keys always visible to specialists (can't be removed by admin)
  const ALWAYS_VISIBLE = new Set(['citas', 'calendario']);

  const filteredNav = ADMIN_NAV.filter(item => {
    if (isAdmin) return true; // admin sees everything
    if (ALWAYS_VISIBLE.has(item.key)) return true; // specialists always see dashboard + calendar
    return userPermissions[item.key] === true; // other sections require explicit permission
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <div style={{ fontFamily: T.fontBody, backgroundColor: T.surface, color: T.onSurface, minHeight: '100vh', display: 'flex' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #ffd9de; color: #944555; }
        input { outline: none; }
        input::placeholder { color: ${T.outlineVariant}; }
        .admin-nav-item {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 16px; border-radius: 10px; border: none;
          cursor: pointer; width: 100%; text-align: left;
          font-family: 'Noto Serif', serif; font-size: 17px;
          letter-spacing: 0.01em; transition: background-color 0.2s, color 0.2s;
        }
        .admin-nav-item.active {
          background: rgba(255,255,255,0.6);
          color: #944555; font-weight: 600;
        }
        .admin-nav-item.inactive {
          background: transparent; color: #534245;
        }
        .admin-nav-item.inactive:hover {
          background: #f8f3f0; color: #944555;
        }
        @media (max-width: 768px) {
          .admin-sidebar { 
            position: fixed; left: 0; top: 0; width: 280px; height: 100vh;
            transform: translateX(-100%); transition: transform 0.3s ease;
            box-shadow: 10px 0 30px rgba(0,0,0,0.1); 
            display: flex !important;
          }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-main { margin-left: 0 !important; padding-bottom: 80px !important; }
          .admin-topbar { left: 0 !important; padding: 0 16px !important; }
          .topbar-search-wrapper { display: none !important; }
          .admin-bottom-nav { 
             display: flex !important; position: fixed; bottom: 0; left: 0; right: 0;
             height: 64px; background: #fff; border-top: 1px solid ${T.outlineVariant}30;
             z-index: 45; justify-content: space-around; align-items: center;
             padding: 0 8px; box-shadow: 0 -4px 12px rgba(0,0,0,0.03); 
          }
          .drawer-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 48;
            opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
          }
          .drawer-overlay.visible { opacity: 1; pointer-events: auto; }
        }
        .logout-btn {
          display: flex; align-items: center; gap: 8px;
          background: none; border: 1px solid ${T.outlineVariant}40;
          padding: 8px 16px; border-radius: 9999px;
          font-family: ${T.fontBody}; font-size: 13px; font-weight: 600;
          color: ${T.onSurfaceVariant}; cursor: pointer;
          transition: all 0.2s;
        }
        .logout-btn:hover {
          background-color: ${T.errorContainer};
          color: ${T.error};
          border-color: ${T.error}40;
        }
      `}</style>

      {/* ── MOBILE OVERLAY ── */}
      <div 
        className={`drawer-overlay ${isDrawerOpen ? 'visible' : ''}`} 
        onClick={() => setIsDrawerOpen(false)} 
      />

      {/* ── SIDEBAR (Now responsive) ── */}
      <aside className={`admin-sidebar ${isDrawerOpen ? 'open' : ''}`} style={{
        width: '256px', minHeight: '100vh', position: 'fixed', left: 0, top: 0,
        backgroundColor: T.surface, display: 'flex', flexDirection: 'column',
        paddingTop: '32px', paddingBottom: '32px', zIndex: 50,
      }}>
        {/* Logo and close button for mobile */}
        <div style={{ padding: '0 24px', marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1
              onClick={() => { navigate('/'); setIsDrawerOpen(false); }}
              style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: T.primary, cursor: 'pointer' }}
            >
              Beauty Salon
            </h1>
            <p style={{ fontFamily: T.fontHeadline, fontSize: '13px', letterSpacing: '0.04em', color: `${T.onSurfaceVariant}70`, marginTop: '4px' }}>
              Admin Dashboard
            </p>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="mobile-only"
            style={{ display: 'none', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: T.onSurfaceVariant }}
          >
            ✕
          </button>
          <style>{`
            @media (max-width: 768px) { .mobile-only { display: block !important; } }
          `}</style>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
          {filteredNav.map(({ icon, label, path }) => {
            const isActive =
              path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(path);
            return (
              <button
                key={path}
                onClick={() => { navigate(path); setIsDrawerOpen(false); }}
                className={`admin-nav-item ${isActive ? 'active' : 'inactive'}`}
              >
                <span style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>

        {/* Admin profile */}
        <div 
          onClick={() => { navigate('/admin/perfil'); setIsDrawerOpen(false); }}
          style={{ padding: '16px 24px', marginTop: 'auto', borderTop: `1px solid ${T.surfaceContainer}`, cursor: 'pointer', transition: 'background-color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.surfaceContainerLow)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={user?.foto || "https://i.pravatar.cc/80?img=9"}
              alt="Admin"
              style={{ width: '38px', height: '38px', borderRadius: '9999px', objectFit: 'cover', border: `2px solid ${T.primaryFixed}` }}
            />
            <div>
              <p style={{ fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700, color: T.onSurface }}>{user?.nombre || 'Administradora'}</p>
              <p style={{ fontFamily: T.fontBody, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: `${T.onSurfaceVariant}70` }}>{user?.role === 'empleada' ? 'Especialista' : 'Admin'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── TOP BAR ── */}
      <header className="admin-topbar" style={{
        position: 'fixed', top: 0, right: 0, left: '256px', height: '72px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', zIndex: 40,
        backgroundColor: 'rgba(255,255,255,0.80)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.outlineVariant}20`,
      }}>
        {/* Hamburger + Mobile Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
             onClick={() => setIsDrawerOpen(true)}
             className="mobile-only"
             style={{ display: 'none', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: T.primary, padding: '8px' }}
          >
            ☰
          </button>
          <h1 className="mobile-only" style={{ display: 'none', fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '18px', color: T.primary, margin: 0 }}>L'Élixir Admin</h1>
        </div>

        {/* Search */}
        <div className="topbar-search-wrapper" style={{
          backgroundColor: T.surfaceContainerLow, borderRadius: '9999px',
          padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px',
          maxWidth: '380px', width: '100%',
        }}>
          <span style={{ fontSize: '16px' }}>🔍</span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ backgroundColor: 'transparent', border: 'none', fontFamily: T.fontBody, fontSize: '13px', color: T.onSurface, width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {topBarRight}
          
          <button onClick={handleLogout} className="logout-btn desktop-only" style={{ display: 'flex' }}>
             <span>🚪</span>
             Cerrar Sesión
          </button>

          <style>{`
            @media (max-width: 768px) {
              .desktop-only { display: none !important; }
              .user-name-label { display: none; }
            }
          `}</style>

          <button
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: T.onSurfaceVariant, padding: '4px' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.onSurfaceVariant)}
          >
            🔔
            <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: T.primary, border: '2px solid white' }} />
          </button>
          <div 
            onClick={() => navigate('/admin/perfil')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '16px', borderLeft: `1px solid ${T.outlineVariant}30`, cursor: 'pointer' }}
          >
            <span className="user-name-label" style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 500, color: T.onSurface }}>{user?.nombre || 'Admin'}</span>
            <img src={user?.foto || "https://i.pravatar.cc/80?img=9"} alt="User" style={{ width: '36px', height: '36px', borderRadius: '9999px', objectFit: 'cover' }} />
          </div>
        </div>
      </header>

      {/* ── BOTTOM NAVIGATION (Mobile Only) ── */}
      <nav className="admin-bottom-nav" style={{ display: 'none' }}>
        {filteredNav.slice(0, 5).map(({ icon, label, path, key }) => {
          const isActive =
            path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(path);
          
          // Shorten labels if too long for mobile
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              style={{
                background: 'none', border: 'none', display: 'flex', flexDirection: 'column', 
                alignItems: 'center', gap: '4px', cursor: 'pointer',
                color: isActive ? T.primary : T.onSurfaceVariant,
                fontFamily: T.fontBody, fontSize: '10px', fontWeight: isActive ? 700 : 500,
                transition: 'color 0.2s', padding: '8px'
              }}
            >
              <span style={{ fontSize: '20px' }}>{icon}</span>
              <span style={{ textTransform: 'capitalize' }}>
                {key === 'settlements' ? 'Pagos' : 
                 key === 'citas' ? 'Inicio' : 
                 key === 'calendario' ? 'Agenda' :
                 key === 'clientes' ? 'Clientes' :
                 key === 'specialists' ? 'Staff' : label.split(' ')[0]}
              </span>
            </button>
          );
        })}
        {/* Profile/Menu as last item in bottom nav if there's space, or just Profile shortcut */}
        <button
           onClick={() => navigate('/admin/perfil')}
           style={{
             background: 'none', border: 'none', display: 'flex', flexDirection: 'column', 
             alignItems: 'center', gap: '4px', cursor: 'pointer',
             color: location.pathname.startsWith('/admin/perfil') ? T.primary : T.onSurfaceVariant,
             fontFamily: T.fontBody, fontSize: '10px', fontWeight: 500
           }}
        >
           <span style={{ fontSize: '20px' }}>👤</span>
           <span>Perfil</span>
        </button>
      </nav>

      {/* ── CONTENT ── */}
      <main className="admin-main" style={{ marginLeft: '256px', paddingTop: '72px', minHeight: '100vh', flex: 1, minWidth: 0, overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
        {children}
      </main>
    </div>
  );
}
