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

// 3. Obtener todos los usuarios
app.get('/api/usuarios', checkAdmin, (req, res) => {
    const sql = 'SELECT ID, Usuario, Correo, rol FROM usuarios';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({ error: 'Error al obtener usuarios' });
        }
        res.json(results);
    });
});

// 4. Crear nuevo usuario
app.post('/api/usuarios', checkAdmin, (req, res) => {
    const { Usuario, Correo, Contra, rol } = req.body;

    // Validación básica
    if (!Usuario || !Correo || !Contra || !rol) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verificar si el email ya existe
    const checkSql = 'SELECT COUNT(*) as count FROM usuarios WHERE Correo = ?';
    db.query(checkSql, [Correo], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en servidor' });
        }

        if (results[0].count > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Insertar nuevo usuario
        const insertSql = 'INSERT INTO usuarios (Usuario, Correo, Contra, rol) VALUES (?, ?, ?, ?)';
        db.query(insertSql, [Usuario, Correo, Contra, rol], (err, result) => {
            if (err) {
                console.error('Error al crear usuario:', err);
                return res.status(500).json({ error: 'Error al crear usuario' });
            }
            res.json({ 
                mensaje: 'Usuario creado exitosamente',
                ID: result.insertId,
                Usuario,
                Correo,
                rol
            });
        });
    });
});

// 5. Actualizar usuario
app.put('/api/usuarios/:id', checkAdmin, (req, res) => {
    const { id } = req.params;
    const { Usuario, Correo, Contra, rol } = req.body;

    if (!Usuario || !Correo || !rol) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Si la contraseña está vacía, no la actualizamos
    let sql, params;
    if (Contra && Contra.trim() !== '') {
        sql = 'UPDATE usuarios SET Usuario = ?, Correo = ?, Contra = ?, rol = ? WHERE ID = ?';
        params = [Usuario, Correo, Contra, rol, id];
    } else {
        sql = 'UPDATE usuarios SET Usuario = ?, Correo = ?, rol = ? WHERE ID = ?';
        params = [Usuario, Correo, rol, id];
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error al actualizar usuario:', err);
            return res.status(500).json({ error: 'Error al actualizar usuario' });
        }
        res.json({ mensaje: 'Usuario actualizado exitosamente' });
    });
});

// 6. Eliminar usuario
app.delete('/api/usuarios/:id', checkAdmin, (req, res) => {
    const { id } = req.params;

    // No permitir eliminar al admin actual
    if (req.session.user.ID == id) {
        return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    const sql = 'DELETE FROM usuarios WHERE ID = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar usuario:', err);
            return res.status(500).json({ error: 'Error al eliminar usuario' });
        }
        res.json({ mensaje: 'Usuario eliminado exitosamente' });
    });
});