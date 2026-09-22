const TIPOS = ['Fuga de agua', 'Presión baja', 'Corte de servicio', 'Agua turbia', 'Otro'];

function validarReporte(body) {
    const data = {};
    for (const [campo, limite] of [['tipo', 100], ['zona', 100], ['sector', 100], ['descripcion', 5000]]) {
        if (typeof body[campo] !== 'string' || !body[campo].trim() || body[campo].trim().length > limite) {
            return { error: `El campo ${campo} es requerido y admite hasta ${limite} caracteres.` };
        }
        data[campo] = body[campo].trim();
    }
    if (!TIPOS.includes(data.tipo)) return { error: 'Selecciona un tipo de incidencia válido.' };
    data.prioridad = ['alta', 'media', 'baja'].includes(body.prioridad) ? body.prioridad : 'media';
    const tieneLat = body.latitud != null;
    const tieneLng = body.longitud != null;
    if (tieneLat !== tieneLng) return { error: 'La ubicación debe incluir latitud y longitud.' };
    data.latitud = null;
    data.longitud = null;
    if (tieneLat) {
        if (typeof body.latitud !== 'number' || typeof body.longitud !== 'number' ||
            !Number.isFinite(body.latitud) || !Number.isFinite(body.longitud) ||
            body.latitud < 13.55 || body.latitud > 13.90 || body.longitud < -89.40 || body.longitud > -88.95) {
            return { error: 'Selecciona una ubicación dentro del Gran San Salvador.' };
        }
        data.latitud = Number(body.latitud.toFixed(6));
        data.longitud = Number(body.longitud.toFixed(6));
    }
    if (body.solicitud_id != null && (typeof body.solicitud_id !== 'string' ||
        !/^[a-zA-Z0-9-]{16,36}$/.test(body.solicitud_id))) {
        return { error: 'La identificación del envío no es válida.' };
    }
    return { data };
}

module.exports = { validarReporte };
