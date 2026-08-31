try { require('dotenv').config(); } catch { /* dotenvx maneja las variables en producción */ }
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');
const dbp = db.promise(); // solo para el arranque, para que los logs salgan en orden
const cors = require('cors');
const Groq = require('groq-sdk');
const bcrypt = require('bcryptjs');
const sensoresArduino = require('./sensores-arduino');
const eventos = require('./eventos');

const isBcryptHash = (value) => /^\$2[aby]\$/.test(value);

// que no salga del server ni en la sesión ni en el json de respuesta
const sanearUsuario = (usuario) => {
    const { Contra, ...resto } = usuario;
    return resto;
};

const ADMIN_EMAILS = [
    'arielgarciacdb@gmail.com',
    'axelfernandolopez267@gmail.com',
    'ricardo.diaz17at@gmail.com',
    'gerardo768burgos@gmail.com',
];
const esCorreoAdmin = (email) => ADMIN_EMAILS.includes(email.toLowerCase());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const nodemailer = require('nodemailer');
const mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER.includes('tu_correo')) {
    console.warn('SMTP sin configurar: pon SMTP_USER y SMTP_PASS (contraseña de aplicación de Gmail) en .env. Los correos NO se enviarán.');
} else {
    mailer.verify()
        .then(() => console.log('SMTP listo — correos de verificación habilitados'))
        .catch((e) => console.error('SMTP inválido:', e.message, '— revisa SMTP_USER / SMTP_PASS (contraseña de aplicación de 16 dígitos, sin espacios)'));
}

const verifyCodes = new Map();
const generarCodigo = () => String(Math.floor(100000 + Math.random() * 900000));

async function enviarCorreoVerificacion(email, nombre, codigo) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#0d2137;padding:22px;text-align:center">
          <span style="color:#00f2ea;font-size:22px;font-weight:800">AquaFlow <span style="color:#fff">SV</span></span>
        </div>
        <div style="padding:26px;color:#1b2735;text-align:center">
          <img src="cid:aquabot-mascota" alt="AquaBot" width="72" height="72" style="display:block;margin:0 auto 14px" />
          <h2 style="margin:0 0 8px">¡Bienvenido/a, ${nombre}!</h2>
          <p style="color:#475569;text-align:left">Tu cuenta se creó correctamente usando tu cuenta de Google. Para verificarla, ingresa el siguiente código en la aplicación:</p>
          <div style="text-align:center;margin:22px 0">
            <span style="display:inline-block;font-size:30px;letter-spacing:8px;font-weight:800;color:#0d2137;background:#e0f7f5;border:1px solid #9be3dd;border-radius:10px;padding:12px 22px">${codigo}</span>
          </div>
          <p style="color:#64748b;font-size:13px;text-align:left">Este código expira en 10 minutos. Si no fuiste tú, puedes ignorar este correo.</p>
        </div>
        <div style="background:#f2f7fb;padding:14px;text-align:center;color:#94a3b8;font-size:12px">AquaFlow SV · Monitoreo Hídrico</div>
      </div>`;
    return mailer.sendMail({
        from: `"AquaFlow SV" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verifica tu cuenta de AquaFlow SV',
        html,
        attachments: [{
            filename: 'aquabot.png',
            path: path.join(__dirname, 'Public', 'aquabot-principal.png'),
            cid: 'aquabot-mascota', // referenciado en el <img src="cid:..."> de arriba
            contentType: 'image/png',
            contentDisposition: 'inline', // sin esto, algunos clientes de correo lo muestran como adjunto en vez de incrustado
        }],
    });
}

function emitirCodigo(email, nombre) {
    const codigo = generarCodigo();
    verifyCodes.set(email, { code: codigo, expires: Date.now() + 10 * 60 * 1000, intentos: 0 });
    const envio = enviarCorreoVerificacion(email, nombre, codigo);
    envio.then(() => console.log('Código de verificación enviado a', email))
         .catch((e) => console.error('Error enviando correo a', email, '-', e.message));
    return envio; // el caller puede esperarlo si necesita confirmar el envío real
}

