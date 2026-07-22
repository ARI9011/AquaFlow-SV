// Puente por puerto serie con el Arduino (sensor de flujo piloto).
// Detecta el dispositivo automáticamente por su chip USB (VID de Arduino LLC = 2341)
// y reintenta la conexión solo si se desconecta o si aún no se encontró.
const { SerialPort, ReadlineParser } = require('serialport');
const db = require('./db');

const BAUD_RATE = 9600;
const REINTENTO_MS = 5000;
const GUARDAR_HISTORIAL_MS = 60 * 1000;
const VENCIMIENTO_LECTURA_MS = 15 * 1000; // sin datos nuevos en este tiempo => "desconectado"
const REVISAR_VENCIMIENTO_MS = 3000;

let puerto = null;
let ultimaLectura = null; // { caudal, estado, rele, recibidoEn }
let ultimoEstadoEmitido = null; // para no repetir el mismo JSON a los clientes SSE
const clientesSSE = new Set(); // res de Express con la conexión abierta

async function encontrarPuertoArduino() {
    const puertos = await SerialPort.list();
    const arduino = puertos.find(p => (p.vendorId || '').toLowerCase() === '2341');
    return arduino || null;
}

function guardarLecturaEnHistorial() {
    if (!ultimaLectura) return;
    if (Date.now() - ultimaLectura.recibidoEn > VENCIMIENTO_LECTURA_MS) return; // no guardar datos viejos
    db.query(
        'INSERT INTO lecturas_sensores (dispositivo, caudal, estado, rele) VALUES (?, ?, ?, ?)',
        ['piloto', ultimaLectura.caudal, ultimaLectura.estado, ultimaLectura.rele],
        (err) => { if (err) console.error('Error guardando lectura de sensor:', err.message); }
    );
}

// Envía el estado actual a todos los navegadores conectados por streaming (SSE),
// solo si cambió algo respecto a lo último emitido (evita tráfico innecesario).
function emitirEstadoSiCambio() {
    const estado = obtenerEstado();
    const serializado = JSON.stringify(estado);
    if (serializado === ultimoEstadoEmitido) return;
    ultimoEstadoEmitido = serializado;
    for (const res of clientesSSE) {
        res.write(`data: ${serializado}\n\n`);
    }
}

function procesarLinea(linea) {
    if (!linea.startsWith('DATA:')) return; // resto de líneas son texto humano para el Monitor Serie
    try {
        const datos = JSON.parse(linea.slice('DATA:'.length));
        if (typeof datos.caudal !== 'number') return;
        ultimaLectura = {
            caudal: datos.caudal,
            estado: datos.estado || null,
            rele: !!datos.rele,
            recibidoEn: Date.now(),
        };
        emitirEstadoSiCambio();
    } catch {
        console.error('Línea de datos del Arduino con formato inválido:', linea);
    }
}

async function intentarConectar() {
    if (puerto && puerto.isOpen) return;
    const info = await encontrarPuertoArduino().catch(() => null);
    if (!info) return;

    const sp = new SerialPort({ path: info.path, baudRate: BAUD_RATE }, (err) => {
        if (err) { console.error('No se pudo abrir el puerto del Arduino:', err.message); return; }
        console.log(`✅ Arduino conectado en ${info.path}`);
        emitirEstadoSiCambio();
    });

    sp.on('close', () => {
        console.log('⚠️  Se perdió la conexión con el Arduino');
        puerto = null;
        emitirEstadoSiCambio();
    });
    sp.on('error', (err) => {
        console.error('Error de puerto serie:', err.message);
        puerto = null;
        emitirEstadoSiCambio();
    });

    const parser = sp.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    parser.on('data', procesarLinea);

    puerto = sp;
}

function iniciar() {
    intentarConectar();
    setInterval(intentarConectar, REINTENTO_MS);
    setInterval(guardarLecturaEnHistorial, GUARDAR_HISTORIAL_MS);
    // Si el Arduino deja de mandar datos (se desconecta sin cerrar el puerto limpiamente),
    // esto detecta el vencimiento y avisa a los clientes aunque no llegue ningún evento nuevo.
    setInterval(emitirEstadoSiCambio, REVISAR_VENCIMIENTO_MS);
}

function obtenerEstado() {
    const conectado = !!(puerto && puerto.isOpen) &&
        !!ultimaLectura &&
        (Date.now() - ultimaLectura.recibidoEn <= VENCIMIENTO_LECTURA_MS);
    return {
        conectado,
        caudal: ultimaLectura ? ultimaLectura.caudal : null,
        estado: ultimaLectura ? ultimaLectura.estado : null,
        rele: ultimaLectura ? ultimaLectura.rele : null,
        actualizado_en: ultimaLectura ? new Date(ultimaLectura.recibidoEn).toISOString() : null,
    };
}

// Registra una respuesta HTTP (ya configurada como text/event-stream) para recibir
// el estado al instante en que cambie. Devuelve una función para desuscribirse.
function suscribir(res) {
    clientesSSE.add(res);
    res.write(`data: ${JSON.stringify(obtenerEstado())}\n\n`);
    return () => clientesSSE.delete(res);
}

module.exports = { iniciar, obtenerEstado, suscribir };
