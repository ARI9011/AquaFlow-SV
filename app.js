try { require('dotenv').config(); } catch { /* dotenvx maneja las variables en producción */ }
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');
const cors = require('cors');
const Groq = require('groq-sdk');
const bcrypt = require('bcryptjs');

const isBcryptHash = (value) => /^\$2[aby]\$/.test(value);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Correo (Gmail SMTP) y códigos de verificación ─────────────────────
const nodemailer = require('nodemailer');
const mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

// Verificación de credenciales SMTP al arrancar (para diagnosticar el envío de correos)
if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER.includes('tu_correo')) {
    console.warn('⚠️  SMTP sin configurar: pon SMTP_USER y SMTP_PASS (contraseña de aplicación de Gmail) en .env. Los correos NO se enviarán.');
} else {
    mailer.verify()
        .then(() => console.log('📮 SMTP listo — correos de verificación habilitados'))
        .catch((e) => console.error('❌ SMTP inválido:', e.message, '— revisa SMTP_USER / SMTP_PASS (contraseña de aplicación de 16 dígitos, sin espacios)'));
}

// email -> { code, expires, intentos }
const verifyCodes = new Map();
const generarCodigo = () => String(Math.floor(100000 + Math.random() * 900000));

async function enviarCorreoVerificacion(email, nombre, codigo) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#0d2137;padding:22px;text-align:center">
          <span style="color:#00f2ea;font-size:22px;font-weight:800">AquaFlow <span style="color:#fff">SV</span></span>
        </div>
        <div style="padding:26px;color:#1b2735">
          <h2 style="margin:0 0 8px">¡Bienvenido/a, ${nombre}!</h2>
          <p style="color:#475569">Tu cuenta se creó correctamente usando tu cuenta de Google. Para verificarla, ingresa el siguiente código en la aplicación:</p>
          <div style="text-align:center;margin:22px 0">
            <span style="display:inline-block;font-size:30px;letter-spacing:8px;font-weight:800;color:#0d2137;background:#e0f7f5;border:1px solid #9be3dd;border-radius:10px;padding:12px 22px">${codigo}</span>
          </div>
          <p style="color:#64748b;font-size:13px">Este código expira en 10 minutos. Si no fuiste tú, puedes ignorar este correo.</p>
        </div>
        <div style="background:#f2f7fb;padding:14px;text-align:center;color:#94a3b8;font-size:12px">AquaFlow SV · Monitoreo Hídrico</div>
      </div>`;
    return mailer.sendMail({
        from: `"AquaFlow SV" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verifica tu cuenta de AquaFlow SV',
        html
    });
}

// Genera, guarda y envía un código; no bloquea la respuesta si el correo tarda
function emitirCodigo(email, nombre) {
    const codigo = generarCodigo();
    verifyCodes.set(email, { code: codigo, expires: Date.now() + 10 * 60 * 1000, intentos: 0 });
    enviarCorreoVerificacion(email, nombre, codigo)
        .then(() => console.log('📧 Código de verificación enviado a', email))
        .catch((e) => console.error('❌ Error enviando correo a', email, '-', e.message));
}

const app = express();

// ── Middlewares de autenticación y roles ──────────────────────────────
function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
    if (req.session.user.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    next();
}

// ── Rate limiting para login (por email, en memoria) ─────────────────
const loginAttempts = new Map(); // email -> { count, lockUntil }

function cleanExpiredAttempts() {
    const now = Date.now();
    for (const [email, record] of loginAttempts.entries()) {
        if (record.lockUntil < now && record.count === 0) loginAttempts.delete(email);
    }
}
setInterval(cleanExpiredAttempts, 5 * 60 * 1000); // limpiar cada 5 min

// 1. Configuración de CORS (Siempre al principio)
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'aquaflow_secret_2026',
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'Public')));


app.get('/api/usuarios', requireAuth, requireAdmin, (req, res) => {
    const sql = 'SELECT ID, Usuario, Correo, rol FROM usuarios';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener usuarios' });
        res.json(results);
    });
});

