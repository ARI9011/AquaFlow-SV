/* ══════════════════════════════════════════════
   AQUAFLOW SV — script.js
   ══════════════════════════════════════════════ */

// Nota: Autenticación manejada por PHP + sesiones
// Los roles ya están controlados en PHP en index.php

/* ── CLOCK ── */
function updateClock() {
  const now  = new Date();
  const m    = String(now.getMinutes()).padStart(2, '0');
  const s    = String(now.getSeconds()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'pm' : 'am';
  const h12  = now.getHours() % 12 || 12;
  document.getElementById('clock').textContent =
    `${String(h12).padStart(2, '0')}:${m}:${s} ${ampm}`;
}
updateClock();
setInterval(updateClock, 1000);

/* ── PAGE NAVIGATION ── */
const pageMeta = {
  dashboard : { title: 'Dashboard',             subtitle: 'Resumen general del sistema' },
  mapa      : { title: 'Mapas en zonas',         subtitle: 'Gestión de zonas de distribución' },
  sensores  : { title: 'Sensores IoT',           subtitle: 'Monitoreo de dispositivos en campo' },
  reportes  : { title: 'Reportes ciudadanos',    subtitle: 'Gestión de reportes por la comunidad' },
  alertas   : { title: 'Alertas',                subtitle: 'Notificaciones del sistema' },
  usuarios  : { title: 'Usuarios',               subtitle: 'Gestión de usuarios' },
  analisis  : { title: 'Análisis',               subtitle: 'Estadísticas del sistema' },
  config    : { title: 'Configuración',          subtitle: 'Ajustes generales' },
};

function navigate(page, el) {
  /* update nav */
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');

  /* update pages */
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    /* re-trigger animations */
    target.querySelectorAll('.stat-card, .panel, .banner, .zone-card').forEach(el => {
      el.style.animation = 'none';
      el.offsetHeight; // reflow
      el.style.animation = '';
    });
  }

  /* update topbar */
  const meta = pageMeta[page] || {};
  document.getElementById('page-title').textContent    = meta.title    || '';
  document.getElementById('page-subtitle').textContent = meta.subtitle || '';

  /* re-animate bars if switching to dashboard */
  if (page === 'dashboard') {
    setTimeout(animateBars, 300);
  }
}

/* ── SHARED DATA ── */
const zones = [
  { name: 'Soyapango',      sector: 'Norte',   psi: 65, psiClass: 'psi-high',   flow: 'Normal', flowDot: 'dot-green', status: 'Activo',       statusClass: 'status-active',   upd: 'hace 21 minutos' },
  { name: 'Ciudad Delgado', sector: 'Sur',     psi:  5, psiClass: 'psi-low',    flow: 'Bajo',   flowDot: 'dot-red',   status: 'Sin servicio', statusClass: 'status-inactive', upd: 'hace 3 minutos'  },
  { name: 'Apopa',          sector: 'Sureste', psi: 25, psiClass: 'psi-medium', flow: 'Medio',  flowDot: 'dot-amber', status: 'Intermedio',   statusClass: 'status-warning',  upd: 'hace 40 minutos' },
  { name: 'Ciudad Futura',  sector: 'Norte',   psi: 67, psiClass: 'psi-high',   flow: 'Normal', flowDot: 'dot-green', status: 'Activo',       statusClass: 'status-active',   upd: 'hace 25 minutos' },
];

