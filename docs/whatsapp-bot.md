# WhatsApp Bot (Seedor-API)

> Cómo correr, depurar y regenerar la sesión de whatsapp-web.js dentro de Seedor-API.

## Variables de entorno relevantes

- `WHATSAPP_CLIENT_ID` (opcional): identificador lógico para LocalAuth. Default: `seedor-bot`.
- `WHATSAPP_SESSION_PATH` o `WHATSAPP_DATA_PATH`: ruta de carpeta donde se persiste la sesión (tokens). Default: `whatsapp-sessions/` en el repo. Usa un volumen en Docker para no perder la sesión.
- `WHATSAPP_ADMIN_PHONES`: lista de teléfonos (coma separada, con o sin `+`) autorizados como admins.

## Scripts

- `npm run start:dev:whatsapp`: arranca el bot standalone con ts-node en modo desarrollo (usa `tsconfig.whatsapp.json`).
- `npm run start:whatsapp` o `npm run start:whatsapp-only`: alias para levantar solo el bot (sin Nest completo).
- Cuando el bot está integrado al Nest app, se inicializa via `WhatsappModule` automáticamente.

## Pasos para levantar en local

1. Instala dependencias (`npm install` o `pnpm install`).
2. Asegura las variables anteriores (la carpeta de sesión debe ser escribible).
3. Ejecuta `npm run start:dev:whatsapp`.
4. En consola verás un QR. Escanéalo desde WhatsApp móvil (la sesión queda persistida en `WHATSAPP_SESSION_PATH`).
5. Si la sesión existe, verás logs de “Sesión de WhatsApp autenticada (recuperada desde disco)” y “WhatsApp listo”.

## Regenerar la sesión

1. Borra la carpeta configurada en `WHATSAPP_SESSION_PATH` (o cámbiala a una nueva).
2. Vuelve a ejecutar el script y escanea el QR.
3. En producción, haz backup de esa carpeta o móntala en un volumen persistente.

## Eventos y reconexión

- El servicio escucha `qr`, `ready`, `authenticated`, `disconnected`, `auth_failure`.
- Hay un backoff simple (5s * intento, máx 30s). Los intentos se loguean y se reintenta automáticamente.
- Si la sesión se invalida, se vuelve a pedir QR y se registra el motivo.

## Seguridad y permisos

- Solo los teléfonos en `WHATSAPP_ADMIN_PHONES` pueden usar comandos de admin (`/tarea`, etc.).
- Mensajes entrantes registran metadatos (phone, rol) en logs; no se guardan contenidos sensibles.

## Límites/consideraciones de whatsapp-web.js

- Es necesario un dispositivo móvil vinculado; cambios de SIM o app pueden invalidar la sesión.
- WhatsApp puede rate-limitar; evita spam. Los reintentos están acotados.
- No almacenar ni loguear contenido sensible; añadir métricas/alertas en fases futuras (ganchos comentados en el código).