// --- LÓGICA DE LOGIN (con rate limiting) ---
app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const now = Date.now();
    const record = loginAttempts.get(email) || { count: 0, lockUntil: 0 };

    // Verificar bloqueo activo
    if (record.lockUntil > now) {
        const retryAfter = Math.ceil((record.lockUntil - now) / 1000);
        return res.status(429).json({
            error: `Cuenta bloqueada. Espera ${retryAfter} segundos.`,
            retryAfter,
            blocked: true,
            attemptsLeft: 0
        });
    }

    const sql = 'SELECT * FROM usuarios WHERE Correo = ?';
    db.query(sql, [email], (err, results) => {
        if (err) { console.error('Login query error:', err); return res.status(500).json({ error: 'Error en servidor' }); }

        const usuario = results[0];
        const passwordOk = usuario && (
            isBcryptHash(usuario.Contra)
                ? bcrypt.compareSync(password, usuario.Contra)
                : usuario.Contra === password
        );

        if (passwordOk) {
            loginAttempts.delete(email); // Limpiar intentos al ingresar correctamente
            req.session.user = usuario;
            console.log('✅ Login exitoso:', email, '| Rol:', usuario.rol);
            return res.json({ success: true, user: usuario });
        }

        // Credenciales incorrectas: registrar intento fallido
        record.count++;
        if (record.count >= 3) {
            record.lockUntil = Date.now() + 60 * 1000; // bloquear 60 segundos
        }
        loginAttempts.set(email, record);

        const attemptsLeft = Math.max(0, 3 - record.count);
        if (record.lockUntil > Date.now()) {
            return res.status(429).json({
                error: 'Demasiados intentos fallidos. Cuenta bloqueada por 60 segundos.',
                retryAfter: 60,
                blocked: true,
                attemptsLeft: 0
            });
        }
        return res.status(401).json({
            error: 'Credenciales incorrectas.',
            attemptsLeft,
            blocked: false
        });
    });
});

// --- LOGIN CON GOOGLE (OAuth) ---
app.post('/auth/google', async (req, res) => {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'Token de Google requerido' });

    try {
        // Obtener el perfil del usuario desde Google con el access_token
        const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        if (!gRes.ok) return res.status(401).json({ error: 'Token de Google inválido' });

        const perfil = await gRes.json();            // { sub, email, name, picture, ... }
        const email  = perfil.email;
        const nombre = perfil.name || (email ? email.split('@')[0] : 'Usuario Google');
        if (!email) return res.status(400).json({ error: 'No se pudo obtener el correo de Google' });

        db.query('SELECT * FROM usuarios WHERE Correo = ?', [email], (err, results) => {
            if (err) return res.status(500).json({ error: 'Error en servidor' });

            // El usuario ya existe -> iniciar sesión
            if (results.length > 0) {
                const usuario = results[0];
                req.session.user = usuario;
                console.log('✅ Login Google:', email, '| Rol:', usuario.rol);
                const yaVerificado = usuario.verificado === 1 || usuario.verificado === true;
                if (!yaVerificado) emitirCodigo(email, usuario.Usuario || nombre);
                return res.json({ success: true, user: usuario, needsVerification: !yaVerificado });
            }

            // Usuario nuevo -> crearlo automáticamente y enviar código de verificación
            const rol = email.toLowerCase().endsWith('@flowcdb.com') ? 'admin' : 'user';
            const placeholder = bcrypt.hashSync('google-' + Date.now(), 10);
            db.query(
                'INSERT INTO usuarios (Usuario, Correo, Contra, rol) VALUES (?, ?, ?, ?)',
                [nombre, email, placeholder, rol],
                (err2, result) => {
                    if (err2) return res.status(500).json({ error: 'Error al crear el usuario' });
                    const nuevo = { ID: result.insertId, id: result.insertId, Usuario: nombre, Correo: email, rol };
                    req.session.user = nuevo;
                    console.log('🆕 Usuario Google creado:', email);
                    emitirCodigo(email, nombre);
                    return res.json({ success: true, user: nuevo, needsVerification: true });
                }
            );
        });
    } catch (e) {
        console.error('Error /auth/google:', e);
        return res.status(500).json({ error: 'Error al verificar con Google' });
    }
});

