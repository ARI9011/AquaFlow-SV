// avisa por SSE que algo cambió en un canal (reportes, alertas...), no manda
// el dato en sí, el front vuelve a pedirlo con el GET normal
const canales = new Map(); // canal -> Set de respuestas HTTP abiertas

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