const app = express();

function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
    if (req.session.user.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    next();
}

// rate limiting de login, por email, todo en memoria
const loginAttempts = new Map();

const VENTANA_INACTIVIDAD_MS = 15 * 60 * 1000; // sin intentos nuevos en este tiempo, ya no hace falta recordarlo

function cleanExpiredAttempts() {
    const now = Date.now();
    for (const [email, record] of loginAttempts.entries()) {
        if (record.lockUntil < now && (now - record.lastAttempt) > VENTANA_INACTIVIDAD_MS) loginAttempts.delete(email);
    }
}
setInterval(cleanExpiredAttempts, 5 * 60 * 1000); // limpiar cada 5 min


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

// login normal
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
            // si se autoregistró como admin (no por Google ni creado por otro admin), primero verifica el correo
            const yaVerificado = usuario.verificado === 1 || usuario.verificado === true;
            if (usuario.rol === 'admin' && !yaVerificado) {
                emitirCodigo(email, usuario.Usuario);
                return res.status(403).json({
                    error: 'Debes verificar tu correo para completar el acceso como administrador.',
                    requiresAdminVerification: true,
                });
            }

            loginAttempts.delete(email); // Limpiar intentos al ingresar correctamente
            const usuarioSeguro = sanearUsuario(usuario);
            req.session.user = usuarioSeguro;
            console.log('Login exitoso:', email, '| Rol:', usuario.rol);
            return res.json({ success: true, user: usuarioSeguro });
        }

        // mal la clave, contamos el intento
        record.count++;
        record.lastAttempt = now;
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

// login con Google
app.post('/auth/google', async (req, res) => {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'Token de Google requerido' });

    try {
        // le pedimos el perfil a Google con el token
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

            // ya existe, lo logueamos
            if (results.length > 0) {
                const usuario = results[0];
                const usuarioSeguro = sanearUsuario(usuario);
                req.session.user = usuarioSeguro;
                console.log('Login Google:', email, '| Rol:', usuario.rol);
                const yaVerificado = usuario.verificado === 1 || usuario.verificado === true;
                if (!yaVerificado) emitirCodigo(email, usuario.Usuario || nombre);
                return res.json({ success: true, user: usuarioSeguro, needsVerification: !yaVerificado });
            }

            // no existe, se crea solo y le mandamos el código
            const rol = esCorreoAdmin(email) ? 'admin' : 'user';
            const placeholder = bcrypt.hashSync('google-' + Date.now(), 10);
            db.query(
                'INSERT INTO usuarios (Usuario, Correo, Contra, rol) VALUES (?, ?, ?, ?)',
                [nombre, email, placeholder, rol],
                (err2, result) => {
                    if (err2) return res.status(500).json({ error: 'Error al crear el usuario' });
                    const nuevo = { ID: result.insertId, id: result.insertId, Usuario: nombre, Correo: email, rol };
                    req.session.user = nuevo;
                    console.log('Usuario Google creado:', email);
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

// verificar código
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
    // se guarda en BD si la columna 'verificado' existe
    db.query('UPDATE usuarios SET verificado = 1 WHERE Correo = ?', [email], (e) => {
        if (e) console.log('(info) columna "verificado" no disponible aún:', e.code);
    });
    console.log('Cuenta verificada:', email);
    return res.json({ success: true, message: 'Cuenta verificada correctamente' });
});

// reenviar código
app.post('/auth/resend-code', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });
    const nombre = (req.session.user && req.session.user.Usuario) || email.split('@')[0];
    emitirCodigo(email, nombre)
        .then(() => res.json({ success: true, message: 'Código reenviado' }))
        .catch(() => res.status(502).json({ error: 'No se pudo enviar el correo. Intenta de nuevo más tarde.' }));
});

