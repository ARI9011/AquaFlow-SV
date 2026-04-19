import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, Edit2, User, X } from 'lucide-react';

// Configuración global para enviar cookies de sesión (importante para el rol Admin)
axios.defaults.withCredentials = true;

export default function Usuarios() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        Usuario: '',
        Correo: '',
        Contra: '',
        rol: 'user'
    });

    // 1. Cargar usuarios (GET)
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:3000/api/usuarios');
            setUsers(response.data);
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    // 2. Preparar el modal para EDITAR
    const abrirEditar = (user: any) => {
        setEditingId(user.ID);
        setFormData({
            Usuario: user.Usuario,
            Correo: user.Correo,
            Contra: '', // La contra se deja vacía por seguridad al editar
            rol: user.rol
        });
        setIsModalOpen(true);
    };

    const cerrarModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ Usuario: '', Correo: '', Contra: '', rol: 'user' });
    };

    // 3. Crear o Actualizar (POST / PUT)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Si hay un ID, actualizamos el usuario existente
                await axios.put(`http://localhost:3000/api/usuarios/${editingId}`, formData);
                alert("¡Usuario actualizado con éxito!");
            } else {
                // Si no hay ID, creamos uno nuevo
                await axios.post(`http://localhost:3000/api/usuarios`, formData);
                alert("¡Usuario registrado en MySQL!");
            }
            cerrarModal();
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.error || "Error en la operación");
        }
    };

    // 4. Eliminar (DELETE)
    const handleEliminar = async (id: number) => {
        if (!window.confirm("¿Estás seguro de eliminar este usuario?")) return;
        try {
            // Enviamos la petición de borrado al servidor
            await axios.delete(`http://localhost:3000/api/usuarios/${id}`);
            fetchUsers(); // Refrescar la tabla
        } catch (error: any) {
            // Manejo del error si intentas borrarte a ti mismo
            alert(error.response?.data?.error || "No se pudo eliminar el usuario");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Encabezado */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter text-white">Gestión de <span className="text-aqua-cyan">Usuarios</span></h2>
                    <p className="text-gray-500 text-sm">Control de acceso para AquaFlow SV</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setIsModalOpen(true); }}
                    className="bg-aqua-cyan hover:bg-aqua-cyan/80 text-aqua-dark font-black px-6 py-3 rounded-2xl transition-all flex items-center gap-2"
                >
                    <UserPlus size={18} /> NUEVO USUARIO
                </button>
            </div>

            {/* Tabla de Usuarios */}
            <div className="bg-aqua-card rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-20 text-center text-aqua-cyan font-bold animate-pulse text-xs tracking-widest">CONECTANDO CON MYSQL...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/[0.02] text-gray-500 text-[10px] uppercase font-black tracking-[0.15em]">
                                <tr>
                                    <th className="px-8 py-5">Usuario</th>
                                    <th className="px-8 py-5">Rol</th>
                                    <th className="px-8 py-5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {users.map((user: any) => (
                                    <tr key={user.ID} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-aqua-cyan/10 flex items-center justify-center text-aqua-cyan">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm">{user.Usuario}</div>
                                                    <div className="text-[10px] text-gray-400">{user.Correo}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${user.rol === 'admin' ? 'bg-aqua-cyan/20 text-aqua-cyan' : 'bg-white/5 text-gray-400'}`}>
                                                {user.rol}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <button
                                                    onClick={() => abrirEditar(user)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-aqua-cyan transition-colors"
                                                    title="Editar usuario"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEliminar(user.ID)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Eliminar usuario"
                                                >
                                                    <Trash2 size={18} />
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

            {/* Modal de Registro/Edición */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-aqua-dark/80 backdrop-blur-sm p-4">
                    <div className="bg-aqua-card border border-aqua-cyan/20 w-full max-w-md rounded-[2.5rem] p-8 relative animate-in zoom-in-95 duration-200">
                        <button onClick={cerrarModal} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={24} /></button>

                        <h3 className="text-2xl font-black text-white mb-6 tracking-tighter">
                            {editingId ? 'Editar' : 'Registrar'} <span className="text-aqua-cyan">Técnico</span>
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-aqua-cyan"
                                placeholder="Nombre de Usuario"
                                value={formData.Usuario}
                                onChange={(e) => setFormData({ ...formData, Usuario: e.target.value })}
                            />
                            <input
                                required
                                type="email"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-aqua-cyan"
                                placeholder="Correo"
                                value={formData.Correo}
                                onChange={(e) => setFormData({ ...formData, Correo: e.target.value })}
                            />
                            <input
                                type="password"
                                placeholder={editingId ? "Nueva contraseña (opcional)" : "Contraseña"}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-aqua-cyan"
                                onChange={(e) => setFormData({ ...formData, Contra: e.target.value })}
                                required={!editingId}
                            />
                            <select
                                className="w-full bg-aqua-dark border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                                value={formData.rol}
                                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                            >
                                <option value="user">Técnico / Usuario</option>
                                <option value="admin">Administrador</option>
                            </select>

                            <button type="submit" className="w-full bg-aqua-cyan text-aqua-dark font-black py-4 rounded-2xl mt-4 hover:scale-[1.02] transition-transform">
                                {editingId ? 'GUARDAR CAMBIOS' : 'GUARDAR EN MYSQL'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}