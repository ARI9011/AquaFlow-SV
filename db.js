try { require('dotenv').config(); } catch { /* dotenvx maneja las variables en producción */ }
const mysql = require('mysql2');

// Configuración de la BD
const dbConfig = {
    host: 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: 'root',
    password: '',
    database: 'aquaflow_sv',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};


const pool = mysql.createPool(dbConfig);

// Sin este listener, un error a nivel de pool (p. ej. la BD se reinicia y tira
// una conexión inactiva) es una excepción no capturada que tumba todo el proceso.
pool.on('error', (err) => {
    console.error('❌ Error en el pool de MySQL:', err.message);
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error de conexión: ' + err.stack);
        return;
    }
    console.log('✅ Conectado a la base de datos MySQL con pool');
    connection.release();
});

module.exports = pool;