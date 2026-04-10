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

async function loadUserInfo() {
    try {
        const res = await fetch('/api/user-info');
        if (!res.ok) return;
        const user = await res.json();
        const display = document.getElementById('user-display');
        if (display) display.textContent = `👤 ${user.Usuario} (${user.rol})`;
        
        if (user.rol === 'admin') {
            const adminSec = document.getElementById('admin-section');
            if (adminSec) adminSec.style.display = 'block';
        }
    } catch (err) { console.error("Error usuario:", err); }
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

/* ── INICIO ── */
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);
    loadUserInfo();
    buildZoneTable('zone-tbody');
    buildBars();
    buildReportesTable('reportes-tbody');
    setTimeout(animateBars, 500);
});