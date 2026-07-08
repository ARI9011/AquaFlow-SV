import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Login from './Pages/Login';
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
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ConfirmProvider } from './components/ConfirmDialog';

function ChatBotGuard() {
  const location = useLocation();
  if (location.pathname === '/login') return null;
  return <ChatBot />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.rol !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-aqua-dark text-white font-sans">
      <BubbleBackground />
      <Sidebar
        isAdmin={user?.rol === 'admin'}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0" style={{ position: 'relative', zIndex: 1 }}>
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <AuthProvider>
      <ConfirmProvider>
      {loading && <LoadingScreen onFinish={() => setLoading(false)} />}
      <Router>
        <ChatBotGuard />
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

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

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      </ConfirmProvider>
    </AuthProvider>
  );
}
