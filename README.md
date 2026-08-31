# AquaFlow SV

Sistema de monitoreo de redes de agua potable para el Gran San Salvador, El Salvador. Permite a operadores y administradores visualizar presión y flujo por zona, reportar incidencias, gestionar alertas automáticas y leer datos en vivo de un sensor de caudal físico (Arduino).

## Arquitectura

El proyecto tiene tres partes independientes que corren por separado:

| Parte | Tecnología | Carpeta |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite 6 + Tailwind 4 | `src/` |
| Backend | Express 5 + MySQL (mysql2) + sesiones | `app.js`, `db.js`, `eventos.js` |
| Firmware | Arduino Mega 2560 (PlatformIO) | `firmware/` |

El frontend nunca habla directo con MySQL: llama al backend (`/api/...`, `/auth/...`), y Vite proxea esas rutas a `http://localhost:3000` en desarrollo (ver `vite.config.ts`).

El backend, a su vez, se conecta por puerto serie a un Arduino (`sensores-arduino.js`) que mide un sensor de flujo piloto; esa lectura se expone a la app vía Server-Sent Events (`eventos.js`).

## Requisitos previos

- **Node.js** 18+ y **pnpm** (el repo trae `pnpm-lock.yaml`; también sirve npm/yarn si prefieres).
- **MySQL** corriendo en `localhost:3306`, usuario `root` sin contraseña (configuración por defecto de WAMP — ver `db.js`). Ajusta `db.js` si tu entorno es distinto.
- Base de datos `aquaflow_sv` importada desde [aquaflow_sv.sql](aquaflow_sv.sql).
- (Opcional) **PlatformIO** si vas a compilar/subir el firmware del Arduino Mega 2560.
- (Opcional) Un Arduino con el sensor de flujo conectado por USB — si no está presente, el backend sigue funcionando: la tarjeta "Sensor de Flujo" en `/sensores` simplemente se muestra como "Desconectado" y reintenta la conexión solo cada 5 s.

## Configuración

Crea un archivo `.env` en la raíz (no se versiona) con estas variables:

```env
# Clave de la API de Groq (chat "AquaBot")
GROQ_API_KEY=

# Google OAuth — Client ID público, usado por el frontend (prefijo VITE_ obligatorio)
VITE_GOOGLE_CLIENT_ID=

# Correo SMTP (Gmail) para enviar el código de verificación de cuentas admin
# SMTP_PASS debe ser una "contraseña de aplicación" de 16 dígitos de Gmail, no tu contraseña normal
SMTP_USER=
SMTP_PASS=
```

Si `SMTP_USER`/`SMTP_PASS` faltan, el servidor arranca igual pero avisa por consola que no se enviarán correos de verificación (login normal y registro de usuarios `user` no se ven afectados; solo el flujo de verificación de cuentas `admin`).

## Puesta en marcha

1. Instala dependencias:
   ```bash
   pnpm install
   ```
2. Importa el esquema en MySQL (por ejemplo con phpMyAdmin de WAMP, o):
   ```bash
   mysql -u root aquaflow_sv < aquaflow_sv.sql
   ```
   El backend también crea/actualiza automáticamente algunas tablas y columnas al arrancar (ver "Migraciones" abajo), así que no hace falta que el `.sql` esté 100% al día.
3. Arranca el backend (puerto **3000**):
   ```bash
   node app.js
   ```
4. En otra terminal, arranca el frontend (puerto **5173**):
   ```bash
   pnpm dev
   ```
5. Abre `http://localhost:5173`. Las peticiones a `/api` y `/auth` se proxean automáticamente al backend.

> No hay un script `npm start`/`npm run server` en `package.json` todavía: el backend se levanta corriendo `node app.js` directamente.

## Scripts disponibles

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Levanta el frontend (Vite) en `http://localhost:5173` |
| `pnpm build` | Compila TypeScript y genera el build de producción del frontend |
| `pnpm preview` | Sirve el build de producción localmente |
| `pnpm lint` | Corre ESLint sobre el proyecto |
| `node app.js` | Levanta el backend (Express) en `http://localhost:3000` |

