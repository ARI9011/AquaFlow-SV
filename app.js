const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');
const cors = require('cors');

const app = express();

// 1. Configuración de CORS para permitir solicitudes desde el frontend 
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(session({
    secret: 'aquaflow_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Importante para localhost
        httpOnly: true,
        sameSite: 'lax'
    }
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

// --- LÓGICA DE LOGIN  ---
app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;

    // Usamos Correo y Contra según tu estructura SQL
    const sql = 'SELECT * FROM usuarios WHERE Correo = ? AND Contra = ?';
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error('Login query error:', err);
            return res.status(500).send('Error en servidor');
        }

        if (results.length > 0) {
            req.session.user = results[0];
            res.redirect('/');
        } else {
            res.send('Credenciales incorrectas. <a href="/login">Volver a intentar</a>');
        }
    });
});

// --- LÓGICA DE REGISTRO (Ajustada a tu SQL) ---
app.post('/auth/register', (req, res) => {
    const { nombre, email, password, adminCode } = req.body;

    const rol = (adminCode === 'CREA2026') ? 'admin' : 'user';

    // Usamos Usuario, Correo, Contra y rol según tu estructura SQL
    const sql = 'INSERT INTO usuarios (Usuario, Correo, Contra, rol) VALUES (?, ?, ?, ?)';

    db.query(sql, [nombre, email, password, rol], (err, result) => {
        if (err) {
            console.error('Register query error:', err);
            return res.send('Error al registrar. <a href="/login">Volver</a>');
        }
        res.redirect('/login?registro=exitoso');
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

// DEBUG para verificar sesión y rol
app.get('/api/debug-session', (req, res) => {
    res.json({
        sessionUser: req.session.user,
        hasSession: !!req.session.user,
        rol: req.session.user?.rol,
        usuario: req.session.user?.Usuario
    });
});

// 2. Ruta para cerrar sesión
app.post('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// 2.5. Endpoint para obtener lista de reportes
app.get('/api/lista-reportes', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json([]);
    }
    res.json([]);
});


//CRUD DE USUARIOS (Solo para Admin)
// Middleware para verificar que es admin
// Este permite el paso a CUALQUIERA que esté logueado (Admin o Técnico)
function checkAuth(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Sesión expirada o no autenticado' });
}

// Este solo permite el paso si es ADMIN
function checkAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    if (req.session.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores' });
    }
    next();
}

// --- RUTAS DE NAVEGACIÓN ---
app.get('/', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'src/Pages/Dashboard.tsx'));
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/Pages/Login.tsx'));
});

// --- API PARA REACT 
app.get('/api/usuarios', checkAuth, (req, res) => {
    const sql = 'SELECT ID, Usuario, Correo, rol FROM usuarios';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener usuarios' });
        res.json(results);
    });
});

// --- LÓGICA DE AUTH ---
app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE Correo = ? AND Contra = ?';
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).send('Error en servidor');
        if (results.length > 0) {
            req.session.user = results[0];
            res.redirect('/');
        } else {
            res.send('Credenciales incorrectas. <a href="/login">Volver</a>');
        }
    });
});

app.post('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- CRUD (Acciones que sí requieren ser Admin) ---


// CREAR USUARIO (Solo Admin)
app.post('/api/usuarios', (req, res) => {
    const { Usuario, Correo, Contra, rol } = req.body;
    const insertSql = 'INSERT INTO usuarios (Usuario, Correo, Contra, rol) VALUES (?, ?, ?, ?)';
    db.query(insertSql, [Usuario, Correo, Contra, rol], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al crear' });
        res.json({ mensaje: 'Creado', ID: result.insertId });
    });
});

// ELIMINAR USUARIO (Solo Admin)
app.delete('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM usuarios WHERE ID = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error al borrar:", err);
            return res.status(500).json({ error: "Error de base de datos" });
        }
        res.json({ mensaje: "Usuario eliminado" });
    });
});

// ACTUALIZAR USUARIO (Solo Admin)
app.put('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { Usuario, Correo, rol } = req.body;
    const sql = 'UPDATE usuarios SET Usuario = ?, Correo = ?, rol = ? WHERE ID = ?';
    db.query(sql, [id, Usuario, Correo, rol], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: "Actualizado correctamente" });
    });
});

// ELIMINAR USUARIO (Solo Admin) - Evitando que un admin se elimine a sí mismo
app.delete('/api/usuarios/:id', checkAdmin, (req, res) => {
    const { id } = req.params;
    if (req.session.user && req.session.user.ID == id) {
        return res.status(400).json({ error: "No puedes eliminarte a ti mismo" });
    }
    const sql = 'DELETE FROM usuarios WHERE ID = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al eliminar" });
        res.json({ mensaje: "Usuario eliminado con éxito" });
    });
});