// registro
app.post('/auth/register', (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const esAdmin = esCorreoAdmin(email);
    const rol = esAdmin ? 'admin' : 'user';

    db.query('SELECT id FROM usuarios WHERE Correo = ?', [email], (errCheck, rows) => {
        if (errCheck) return res.status(500).json({ error: 'Error en servidor' });
        if (rows.length > 0) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo electrónico.' });

        const hashedPassword = bcrypt.hashSync(password, 10);
        // cualquiera puede poner un correo de admin en el form, por eso se crea sin verificar
        // hasta que confirme el código que le llega ahí
        const sql = esAdmin
            ? 'INSERT INTO usuarios (Usuario, Correo, Contra, rol, verificado) VALUES (?, ?, ?, ?, 0)'
            : 'INSERT INTO usuarios (Usuario, Correo, Contra, rol) VALUES (?, ?, ?, ?)';
        db.query(sql, [nombre, email, hashedPassword, rol], (err, result) => {
            if (err) {
                console.error('Register query error:', err);
                return res.status(500).json({ error: 'Error al registrar. Intenta de nuevo.' });
            }
            if (esAdmin) emitirCodigo(email, nombre);
            return res.json({
                success: true,
                message: esAdmin
                    ? 'Cuenta creada. Te enviamos un código a tu correo: deberás verificarlo antes de poder iniciar sesión como administrador.'
                    : 'Usuario registrado exitosamente',
                isAdmin: esAdmin,
            });
        });
    });
});

