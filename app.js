const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db'); 
const cors = require('cors');

const app = express();

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


app.get('/api/usuarios', (req, res) => {
    // ESTO TE DIRÁ SI EL SERVIDOR RECIBE LA PETICIÓN
    console.log("==> Petición recibida en /api/usuarios");
    console.log("==> ¿Hay sesión activa?:", !!req.session.user);
    
    const sql = 'SELECT ID, Usuario, Correo, rol FROM usuarios';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error SQL:', err);
            return res.status(500).json({ error: 'Error al obtener usuarios' });
        }
        res.json(results);
    });
});

// --- RUTAS DE NAVEGACIÓN ---

app.get('/', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'Public/html/index.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public/html/login.html'));
});

// --- LÓGICA DE LOGIN (Ajustada a tu SQL) ---
app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Usamos Correo y Contra según tu estructura SQL
    const sql = 'SELECT * FROM usuarios WHERE Correo = ? AND Contra = ?';
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error('Login query error:', err);
            return res.status(500).json({ error: 'Error en servidor' });
        }

        if (results.length > 0) {
            req.session.user = results[0];
            console.log('✅ Login exitoso:', email, '| Rol:', results[0].rol);
            return res.json({ success: true, user: results[0] });
        } else {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
    });
});

// --- LÓGICA DE REGISTRO (Ajustada a tu SQL) ---
app.post('/auth/register', (req, res) => {
    const { nombre, email, password, adminCode } = req.body;
    
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Validar que sea email @flowcdb.com o que tenga el código admin
    const isFlowcdbEmail = email.toLowerCase().endsWith('@flowcdb.com');
    const rol = (isFlowcdbEmail || adminCode === 'FLOWCDB2026') ? 'admin' : 'user';

    console.log(`📝 Registrando usuario: ${email} | Rol: ${rol} | FlowCDB: ${isFlowcdbEmail}`);

    // Usamos Usuario, Correo, Contra y rol según tu estructura SQL
    const sql = 'INSERT INTO usuarios (Usuario, Correo, Contra, rol) VALUES (?, ?, ?, ?)';
    
    db.query(sql, [nombre, email, password, rol], (err, result) => {
        if (err) {
            console.error('Register query error:', err);
            return res.status(500).json({ error: 'Error al registrar. El email puede estar duplicado.' });
        }
        console.log('✅ Registro exitoso:', email, '| Nuevo ID:', result.insertId);
        return res.json({ 
            success: true, 
            message: 'Usuario registrado exitosamente',
            isAdmin: rol === 'admin'
        });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 AquaFlow SV corriendo en http://localhost:${PORT}`);
});

// 1. Ruta para obtener la info del usuario logueado
app.get('/api/user-info', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'No autorizado' });
    }
});

// DEBUG: Endpoint para verificar sesión y rol
app.get('/api/debug-session', (req, res) => {
    res.json({
        sessionUser: req.session.user,
        hasSession: !!req.session.user,
        rol: req.session.user?.rol,
        usuario: req.session.user?.Usuario
    });
});

// 2. Ruta para cerrar sesión (para que el botón "Salir" funcione)
app.post('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// 2.5. Endpoint para obtener lista de reportes
app.get('/api/lista-reportes', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json([]);
    }
    
    // Por ahora retorna un array vacío - después conectaremos con la BD
    // const sql = 'SELECT * FROM reportes LIMIT 10';
    // db.query(sql, (err, results) => { ... });
    
    res.json([]);
});


//CRUD DE USUARIOS (Solo para Admin)

// Middleware para verificar que es admin
function checkAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    if (req.session.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores' });
    }
    next();
}

// --- CRUD (Acciones que sí requieren ser Admin) ---
app.post('/api/usuarios', (req, res) => {
    const { Usuario, Correo, Contra, rol } = req.body;
    const insertSql = 'INSERT INTO usuarios (Usuario, Correo, Contra, rol) VALUES (?, ?, ?, ?)';
    db.query(insertSql, [Usuario, Correo, Contra, rol], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al crear' });
        res.json({ mensaje: 'Creado', ID: result.insertId });
    });
});

app.delete('/api/usuarios/:id',(req, res) => {
    const { id } = req.params;
    if (req.session.user.ID == id) return res.status(400).json({ error: 'No puedes borrarte' });
    db.query('DELETE FROM usuarios WHERE ID = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: 'Error al eliminar' });
        res.json({ mensaje: 'Eliminado' });
    });
});