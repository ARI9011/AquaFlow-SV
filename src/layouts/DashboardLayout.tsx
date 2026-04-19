import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-aqua-dark text-white font-sans">
      <Sidebar isAdmin={true} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar />
        <main className="flex-1 p-10 overflow-y-auto">
          {/* Aquí es donde React Router inyectará el Dashboard, Usuarios, etc. */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}