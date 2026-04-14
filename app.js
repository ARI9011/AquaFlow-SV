const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db'); 

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'aquaflow_secret_2026',
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'Public')));

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

// 2. Ruta para cerrar sesión (para que el botón "Salir" funcione)
app.post('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});