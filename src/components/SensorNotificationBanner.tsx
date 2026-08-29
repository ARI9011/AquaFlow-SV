import { useEffect, useState } from 'react';
import { Cpu, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EstadoPiloto {
  conectado: boolean;
  caudal: number | null;
  estado: string | null;
  rele: boolean | null;
  actualizado_en: string | null;
}

export default function SensorNotificationBanner() {
  const { user } = useAuth();
  const [notificacion, setNotificacion] = useState<{
    id: number;
    tipo: 'conexion' | 'desconexion' | 'alerta';
    titulo: string;
    mensaje: string;
  } | null>(null);

  useEffect(() => {
    // El stream requiere sesión iniciada; sin ella el servidor responde 401
    // y no tiene sentido reintentar (p. ej. en la página pública de inicio).
    if (!user) return;

    let es: EventSource | null = null;
    let reintento: ReturnType<typeof setTimeout> | null = null;
    let cerrado = false;
    let estadoPrevioConectado: boolean | null = null;

    const conectar = () => {
      if (cerrado) return;
      es = new EventSource('/api/sensores/piloto/stream');

      es.onmessage = (ev) => {
        try {
          const datos: EstadoPiloto = JSON.parse(ev.data);
          const estaConectado = !!datos.conectado;

          if (estadoPrevioConectado !== null && estadoPrevioConectado !== estaConectado) {
            if (estaConectado) {
              setNotificacion({
                id: Date.now(),
                tipo: 'conexion',
                titulo: '¡Modulo Arduino Conectado!',
                mensaje: `Sensor de flujo activo. Caudal detectado: ${datos.caudal != null ? datos.caudal.toFixed(1) + ' L/min' : '0.0 L/min'}`
              });
            } else {
              setNotificacion({
                id: Date.now(),
                tipo: 'desconexion',
                titulo: 'Modulo Arduino Desconectado',
                mensaje: 'Se perdió la señal con el sensor USB piloto.'
              });
            }
          }

          // Si reporta estado de alerta o crítico de caudal
          if (estaConectado && datos.estado && datos.estado.toLowerCase().includes('alerta')) {
            setNotificacion({
              id: Date.now(),
              tipo: 'alerta',
              titulo: 'Alerta en Sensor IoT',
              mensaje: `Estado del sensor: ${datos.estado} (${datos.caudal != null ? datos.caudal.toFixed(1) : 0} L/min)`
            });
          }

          estadoPrevioConectado = estaConectado;
        } catch {
          // Ignorar JSON malformado
        }
      };

      es.onerror = () => {
        es?.close();
        if (estadoPrevioConectado === true) {
          setNotificacion({
            id: Date.now(),
            tipo: 'desconexion',
            titulo: 'Conexión IoT Interrumpida',
            mensaje: 'No se pudo mantener la comunicación en vivo con el Arduino.'
          });
        }
        estadoPrevioConectado = false;
        if (!cerrado) reintento = setTimeout(conectar, 8000);
      };
    };

    conectar();
    return () => {
      cerrado = true;
      if (reintento) clearTimeout(reintento);
      es?.close();
    };
  }, [user]);

  // Ocultar notificación automáticamente tras 7 segundos
  useEffect(() => {
    if (notificacion) {
      const timer = setTimeout(() => setNotificacion(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [notificacion]);

  if (!notificacion) return null;

  const isSuccess = notificacion.tipo === 'conexion';
  const isAlert = notificacion.tipo === 'alerta';

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-md w-full animate-bounce-short">
      <div className={`portal-card p-4 shadow-2xl border flex items-start gap-3.5 relative overflow-hidden backdrop-blur-xl ${
        isSuccess ? 'border-green-500/30 bg-green-950/80 text-green-100' :
        isAlert ? 'border-amber-500/30 bg-amber-950/80 text-amber-100' :
        'border-red-500/30 bg-red-950/80 text-red-100'
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isSuccess ? 'bg-green-500/20 text-green-400' :
          isAlert ? 'bg-amber-500/20 text-amber-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {isSuccess ? <CheckCircle2 size={20} /> : isAlert ? <Cpu size={20} /> : <AlertTriangle size={20} />}
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <p className="font-black text-sm leading-tight">{notificacion.titulo}</p>
          <p className="text-xs mt-1 text-gray-300 font-medium leading-relaxed">{notificacion.mensaje}</p>
        </div>
        <button
          onClick={() => setNotificacion(null)}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          aria-label="Cerrar notificación"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
