/* ── CONFIGURACIÓN Y DATOS ESTÁTICOS ── */
const zones = [
    { name: 'Soyapango', sector: 'Norte', psi: 65, psiClass: 'psi-high', flow: 'Normal', flowDot: 'dot-green', status: 'Activo', statusClass: 'status-active', upd: 'hace 21 min' },
    { name: 'Ciudad Delgado', sector: 'Sur', psi: 5, psiClass: 'psi-low', flow: 'Bajo', flowDot: 'dot-red', status: 'Sin servicio', statusClass: 'status-inactive', upd: 'hace 3 min' },
    { name: 'Apopa', sector: 'Sureste', psi: 25, psiClass: 'psi-medium', flow: 'Medio', flowDot: 'dot-amber', status: 'Intermedio', statusClass: 'status-warning', upd: 'hace 40 min' }
];

const barData = [
    { label: 'Soyapango', pct: 80, color: 'var(--green)', val: '65 PSI' },
    { label: 'Apopa', pct: 38, color: 'var(--amber)', val: '25 PSI' },
    { label: 'Ciudad Delgado', pct: 8, color: 'var(--red)', val: '5 PSI' }
];

/* ── FUNCIONES DE MODAL PERSONALIZADO ── */

// Mostrar modal de confirmación personalizado
// Parámetros: title (título del modal), message (mensaje a mostrar)
// Retorna: Promise que resuelve a true si acepta, false si cancela
function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        // Obtener referencias a elementos del DOM del modal
        const overlay = document.getElementById('modal-overlay');
        const titleEl = document.getElementById('modal-title');
        const messageEl = document.getElementById('modal-message');
        const acceptBtn = document.getElementById('modal-accept');
        const cancelBtn = document.getElementById('modal-cancel');

        // Establecer el título y mensaje personalizados
        titleEl.textContent = title;
        messageEl.textContent = message;

        // Mostrar el modal
        overlay.style.display = 'flex';

        // Función que se ejecuta cuando el usuario hace clic en Aceptar
        const handleAccept = () => {
            cleanup();
            resolve(true);
        };

        // Función que se ejecuta cuando el usuario hace clic en Cancelar
        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        // Función para limpiar los event listeners y ocultar el modal
        const cleanup = () => {
            overlay.style.display = 'none';
            acceptBtn.removeEventListener('click', handleAccept);
            cancelBtn.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleKeydown);
        };

        // Permitir cerrar el modal con teclas (Escape para cancelar, Enter para aceptar)
        const handleKeydown = (e) => {
            if (e.key === 'Escape') handleCancel();
            if (e.key === 'Enter') handleAccept();
        };

        // Agregar los event listeners
        acceptBtn.addEventListener('click', handleAccept);
        cancelBtn.addEventListener('click', handleCancel);
        document.addEventListener('keydown', handleKeydown);
    });
}

// Mostrar modal de alerta personalizado
// Parámetros: title (título del modal), message (mensaje a mostrar)
// Retorna: Promise que resuelve cuando el usuario cierra la alerta
function showAlertModal(title, message) {
    return new Promise((resolve) => {
        // Obtener referencias a elementos del DOM del modal de alerta
        const overlay = document.getElementById('alert-overlay');
        const titleEl = document.getElementById('alert-title');
        const messageEl = document.getElementById('alert-message');
        const acceptBtn = document.getElementById('alert-accept');

        // Establecer el título y mensaje personalizados
        titleEl.textContent = title;
        messageEl.textContent = message;

        // Mostrar el modal
        overlay.style.display = 'flex';

        // Función que se ejecuta cuando el usuario hace clic en OK
        const handleAccept = () => {
            cleanup();
            resolve();
        };

        // Función para limpiar los event listeners y ocultar el modal
        const cleanup = () => {
            overlay.style.display = 'none';
            acceptBtn.removeEventListener('click', handleAccept);
            document.removeEventListener('keydown', handleKeydown);
        };

        // Permitir cerrar la alerta con Escape o Enter
        const handleKeydown = (e) => {
            if (e.key === 'Escape' || e.key === 'Enter') handleAccept();
        };

        // Agregar los event listeners
        acceptBtn.addEventListener('click', handleAccept);
        document.addEventListener('keydown', handleKeydown);
    });
}