// MySQL no soporta IF EXISTS en ADD/DROP COLUMN, toca verificar a mano
async function ensureColumnDropped(table, column) {
    const [rows] = await dbp.query(
        `SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    if (rows[0].n > 0) await dbp.query(`ALTER TABLE ${table} DROP COLUMN ${column}`);
}

async function ensureColumnAdded(table, column, definitionSql) {
    const [rows] = await dbp.query(
        `SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    if (rows[0].n === 0) await dbp.query(`ALTER TABLE ${table} ADD COLUMN ${definitionSql}`);
}

// todas las tablas se crean en orden y se imprimen juntas al final
const TABLAS_SISTEMA = [
    {
        nombre: 'comentarios_alertas',
        sql: `CREATE TABLE IF NOT EXISTS comentarios_alertas (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id  INT NOT NULL,
            usuario     VARCHAR(100) NOT NULL,
            rol         VARCHAR(20)  NOT NULL DEFAULT 'user',
            contenido   TEXT NOT NULL,
            creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
            editado_en  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    },
    {
        nombre: 'reportes',
        antes: migrarReportesEsquemaViejo,
        sql: `CREATE TABLE IF NOT EXISTS reportes (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    },
    {
        nombre: 'comentarios_reportes',
        sql: `CREATE TABLE IF NOT EXISTS comentarios_reportes (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            reporte_id  INT NOT NULL,
            usuario_id  INT NOT NULL,
            usuario     VARCHAR(100) NOT NULL,
            rol         VARCHAR(20)  NOT NULL DEFAULT 'user',
            contenido   TEXT NOT NULL,
            creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    },
    {
        nombre: 'alertas',
        sql: `CREATE TABLE IF NOT EXISTS alertas (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        despues: reconciliarAlertasExistentes,
    },
    {
        nombre: 'configuracion_sistema',
        sql: `CREATE TABLE IF NOT EXISTS configuracion_sistema (
            id                INT PRIMARY KEY DEFAULT 1,
            auto_refresh      TINYINT(1) NOT NULL DEFAULT 1,
            intervalo         INT NOT NULL DEFAULT 30,
            umbral_presion    DECIMAL(6,2) NOT NULL DEFAULT 25,
            umbral_flujo      DECIMAL(6,2) NOT NULL DEFAULT 8,
            actualizado_en    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        despues: async () => {
            await dbp.query('INSERT IGNORE INTO configuracion_sistema (id) VALUES (1)');
            // esto ya no se usa, se quita si sigue ahí
            await ensureColumnDropped('configuracion_sistema', 'sesion_expiracion');
        },
    },
    {
        nombre: 'configuracion_notificaciones',
        sql: `CREATE TABLE IF NOT EXISTS configuracion_notificaciones (
            usuario_id     INT PRIMARY KEY,
            notif_alertas  TINYINT(1) NOT NULL DEFAULT 1,
            notif_reportes TINYINT(1) NOT NULL DEFAULT 1,
            notif_sensores TINYINT(1) NOT NULL DEFAULT 0,
            tema           VARCHAR(10) NOT NULL DEFAULT 'oscuro',
            actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        // por si la tabla es vieja y no tiene la columna 'tema'
        despues: () => ensureColumnAdded('configuracion_notificaciones', 'tema', "tema VARCHAR(10) NOT NULL DEFAULT 'oscuro'"),
    },
    {
        nombre: 'lecturas_sensores',
        sql: `CREATE TABLE IF NOT EXISTS lecturas_sensores (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            dispositivo VARCHAR(50) NOT NULL,
            caudal      DECIMAL(6,2) NULL,
            estado      VARCHAR(20) NULL,
            rele        TINYINT(1) NULL,
            creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    },
];

// la tabla reportes de antes tenía otras columnas (Usuario, Zona, Cometario).
// si la detecta así y está vacía, la recrea sola; si ya tiene datos, no la toca y solo avisa.
async function migrarReportesEsquemaViejo() {
    const [tablas] = await dbp.query(
        `SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reportes'`
    );
    if (tablas[0].n === 0) return; // no existe todavía: la crea el CREATE TABLE normal

    const [cols] = await dbp.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reportes'`
    );
    const nombres = cols.map(c => c.COLUMN_NAME);
    const esEsquemaViejo = nombres.includes('Cometario') && !nombres.includes('tipo');
    if (!esEsquemaViejo) return;

    const [filas] = await dbp.query('SELECT COUNT(*) AS n FROM reportes');
    if (filas[0].n > 0) {
        console.log(`   reportes tiene el esquema viejo y ${filas[0].n} fila(s) — no se toca automáticamente, migra los datos a mano`);
        return;
    }
    await dbp.query('DROP TABLE reportes');
    console.log('   reportes tenía el esquema viejo y estaba vacía — recreada con el esquema actual');
}

async function prepararBaseDeDatos() {
    console.log('\nBase de datos');

    try {
        const conn = await dbp.getConnection();
        conn.release();
        console.log('   conexión MySQL');
    } catch (err) {
        console.log(`   conexión MySQL — ERROR: ${err.message}`);
    }

    // default 1 para no romper las cuentas que ya existían antes de esto
    await ensureColumnAdded('usuarios', 'verificado', 'verificado TINYINT(1) NOT NULL DEFAULT 1');

    for (const tabla of TABLAS_SISTEMA) {
        try {
            if (tabla.antes) await tabla.antes();
            await dbp.query(tabla.sql);
            if (tabla.despues) await tabla.despues();
            console.log(`   ${tabla.nombre}`);
        } catch (err) {
            console.log(`   ${tabla.nombre} — ERROR: ${err.message}`);
        }
    }
    console.log('Base de datos lista\n');
}

// por si ya había reportes suficientes antes de que existiera esta lógica
async function reconciliarAlertasExistentes() {
    const [grupos] = await dbp.query(
        `SELECT zona FROM reportes WHERE estado != 'resuelto' GROUP BY zona HAVING COUNT(*) >= ?`,
        [UMBRAL_ALERTA]
    );
    for (const { zona } of grupos) {
        const [rows] = await dbp.query(
            `SELECT sector, descripcion, usuario FROM reportes
             WHERE zona = ? AND estado != 'resuelto' ORDER BY creado_en DESC LIMIT 1`,
            [zona]
        );
        if (!rows.length) continue;
        const r = rows[0];
        verificarUmbralAlerta(zona, r.sector, r.descripcion, r.usuario);
    }
}

const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`AquaFlow SV corriendo en http://localhost:${PORT}`);
    const key = process.env.GROQ_API_KEY;
    console.log(`GROQ_API_KEY: ${key ? key.substring(0, 10) + '...' : 'NO ENCONTRADA'}`);

    await prepararBaseDeDatos();

    // arranca el puente con el Arduino
    sensoresArduino.iniciar();
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

// crud de usuarios, solo admin
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

// sensor piloto, el Arduino conectado por USB
app.get('/api/sensores/piloto', requireAuth, (req, res) => {
    res.json(sensoresArduino.obtenerEstado());
});

// SSE: avisa al instante en vez de que el navegador esté preguntando cada rato
app.get('/api/sensores/piloto/stream', requireAuth, (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });
    res.flushHeaders();

    const desuscribir = sensoresArduino.suscribir(res);
    req.on('close', desuscribir);
});

