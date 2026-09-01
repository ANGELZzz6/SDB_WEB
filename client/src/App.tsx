import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ServicesPage from './pages/ServicesPage';
import SpecialistsPage from './pages/SpecialistsPage';
import GalleryPage from './pages/GalleryPage';
import AdminPage from './pages/AdminPage';
// @ts-ignore - The file exists and compiles fine, forcing IDE refresh
import AdminCalendarPage from './pages/AdminCalendarPage';
import AdminServicesPage from './pages/AdminServicesPage';
import AdminSpecialistsPage from './pages/AdminSpecialistsPage';
import AdminClientsPage from './pages/AdminClientsPage';
import AdminClientDetailPage from './pages/AdminClientDetailPage';
import AdminProfilePage from './pages/AdminProfilePage';
import AdminAccessPage from './pages/AdminAccessPage';
import AdminGalleryPage from './pages/AdminGalleryPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminLiquidacionesPage from './pages/AdminLiquidacionesPage';
import ChatbotPage from './pages/ChatbotPage';
import AdminItineraryPage from './pages/AdminItineraryPage';
import AdminLogin from './pages/admin/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalWakeUp from './components/GlobalWakeUp';
import CookieConsent from './components/CookieConsent';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminProductDetailPage from './pages/AdminProductDetailPage';
import AdminProductFormPage from './pages/AdminProductFormPage';
import NotFoundPage from './pages/NotFoundPage';
import { ToastProvider } from './components/Toast';
import PageDisabled from './components/PageDisabled';
import { usePageVisibility } from './hooks/usePageVisibility';
import type { PaginasOcultas } from './types';
import './index.css';

/**
 * VisibilityGatedRoute — CAPA 2 de seguridad de visibilidad de páginas.
 * Verifica si la página está habilitada antes de renderizar el componente destino.
 * Si está deshabilitada, muestra <PageDisabled> con el mensaje y botones configurados.
 * 
 * Complementa la CAPA 1 (middleware de servidor) y la CAPA 3 (componente propio).
 */
function VisibilityGatedRoute({
  pageName,
  children,
  icon,
}: {
  pageName: keyof PaginasOcultas;
  children: React.ReactNode;
  icon?: string;
}) {
  const { isEnabled, getPageConfig, loading } = usePageVisibility();

  // Mientras carga la configuración, mostramos nada (evita flash de contenido)
  if (loading) return null;

  if (!isEnabled(pageName)) {
    return <PageDisabled config={getPageConfig(pageName)} icon={icon} />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <GlobalWakeUp />
        <CookieConsent />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/especialistas" element={<SpecialistsPage />} />
          <Route path="/galeria" element={<GalleryPage />} />
          <Route
            path="/chatbot"
            element={
              <VisibilityGatedRoute pageName="chatbot" icon="📅">
                <ChatbotPage />
              </VisibilityGatedRoute>
            }
          />
          <Route path="/productos" element={<ProductsPage />} />
          <Route path="/productos/:id" element={<ProductDetailPage />} />

          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/itinerario" element={<AdminItineraryPage />} />
            <Route path="/admin/calendario" element={<AdminCalendarPage />} />
            <Route path="/admin/perfil" element={<AdminProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="servicios" />}>
            <Route path="/admin/servicios" element={<AdminServicesPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="especialistas" />}>
            <Route path="/admin/especialistas" element={<AdminSpecialistsPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="clientes" />}>
            <Route path="/admin/clientes" element={<AdminClientsPage />} />
            <Route path="/admin/clientes/:phone" element={<AdminClientDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="galeria" />}>
            <Route path="/admin/galeria" element={<AdminGalleryPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="accesos" />}>
            <Route path="/admin/accesos" element={<AdminAccessPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="configuracion" />}>
            <Route path="/admin/configuracion" element={<AdminSettingsPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="liquidaciones" />}>
            <Route path="/admin/liquidaciones" element={<AdminLiquidacionesPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="productos" />}>
            <Route path="/admin/productos" element={<AdminProductsPage />} />
            <Route path="/admin/productos/nuevo" element={<AdminProductFormPage />} />
            <Route path="/admin/productos/editar/:id" element={<AdminProductFormPage />} />
            <Route path="/admin/productos/:id" element={<AdminProductDetailPage />} />
          </Route>

          {/* Custom 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
