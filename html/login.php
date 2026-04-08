<?php

session_start();
require 'config.php';

// Si ya está autenticado, redirige al dashboard
if (isset($_SESSION['user'])) {
    header('Location: index.php');
    exit();
}

$error = '';
$success = '';
$formType = isset($_GET['form']) ? $_GET['form'] : 'login';

// Funciones de validación
function validateEmail($email) {
    $allowedDomains = ['@gmail.com', '@hotmail.com', '@cdb.edu.sv'];
    $emailLower = strtolower($email);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    foreach ($allowedDomains as $domain) {
        if (substr($emailLower, -strlen($domain)) === $domain) {
            return true;
        }
    }
    return false;
}

function validatePassword($password) {
    if (strlen($password) < 6) return false;
    if (!preg_match('/[A-Z]/', $password)) return false;
    if (!preg_match('/[0-9]/', $password)) return false;
    if (!preg_match('/[!@#$%^&*()_\-+=\[\]{};:\'",.<>?\/\\|`~]/', $password)) return false;
    return true;
}

// PROCESAR FORMULARIOS
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    // LOGIN
    if ($action === 'login') {
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (empty($email) || empty($password)) {
            $error = 'Email y contraseña requeridos';
        } elseif (!validateEmail($email)) {
            $error = 'Solo se aceptan: @gmail.com, @hotmail.com, @cdb.edu.sv';
        } else {
            $stmt = $conn->prepare('SELECT id, Usuario, Correo, Contra, rol FROM usuarios WHERE LOWER(Correo) = ?');
            $emailLower = strtolower($email);
            $stmt->bind_param('s', $emailLower);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                $error = 'Email o contraseña incorrectos';
            } else {
                $user = $result->fetch_assoc();

                if ($password !== $user['Contra']) {
                    $error = 'Email o contraseña incorrectos';
                } else {
                    $_SESSION['user'] = [
                        'id' => $user['id'],
                        'nombre' => $user['Usuario'],
                        'email' => $user['Correo'],
                        'rol' => $user['rol']
                    ];
                    header('Location: index.php');
                    exit();
                }
            }
            $stmt->close();
        }
    }

    // REGISTRO
    elseif ($action === 'register') {
        $nombre = trim($_POST['nombre'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $passwordConfirm = $_POST['passwordConfirm'] ?? '';
        $adminCode = trim($_POST['adminCode'] ?? '');

        if (empty($nombre)) {
            $error = 'El nombre es requerido';
        } elseif (empty($email)) {
            $error = 'El email es requerido';
        } elseif (empty($password)) {
            $error = 'La contraseña es requerida';
        } elseif (empty($passwordConfirm)) {
            $error = 'Debe confirmar la contraseña';
        } elseif (!validateEmail($email)) {
            $error = 'Solo se aceptan: @gmail.com, @hotmail.com, @cdb.edu.sv';
        } elseif (!validatePassword($password)) {
            $error = 'Password: 6+ chars, 1 mayús., 1 número, 1 símbolo (!@#$%)';
        } elseif ($password !== $passwordConfirm) {
            $error = 'Las contraseñas no coinciden';
        } else {
            // Verificar si el email existe
            $stmt = $conn->prepare('SELECT id FROM usuarios WHERE LOWER(Correo) = ?');
            $emailLower = strtolower($email);
            $stmt->bind_param('s', $emailLower);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $error = 'Este email ya está registrado';
                $stmt->close();
            } else {
                $stmt->close();

                // Determinar rol basado en código de administrador
                $rol = 'user';
                $adminCodeValid = '';
                if (!empty($adminCode)) {
                    if ($adminCode === 'ADMIN123SV') {
                        $rol = 'admin';
                        $adminCodeValid = '✓ ';
                    } else {
                        $error = 'Código de administrador incorrecto';
                    }
                }

                // Solo insertar si no hay error
                if (empty($error)) {
                    // Insertar usuario CON contraseña en texto plano
                    $stmt = $conn->prepare('INSERT INTO usuarios (Usuario, Correo, Contra, rol) VALUES (?, ?, ?, ?)');
                    $stmt->bind_param('ssss', $nombre, $email, $password, $rol);

                    if ($stmt->execute()) {
                        $roleText = ($rol === 'admin') ? ' (Administrador)' : '';
                        $success = '✓ Cuenta creada exitosamente' . $roleText . '. Inicia sesión.';
                        $nombre = '';
                        $email = '';
                        $password = '';
                        $passwordConfirm = '';
                        $adminCode = '';
                        $formType = 'login';
                    } else {
                        $error = 'Error al registrar: ' . $stmt->error;
                    }
                    $stmt->close();
                }
            }
        }
    }
}

