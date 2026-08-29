import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from './api/axiosConfig';
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
import { ToastProvider } from './components/Toast';
import SensorNotificationBanner from './components/SensorNotificationBanner';
import SobreNosotros from './Pages/SobreNosotros';

interface AlertaResumen {
  id: number;
  tipo: string;
  zona: string;
  descripcion: string;
  creado_en: string;
}

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
  const [alertasActivas, setAlertasActivas] = useState<AlertaResumen[]>([]);

  useEffect(() => {
    if (!user) { setAlertasActivas([]); return; }
    let cancelado = false;
    const cargarAlertas = () => {
      axios.get('/api/alertas')
        .then(({ data }) => {
          if (cancelado || !Array.isArray(data)) return;
          setAlertasActivas(
            data
              .filter((a: any) => a.estado === 'activa')
              .sort((a: any, b: any) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime())
          );
        })
        .catch(() => { /* se mantiene el último valor conocido */ });
    };
    cargarAlertas();
    const id = setInterval(cargarAlertas, 60000);
    return () => { cancelado = true; clearInterval(id); };
  }, [user]);

  return (
    <div className="flex min-h-screen bg-aqua-dark text-ink font-sans">
      <BubbleBackground />
      <SensorNotificationBanner />
      <Sidebar
        isAdmin={user?.rol === 'admin'}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        alertCount={alertasActivas.length}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0" style={{ position: 'relative', zIndex: 1 }}>
        {/* Skip link: primer elemento tabulable, permite saltar el menú */}
        <a href="#contenido-principal" className="skip-link">Saltar al contenido principal</a>
        <Topbar onMenuClick={() => setMobileNavOpen(true)} alertas={alertasActivas} />
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
      <ToastProvider>
      {loading && <LoadingScreen onFinish={() => setLoading(false)} />}
      <Router>
        <ChatBotGuard />
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* "Inicio" es pública, igual que "/": Home ya bloquea cada sección por su cuenta con irA() */}
          <Route path="/inicio" element={
            <AdminLayout><Home /></AdminLayout>
          } />

          {/* Rutas privadas con guard de autenticación */}
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
          <Route path="/sobre-nosotros" element={
            <AdminLayout><SobreNosotros /></AdminLayout>
          } />

          {/* Página de bienvenida PÚBLICA: con barra lateral y topbar, sin exigir login */}
          <Route path="/" element={<AdminLayout><Home /></AdminLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </ToastProvider>
      </ConfirmProvider>
      </ConfigProvider>
      </AccessibilityProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
