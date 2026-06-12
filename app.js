require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');
const cors = require('cors');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

    const sql = 'SELECT * FROM usuarios WHERE Correo = ? AND Contra = ?';
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en servidor' });

        if (results.length > 0) {
            loginAttempts.delete(email); // Limpiar intentos al ingresar correctamente
            req.session.user = results[0];
            console.log('✅ Login exitoso:', email, '| Rol:', results[0].rol);
            return res.json({ success: true, user: results[0] });
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

// --- LÓGICA DE REGISTRO (Ajustada a tu SQL) ---
app.post('/auth/register', (req, res) => {
    const { nombre, email, password, adminCode } = req.body;
    
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const isFlowcdbEmail = email.toLowerCase().endsWith('@flowcdb.com');
    const rol = (isFlowcdbEmail || adminCode === 'FLOWCDB2026') ? 'admin' : 'user';
    const sql = 'INSERT INTO usuarios (Usuario, Correo, Contra, rol) VALUES (?, ?, ?, ?)';
    
    db.query(sql, [nombre, email, password, rol], (err, result) => {
        if (err) {
            console.error('Register query error:', err);
            return res.status(500).json({ error: 'Error al registrar. El email puede estar duplicado.' });
        }
        return res.json({ success: true, message: 'Usuario registrado exitosamente', isAdmin: rol === 'admin' });
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
});

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
    const insertSql = 'INSERT INTO usuarios (Usuario, Correo, Contra, rol) VALUES (?, ?, ?, ?)';
    db.query(insertSql, [Usuario, Correo, Contra, userRol], (err, result) => {
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
        const sql = 'UPDATE usuarios SET Usuario=?, Correo=?, Contra=?, rol=? WHERE ID=?';
        db.query(sql, [Usuario, Correo, Contra, userRol, id], (err) => {
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
    const { ID, Usuario, rol } = req.session.user;
    db.query(
        'INSERT INTO comentarios_alertas (usuario_id, usuario, rol, contenido) VALUES (?, ?, ?, ?)',
        [ID, Usuario, rol, contenido.trim()],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, usuario_id: ID, usuario: Usuario, rol, contenido: contenido.trim(), creado_en: new Date() });
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
    if (req.session.user.ID == id) return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    db.query('DELETE FROM usuarios WHERE ID = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: 'Error al eliminar' });
        res.json({ mensaje: 'Eliminado' });
    });
});