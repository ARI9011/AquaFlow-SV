import Clock from '../components/Clock';

// 1. DATOS DINÁMICOS
const zonasData = [
    { id: 1, nombre: 'Colonia Escalón', sector: 'San Salvador', presion: 48.2, flujo: 15.2, estado: 'Óptimo', color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 2, nombre: 'Soyapango Centro', sector: 'Soyapango', presion: 42.5, flujo: 12.8, estado: 'Estable', color: 'text-aqua-cyan', bg: 'bg-aqua-cyan/10' },
    { id: 3, nombre: 'Mejicanos Norte', sector: 'Mejicanos', presion: 18.4, flujo: 5.1, estado: 'Crítico', color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 4, nombre: 'Ilopango Sur', sector: 'Ilopango', presion: 35.0, flujo: 10.0, estado: 'Alerta', color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

// 2. SUB-COMPONENTE DE TARJETAS
const StatCard = ({ icon, value, label, sub, colorClass }: any) => (
    <div className="bg-aqua-card p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all shadow-lg">
        <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`} />
        <div className="flex items-start gap-4">
            <div className="text-2xl group-hover:scale-110 transition-transform">{icon}</div>
            <div>
                <div className="text-3xl font-black text-white leading-none">{value}</div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">{label}</div>
                <div className="text-[10px] text-gray-600 mt-1 italic">{sub}</div>
            </div>
        </div>
    </div>
);

export default function Dashboard() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* BANNER DE BIENVENIDA CON RELOJ INTEGRADO */}
            <div className="bg-gradient-to-r from-aqua-cyan/20 via-aqua-cyan/5 to-transparent p-10 rounded-[2.5rem] border border-aqua-cyan/10 relative overflow-hidden">

                {/* El contenedor principal debe ser z-10 */}
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-4xl font-black tracking-tighter mb-2">💧 AquaFlow <span className="text-aqua-cyan">SV</span></h2>
                        <p className="text-gray-400 font-medium max-w-md text-sm">
                            Monitoreo hídrico en tiempo real para el Gran San Salvador.
                        </p>
                    </div>

                    {/* EL RELOJ: Agregamos z-20 y un color de fondo más sólido para probar */}
                    <div className="relative z-20 bg-aqua-card/80 backdrop-blur-xl px-6 py-4 rounded-2xl border border-aqua-cyan/30 shadow-[0_0_20px_rgba(0,242,234,0.1)]">
                        <div className="text-[10px] font-black text-aqua-cyan uppercase tracking-[0.2em] mb-1">
                            Hora Sistema
                        </div>
                        <Clock />
                    </div>
                </div>

                {/* Los círculos decorativos DEBEN tener z-0 o ser simplemente absolutos sin z-index */}
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-aqua-cyan/10 rounded-full blur-[100px] pointer-events-none" />
            </div>

            {/* MÉTRICAS RÁPIDAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon="📍" value="6" label="Zonas Totales" sub="Gran San Salvador" colorClass="bg-aqua-cyan" />
                <StatCard icon="📡" value="5/6" label="Sensores" sub="Dispositivos activos" colorClass="bg-blue-500" />
                <StatCard icon="📋" value="12" label="Reportes" sub="Últimas 24 horas" colorClass="bg-purple-500" />
                <StatCard icon="⚠️" value="1" label="Incidencias" sub="Requiere revisión" colorClass="bg-red-500" />
            </div>

            {/* TABLA DE ESTADO POR ZONAS */}
            <div className="bg-aqua-card rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <h3 className="font-bold text-xl tracking-tight">📍 Estado por Zonas</h3>
                    <span className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-gray-400 font-black uppercase tracking-widest">
                        Actualizado: Recién
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/[0.02] text-gray-500 text-[10px] uppercase font-black tracking-[0.15em]">
                            <tr>
                                <th className="px-8 py-5">Zona / Sector</th>
                                <th className="px-8 py-5 text-center">Presión</th>
                                <th className="px-8 py-5 text-center">Flujo</th>
                                <th className="px-8 py-5 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {zonasData.map((zona) => (
                                <tr key={zona.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-white text-sm">{zona.nombre}</div>
                                        <div className="text-[10px] text-gray-500 font-medium">{zona.sector}</div>
                                    </td>
                                    <td className="px-8 py-6 text-center font-mono font-bold text-aqua-cyan">
                                        {zona.presion} <span className="text-[10px] text-gray-600">PSI</span>
                                    </td>
                                    <td className="px-8 py-6 text-center font-mono font-bold text-gray-300">
                                        {zona.flujo} <span className="text-[10px] text-gray-600">L/m</span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`inline-block px-3 py-1 ${zona.bg} ${zona.color} text-[10px] font-black rounded-lg uppercase tracking-wider border border-current/10`}>
                                            {zona.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}