/* ── DASHBOARD: ZONE TABLE ── */
function buildZoneTable(tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = '';
  zones.forEach(z => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="zone-name">${z.name}</td>
      <td>${z.sector}</td>
      <td><span class="psi-value ${z.psiClass}">${z.psi} PSI</span></td>
      <td><span class="flow-badge"><span class="dot ${z.flowDot}"></span>${z.flow}</span></td>
      <td><span class="status-badge ${z.statusClass}">${z.status}</span></td>
      <td class="upd-time">${z.upd}</td>
    `;
    tbody.appendChild(tr);
  });
}
buildZoneTable('zone-tbody');
buildZoneTable('reportes-tbody');

/* ── DASHBOARD: BAR CHART ── */
const barData = [
  { label: 'Soyapango',      pct: 80, color: 'var(--green)', val: '65 PSI' },
  { label: 'Apopa',          pct: 38, color: 'var(--amber)', val: '25 PSI' },
  { label: 'Ciudad Delgado', pct:  8, color: 'var(--red)',   val: '5 PSI'  },
];

function buildBars() {
  const wrapper = document.getElementById('bars-wrapper');
  if (!wrapper) return;
  wrapper.innerHTML = '';
  barData.forEach(b => {
    const item = document.createElement('div');
    item.className = 'bar-item';
    item.innerHTML = `
      <div class="bar-val" style="color:${b.color}">${b.val}</div>
      <div class="bar-track">
        <div class="bar-fill" data-pct="${b.pct}"
             style="height:0;background:linear-gradient(180deg,${b.color},${b.color}88)"></div>
      </div>
      <div class="bar-label">${b.label}</div>
    `;
    wrapper.appendChild(item);
  });
}

function animateBars() {
  document.querySelectorAll('.bar-fill').forEach(el => {
    el.style.height = el.dataset.pct + '%';
  });
}

buildBars();
setTimeout(animateBars, 400);

/* ── DASHBOARD: ACTIVITY ── */
const activities = [
  { color: 'var(--red)',    title: 'Alerta de presión baja — Ciudad Delgado',        time: 'hace 3 minutos'  },
  { color: 'var(--green)',  title: 'Sensor S-04 reconectado — Soyapango Norte',      time: 'hace 15 minutos' },
  { color: 'var(--amber)',  title: 'Flujo intermedio detectado — Apopa Sureste',     time: 'hace 41 minutos' },
  { color: 'var(--cyan)',   title: 'Reporte ciudadano #0042 recibido',               time: 'hace 1 hora'     },
  { color: 'var(--green)',  title: 'Ciudad Futura — Presión estabilizada (67 PSI)',  time: 'hace 1.5 horas'  },
];

function buildActivity(bodyId, data) {
  const body = document.getElementById(bodyId);
  if (!body) return;
  body.innerHTML = '';
  data.forEach(a => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="activity-dot" style="background:${a.color};box-shadow:0 0 6px ${a.color}"></div>
      <div class="activity-text">
        <strong>${a.title}</strong>
        <span>${a.time}</span>
      </div>
    `;
    body.appendChild(item);
  });
}

buildActivity('activity-body', activities);

/* ── ALERTAS PAGE ── */
const alertsData = [
  { color: 'var(--red)',   title: 'Presión crítica — Ciudad Delgado (5 PSI)',         time: 'hace 3 minutos',  type: 'Crítica'  },
  { color: 'var(--amber)', title: 'Flujo intermedio persistente — Apopa Sureste',     time: 'hace 40 minutos', type: 'Advertencia' },
  { color: 'var(--red)',   title: 'Sensor SNS-002 con batería baja (15%)',            time: 'hace 1 hora',     type: 'Crítica'  },
];
buildActivity('alertas-body', alertsData);

/* ── MAPA DE ZONAS: ZONE CARDS ── */
const zonaCards = [
  {
    name: 'Los Santos 2', status: 'Activo', statusClass: 'status-active',
    sector: 'Norte', ciudad: 'Soyapango',
    psi: 65, psiClass: 'psi-high',
    horario: '5:00 AM – 3:45 PM', upd: 'Hace 15 minutos',
    desc: 'Zona residencial de alta demanda',
    razon: null,
  },
  {
    name: 'Santa Marta', status: 'Sin Servicio', statusClass: 'status-inactive',
    sector: 'Sur', ciudad: 'Ciudad Delgado',
    psi: 5, psiClass: 'psi-low',
    horario: '4:00 AM – 8:00 AM', upd: 'Hace 35 minutos',
    desc: null,
    razon: 'Falla en tubería principal',
  },
  {
    name: 'Urbanización Valle Verde', status: 'Intermedio', statusClass: 'status-warning',
    sector: 'Sureste', ciudad: 'Apopa',
    psi: 25, psiClass: 'psi-medium',
    horario: '3:00 AM – 7:45 PM', upd: 'Hace 15 minutos',
    desc: 'Zona residencial de alta demanda',
    razon: null,
  },
  {
    name: 'Colonia Ciudad Futura', status: 'Activo', statusClass: 'status-active',
    sector: 'Norte', ciudad: 'Apopa',
    psi: 67, psiClass: 'psi-high',
    horario: '4:00 AM – 8:00 AM', upd: 'Hace 35 minutos',
    desc: null,
    razon: null,
  },
];