// --- VERIFICAR CÓDIGO DE CUENTA ---
app.post('/auth/verify-code', (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email y código requeridos' });

    const rec = verifyCodes.get(email);
    if (!rec) return res.status(400).json({ error: 'No hay un código pendiente. Solicita uno nuevo.' });
    if (Date.now() > rec.expires) {
        verifyCodes.delete(email);
        return res.status(400).json({ error: 'El código expiró. Solicita uno nuevo.' });
    }

    rec.intentos = (rec.intentos || 0) + 1;
    if (rec.intentos > 5) {
        verifyCodes.delete(email);
        return res.status(429).json({ error: 'Demasiados intentos. Solicita un código nuevo.' });
    }
    if (String(code).trim() !== rec.code) {
        return res.status(400).json({ error: 'Código incorrecto.' });
    }

    verifyCodes.delete(email);
    if (req.session.user) req.session.user.verificado = 1;
    // Persistir en BD si existe la columna 'verificado' (si no existe, solo se informa)
    db.query('UPDATE usuarios SET verificado = 1 WHERE Correo = ?', [email], (e) => {
        if (e) console.log('(info) columna "verificado" no disponible aún:', e.code);
    });
    console.log('✔️  Cuenta verificada:', email);
    return res.json({ success: true, message: 'Cuenta verificada correctamente' });
});

// --- REENVIAR CÓDIGO ---
app.post('/auth/resend-code', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });
    const nombre = (req.session.user && req.session.user.Usuario) || email.split('@')[0];
    emitirCodigo(email, nombre);
    return res.json({ success: true, message: 'Código reenviado' });
});

