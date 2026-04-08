<?php

// Configuración de la BD
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'aquaflow_sv');

// Crear conexión
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Verificar conexión
if ($conn->connect_error) {
    die('❌ Error de conexión: ' . $conn->connect_error);
}

// Establecer charset
$conn->set_charset('utf8mb4');

?>