function buildZoneCards() {
  const grid = document.getElementById('zone-cards');
  if (!grid) return;
  grid.innerHTML = '';
  zonaCards.forEach(z => {
    const card = document.createElement('div');
    card.className = 'zone-card';
    card.innerHTML = `
      <div class="zone-card-header">
        <div class="zone-card-title">
          <span class="zone-card-name">${z.name}</span>
          <span class="status-badge ${z.statusClass}">${z.status}</span>
        </div>
        <div class="zone-card-actions">
          <button class="btn-icon btn-chart" title="Ver gráfico">
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5v12h-2V2h2z"/></svg>
          </button>
          <button class="btn-icon btn-delete" title="Eliminar">
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1z"/></svg>
          </button>
        </div>
      </div>

      <div class="zone-card-location">
        <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12" style="color:var(--red);flex-shrink:0"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
        ${z.sector} – ${z.ciudad}
      </div>

      <div class="zone-card-psi-row">
        <span class="zone-card-psi-label">Presión</span>
        <span class="psi-value ${z.psiClass}">${z.psi} PSI</span>
      </div>

      <div class="zone-card-row">
        <div class="zone-card-meta">
          <span class="meta-label">Horario</span>
          <span class="meta-val">
            <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11" style="color:var(--red);margin-right:3px"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>
            ${z.horario}
          </span>
        </div>
        <div class="zone-card-meta">
          <span class="meta-label">Actualizado</span>
          <span class="meta-val">${z.upd}</span>
        </div>
      </div>

      <div class="zone-card-footer">
        ${z.desc   ? `<span class="zone-card-desc">${z.desc}</span>` : ''}
        ${z.razon  ? `<span class="zone-card-razon">Razón: ${z.razon}</span>` : ''}
        ${!z.desc && !z.razon ? '<span class="zone-card-razon">—</span>' : ''}
      </div>
    `;
    grid.appendChild(card);
  });
}
buildZoneCards();

/* ── SENSORES IOT ── */
const sensors = [
  { id: 'SNS-001', zona: 'Soyapango',      psi: 65, psiClass: 'psi-high',   status: 'Activo', statusClass: 'status-active', bat: 100, signal: 'Hace un momento' },
  { id: 'SNS-002', zona: 'Ciudad Delgado', psi:  5, psiClass: 'psi-low',    status: 'Activo', statusClass: 'status-active', bat: 15,  signal: 'Hace un momento' },
  { id: 'SNS-003', zona: 'Apopa',          psi: 25, psiClass: 'psi-medium', status: 'Activo', statusClass: 'status-active', bat: 55,  signal: 'Hace un momento' },
  { id: 'SNS-004', zona: 'Ciudad Futura',  psi: 67, psiClass: 'psi-high',   status: 'Activo', statusClass: 'status-active', bat: 75,  signal: 'Hace un momento' },
];

function getBatteryColor(pct) {
  if (pct >= 60) return 'var(--green)';
  if (pct >= 30) return 'var(--amber)';
  return 'var(--red)';
}

function buildSensorsTable() {
  const tbody = document.getElementById('sensors-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  sensors.forEach(s => {
    const batColor = getBatteryColor(s.bat);
    const batWidth = s.bat + '%';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="sensor-id">${s.id}</td>
      <td class="zone-name">${s.zona}</td>
      <td><span class="psi-value ${s.psiClass}">${s.psi} PSI</span></td>
      <td><span class="status-badge ${s.statusClass}">${s.status}</span></td>
      <td>
        <div class="bat-cell">
          <div class="bat-icon">
            <div class="bat-fill" style="width:${batWidth};background:${batColor}"></div>
          </div>
          <span class="bat-pct" style="color:${batColor}">${s.bat}%</span>
        </div>
      </td>
      <td class="upd-time">${s.signal}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon btn-chart" title="Ver datos">
            <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13"><path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5v12h-2V2h2z"/></svg>
          </button>
          <button class="btn-icon btn-delete" title="Eliminar">
            <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1z"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
buildSensorsTable();