// mismo streaming para reportes y alertas, solo avisa que algo cambió y el
// front vuelve a pedir la lista de siempre
function registrarStream(ruta, canal) {
    app.get(ruta, requireAuth, (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });
        res.flushHeaders();
        const desuscribir = eventos.suscribir(canal, res);
        req.on('close', desuscribir);
    });
}
registrarStream('/api/reportes/stream', 'reportes');
registrarStream('/api/alertas/stream', 'alertas');

// últimas 8 horas, para la gráfica de tendencia
app.get('/api/sensores/piloto/historial', requireAuth, (req, res) => {
    db.query(
        `SELECT caudal, estado, rele, creado_en FROM lecturas_sensores
         WHERE dispositivo = 'piloto' AND creado_en >= DATE_SUB(NOW(), INTERVAL 8 HOUR)
         ORDER BY creado_en ASC`,
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Error al cargar historial' });
            res.json(rows);
        }
    );
});

// configuración
// GET es para cualquier usuario logueado, el técnico necesita el intervalo aunque no pueda editarlo
app.get('/api/configuracion', requireAuth, (req, res) => {
    const userId = req.session.user.id || req.session.user.ID;
    db.query('SELECT auto_refresh, intervalo, umbral_presion, umbral_flujo FROM configuracion_sistema WHERE id = 1', (err, sisRows) => {
        if (err) return res.status(500).json({ error: 'Error al cargar configuración' });
        db.query(
            'SELECT notif_alertas, notif_reportes, notif_sensores, tema FROM configuracion_notificaciones WHERE usuario_id = ?',
            [userId],
            (err2, notifRows) => {
                if (err2) return res.status(500).json({ error: 'Error al cargar configuración' });
                res.json({
                    sistema: sisRows[0] || { auto_refresh: 1, intervalo: 30, umbral_presion: 25, umbral_flujo: 8 },
                    notificaciones: notifRows[0] || { notif_alertas: 1, notif_reportes: 1, notif_sensores: 0, tema: 'oscuro' },
                });
            }
        );
    });
});

// PUT: preferencias de notificaciones del propio usuario (cualquier rol)
app.put('/api/configuracion/notificaciones', requireAuth, (req, res) => {
    const userId = req.session.user.id || req.session.user.ID;
    const { notif_alertas, notif_reportes, notif_sensores } = req.body;
    db.query(
        `INSERT INTO configuracion_notificaciones (usuario_id, notif_alertas, notif_reportes, notif_sensores)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE notif_alertas = VALUES(notif_alertas), notif_reportes = VALUES(notif_reportes), notif_sensores = VALUES(notif_sensores)`,
        [userId, !!notif_alertas, !!notif_reportes, !!notif_sensores],
        (err) => {
            if (err) return res.status(500).json({ error: 'Error al guardar notificaciones' });
            res.json({ success: true });
        }
    );
});

