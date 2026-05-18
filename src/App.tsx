import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// Este componente envuelve las páginas privadas para mostrar siempre el Sidebar y Topbar
const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen bg-aqua-dark text-white font-sans">
    <BubbleBackground />
    {/* Sidebar con acceso de Admin activado */}
    <Sidebar isAdmin={true} />

    <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0" style={{ position: 'relative', zIndex: 1 }}>
      <Topbar />
      <main className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto custom-scrollbar">
        {children}
      </main>
    </div>
  </div>
);

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && <LoadingScreen onFinish={() => setLoading(false)} />}
    <Router>
      <Routes>
        {/* 1. RUTA PÚBLICA: Login (Pantalla limpia) */}
        <Route path="/login" element={<Login />} />

        {/* 2. RUTAS PRIVADAS: Dashboard y Usuarios */}
        <Route
          path="/dashboard"
          element={
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          }
        />

        <Route
          path="/usuarios"
          element={
            <AdminLayout>
              <Usuarios />
            </AdminLayout>
          }
        />

        <Route
          path="/mapa"
          element={
            <AdminLayout>
              <Mapa />
            </AdminLayout>
          }
        />

        <Route
          path="/sensores"
          element={
            <AdminLayout>
              <Sensores />
            </AdminLayout>
          }
        />

        <Route
          path="/reportes"
          element={<AdminLayout><Reportes /></AdminLayout>}
        />
        <Route
          path="/alertas"
          element={<AdminLayout><Alertas /></AdminLayout>}
        />
        <Route
          path="/configuracion"
          element={<AdminLayout><Configuracion /></AdminLayout>}
        />

        {/* 3. REDIRECCIONES DE SEGURIDAD */}
        {/* Si entras a la raíz (/), te manda al Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Si escribes cualquier ruta que no existe, al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
    </>
  );
}