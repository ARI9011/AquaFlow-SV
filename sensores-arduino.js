// puente por puerto serie con el Arduino, lo detecta solo por el VID (2341) y
// reintenta si se cae la conexión
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

// 2341 = Arduino oficial; los Mega 2560 "clon" (muy comunes) traen chips
// USB-serie de terceros con otro VID: CH340 (1a86), CP210x (10c4), FTDI (0403).
const VENDOR_IDS_ARDUINO = ['2341', '1a86', '10c4', '0403'];

async function encontrarPuertoArduino() {
    const puertos = await SerialPort.list();
    let arduino = puertos.find(p => VENDOR_IDS_ARDUINO.includes((p.vendorId || '').toLowerCase()));
    // Si no se reconoce el VID pero solo hay un puerto serie disponible, se asume que es el Arduino.
    if (!arduino && puertos.length === 1) arduino = puertos[0];
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

// solo manda si cambió algo respecto a lo último que se envió
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
    if (!linea.startsWith('DATA:')) {
        console.log('[Arduino]', linea); // texto humano para el Monitor Serie, útil para depurar
        return;
    }
    try {
        const datos = JSON.parse(linea.slice('DATA:'.length));
        if (typeof datos.caudal !== 'number') {
            console.error('Línea DATA: del Arduino sin "caudal" numérico:', linea);
            return;
        }
        ultimaLectura = {
            caudal: datos.caudal,
            estado: datos.estado || null,
            rele: !!datos.rele,
            recibidoEn: Date.now(),
        };
        console.log('[Arduino] lectura OK:', ultimaLectura);
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
        console.log(`Arduino conectado en ${info.path}`);
        emitirEstadoSiCambio();
    });

    sp.on('close', () => {
        console.log('Se perdió la conexión con el Arduino');
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
    // por si el Arduino se desconecta sin cerrar el puerto bien, así igual se marca como desconectado
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

// engancha una respuesta SSE ya abierta, devuelve función para desuscribirse
function suscribir(res) {
    clientesSSE.add(res);
    res.write(`data: ${JSON.stringify(obtenerEstado())}\n\n`);
    return () => clientesSSE.delete(res);
}

module.exports = { iniciar, obtenerEstado, suscribir };