## Cuentas y roles

Hay dos roles: `user` (técnico) y `admin`. El registro público (`/auth/register`) crea cuentas `user` por defecto; solo un correo dentro de la lista fija `ADMIN_EMAILS` (ver `app.js`) puede autoregistrarse como `admin`, y esa cuenta queda **sin verificar** hasta confirmar un código enviado por correo (protección para que nadie reclame un rol de admin solo por escribir ese correo en el formulario). Un admin también puede crear/editar usuarios y roles manualmente desde `/usuarios`.

El login con Google sigue la misma regla: si el correo de Google está en `ADMIN_EMAILS`, la cuenta se crea como `admin` (también pendiente de verificación por correo).

## Datos en vivo vs. datos de ejemplo

- **`/sensores`** → la tarjeta "Sensor de Flujo (Arduino piloto)" muestra datos reales del Arduino conectado por USB, vía streaming (SSE). El resto de tarjetas en esa página ("Red simulada") son datos de ejemplo fijos, para previsualizar cómo se vería una red de sensores más grande.
- **`/dashboard`** → los contadores de reportes/alertas se leen de la base de datos real; la gráfica de presión por hora usa una serie de datos fija de ejemplo (no proviene de sensores reales todavía).
- **Reportes, Alertas, Usuarios, Comentarios** → 100% datos reales de MySQL.

## Alertas automáticas

Cuando una misma zona acumula **5 o más reportes activos** del mismo `tipo`, el backend genera (o actualiza) automáticamente una alerta en `/alertas` — ver `verificarUmbralAlerta()` en `app.js`. La severidad escala con el número de reportes (`media` → `alta` a partir de 7 → `crítica` a partir de 10). Un admin puede suspender, reactivar, resolver o eliminar cada alerta manualmente.

## Firmware (Arduino)

`firmware/src/main.cpp` corre en un Arduino Mega 2560 con un sensor de flujo por interrupción, un relé con pulsador y una pantalla LCD I2C 20x4. Envía lecturas por el puerto serie como una línea `DATA:{"caudal":...,"estado":"...","rele":true|false}`, que `sensores-arduino.js` detecta automáticamente por el VID del fabricante (`2341`) sin necesidad de configurar el puerto COM a mano.

Para compilar y subir el firmware:
```bash
cd firmware
pio run --target upload
```

## Estructura del proyecto

```
├── app.js                  # Backend Express: auth, CRUD, chat IA, configuración
├── db.js                   # Pool de conexión MySQL
├── eventos.js               # Hub de Server-Sent Events (canales "reportes"/"alertas")
├── sensores-arduino.js      # Puente serie con el Arduino (autodetección + reconexión)
├── aquaflow_sv.sql          # Esquema y datos iniciales de la base de datos
├── firmware/                # Proyecto PlatformIO del Arduino Mega 2560
│   └── src/main.cpp
└── src/
    ├── Pages/                # Dashboard, Sensores, Mapa, Reportes, Alertas, Usuarios, Configuración...
    ├── components/           # Sidebar, Topbar, ChatBot, AccessibilityPanel...
    ├── context/              # Auth, Config, Language, Accessibility
    └── api/axiosConfig.ts    # Cliente Axios compartido (withCredentials + manejo de 401)
```

## Notas para quien retome el proyecto

- La conexión a MySQL en `db.js` está hardcodeada para desarrollo local con WAMP (`root` sin contraseña). Antes de desplegar a producción hay que moverla a variables de entorno.
- Existen contraseñas sin cifrar en `aquaflow_sv.sql` (cuentas de prueba históricas); el backend las acepta por compatibilidad (`isBcryptHash()` en `app.js`), pero no deberían usarse como referencia de buenas prácticas.
- El `secret` de la sesión (`express-session`) está hardcodeado en `app.js` — mover a `.env` antes de producción.