// --- LÓGICA DE REGISTRO (Ajustada a tu SQL) ---
app.post('/auth/register', (req, res) => {
    const { nombre, email, password, adminCode } = req.body;
    
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const isFlowcdbEmail = email.toLowerCase().endsWith('@flowcdb.com');
    const rol = (isFlowcdbEmail || adminCode === 'FLOWCDB2026') ? 'admin' : 'user';

    db.query('SELECT id FROM usuarios WHERE Correo = ?', [email], (errCheck, rows) => {
        if (errCheck) return res.status(500).json({ error: 'Error en servidor' });
        if (rows.length > 0) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo electrónico.' });

        const hashedPassword = bcrypt.hashSync(password, 10);
        const sql = 'INSERT INTO usuarios (Usuario, Correo, Contra, rol) VALUES (?, ?, ?, ?)';
        db.query(sql, [nombre, email, hashedPassword, rol], (err, result) => {
            if (err) {
                console.error('Register query error:', err);
                return res.status(500).json({ error: 'Error al registrar. Intenta de nuevo.' });
            }
            return res.json({ success: true, message: 'Usuario registrado exitosamente', isAdmin: rol === 'admin' });
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 AquaFlow SV corriendo en http://localhost:${PORT}`);
    const key = process.env.GROQ_API_KEY;
    console.log(`🔑 GROQ_API_KEY: ${key ? key.substring(0, 10) + '...' : 'NO ENCONTRADA ❌'}`);

    // Crear tabla de comentarios si no existe
    const sqlTable = `
        CREATE TABLE IF NOT EXISTS comentarios_alertas (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id  INT NOT NULL,
            usuario     VARCHAR(100) NOT NULL,
            rol         VARCHAR(20)  NOT NULL DEFAULT 'user',
            contenido   TEXT NOT NULL,
            creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
            editado_en  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    db.query(sqlTable, (err) => {
        if (err) console.error('Error creando tabla comentarios:', err.message);
        else console.log('✅ Tabla comentarios_alertas lista');
    });

    db.query(`CREATE TABLE IF NOT EXISTS reportes (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        tipo        VARCHAR(100) NOT NULL,
        zona        VARCHAR(100) NOT NULL,
        sector      VARCHAR(100) NOT NULL,
        descripcion TEXT NOT NULL,
        estado      ENUM('pendiente','en proceso','resuelto') DEFAULT 'pendiente',
        prioridad   ENUM('alta','media','baja') DEFAULT 'media',
        usuario_id  INT NOT NULL,
        usuario     VARCHAR(100) NOT NULL,
        creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, (err) => {
        if (err) console.error('Error creando tabla reportes:', err.message);
        else console.log('✅ Tabla reportes lista');
    });

    db.query(`CREATE TABLE IF NOT EXISTS comentarios_reportes (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        reporte_id  INT NOT NULL,
        usuario_id  INT NOT NULL,
        usuario     VARCHAR(100) NOT NULL,
        rol         VARCHAR(20)  NOT NULL DEFAULT 'user',
        contenido   TEXT NOT NULL,
        creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, (err) => {
        if (err) console.error('Error creando tabla comentarios_reportes:', err.message);
        else console.log('✅ Tabla comentarios_reportes lista');
    });

    db.query(`CREATE TABLE IF NOT EXISTS alertas (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        tipo           VARCHAR(100) NOT NULL,
        zona           VARCHAR(100) NOT NULL,
        sector         VARCHAR(100) NOT NULL,
        descripcion    TEXT NOT NULL,
        severidad      ENUM('critica','alta','media') DEFAULT 'media',
        estado         ENUM('activa','suspendida','resuelta') DEFAULT 'activa',
        total_reportes INT NOT NULL DEFAULT 0,
        usuario        VARCHAR(100) NOT NULL,
        creado_en      DATETIME DEFAULT CURRENT_TIMESTAMP,
        actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        resuelta_en    DATETIME NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, (err) => {
        if (err) console.error('Error creando tabla alertas:', err.message);
        else {
            console.log('✅ Tabla alertas lista');
            reconciliarAlertasExistentes();
        }
    });
});

// Al arrancar, revisa reportes que ya cumplían el umbral antes de que existiera esta lógica.
function reconciliarAlertasExistentes() {
    db.query(
        `SELECT tipo, zona FROM reportes WHERE estado != 'resuelto' GROUP BY tipo, zona HAVING COUNT(*) >= ?`,
        [UMBRAL_ALERTA],
        (err, grupos) => {
            if (err) return console.error('Error al reconciliar alertas:', err.message);
            grupos.forEach(({ tipo, zona }) => {
                db.query(
                    `SELECT sector, descripcion, usuario FROM reportes
                     WHERE tipo = ? AND zona = ? AND estado != 'resuelto' ORDER BY creado_en DESC LIMIT 1`,
                    [tipo, zona],
                    (err2, rows) => {
                        if (err2 || !rows.length) return;
                        const r = rows[0];
                        verificarUmbralAlerta(tipo, zona, r.sector, r.descripcion, r.usuario);
                    }
                );
            });
        }
    );
}

app.get('/api/user-info', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'No autorizado' });
    }
});

app.post('/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

// --- CRUD USUARIOS (solo admin) ---
app.post('/api/usuarios', requireAdmin, (req, res) => {
    const { Usuario, Correo, Contra, rol } = req.body;
    if (!Usuario || !Correo || !Contra) return res.status(400).json({ error: 'Todos los campos son requeridos' });
    const validRoles = ['admin', 'user'];
    const userRol = validRoles.includes(rol) ? rol : 'user';
    const hashedContra = bcrypt.hashSync(Contra, 10);
    const insertSql = 'INSERT INTO usuarios (Usuario, Correo, Contra, rol) VALUES (?, ?, ?, ?)';
    db.query(insertSql, [Usuario, Correo, hashedContra, userRol], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al crear. El correo puede estar duplicado.' });
        res.json({ mensaje: 'Creado', ID: result.insertId });
    });
});

app.put('/api/usuarios/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { Usuario, Correo, Contra, rol } = req.body;
    if (!Usuario || !Correo) return res.status(400).json({ error: 'Nombre y correo son requeridos' });
    const validRoles = ['admin', 'user'];
    const userRol = validRoles.includes(rol) ? rol : 'user';
    // Si no se envía contraseña, no la actualizar
    if (Contra && Contra.trim() !== '') {
        const hashedContra = bcrypt.hashSync(Contra, 10);
        const sql = 'UPDATE usuarios SET Usuario=?, Correo=?, Contra=?, rol=? WHERE ID=?';
        db.query(sql, [Usuario, Correo, hashedContra, userRol, id], (err) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar' });
            res.json({ mensaje: 'Actualizado' });
        });
    } else {
        const sql = 'UPDATE usuarios SET Usuario=?, Correo=?, rol=? WHERE ID=?';
        db.query(sql, [Usuario, Correo, userRol, id], (err) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar' });
            res.json({ mensaje: 'Actualizado' });
        });
    }
});

