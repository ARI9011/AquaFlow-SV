// Hub genérico de streaming (Server-Sent Events): avisa a los navegadores conectados
// que algo cambió en un canal (p. ej. "reportes" o "alertas"), sin depender de un
// intervalo de sondeo. El mensaje es solo una señal para "vuelve a pedir los datos",
// no manda el dato en sí — así no hay que duplicar la lógica de cada endpoint GET.
const canales = new Map(); // nombre de canal -> Set de respuestas HTTP abiertas

function suscribir(canal, res) {
    if (!canales.has(canal)) canales.set(canal, new Set());
    canales.get(canal).add(res);
    return () => canales.get(canal)?.delete(res);
}

function emitir(canal) {
    const subs = canales.get(canal);
    if (!subs || subs.size === 0) return;
    const linea = `data: ${JSON.stringify({ canal, en: Date.now() })}\n\n`;
    for (const res of subs) res.write(linea);
}

module.exports = { suscribir, emitir };
