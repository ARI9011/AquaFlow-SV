import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Login from './Pages/Login';
import Home from './Pages/Home';
import Dashboard from './Pages/Dashboard';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Usuarios from './Pages/Usuarios';
import Mapa from './Pages/Mapa';
import Sensores from './Pages/Sensores';
import LoadingScreen from './components/LoadingScreen';
import BubbleBackground from './components/BubbleBackground';
import Reportes from './Pages/Reportes';
import Alertas from './Pages/Alertas';
import Configuracion from './Pages/Configuracion';
import ChatBot from './components/ChatBot';
import AccessibilityPanel from './components/AccessibilityPanel';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ConfirmProvider } from './components/ConfirmDialog';

function ChatBotGuard() {
  const location = useLocation();
  if (location.pathname === '/login') return null;
  return <ChatBot />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();
  if (authLoading) return null;
  if (!user) return <Navigate to="/" replace state={{ requireLogin: true, from: location.pathname }} />;
  if (user.rol !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-aqua-dark text-ink font-sans">
      <BubbleBackground />
      <Sidebar
        isAdmin={user?.rol === 'admin'}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0" style={{ position: 'relative', zIndex: 1 }}>
        {/* Skip link: primer elemento tabulable, permite saltar el menú */}
        <a href="#contenido-principal" className="skip-link">Saltar al contenido principal</a>
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main id="contenido-principal" tabIndex={-1} role="main"
          className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
      <AccessibilityPanel />
    </div>
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <AuthProvider>
      <LanguageProvider>
      <AccessibilityProvider>
      <ConfigProvider>
      <ConfirmProvider>
      {loading && <LoadingScreen onFinish={() => setLoading(false)} />}
      <Router>
        <ChatBotGuard />
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas privadas con guard de autenticación */}
          <Route path="/inicio" element={
            <ProtectedRoute><AdminLayout><Home /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/usuarios" element={
            <AdminRoute><AdminLayout><Usuarios /></AdminLayout></AdminRoute>
          } />
          <Route path="/mapa" element={
            <ProtectedRoute><AdminLayout><Mapa /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/sensores" element={
            <ProtectedRoute><AdminLayout><Sensores /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/reportes" element={
            <ProtectedRoute><AdminLayout><Reportes /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/alertas" element={
            <ProtectedRoute><AdminLayout><Alertas /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/configuracion" element={
            <ProtectedRoute><AdminLayout><Configuracion /></AdminLayout></ProtectedRoute>
          } />

          {/* Página de bienvenida PÚBLICA: con barra lateral y topbar, sin exigir login */}
          <Route path="/" element={<AdminLayout><Home /></AdminLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </ConfirmProvider>
      </ConfigProvider>
      </AccessibilityProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