// --- CHAT IA ---
const SYSTEM_PROMPT = `Eres AquaBot, el asistente inteligente de AquaFlow SV, un sistema de monitoreo de redes de agua potable para el Gran San Salvador, El Salvador.

Tu rol es ayudar a operadores y administradores a entender el sistema, interpretar datos y resolver dudas.

Contexto del sistema:
- Monitorea 4 zonas: Colonia Escalón (San Salvador), Soyapango Centro, Mejicanos Norte y Ilopango Sur.
- Métricas clave: Presión (PSI) y Flujo (L/m).
- Estados posibles: Óptimo (verde), Estable (cyan), Alerta (amarillo), Crítico (rojo).
- Valores normales de presión: 35–55 PSI. Por debajo de 20 PSI es crítico.
- Los usuarios con rol "admin" gestionan usuarios, zonas y configuraciones.

Instrucciones:
- Responde siempre en español, de forma clara y concisa.
- Si te preguntan sobre datos en tiempo real, explica que los datos se actualizan desde los sensores.
- Sé amable, profesional y útil.
- Si no sabes algo específico del sistema, indícalo honestamente.`;

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Se requiere el array de mensajes' });
    }

    try {
        const result = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
            ],
            max_tokens: 1024,
            temperature: 0.7,
        });

        res.json({ reply: result.choices[0].message.content });
    } catch (err) {
        console.error('Error Groq:', err.message);
        res.status(500).json({ error: err.message || 'Error desconocido' });
    }
});

// ── COMENTARIOS DE ALERTAS ──────────────────────────────────────────

// GET todos los comentarios (cualquier usuario autenticado)
app.get('/api/comentarios', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
    db.query('SELECT * FROM comentarios_alertas ORDER BY creado_en DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST nuevo comentario (cualquier usuario autenticado)
app.post('/api/comentarios', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
    const { contenido } = req.body;
    if (!contenido?.trim()) return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    const { id, Usuario, rol } = req.session.user;
    db.query(
        'INSERT INTO comentarios_alertas (usuario_id, usuario, rol, contenido) VALUES (?, ?, ?, ?)',
        [id, Usuario, rol, contenido.trim()],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, usuario_id: id, usuario: Usuario, rol, contenido: contenido.trim(), creado_en: new Date() });
        }
    );
});

// PUT editar comentario (solo admin)
app.put('/api/comentarios/:id', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
    if (req.session.user.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
    const { contenido } = req.body;
    if (!contenido?.trim()) return res.status(400).json({ error: 'El contenido no puede estar vacío' });
    db.query('UPDATE comentarios_alertas SET contenido = ? WHERE id = ?', [contenido.trim(), req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ok: true });
    });
});

// DELETE eliminar comentario (solo admin)
app.delete('/api/comentarios/:id', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
    if (req.session.user.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
    db.query('DELETE FROM comentarios_alertas WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ok: true });
    });
});

// ────────────────────────────────────────────────────────────────────