/* ── FUNCIONES DE RENDERIZADO ── */

function updateClock() {
    const now = new Date();
    const h12 = now.getHours() % 12 || 12;
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'pm' : 'am';
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = `${String(h12).padStart(2, '0')}:${m}:${s} ${ampm}`;
}

function buildZoneTable(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = zones.map(z => `
        <tr>
            <td class="zone-name">${z.name}</td>
            <td>${z.sector}</td>
            <td><span class="psi-value ${z.psiClass}">${z.psi} PSI</span></td>
            <td><span class="flow-badge"><span class="dot ${z.flowDot}"></span>${z.flow}</span></td>
            <td><span class="status-badge ${z.statusClass}">${z.status}</span></td>
            <td class="upd-time">${z.upd}</td>
        </tr>
    `).join('');
}

function buildBars() {
    const wrapper = document.getElementById('bars-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = barData.map(b => `
        <div class="bar-item">
            <div class="bar-val" style="color:${b.color}">${b.val}</div>
            <div class="bar-track">
                <div class="bar-fill" data-pct="${b.pct}" style="height:0; background:linear-gradient(180deg,${b.color},${b.color}88)"></div>
            </div>
            <div class="bar-label">${b.label}</div>
        </div>
    `).join('');
}

function animateBars() {
    document.querySelectorAll('.bar-fill').forEach(el => {
        el.style.height = el.dataset.pct + '%';
    });
}

/* ── LLAMADAS AL SERVIDOR (API) ── */

// Cargar información del usuario y mostrar en el perfil del topbar
async function loadUserInfo() {
    try {
        const res = await fetch('/api/user-info');
        if (!res.ok) return;
        const user = await res.json();
        
        // Actualizar el nombre en el botón del perfil
        const profileName = document.getElementById('profile-name');
        if (profileName) profileName.textContent = user.Usuario;
        
        // Actualizar el nombre en el dropdown del perfil
        const dropdownName = document.getElementById('dropdown-name');
        if (dropdownName) dropdownName.textContent = user.Usuario;
        
        // Actualizar el rol en el dropdown
        const dropdownRole = document.getElementById('dropdown-role');
        if (dropdownRole) dropdownRole.textContent = user.rol;
        
        // Si el usuario es admin, mostrar la sección de administración
        if (user.rol === 'admin') {
            const adminSec = document.getElementById('admin-section');
            if (adminSec) adminSec.style.display = 'block';
        }
    } catch (err) { console.error("Error usuario:", err); }
}

// Manejar el dropdown del perfil
// Esta función configura los event listeners para abrir/cerrar el dropdown de perfil
function setupProfileDropdown() {
    const profileBtn = document.getElementById('profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    if (!profileBtn || !profileDropdown) return;
    
    // Al hacer click en el botón, toggle el dropdown (abre/cierra)
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileBtn.classList.toggle('active');
        profileDropdown.classList.toggle('active');
    });
    
    // Cerrar el dropdown al hacer click en alguna opción
    profileDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            profileBtn.classList.remove('active');
            profileDropdown.classList.remove('active');
        });
    });
    
    // Cerrar el dropdown cuando se hace click fuera de él
    document.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileBtn.classList.remove('active');
            profileDropdown.classList.remove('active');
        }
    });
}

async function buildReportesTable(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    try {
        const res = await fetch('/api/lista-reportes');
        const reportes = await res.json();
        if (reportes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No hay reportes</td></tr>';
            return;
        }
        tbody.innerHTML = reportes.map(r => `
            <tr>
                <td>${r.Usuario}</td>
                <td>${r.Zona}</td>
                <td>${r.Cometario}</td>
                <td><span class="status-badge status-active">Recibido</span></td>
            </tr>
        `).join('');
    } catch (err) { console.error("Error reportes:", err); }
}

/* ── CRUD DE USUARIOS ── */

let editingUserId = null;

// Cargar y mostrar usuarios en la tabla
async function loadUsuarios() {
    const tbody = document.getElementById('usuarios-tbody');
    if (!tbody) return;

    try {
        const res = await fetch('/api/usuarios');
        console.log('📡 Respuesta de /api/usuarios:', res.status);
        
        if (!res.ok) {
            const error = await res.text();
            console.error('❌ Error:', error);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No tienes permiso para ver usuarios (Status: ' + res.status + ')</td></tr>';
            return;
        }

        const usuarios = await res.json();
        console.log('✅ Usuarios cargados:', usuarios);
        
        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No hay usuarios registrados</td></tr>';
            return;
        }

        tbody.innerHTML = usuarios.map(u => `
            <tr>
                <td class="zone-name">${u.Usuario}</td>
                <td>${u.Correo}</td>
                <td><span class="status-badge ${u.rol === 'admin' ? 'status-active' : 'status-warning'}">${u.rol === 'admin' ? '👑 Admin' : 'Usuario'}</span></td>
                <td><span class="status-badge status-active">Activo</span></td>
                <td style="display: flex; gap: 8px;">
                    <button onclick="editarUsuario(${u.ID}, '${u.Usuario}', '${u.Correo}', '${u.rol}')" 
                        style="padding: 5px 10px; background: var(--blue-primary); color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">✏️ Editar</button>
                    <button onclick="eliminarUsuario(${u.ID})" 
                        style="padding: 5px 10px; background: var(--red); color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">🗑️ Eliminar</button>
                </td>
            </tr>
        `).join('');
    } catch (err) { 
        console.error("Error cargando usuarios:", err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">Error al cargar usuarios</td></tr>';
    }
}

// Agregar o actualizar usuario
// Esta función maneja tanto la creación de nuevos usuarios como la actualización de existentes
// Si editingUserId es null, se crea un usuario nuevo; de lo contrario, se actualiza el existente
async function agregarOActualizarUsuario(e) {
    e.preventDefault();

    // Obtener valores del formulario y remover espacios en blanco
    const nombre = document.getElementById('user-nombre').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const password = document.getElementById('user-password').value.trim();
    const rol = document.getElementById('user-rol').value;

    // Validar que los campos requeridos estén completos
    // Para crear usuario: nombre, email y contraseña son obligatorios
    // Para editar: nombre, email y rol son obligatorios (contraseña es opcional)
    if (!nombre || !email || (editingUserId === null && !password)) {
        await showAlertModal('⚠️ Campos Requeridos', 'Por favor completa todos los campos requeridos');
        return;
    }

    // Preparar datos a enviar al servidor
    const userData = { Usuario: nombre, Correo: email, rol };
    if (password) userData.Contra = password; // Solo agregar contraseña si se proporcionó

    try {
        let res;
        // Determinar si es crear (POST) o actualizar (PUT)
        if (editingUserId === null) {
            // POST: Crear nuevo usuario
            res = await fetch('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
        } else {
            // PUT: Actualizar usuario existente
            res = await fetch(`/api/usuarios/${editingUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
        }

        // Verificar si la respuesta fue exitosa
        if (!res.ok) {
            const error = await res.json();
            await showAlertModal('❌ Error', error.error || 'Error desconocido');
            return;
        }

        // Mostrar mensaje de éxito personalizado según la acción realizada
        const action = editingUserId === null ? 'creado' : 'actualizado';
        await showAlertModal('✅ Éxito', `Usuario ${action} exitosamente`);
        
        // Limpiar el formulario y restaurar a estado inicial de crear
        document.getElementById('user-form').reset();
        editingUserId = null;
        document.getElementById('submit-user-btn').textContent = 'Agregar Usuario';
        document.getElementById('cancel-edit-btn').style.display = 'none';
        
        // Recargar la tabla de usuarios para mostrar los cambios
        loadUsuarios();
    } catch (err) {
        console.error('Error:', err);
        await showAlertModal('❌ Error', 'Error al procesar la solicitud');
    }
}

