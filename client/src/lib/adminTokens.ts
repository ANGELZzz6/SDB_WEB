/* ─────────────────────────────────────────────────
   Design Tokens — shared across all admin pages
───────────────────────────────────────────────── */
export const T = {
  fontHeadline: "'Noto Serif', serif",
  fontBody: "'Plus Jakarta Sans', sans-serif",
  primary: '#944555',
  primaryFixed: '#ffd9de',
  primaryFixedDim: '#ffb2be',
  primaryContainer: '#e8899a',
  onPrimary: '#ffffff',
  surface: '#fdf8f5',
  surfaceContainer: '#f2edea',
  surfaceContainerLow: '#f8f3f0',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHigh: '#ece7e4',
  surfaceContainerHighest: '#e6e2df',
  surfaceVariant: '#e6e2df',
  onSurface: '#1c1b1a',
  onSurfaceVariant: '#534245',
  outlineVariant: '#d9c1c3',
  secondaryContainer: '#ffca9b',
  onSecondaryContainer: '#7a532e',
  secondaryFixedDim: '#f0bd8f',
  errorContainer: '#ffdad6',
  error: '#ba1a1a',
};

/* ─────────────────────────────────────────────────
   Admin navigation items
───────────────────────────────────────────────── */
export const ADMIN_NAV = [
  { icon: '⭐', label: 'Resumen',        path: '/admin',               key: 'citas' },
  { icon: '📅', label: 'Calendario',     path: '/admin/calendario',    key: 'calendario' },
  { icon: '✂️', label: 'Servicios',      path: '/admin/servicios',     key: 'servicios',     adminOnly: true },
  { icon: '👩‍🎨', label: 'Especialistas', path: '/admin/especialistas', key: 'especialistas', adminOnly: true },
  { icon: '👥', label: 'Clientes',       path: '/admin/clientes',      key: 'clientes',      adminOnly: true },
  { icon: '🖼️', label: 'Galería',        path: '/admin/galeria',       key: 'galeria',       adminOnly: true },
  { icon: '🔐', label: 'Accesos',        path: '/admin/accesos',       key: 'accesos',       adminOnly: true },
  { icon: '⚙️', label: 'Configuración', path: '/admin/configuracion', key: 'configuracion', adminOnly: true },
];
