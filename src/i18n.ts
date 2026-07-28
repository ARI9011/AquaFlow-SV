

export type Lang = 'es' | 'en';

export const translations: Record<Lang, Record<string, string>> = {
  es: {
    // Menú lateral (Sidebar)
    'nav.inicio': 'Inicio',
    'nav.dashboard': 'Dashboard',
    'nav.mapa': 'Mapa de zonas',
    'nav.sensores': 'Sensores IoT',
    'nav.reportes': 'Reportes',
    'nav.alertas': 'Alertas',
    'nav.configuracion': 'Configuración',
    'nav.usuarios': 'Usuarios',
    'nav.principal': 'Principal',
    'nav.administracion': 'Administración',

    // Títulos de página (Topbar)
    'page.inicio.title': 'Inicio',                 'page.inicio.sub': 'Bienvenido a AquaFlow SV',
    'page.dashboard.title': 'Dashboard',           'page.dashboard.sub': 'Resumen general del sistema',
    'page.mapa.title': 'Mapa de Zonas',            'page.mapa.sub': 'Gran San Salvador',
    'page.sensores.title': 'Sensores IoT',         'page.sensores.sub': 'Dispositivos de medición',
    'page.usuarios.title': 'Gestión de Usuarios',  'page.usuarios.sub': 'Control de acceso',
    'page.reportes.title': 'Reportes Ciudadanos',  'page.reportes.sub': 'Incidencias reportadas',
    'page.alertas.title': 'Alertas del Sistema',   'page.alertas.sub': '3 alertas activas',
    'page.config.title': 'Configuración',          'page.config.sub': 'Preferencias del sistema',
    'page.default.title': 'AquaFlow SV',           'page.default.sub': 'Monitoreo Hídrico',

    // Comunes
    'common.logout': 'Cerrar sesión',
  },
  en: {
    'nav.inicio': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.mapa': 'Zone Map',
    'nav.sensores': 'IoT Sensors',
    'nav.reportes': 'Reports',
    'nav.alertas': 'Alerts',
    'nav.configuracion': 'Settings',
    'nav.usuarios': 'Users',
    'nav.principal': 'Main',
    'nav.administracion': 'Administration',

    'page.inicio.title': 'Home',                 'page.inicio.sub': 'Welcome to AquaFlow SV',
    'page.dashboard.title': 'Dashboard',         'page.dashboard.sub': 'System overview',
    'page.mapa.title': 'Zone Map',               'page.mapa.sub': 'Greater San Salvador',
    'page.sensores.title': 'IoT Sensors',        'page.sensores.sub': 'Measurement devices',
    'page.usuarios.title': 'User Management',     'page.usuarios.sub': 'Access control',
    'page.reportes.title': 'Citizen Reports',    'page.reportes.sub': 'Reported incidents',
    'page.alertas.title': 'System Alerts',       'page.alertas.sub': '3 active alerts',
    'page.config.title': 'Settings',             'page.config.sub': 'System preferences',
    'page.default.title': 'AquaFlow SV',         'page.default.sub': 'Water Monitoring',

    'common.logout': 'Log out',
  },
};
