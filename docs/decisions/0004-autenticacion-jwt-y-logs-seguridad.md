# Decision: Autenticación JWT, Roles y Logs de Seguridad

## Status
Aceptado (reemplaza a [0001-sin-autenticacion](./0001-sin-autenticacion.md))

## Contexto
El proyecto requería cumplir un conjunto de prácticas académicas de "Seguridad de Aplicaciones Web: Creación y Gestión de Logs" (registro de eventos de autenticación, intentos fallidos, protección de datos sensibles en logs, auditoría de cambios, control de accesos por rol, persistencia de logs en base de datos y niveles de severidad). Varias de esas prácticas exigen un sistema de autenticación real, algo que la decisión 0001 excluía deliberadamente al asumir un visor de solo lectura protegido por seguridad de red (VPN/firewall).

## Decisión
Se implementó autenticación real sobre el visor de nómina:

- **JWT en cookie httpOnly** como mecanismo de sesión (sin estado en servidor). El JWT incluye `sub`, `email` y `rol`, firmado con `JWT_SECRET` (ver `backend/src/config/env.js`).
- **Dos roles**: `admin` y `usuario`. Toda petición sin cookie válida es tratada como "invitado" (no autenticado) y queda registrada como intento de acceso no autorizado — cubre ese caso sin necesitar un tercer rol dedicado.
- **Rutas protegidas**: `/api/empleados`, `/api/nomina` y `/api/reportes` exigen sesión iniciada (cualquier rol), ya que estos endpoints alimentan el dashboard principal para todos los usuarios. `/api/admin/*` exige además rol `admin`.
- **Tabla `logs_seguridad`** (migración `1755000000000_create-auth-and-logs-tables.js`) centraliza login exitoso/fallido, logout, accesos no autorizados o denegados por rol, y auditoría de cambios de perfil (`campo`, `valor_anterior`, `valor_nuevo`), cada uno con un nivel de severidad (`INFO`/`WARNING`/`ERROR`/`DEBUG`) — ver `backend/src/utils/securityLogger.js`.
- **Contraseñas e intentos fallidos**: hash con bcrypt; tras 5 intentos fallidos en 15 minutos (contador en Redis, reutilizando la infraestructura de [0003](./0003-redis-como-cache-de-reportes.md)) la cuenta queda bloqueada temporalmente.
- **Nunca se registran credenciales**: `pino-http` redacta cookies/autorización/contraseñas, y `securityLogger` limpia explícitamente campos sensibles (`password`, `token`, `cookie`) de cualquier detalle antes de persistirlo o loguearlo.

## Consecuencias
- **Reemplaza a la 0001**: el visor ya no depende únicamente de la seguridad perimetral; ahora exige login incluso dentro de la red donde se despliegue.
- **Alcance de curso, no de producción crítica**: no se implementó MFA, rotación de secretos, ni políticas de expiración/renovación de contraseñas. Si el sistema llegara a exponerse a internet abierto, seguirá siendo necesario reforzarlo (HTTPS obligatorio, rotación de `JWT_SECRET`, límites de sesión más estrictos, etc.).
- **Impacto en pruebas**: los tests existentes de `empleados`, `nomina`, `reportes` y `middleware` ahora mockean el middleware de autenticación (no es su objeto de prueba); la cobertura de autenticación/roles vive en `backend/src/__tests__/auth.test.js` y en los casos añadidos a `admin.test.js`.