// Editar usuario (pre-llenar formulario)
function editarUsuario(id, nombre, email, rol) {
    editingUserId = id;
    document.getElementById('user-nombre').value = nombre;
    document.getElementById('user-email').value = email;
    document.getElementById('user-password').value = '';
    document.getElementById('user-rol').value = rol;
    
    document.getElementById('submit-user-btn').textContent = '💾 Guardar Cambios';
    document.getElementById('cancel-edit-btn').style.display = 'inline-block';
    
    // Scroll al formulario
    document.getElementById('user-form').scrollIntoView({ behavior: 'smooth' });
}

// Cancelar edición
function cancelarEdicion() {
    editingUserId = null;
    document.getElementById('user-form').reset();
    document.getElementById('submit-user-btn').textContent = 'Agregar Usuario';
    document.getElementById('cancel-edit-btn').style.display = 'none';
}

// Eliminar usuario
// Parámetro: id (ID del usuario a eliminar)
// Primero muestra un modal de confirmación personalizado antes de hacer la eliminación
async function eliminarUsuario(id) {
    // Mostrar modal de confirmación y esperar respuesta del usuario
    // Si el usuario hace clic en Aceptar, confirmed será true; si en Cancelar, será false
    const confirmed = await showConfirmModal(
        '⚠️ Eliminar Usuario',
        '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.'
    );
    
    // Si el usuario no confirma, salir de la función sin hacer nada
    if (!confirmed) return;

    try {
        // Enviar solicitud DELETE al servidor para eliminar el usuario
        const res = await fetch(`/api/usuarios/${id}`, {
            method: 'DELETE'
        });

        // Si la solicitud fue exitosa, mostrar mensaje de éxito
        if (!res.ok) {
            const error = await res.json();
            await showAlertModal('❌ Error', error.error || 'Error desconocido');
            return;
        }

        // Mostrar alerta de éxito
        await showAlertModal('✅ Éxito', 'Usuario eliminado exitosamente');
        // Recargar tabla para reflejar la eliminación
        loadUsuarios();
    } catch (err) {
        console.error('Error:', err);
        await showAlertModal('❌ Error', 'Error al eliminar usuario');
    }
}