app.delete('/api/usuarios/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    if (req.session.user.id == id) return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    db.query('DELETE FROM usuarios WHERE ID = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: 'Error al eliminar' });
        res.json({ mensaje: 'Eliminado' });
    });
});

// ── ALERTAS AUTOMÁTICAS POR ZONA ──────────────────────────────────────
const UMBRAL_ALERTA = 5; // reportes de la misma zona + tipo para generar alerta

function calcularSeveridad(total) {
    if (total >= 10) return 'critica';
    if (total >= 7) return 'alta';
    return 'media';
}

// Revisa si los reportes activos de una zona+tipo alcanzaron el umbral y
// crea o actualiza la alerta correspondiente con los datos del reporte.
function verificarUmbralAlerta(tipo, zona, sector, descripcion, usuario) {
    db.query(
        `SELECT COUNT(*) AS total FROM reportes WHERE tipo = ? AND zona = ? AND estado != 'resuelto'`,
        [tipo, zona],
        (err, rows) => {
            if (err) return console.error('Error al contar reportes para alerta:', err.message);
            const total = rows[0].total;
            if (total < UMBRAL_ALERTA) return;

            const severidad = calcularSeveridad(total);

            db.query(
                `SELECT id, estado FROM alertas WHERE tipo = ? AND zona = ? AND estado IN ('activa','suspendida')
                 ORDER BY FIELD(estado, 'activa', 'suspendida') LIMIT 1`,
                [tipo, zona],
                (err2, existentes) => {
                    if (err2) return console.error('Error al buscar alerta existente:', err2.message);

                    if (existentes.length > 0) {
                        // Si está suspendida, se respeta la decisión del admin y solo se actualiza el conteo.
                        const alerta = existentes[0];
                        db.query(
                            'UPDATE alertas SET total_reportes = ?, severidad = ?, descripcion = ?, usuario = ? WHERE id = ?',
                            [total, severidad, descripcion, usuario, alerta.id],
                            (err3) => { if (err3) console.error('Error al actualizar alerta:', err3.message); }
                        );
                    } else {
                        db.query(
                            `INSERT INTO alertas (tipo, zona, sector, descripcion, severidad, total_reportes, usuario)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [tipo, zona, sector, descripcion, severidad, total, usuario],
                            (err3) => { if (err3) console.error('Error al crear alerta:', err3.message); }
                        );
                    }
                }
            );
        }
    );
}

// GET todas las alertas (cualquier usuario autenticado)
app.get('/api/alertas', requireAuth, (req, res) => {
    db.query('SELECT * FROM alertas ORDER BY creado_en DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// PUT cambiar estado de una alerta: activa | suspendida | resuelta (solo admin)
app.put('/api/alertas/:id', requireAdmin, (req, res) => {
    const { estado } = req.body;
    const validEstados = ['activa', 'suspendida', 'resuelta'];
    if (!validEstados.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });
    const resueltaEn = estado === 'resuelta' ? new Date() : null;
    db.query('UPDATE alertas SET estado = ?, resuelta_en = ? WHERE id = ?', [estado, resueltaEn, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Alerta no encontrada' });
        res.json({ ok: true });
    });
});

// DELETE eliminar una alerta (solo admin)
app.delete('/api/alertas/:id', requireAdmin, (req, res) => {
    db.query('DELETE FROM alertas WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Alerta no encontrada' });
        res.json({ ok: true });
    });
});

// ── REPORTES ──────────────────────────────────────────────────────────

app.get('/api/reportes', requireAuth, (req, res) => {
    const sql = `
        SELECT r.id, r.tipo, r.zona, r.sector, r.descripcion, r.estado, r.prioridad,
               r.usuario_id, r.usuario, r.creado_en,
               (SELECT COUNT(*) FROM comentarios_reportes cr WHERE cr.reporte_id = r.id) AS total_comentarios
        FROM reportes r
        ORDER BY r.creado_en DESC
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/reportes', requireAuth, (req, res) => {
    const { tipo, zona, sector, descripcion, prioridad } = req.body;
    if (!tipo || !zona || !sector || !descripcion)
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    const userId  = req.session.user.id || req.session.user.ID;
    const usuario = req.session.user.Usuario;
    const validPrioridad = ['alta', 'media', 'baja'].includes(prioridad) ? prioridad : 'media';
    db.query(
        'INSERT INTO reportes (tipo, zona, sector, descripcion, prioridad, usuario_id, usuario) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [tipo, zona, sector, descripcion, validPrioridad, userId, usuario],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            verificarUmbralAlerta(tipo, zona, sector, descripcion, usuario);
            res.json({ id: result.insertId });
        }
    );
});

app.put('/api/reportes/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { tipo, zona, sector, descripcion, estado, prioridad } = req.body;
    const userId = req.session.user.id || req.session.user.ID;
    const { rol } = req.session.user;
    db.query('SELECT * FROM reportes WHERE id = ?', [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows.length) return res.status(404).json({ error: 'Reporte no encontrado' });
        const r = rows[0];
        if (rol !== 'admin')
            return res.status(403).json({ error: 'Solo los administradores pueden editar reportes' });
        const validEstado    = ['pendiente', 'en proceso', 'resuelto'].includes(estado) ? estado : r.estado;
        const validPrioridad = ['alta', 'media', 'baja'].includes(prioridad) ? prioridad : r.prioridad;
        const estadoFinal    = rol === 'admin' ? validEstado : r.estado;
        db.query(
            'UPDATE reportes SET tipo=?, zona=?, sector=?, descripcion=?, estado=?, prioridad=? WHERE id=?',
            [tipo || r.tipo, zona || r.zona, sector || r.sector, descripcion || r.descripcion, estadoFinal, validPrioridad, id],
            (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ ok: true });
            }
        );
    });
});

