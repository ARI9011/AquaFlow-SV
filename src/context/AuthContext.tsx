import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  Usuario: string;
  Correo: string;
  rol: string;
}

interface AuthContextType {
  user: User | null;
  authLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/user-info')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const logout = async () => {
    // Se limpia de inmediato (antes de la llamada de red) para que cualquier ruta
    // protegida que siga montada deje de estarlo en el mismo render que la navegación
    // manual del que llama, y así ProtectedRoute nunca alcanza a redirigir con su
    // propio aviso de "inicia sesión" de por medio.
    setUser(null);
    try {
      await axios.post('/auth/logout');
    } catch {
      // ignorar errores de red
    }
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