// tema claro/oscuro, se aplica al toque, no espera el botón Guardar
app.put('/api/configuracion/tema', requireAuth, (req, res) => {
    const userId = req.session.user.id || req.session.user.ID;
    const tema = req.body.tema === 'claro' ? 'claro' : 'oscuro';
    db.query(
        `INSERT INTO configuracion_notificaciones (usuario_id, tema) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE tema = VALUES(tema)`,
        [userId, tema],
        (err) => {
            if (err) return res.status(500).json({ error: 'Error al guardar el tema' });
            res.json({ success: true, tema });
        }
    );
});

// PUT: configuración del sistema (solo admin) — afecta a todos los usuarios
app.put('/api/configuracion/sistema', requireAdmin, (req, res) => {
    const { auto_refresh, intervalo, umbral_presion, umbral_flujo } = req.body;
    const intervaloNum = Number(intervalo);
    const presionNum   = Number(umbral_presion);
    const flujoNum     = Number(umbral_flujo);
    // 0 = tiempo real (streaming), no sondeo
    if (!Number.isFinite(intervaloNum) || intervaloNum < 0) return res.status(400).json({ error: 'Intervalo inválido' });
    if (!Number.isFinite(presionNum) || presionNum < 0) return res.status(400).json({ error: 'Umbral de presión inválido' });
    if (!Number.isFinite(flujoNum) || flujoNum < 0) return res.status(400).json({ error: 'Umbral de flujo inválido' });

    db.query(
        `UPDATE configuracion_sistema SET auto_refresh=?, intervalo=?, umbral_presion=?, umbral_flujo=? WHERE id = 1`,
        [!!auto_refresh, intervaloNum, presionNum, flujoNum],
        (err) => {
            if (err) return res.status(500).json({ error: 'Error al guardar configuración' });
            res.json({ success: true });
        }
    );
});

