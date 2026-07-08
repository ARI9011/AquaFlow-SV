import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, Edit2, User, X, ShieldCheck, UserCheck, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useConfirm } from '../components/ConfirmDialog';

interface UsuarioRow {
  ID: number;
  Usuario: string;
  Correo: string;
  rol: string;
}

interface Toast {
  type: 'success' | 'error';
  msg: string;
}

export default function Usuarios() {
  const [users, setUsers]           = useState<UsuarioRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [toast, setToast]           = useState<Toast | null>(null);
  const confirmDialog = useConfirm();

  const [formData, setFormData] = useState({
    Usuario: '',
    Correo: '',
    Contra: '',
    rol: 'user',
  });

  const showToast = (type: Toast['type'], msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/usuarios');
      setUsers(response.data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const abrirEditar = (user: UsuarioRow) => {
    setEditingId(user.ID);
    setFormData({ Usuario: user.Usuario, Correo: user.Correo, Contra: '', rol: user.rol });
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ Usuario: '', Correo: '', Contra: '', rol: 'user' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/usuarios/${editingId}`, formData);
        showToast('success', 'Usuario actualizado con éxito');
      } else {
        await axios.post('/api/usuarios', formData);
        showToast('success', 'Usuario registrado correctamente');
      }
      cerrarModal();
      fetchUsers();
    } catch (error: any) {
      showToast('error', error.response?.data?.error || 'Error en la operación');
    }
  };

  const handleEliminar = async (id: number) => {
    const ok = await confirmDialog({ message: '¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.', danger: true });
    if (!ok) return;
    try {
      await axios.delete(`/api/usuarios/${id}`);
      fetchUsers();
      showToast('success', 'Usuario eliminado');
    } catch (error: any) {
      showToast('error', error.response?.data?.error || 'No se pudo eliminar el usuario');
    }
  };

  return (
    <div className="space-y-5 page-enter portal-grid-bg min-h-full pb-2">

      {/* TOAST */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border transition-all ${
          toast.type === 'success'
            ? 'bg-green-500/15 border-green-500/30 text-green-400'
            : 'bg-red-500/15 border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 size={16} />
            : <AlertTriangle size={16} />}
          <span className="text-sm font-bold">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10px] text-aqua-cyan/60 uppercase tracking-[0.25em] font-bold mb-1">Administración</p>
          <h2 className="text-3xl font-black tracking-tighter gradient-text">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-500 mt-1">Control de acceso para AquaFlow SV</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-aqua-cyan hover:bg-aqua-cyan/80 text-aqua-dark font-black px-5 py-2.5 rounded-2xl transition-all text-sm w-full sm:w-auto"
        >
          <UserPlus size={16} /> Nuevo usuario
        </button>
      </div>

      {/* TABLA */}
      <div className="portal-card card-top-cyan overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-aqua-cyan/10 flex items-center justify-center">
            <Users size={16} className="text-aqua-cyan" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Directorio de usuarios</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {loading ? 'Cargando...' : `${users.length} usuario${users.length !== 1 ? 's' : ''} registrado${users.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-aqua-cyan/30 border-t-aqua-cyan rounded-full animate-spin" />
            <p className="text-xs text-gray-500 font-medium">Conectando con la base de datos...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 flex flex-col items-center gap-3">
            <Users size={32} className="text-gray-600 opacity-40" />
            <p className="text-sm font-bold text-gray-500">No hay usuarios registrados</p>
            <p className="text-xs text-gray-600">Crea el primer usuario con el botón "Nuevo usuario"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/[0.02] text-gray-500 text-[10px] uppercase font-black tracking-[0.15em]">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {users.map((user) => (
                  <tr key={user.ID} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-aqua-cyan/10 border border-aqua-cyan/20 flex items-center justify-center text-aqua-cyan flex-shrink-0">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{user.Usuario}</p>
                          <p className="text-[10px] text-gray-500">{user.Correo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        user.rol === 'admin'
                          ? 'bg-aqua-cyan/15 text-aqua-cyan border border-aqua-cyan/20'
                          : 'bg-white/5 text-gray-400 border border-white/10'
                      }`}>
                        {user.rol === 'admin'
                          ? <><ShieldCheck size={11} /> Administrador</>
                          : <><UserCheck size={11} /> Técnico</>}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200">
                        <button onClick={() => abrirEditar(user)} title="Editar usuario"
                          className="p-2 hover:bg-aqua-cyan/10 rounded-xl text-gray-500 hover:text-aqua-cyan transition-colors border border-transparent hover:border-aqua-cyan/20">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleEliminar(user.ID)} title="Eliminar usuario"
                          className="p-2 hover:bg-red-500/10 rounded-xl text-gray-500 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aqua-dark/80 backdrop-blur-sm p-4">
          <div className="bg-[#0d1c21] border border-aqua-cyan/20 w-full max-w-md rounded-3xl p-7 relative animate-in zoom-in-95 duration-200 shadow-2xl">
            <button onClick={cerrarModal}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all">
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-aqua-cyan/10 border border-aqua-cyan/20 flex items-center justify-center">
                {editingId ? <Edit2 size={16} className="text-aqua-cyan" /> : <UserPlus size={16} className="text-aqua-cyan" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  {editingId ? 'Editar usuario' : 'Nuevo usuario'}
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {editingId ? 'Modifica los datos del técnico' : 'Agrega un nuevo técnico o administrador'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Nombre de usuario"
                value={formData.Usuario}
                onChange={(e) => setFormData({ ...formData, Usuario: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-aqua-cyan/40 placeholder-gray-600 transition-colors"
              />
              <input
                required
                type="email"
                placeholder="Correo electrónico"
                value={formData.Correo}
                onChange={(e) => setFormData({ ...formData, Correo: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-aqua-cyan/40 placeholder-gray-600 transition-colors"
              />
              <input
                type="password"
                placeholder={editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                onChange={(e) => setFormData({ ...formData, Contra: e.target.value })}
                required={!editingId}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-aqua-cyan/40 placeholder-gray-600 transition-colors"
              />
              <div>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full bg-[#060b0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-aqua-cyan/40 transition-colors"
                >
                  <option value="user">Técnico / Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="text-[10px] text-gray-600 mt-1.5 ml-1">El rol determina los permisos de acceso dentro del sistema.</p>
              </div>

              <button type="submit"
                className="w-full bg-aqua-cyan text-aqua-dark font-black py-3.5 rounded-2xl mt-2 hover:bg-aqua-cyan/80 transition-all active:scale-[0.98]">
                {editingId ? 'GUARDAR CAMBIOS' : 'CREAR USUARIO'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
