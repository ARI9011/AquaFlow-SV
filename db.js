const mysql = require('mysql2');

// Configuración de la BD (Lo que tenías en los define)
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'aquaflow_sv',
    charset: 'utf8mb4'
};

// Crear la conexión (similar a new mysqli)
const connection = mysql.createConnection(dbConfig);

// Verificar conexión
connection.connect((err) => {
    if (err) {
        console.error('❌ Error de conexión: ' + err.stack);
        return;
    }
    console.log('✅ Conectado a la base de datos MySQL como ID ' + connection.threadId);
});

// Exportar para usarlo en index.js
module.exports = connection;