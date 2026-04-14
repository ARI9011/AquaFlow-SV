const mysql = require('mysql2');

// Configuración de la BD
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'aquaflow_sv',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Usar pool para mantener conexiones estables y evitar errores por conexión cerrada
const pool = mysql.createPool(dbConfig);

pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error de conexión: ' + err.stack);
        return;
    }
    console.log('✅ Conectado a la base de datos MySQL con pool');
    connection.release();
});

module.exports = pool;