$conn->close();
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AquaFlow SV — Autenticación</title>
  <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../css/auth.css" />
</head>
<body>
  <div class="auth-container">
    <div class="auth-wrapper">
      <div class="auth-header">
        <div class="auth-logo">💧</div>
        <div>
          <h1>AquaFlow SV</h1>
          <p>Monitoreo Hídrico</p>
        </div>
      </div>

      <div class="auth-card">
        <div class="forms-container">

          <!-- FORMULARIO LOGIN -->
          <div id="login-form" class="auth-form <?php echo $formType === 'login' ? 'active' : ''; ?>">
            <h2>Bienvenido</h2>
            <p>Ingresa tu email y contraseña</p>

            <?php if ($error && $formType === 'login'): ?>
              <div style="padding: 12px; background: rgba(255, 61, 94, 0.12); border: 1px solid rgba(255, 61, 94, 0.3); border-radius: 6px; margin-bottom: 16px;">
                <p style="font-size: 12px; color: #ff3d5e; margin: 0;">❌ <?php echo htmlspecialchars($error); ?></p>
              </div>
            <?php endif; ?>

            <form method="POST">
              <input type="hidden" name="action" value="login">

              <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" placeholder="tu@email.com" value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>" required>
              </div>

              <div class="form-group">
                <label>Contraseña</label>
                <input type="password" name="password" placeholder="••••••••" required>
              </div>

              <button type="submit" class="auth-button">Iniciar Sesión</button>
            </form>

            <div class="auth-divider"><span>O</span></div>

            <button class="auth-toggle" onclick="location.href='login.php?form=register'">
              ¿No tienes cuenta? Regístrate
            </button>
          </div>

          <!-- FORMULARIO REGISTRO -->
          <div id="register-form" class="auth-form <?php echo $formType === 'register' ? 'active' : ''; ?>">
            <h2>Crear Cuenta</h2>
            <p>Regístrate para acceder a AquaFlow SV</p>

            <?php if ($success): ?>
              <div style="padding: 12px; background: rgba(34, 224, 134, 0.12); border: 1px solid rgba(34, 224, 134, 0.3); border-radius: 6px; margin-bottom: 16px;">
                <p style="font-size: 12px; color: #22e086; margin: 0;"><?php echo htmlspecialchars($success); ?></p>
              </div>
            <?php endif; ?>

            <?php if ($error && $formType === 'register'): ?>
              <div style="padding: 12px; background: rgba(255, 61, 94, 0.12); border: 1px solid rgba(255, 61, 94, 0.3); border-radius: 6px; margin-bottom: 16px;">
                <p style="font-size: 12px; color: #ff3d5e; margin: 0;">❌ <?php echo htmlspecialchars($error); ?></p>
              </div>
            <?php endif; ?>

            <form method="POST">
              <input type="hidden" name="action" value="register">

              <div class="form-group">
                <label>Nombre completo</label>
                <input type="text" name="nombre" placeholder="Tu nombre" value="<?php echo htmlspecialchars($_POST['nombre'] ?? ''); ?>" required>
              </div>

              <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" placeholder="tu@email.com" value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>" required>
              </div>

              <div class="form-group">
                <label>Contraseña</label>
                <input type="password" name="password" placeholder="••••••••" onfocus="document.querySelector('.password-requirements').style.display='block'" onblur="document.querySelector('.password-requirements').style.display='none'" required>
                <span class="password-requirements" style="font-size: 10px; color: var(--auth-text-muted); margin-top: 4px; display: none;">
                  • Mín. 6 caracteres • 1 mayúscula • 1 número • 1 símbolo
                </span>
              </div>

              <div class="form-group">
                <label>Confirmar contraseña</label>
                <input type="password" name="passwordConfirm" placeholder="••••••••" required>
              </div>

              <div class="form-group">
                <label>Código de administrador (opcional)</label>
                <input type="password" name="adminCode" placeholder="Ingresa el código si eres admin" value="<?php echo htmlspecialchars($_POST['adminCode'] ?? ''); ?>">
                <span class="password-requirements" style="font-size: 10px; color: var(--auth-text-muted); margin-top: 4px;">
                  💡 Si dejas en blanco, se creará como usuario regular
                </span>
              </div>

              <button type="submit" class="auth-button">Crear Cuenta</button>
            </form>

            <div class="auth-divider"><span>O</span></div>

            <button class="auth-toggle" onclick="location.href='login.php'">
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</body>
</html>
