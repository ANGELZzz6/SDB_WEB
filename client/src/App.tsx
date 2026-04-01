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
import AdminAccessPage from './pages/AdminAccessPage';
import AdminGalleryPage from './pages/AdminGalleryPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
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
          <Route path="/admin/servicios" element={<AdminServicesPage />} />
          <Route path="/admin/especialistas" element={<AdminSpecialistsPage />} />
          <Route path="/admin/clientes" element={<AdminClientsPage />} />
          <Route path="/admin/galeria" element={<AdminGalleryPage />} />
          <Route path="/admin/accesos" element={<AdminAccessPage />} />
          <Route path="/admin/configuracion" element={<AdminSettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