app.delete('/api/reportes/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const userId = req.session.user.id || req.session.user.ID;
    const { rol } = req.session.user;
    db.query('SELECT * FROM reportes WHERE id = ?', [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows.length) return res.status(404).json({ error: 'Reporte no encontrado' });
        if (rows[0].usuario_id !== Number(userId) && rol !== 'admin')
            return res.status(403).json({ error: 'Sin permiso para eliminar este reporte' });
        db.query('DELETE FROM comentarios_reportes WHERE reporte_id = ?', [id], () => {
            db.query('DELETE FROM reportes WHERE id = ?', [id], (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ ok: true });
            });
        });
    });
});

app.get('/api/reportes/:id/comentarios', requireAuth, (req, res) => {
    db.query(
        'SELECT * FROM comentarios_reportes WHERE reporte_id = ? ORDER BY creado_en ASC',
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

app.post('/api/reportes/:id/comentarios', requireAuth, (req, res) => {
    const { contenido } = req.body;
    if (!contenido?.trim()) return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    const userId  = req.session.user.id || req.session.user.ID;
    const usuario = req.session.user.Usuario;
    const { rol } = req.session.user;
    db.query(
        'INSERT INTO comentarios_reportes (reporte_id, usuario_id, usuario, rol, contenido) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, userId, usuario, rol, contenido.trim()],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, reporte_id: Number(req.params.id), usuario_id: userId, usuario, rol, contenido: contenido.trim(), creado_en: new Date() });
        }
    );
});

app.delete('/api/reportes/:id/comentarios/:cid', requireAuth, (req, res) => {
    const { cid } = req.params;
    const userId = req.session.user.id || req.session.user.ID;
    const { rol } = req.session.user;
    db.query('SELECT * FROM comentarios_reportes WHERE id = ?', [cid], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows.length) return res.status(404).json({ error: 'Comentario no encontrado' });
        if (rows[0].usuario_id !== Number(userId) && rol !== 'admin')
            return res.status(403).json({ error: 'Sin permiso para eliminar este comentario' });
        db.query('DELETE FROM comentarios_reportes WHERE id = ?', [cid], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ ok: true });
        });
    });
});