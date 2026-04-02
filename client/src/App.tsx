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
import AdminLogin from './pages/admin/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/servicios" element={<ServicesPage />} />
        <Route path="/especialistas" element={<SpecialistsPage />} />
        <Route path="/galeria" element={<GalleryPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminPage />} />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
