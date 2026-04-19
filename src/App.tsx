import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Usuarios from './Pages/Usuarios';

// Este componente envuelve las páginas privadas para mostrar siempre el Sidebar y Topbar
const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen bg-aqua-dark text-white font-sans">
    {/* Sidebar con acceso de Admin activado */}
    <Sidebar isAdmin={true} />

    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Topbar />
      <main className="flex-1 p-10 overflow-y-auto custom-scrollbar">
        {children}
      </main>
    </div>
  </div>
);

export default function App() {
  return (
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

        {/* 3. REDIRECCIONES DE SEGURIDAD */}
        {/* Si entras a la raíz (/), te manda al Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Si escribes cualquier ruta que no existe, al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}