function navigate(page, element) {
    document.querySelectorAll('.page').forEach(section => {
        section.classList.toggle('active', section.id === `page-${page}`);
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    const titles = {
        dashboard: 'Dashboard',
        mapa: 'Mapa de Zonas',
        sensores: 'Sensores IoT',
        reportes: 'Reportes Ciudadanos',
        alertas: 'Alertas',
        usuarios: 'Usuarios',
        configuracion: 'Configuración'
    };

    const subtitles = {
        dashboard: 'Resumen general del sistema',
        mapa: 'Vista y estado de las zonas',
        sensores: 'Estado de los dispositivos IoT',
        reportes: 'Reporte de incidencias y solicitudes',
        alertas: 'Alertas activas y notificaciones',
        usuarios: 'Gestión de usuarios del sistema',
        configuracion: 'Ajustes y parámetros del sistema'
    };

    const titleEl = document.getElementById('page-title');
    const subtitleEl = document.getElementById('page-subtitle');
    if (titleEl) titleEl.textContent = titles[page] || 'Dashboard';
    if (subtitleEl) subtitleEl.textContent = subtitles[page] || 'Resumen general del sistema';
}

function initConfigControls() {
    const slider = document.getElementById('interval-slider');
    const intervalValue = document.getElementById('update-interval-value');

    if (slider && intervalValue) {
        intervalValue.textContent = `${slider.value}s`;
        slider.addEventListener('input', () => {
            intervalValue.textContent = `${slider.value}s`;
        });
    }
}

/* ── INICIO ── */
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);
    loadUserInfo();
    setupProfileDropdown(); // Configurar el dropdown del perfil
    buildZoneTable('zone-tbody');
    buildBars();
    buildReportesTable('reportes-tbody');
    loadUsuarios();
    initConfigControls();
    setTimeout(animateBars, 500);

    // Event listeners para formulario de usuarios
    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', agregarOActualizarUsuario);
    }

    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelarEdicion);
    }
});