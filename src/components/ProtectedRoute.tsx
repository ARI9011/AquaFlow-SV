import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return null;
  if (!user) return <Navigate to="/" replace state={{ requireLogin: true, from: location.pathname }} />;
  return <>{children}</>;
}