// chat con IA
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
- Si no sabes algo específico del sistema, indícalo honestamente.
- Escribe en texto normal, como si hablaras con la persona: el chat no interpreta formato, así
  que NO uses markdown ni HTML (nada de #, ##, **negritas**, tablas con |, <br>, viñetas con *).
  Si necesitas listar algo, usa líneas separadas con un guion simple ("- ") o numeradas ("1. "),
  cada punto en su propia línea (con un salto de línea real entre ellos) — nunca los pegues
  todos seguidos en el mismo párrafo. Usa caracteres especiales solo cuando de verdad aporten
  (unidades como °C o %, o un guion), no como decoración.`;

// sin sesión hay límite de mensajes, con sesión no
const CHAT_PROMPTS_GRATIS = 5;

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Se requiere el array de mensajes' });
    }

    if (!req.session.user) {
        const usados = req.session.chatPromptsUsados || 0;
        if (usados >= CHAT_PROMPTS_GRATIS) {
            return res.status(403).json({
                error: 'Alcanzaste el límite de mensajes gratuitos de AquaBot.',
                requiresLogin: true,
                limit: CHAT_PROMPTS_GRATIS,
            });
        }
        req.session.chatPromptsUsados = usados + 1;
    }

    try {
        const result = await groq.chat.completions.create({
            model: 'openai/gpt-oss-120b',
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

// comentarios de alertas
// GET todos (cualquier usuario logueado)
app.get('/api/comentarios', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
    db.query('SELECT * FROM comentarios_alertas ORDER BY creado_en DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST nuevo comentario
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
            eventos.emitir('alertas');
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
        eventos.emitir('alertas');
        res.json({ ok: true });
    });
});

// DELETE eliminar comentario (solo admin)
app.delete('/api/comentarios/:id', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
    if (req.session.user.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
    db.query('DELETE FROM comentarios_alertas WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        eventos.emitir('alertas');
        res.json({ ok: true });
    });
});

app.delete('/api/usuarios/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    if (req.session.user.id == id) return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    db.query('DELETE FROM usuarios WHERE ID = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: 'Error al eliminar' });
        res.json({ mensaje: 'Eliminado' });
    });
});

// alertas automáticas por zona
const UMBRAL_ALERTA = 5; // reportes activos en la zona (cualquier tipo)
const TIPO_ALERTA_MIXTA = 'Varios problemas'; // cuando no son todos del mismo tipo

function calcularSeveridad(total) {
    if (total >= 10) return 'critica';
    if (total >= 7) return 'alta';
    return 'media';
}

// cuenta los reportes activos de la zona (sin ver el tipo) y crea o actualiza
// la alerta; si todos son del mismo tipo lo muestra, si no, "Varios problemas"
function verificarUmbralAlerta(zona, sector, descripcion, usuario) {
    db.query(
        `SELECT tipo, COUNT(*) AS n FROM reportes WHERE zona = ? AND estado != 'resuelto' GROUP BY tipo`,
        [zona],
        (err, filas) => {
            if (err) return console.error('Error al contar reportes para alerta:', err.message);
            const total = filas.reduce((acc, f) => acc + f.n, 0);
            if (total < UMBRAL_ALERTA) return;

            const tipo = filas.length === 1 ? filas[0].tipo : TIPO_ALERTA_MIXTA;
            const severidad = calcularSeveridad(total);

            db.query(
                `SELECT id, estado FROM alertas WHERE zona = ? AND estado IN ('activa','suspendida')
                 ORDER BY FIELD(estado, 'activa', 'suspendida') LIMIT 1`,
                [zona],
                (err2, existentes) => {
                    if (err2) return console.error('Error al buscar alerta existente:', err2.message);

                    if (existentes.length > 0) {
                        // si está suspendida no se reactiva sola, solo se actualiza el conteo
                        const alerta = existentes[0];
                        db.query(
                            'UPDATE alertas SET tipo = ?, total_reportes = ?, severidad = ?, descripcion = ?, usuario = ? WHERE id = ?',
                            [tipo, total, severidad, descripcion, usuario, alerta.id],
                            (err3) => {
                                if (err3) return console.error('Error al actualizar alerta:', err3.message);
                                eventos.emitir('alertas');
                            }
                        );
                    } else {
                        db.query(
                            `INSERT INTO alertas (tipo, zona, sector, descripcion, severidad, total_reportes, usuario)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [tipo, zona, sector, descripcion, severidad, total, usuario],
                            (err3) => {
                                if (err3) return console.error('Error al crear alerta:', err3.message);
                                eventos.emitir('alertas');
                            }
                        );
                    }
                }
            );
        }
    );
}

// GET todas las alertas (cualquier usuario autenticado)
app.get('/api/alertas', requireAuth, (req, res) => {
    const sql = `
        SELECT a.*, u.rol AS usuario_rol
        FROM alertas a
        LEFT JOIN usuarios u ON u.Usuario = a.usuario
        ORDER BY a.creado_en DESC
    `;
    db.query(sql, (err, rows) => {
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
        eventos.emitir('alertas');
        res.json({ ok: true });
    });
});

// DELETE eliminar una alerta (solo admin)
app.delete('/api/alertas/:id', requireAdmin, (req, res) => {
    db.query('DELETE FROM alertas WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Alerta no encontrada' });
        eventos.emitir('alertas');
        res.json({ ok: true });
    });
});

// reportes

app.get('/api/reportes', requireAuth, (req, res) => {
    const sql = `
        SELECT r.id, r.tipo, r.zona, r.sector, r.descripcion, r.estado, r.prioridad,
               r.usuario_id, r.usuario, r.creado_en, u.rol AS usuario_rol,
               (SELECT COUNT(*) FROM comentarios_reportes cr WHERE cr.reporte_id = r.id) AS total_comentarios
        FROM reportes r
        LEFT JOIN usuarios u ON u.id = r.usuario_id
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
            verificarUmbralAlerta(zona, sector, descripcion, usuario);
            eventos.emitir('reportes');
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
                eventos.emitir('reportes');
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
                eventos.emitir('reportes');
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
            eventos.emitir('reportes');
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
            eventos.emitir('reportes');
            res.json({ ok: true });
        });
    });
});