<?php

session_start();
require 'config.php';

// Verificar autenticación
if (!isset($_SESSION['user'])) {
  header('Location: login.php');
  exit();
}

$user = $_SESSION['user'];
$userName = htmlspecialchars($user['nombre']);
$userRole = $user['rol'];

// Manejo de logout
if (isset($_POST['logout'])) {
  session_unset();
  session_destroy();
  header('Location: login.php');
  exit();
}

$conn->close();
?>
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AquaFlow SV — Monitoreo Hídrico</title>
  <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../css/style.css" />
</head>

<body>

  <div class="shell">

    <!-- ══ TOPBAR ══ -->
    <header class="topbar">
      <div class="brand">
        <div class="brand-icon">💧</div>
        <div class="brand-text">
          <h1>AquaFlow SV</h1>
          <span>Monitoreo Hídrico</span>
        </div>
      </div>
      <div class="topbar-center">
        <h2 id="page-title">Dashboard</h2>
        <p id="page-subtitle">Resumen general del sistema</p>
      </div>
      <div class="topbar-clock">
        <div class="clock-dot"></div>
        <span id="clock">--:--:-- --</span>
      </div>
      <div class="topbar-user">
        <span style="font-size: 12px; color: var(--text-secondary); margin-right: 16px;">👤 <?php echo $userName; ?></span>
        <form method="POST" style="display: inline;">
          <button type="submit" name="logout" class="logout-button" style="border: none; cursor: pointer; padding: 6px 12px; background: rgba(255, 61, 94, 0.12); border: 1px solid rgba(255, 61, 94, 0.3); border-radius: 6px; color: #ff3d5e; font-family: Rajdhani; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" style="display: inline; margin-right: 4px; vertical-align: middle;">
              <path d="M12 1a1 1 0 0 1 1 1v6h.5a.5.5 0 0 1 .354.854l-7 7a.5.5 0 0 1-.708 0l-7-7A.5.5 0 0 1 .5 8H1V2a1 1 0 0 1 1-1h10zm-5 8a.5.5 0 0 0-.5.5v3.5H5V9.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5V15h2.5v-3.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5V15h2.5v-3.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5V15h2.5V9.5a.5.5 0 0 0-.5-.5h-1Z" />
            </svg>
            Salir
          </button>
        </form>
      </div>
    </header>

    <!-- ══ SIDEBAR ══ -->
    <aside class="sidebar">
      <div class="nav-group-label">Principal</div>
      <div class="nav-item active" data-page="dashboard" onclick="navigate('dashboard', this)">
        <svg class="nav-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4zM3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 9.31a.91.91 0 1 0 1.302 1.258l3.434-4.297a.389.389 0 0 0-.029-.518z" />
          <path fill-rule="evenodd" d="M0 10a8 8 0 1 1 15.547 2.661c-.442 1.253-1.845 1.602-2.932 1.25C11.309 13.488 9.475 13 8 13c-1.474 0-3.31.488-4.615.911-1.087.352-2.49.003-2.932-1.25A7.988 7.988 0 0 1 0 10zm8-7a7 7 0 0 0-6.603 9.329c.203.575.923.876 1.68.63C4.397 12.533 6.358 12 8 12s3.604.532 4.923.96c.757.245 1.477-.056 1.68-.631A7 7 0 0 0 8 3z" />
        </svg>
        Dashboard
      </div>
      <div class="nav-item" data-page="mapa" onclick="navigate('mapa', this)">
        <svg class="nav-icon" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd" d="M15.817.113A.5.5 0 0 1 16 .5v14a.5.5 0 0 1-.402.49l-5 1a.502.502 0 0 1-.196 0L5.5 15.01l-4.902.98A.5.5 0 0 1 0 15.5v-14a.5.5 0 0 1 .402-.49l5-1a.5.5 0 0 1 .196 0L10.5.99l4.902-.98a.5.5 0 0 1 .415.103zM10 1.91l-4-.8v12.98l4 .8V1.91zm1 12.98 4-.8V1.11l-4 .8v12.98zm-6-.8V1.11l-4 .8v12.98l4-.8z" />
        </svg>
        Mapa de zonas
      </div>
      <div class="nav-item" data-page="sensores" onclick="navigate('sensores', this)">
        <svg class="nav-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022zM6 8.694 1 10.36V15h5V8.694zM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309l-7 3.5V15z" />
        </svg>
        Sensores IoT
      </div>

      <div class="nav-group-label">Ciudadano</div>
      <div class="nav-item" data-page="reportes" onclick="navigate('reportes', this)">
        <svg class="nav-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z" />
          <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" />
        </svg>
        Reportes ciudadanos
      </div>
      <div class="nav-item" data-page="alertas" onclick="navigate('alertas', this)">
        <svg class="nav-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z" />
        </svg>
        Alertas
        <span class="nav-badge">3</span>
      </div>

      <div class="nav-group-label" <?php echo $userRole !== 'admin' ? 'style="display:none;"' : ''; ?>>Administración</div>
      <div class="nav-item" data-page="usuarios" onclick="navigate('usuarios', this)" <?php echo $userRole !== 'admin' ? 'style="display:none;"' : ''; ?>>
        <svg class="nav-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
        </svg>
        Usuarios
      </div>
      <div class="nav-item" data-page="analisis" onclick="navigate('analisis', this)" <?php echo $userRole !== 'admin' ? 'style="display:none;"' : ''; ?>>
        <svg class="nav-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5v12h-2V2h2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3z" />
        </svg>
        Análisis
      </div>
      <div class="nav-item" data-page="config" onclick="navigate('config', this)" <?php echo $userRole !== 'admin' ? 'style="display:none;"' : ''; ?>>
        <svg class="nav-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
          <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.474l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
        </svg>
        Configuración
      </div>
    </aside>

    <!-- ══ PAGES ══ -->
    <main class="main">

      <!-- ═══ PAGE: DASHBOARD ═══ -->
      <section id="page-dashboard" class="page active">
        <div class="banner">
          <h2>💧 Bienvenido a AquaFlow SV</h2>
          <p>Sistema de monitoreo de agua potable · Gran San Salvador</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card" style="--accent:var(--cyan)">
            <div class="stat-icon">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z" />
              </svg>
            </div>
            <div>
              <div class="stat-value">3</div>
              <div class="stat-label">Zonas activas</div>
              <div class="stat-sub">de 6 totales</div>
            </div>
          </div>
          <div class="stat-card" style="--accent:var(--teal)">
            <div class="stat-icon">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022z" />
              </svg>
            </div>
            <div>
              <div class="stat-value">5</div>
              <div class="stat-label">Sensores en línea</div>
              <div class="stat-sub">de 6 instalados</div>
            </div>
          </div>
          <div class="stat-card" style="--accent:var(--purple)">
            <div class="stat-icon">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z" />
                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" />
              </svg>
            </div>
            <div>
              <div class="stat-value">9</div>
              <div class="stat-label">Reportes totales</div>
              <div class="stat-sub">4 pendientes</div>
            </div>
          </div>
          <div class="stat-card" style="--accent:var(--red)">
            <div class="stat-icon">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917z" />
              </svg>
            </div>
            <div>
              <div class="stat-value">3</div>
              <div class="stat-label">Alertas activas</div>
              <div class="stat-sub" style="color:var(--red)">⚠ Requieren atención</div>
            </div>
          </div>
        </div>

        <div class="bottom-grid">
          <div class="panel">
            <div class="panel-header">📍 Estado de zonas</div>
            <table class="zone-table">
              <thead>
                <tr>
                  <th>Zona</th>
                  <th>Sector</th>
                  <th>Presión</th>
                  <th>Flujo</th>
                  <th>Estado</th>
                  <th>Actualización</th>
                </tr>
              </thead>
              <tbody id="zone-tbody"></tbody>
            </table>
          </div>
          <div class="panel chart-panel">
            <div class="panel-header">📊 Distribución por zonas</div>
            <div class="chart-body">
              <div class="bars-wrapper" id="bars-wrapper"></div>
            </div>
          </div>
        </div>

        <div class="panel activity-panel">
          <div class="panel-header">⚡ Actividad reciente</div>
          <div class="activity-body" id="activity-body"></div>
        </div>
      </section>

      <!-- ═══ PAGE: MAPA DE ZONAS ═══ -->
      <section id="page-mapa" class="page">
        <div class="banner">
          <h2>🗺️ Mapas en zonas</h2>
          <p>Gestión de zonas de distribución de agua potable</p>
        </div>

        <div class="section-toolbar">
          <div class="section-count">Zonas registradas <span class="count-badge">3</span></div>
          <span class="filter-badge filter-active">Activo</span>
        </div>

        <div class="zone-cards-grid" id="zone-cards"></div>
      </section>

      <!-- ═══ PAGE: SENSORES IOT ═══ -->
      <section id="page-sensores" class="page">
        <div class="banner">
          <h2>📡 Sensores IoT</h2>
          <p>Monitoreo de dispositivos en el campo</p>
        </div>

        <div class="section-toolbar">
          <div class="section-count">Dispositivos registrados <span class="count-badge">4</span></div>
          <span class="filter-badge filter-active">Activo</span>
        </div>

        <div class="panel">
          <table class="zone-table sensors-table">
            <thead>
              <tr>
                <th>ID-Sensor</th>
                <th>Zona</th>
                <th>Presión</th>
                <th>Estado</th>
                <th>Batería</th>
                <th>Última señal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="sensors-tbody"></tbody>
          </table>
        </div>
      </section>

      <!-- ═══ PAGE: REPORTES CIUDADANOS ═══ -->
      <section id="page-reportes" class="page">
        <div class="banner">
          <h2>📋 Reportes Ciudadanos</h2>
          <p>Gestión de reportes de la comunidad · Modo Manual</p>
        </div>

        <div class="panel">
          <div class="panel-header">📍 Estado de zonas</div>
          <table class="zone-table">
            <thead>
              <tr>
                <th>Zona</th>
                <th>Sector</th>
                <th>Presión</th>
                <th>Flujo</th>
                <th>Estado</th>
                <th>Actualización</th>
              </tr>
            </thead>
            <tbody id="reportes-tbody"></tbody>
          </table>
        </div>
      </section>

      <!-- ═══ PAGE: ALERTAS ═══ -->
      <section id="page-alertas" class="page">
        <div class="banner">
          <h2>🔔 Alertas activas</h2>
          <p>Notificaciones que requieren atención inmediata</p>
        </div>
        <div class="panel activity-panel">
          <div class="panel-header">⚠️ Alertas del sistema</div>
          <div class="activity-body" id="alertas-body"></div>
        </div>
      </section>

      <!-- ═══ PAGE: USUARIOS ═══ -->
      <section id="page-usuarios" class="page">
        <div class="banner">
          <h2>👥 Usuarios</h2>
          <p>Gestión de usuarios del sistema</p>
        </div>
        <div class="panel coming-soon-panel">
          <div class="coming-soon">
            <svg viewBox="0 0 16 16" fill="currentColor" width="48" height="48">
              <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
            </svg>
            <p>Módulo en construcción</p>
          </div>
        </div>
      </section>

      <!-- ═══ PAGE: ANÁLISIS ═══ -->
      <section id="page-analisis" class="page">
        <div class="banner">
          <h2>📈 Análisis</h2>
          <p>Estadísticas y métricas del sistema hídrico</p>
        </div>
        <div class="panel coming-soon-panel">
          <div class="coming-soon">
            <svg viewBox="0 0 16 16" fill="currentColor" width="48" height="48">
              <path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5v12h-2V2h2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2z" />
            </svg>
            <p>Módulo en construcción</p>
          </div>
        </div>
      </section>

      <!-- ═══ PAGE: CONFIGURACIÓN ═══ -->
      <section id="page-config" class="page">
        <div class="banner">
          <h2>⚙️ Configuración</h2>
          <p>Ajustes generales del sistema</p>
        </div>
        <div class="panel coming-soon-panel">
          <div class="coming-soon">
            <svg viewBox="0 0 16 16" fill="currentColor" width="48" height="48">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z" />
            </svg>
            <p>Módulo en construcción</p>
          </div>
        </div>
      </section>

    </main>
  </div>

  <script src="../JS/script.js"></script>
</body>

</html>