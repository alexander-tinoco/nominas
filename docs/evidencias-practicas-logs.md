# Evidencias — Prácticas: Seguridad de Aplicaciones Web (Creación y Gestión de Logs)

Este documento reúne la evidencia de la implementación de las 8 prácticas del documento `trabajo de logs.pdf` sobre el proyecto **nominas** (visor de nómina gubernamental). La decisión de arquitectura y el detalle técnico completo están en [`docs/decisions/0004-autenticacion-jwt-y-logs-seguridad.md`](./decisions/0004-autenticacion-jwt-y-logs-seguridad.md).

**Resumen de la implementación:**
- Autenticación con JWT en cookie httpOnly, 2 roles (`admin`, `usuario`).
- Una tabla `logs_seguridad` (BD) centraliza todos los eventos de seguridad, con severidad `INFO`/`WARNING`/`ERROR`/`DEBUG`.
- Todo lo mostrado abajo se ejecutó de verdad contra el stack levantado con `docker compose` (Postgres + Redis + backend + frontend), no son datos simulados salvo donde se indica explícitamente.
- Usuarios de prueba (solo entorno de desarrollo): `admin@nominas.local` / `Practica2026Admin!` (rol `admin`) y `usuario@nominas.local` / `Practica2026User!` (rol `usuario`), creados con `npm run seed:usuarios`.

**Capturas de pantalla de la aplicación funcionando:**

![Pantalla de login](./images/login-vacio.png)
*Pantalla de login (`LoginPage`), acceso restringido al visor.*

![Error de credenciales inválidas](./images/login-credenciales-invalidas.png)
*Intento de login fallido — mensaje "Credenciales inválidas" (Prácticas 1 y 2).*

![Dashboard como admin](./images/dashboard-admin.png)
*Sesión iniciada como `admin@nominas.local` — badge de usuario/rol y el ícono de escudo (bitácora de seguridad) visible sólo para este rol (Práctica 5).*

![Dashboard como usuario, sin panel de admin](./images/dashboard-usuario-sin-panel-admin.png)
*Sesión iniciada como `usuario@nominas.local` — mismo dashboard, pero el ícono de la bitácora de seguridad ya no aparece: el control de acceso por rol también se aplica en la interfaz, no sólo en la API (Práctica 5).*

---

## Práctica 1 — Registro básico de eventos de seguridad

**Objetivo:** registrar inicio de sesión exitoso, fallido, cierre de sesión y acceso a rutas restringidas.

**Implementación:** `backend/src/controllers/auth.js`, `backend/src/services/authService.js`, `backend/src/middleware/auth.js`, `backend/src/utils/securityLogger.js`.

Login exitoso — respuesta real (`POST /api/auth/login`):

```
HTTP/1.1 200 OK
Set-Cookie: token=<JWT-omitido-por-seguridad>; Max-Age=7200; Path=/; HttpOnly; SameSite=Lax
Content-Type: application/json; charset=utf-8

{"usuario":{"id":1,"email":"admin@nominas.local","rol":"admin","nombre":"Administrador Demo"}}
```

Log estructurado (Pino) generado por ese mismo login:

```json
{"level":30,"msg":"[Seguridad] login_exitoso","usuario":"admin@nominas.local","evento":"login_exitoso","nivel":"INFO","detalle":{"rol":"admin","ip":"::ffff:172.20.0.1"}}
{"level":30,"req":{"method":"POST","url":"/api/auth/login"},"res":{"statusCode":200},"responseTime":231,"msg":"request completed"}
```

Cierre de sesión (`POST /api/auth/logout`) — respuesta 200 y log real:

```json
{"level":30,"msg":"[Seguridad] logout","usuario":"usuario@nominas.local","evento":"logout","nivel":"INFO","detalle":{"ip":"::ffff:172.20.0.1"}}
```

Acceso a ruta restringida sin sesión (`GET /api/empleados` sin cookie) — 401 real y log real:

```
HTTP/1.1 401 Unauthorized
{"error":"No autenticado"}
```
```json
{"level":40,"msg":"[Seguridad] acceso_no_autorizado","usuario":"anonimo","evento":"acceso_no_autorizado","nivel":"WARNING","detalle":{"ruta":"/api/empleados","metodo":"GET","motivo":"Sin cookie de sesión","ip":"::ffff:172.20.0.1"}}
```

Estos 4 eventos (y todos los demás) quedan además persistidos en la tabla `logs_seguridad` (ver Práctica 6).

---

## Práctica 2 — Registro de intentos fallidos de autenticación

**Objetivo:** registrar fecha/hora, usuario, motivo del fallo y número de intentos.

**Implementación:** `authService.login` (`backend/src/services/authService.js`) cuenta los intentos fallidos en Redis (`incrementWithTTL`, ventana de 15 minutos) y bloquea tras el 5º intento.

Reporte real de intentos detectados (consulta SQL contra `logs_seguridad`, usuario `usuario@nominas.local` intentando con contraseña incorrecta 5 veces seguidas):

```sql
SELECT fecha_hora, usuario, evento, detalle->>'intentos' AS intentos, detalle->>'motivo' AS motivo
FROM logs_seguridad
WHERE evento IN ('login_fallido','cuenta_bloqueada_temporalmente')
ORDER BY fecha_hora;
```

```
          fecha_hora           |        usuario         |             evento             | intentos |            motivo
--------------------------------+-----------------------+---------------------------------+----------+------------------------------
 2026-08-13 16:37:34.524734+00 | usuario@nominas.local | login_fallido                   | 1        | Contraseña incorrecta
 2026-08-13 16:37:41.772580+00 | usuario@nominas.local | login_fallido                   | 2        | Contraseña incorrecta
 2026-08-13 16:37:41.947996+00 | usuario@nominas.local | login_fallido                   | 3        | Contraseña incorrecta
 2026-08-13 16:37:42.116084+00 | usuario@nominas.local | login_fallido                   | 4        | Contraseña incorrecta
 2026-08-13 16:37:42.278333+00 | usuario@nominas.local | cuenta_bloqueada_temporalmente | 5        | Demasiados intentos fallidos
```

Respuesta real del 6º intento, ya con la cuenta bloqueada:

```
HTTP/1.1 429 Too Many Requests
{"error":"Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intente de nuevo en unos minutos."}
```

---

## Práctica 3 — Protección de información sensible en los logs

**Objetivo:** comparar un log inseguro contra uno donde los datos sensibles están ocultos.

**Implementación:** dos capas independientes:

1. El request logger (`pino-http`, en `backend/src/middleware/logger.js`) **nunca serializa el cuerpo de la petición**: su `serializers.req` sólo extrae `method` y `url`. Adicionalmente se agregó `redact` para `req.headers.cookie`, `req.headers.authorization`, `req.body.password` y `res.headers["set-cookie"]` como defensa adicional si en el futuro algún handler loguea el objeto `req` completo.
2. `securityLogger.logSecurityEvent` (`backend/src/utils/securityLogger.js`) limpia explícitamente los campos `password`, `password_hash`, `token` y `cookie` de cualquier `detalle` antes de escribirlo a BD o a Pino (función `limpiarDetalle`).

**Log real capturado** al hacer login con `POST /api/auth/login` con body `{"email":"admin@nominas.local","password":"Practica2026Admin!"}` — el password nunca aparece:

```json
{"level":30,"req":{"method":"POST","url":"/api/auth/login"},"res":{"statusCode":200},"responseTime":231,"msg":"request completed"}
```

**Comparación (log inseguro vs. seguro):**

| | Log inseguro (cómo se vería si se registrara `req.body` sin control) | Log seguro (lo que realmente produce la app) |
|---|---|---|
| Login | `{"req":{"method":"POST","url":"/api/auth/login","body":{"email":"admin@nominas.local","password":"Practica2026Admin!"}}}` | `{"req":{"method":"POST","url":"/api/auth/login"},"res":{"statusCode":200}}` |
| Auditoría de perfil | `{"evento":"perfil_actualizado","detalle":{"campo":"password","valor_anterior":"hash-viejo","valor_nuevo":"hash-nuevo"}}` | `limpiarDetalle()` elimina cualquier clave `password`/`token`/`cookie` antes de persistir — nunca se registra un hash ni un JWT |
| Sesión | `Cookie: token=<JWT-omitido>` visible en el log de cada request | `redact: ['req.headers.cookie', ...]` → `"[REDACTADO]"` |

La columna "inseguro" es ilustrativa (muestra qué pasaría sin las protecciones); la columna "seguro" es la salida real del sistema.

---

## Práctica 4 — Auditoría de cambios

**Objetivo:** registrar usuario, fecha, campo modificado, valor anterior y valor nuevo.

**Implementación:** `PATCH /api/auth/profile` → `authService.updateProfile` (`backend/src/services/authService.js`).

Petición real: cambiar el nombre del usuario admin de "Administrador Demo" a "Administrador Principal":

```
PATCH /api/auth/profile
{"campo":"nombre","valor":"Administrador Principal"}

200 OK
{"usuario":{"id":1,"email":"admin@nominas.local","rol":"admin","nombre":"Administrador Principal", ...}}
```

Bitácora de auditoría (consulta SQL real contra `logs_seguridad`):

```sql
SELECT fecha_hora, usuario, detalle->>'campo' AS campo,
       detalle->>'valor_anterior' AS valor_anterior, detalle->>'valor_nuevo' AS valor_nuevo
FROM logs_seguridad WHERE evento = 'perfil_actualizado';
```

```
          fecha_hora           |       usuario        | campo  |   valor_anterior    |       valor_nuevo
--------------------------------+----------------------+--------+---------------------+-------------------------
 2026-08-13 16:37:51.937465+00 | admin@nominas.local  | nombre | Administrador Demo  | Administrador Principal
```

---

## Práctica 5 — Accesos no autorizados

**Objetivo:** implementar roles (administrador / usuario / invitado) y registrar intentos de acceso indebido.

**Implementación:** `backend/src/middleware/auth.js` (`requireAuth`, `requireRole`). Se usan 2 roles reales en la tabla `usuarios` (`admin`, `usuario`); el caso **"invitado"** se cubre de forma natural: cualquier petición sin cookie de sesión válida es tratada como no autenticada.

**Caso "invitado"** (sin sesión) contra ruta protegida — ya mostrado en la Práctica 1 (401 + evento `acceso_no_autorizado`).

**Caso "rol insuficiente"** — usuario con rol `usuario` intentando acceder a una ruta admin-only:

```
GET /api/admin/logs-seguridad   (con cookie de sesión de usuario@nominas.local, rol "usuario")
HTTP/1.1 403 Forbidden
```

```json
{"level":40,"msg":"[Seguridad] acceso_denegado_rol","usuario":"usuario@nominas.local","evento":"acceso_denegado_rol","nivel":"WARNING","detalle":{"ruta":"/api/admin/logs-seguridad","metodo":"GET","rol_actual":"usuario","roles_requeridos":["admin"],"ip":"::ffff:172.20.0.1"}}
```

**Caso "acceso permitido"** — el mismo usuario `usuario` sí puede usar las rutas normales del dashboard (no se le restringe todo, sólo lo administrativo):

```
GET /api/empleados?limit=1            -> 200
GET /api/reportes/por-unidad?qna=201806 -> 200
```

---

## Práctica 6 — Logs en base de datos

**Objetivo:** guardar los eventos en una tabla con id, fecha_hora, usuario, evento, nivel, detalle.

**Implementación:** migración `backend/migrations/1755000000000_create-auth-and-logs-tables.js`, tabla `logs_seguridad`:

```
Column     |           Type
-----------+--------------------------
id         | serial (PK)
fecha_hora | timestamptz, default now()
usuario    | varchar(150)
evento     | varchar(50)
nivel      | varchar(10)  CHECK IN ('INFO','WARNING','ERROR','DEBUG')
detalle    | jsonb
```

Consulta SQL real (13 eventos generados durante esta sesión de pruebas):

```sql
SELECT id, fecha_hora, usuario, evento, nivel FROM logs_seguridad ORDER BY fecha_hora DESC LIMIT 15;
```

```
 id |          fecha_hora           |        usuario        |             evento             |  nivel
----+--------------------------------+------------------------+---------------------------------+---------
 13 | 2026-08-13 16:38:08.859130+00 | usuario@nominas.local | logout                          | INFO
 12 | 2026-08-13 16:38:08.722244+00 | usuario@nominas.local | acceso_denegado_rol             | WARNING
 11 | 2026-08-13 16:38:08.691865+00 | usuario@nominas.local | login_exitoso                   | INFO
 10 | 2026-08-13 16:37:51.937465+00 | admin@nominas.local   | perfil_actualizado              | INFO
  9 | 2026-08-13 16:37:51.895167+00 | admin@nominas.local   | login_exitoso                   | INFO
  8 | 2026-08-13 16:37:42.455629+00 | usuario@nominas.local | cuenta_bloqueada_temporalmente  | ERROR
  7 | 2026-08-13 16:37:42.278333+00 | usuario@nominas.local | cuenta_bloqueada_temporalmente  | ERROR
  6 | 2026-08-13 16:37:42.116084+00 | usuario@nominas.local | login_fallido                   | WARNING
  5 | 2026-08-13 16:37:41.947996+00 | usuario@nominas.local | login_fallido                   | WARNING
  4 | 2026-08-13 16:37:41.772580+00 | usuario@nominas.local | login_fallido                   | WARNING
  3 | 2026-08-13 16:37:34.556523+00 | anonimo                | acceso_no_autorizado            | WARNING
  2 | 2026-08-13 16:37:34.524734+00 | usuario@nominas.local | login_fallido                   | WARNING
  1 | 2026-08-13 16:37:27.422287+00 | admin@nominas.local   | login_exitoso                   | INFO
```

Esta misma consulta está disponible dentro de la aplicación para el rol `admin` vía `GET /api/admin/logs-seguridad` y se visualiza en el panel `SecurityLogsPanel` del frontend.

---

## Práctica 7 — Niveles de severidad

**Objetivo:** clasificar los eventos según su importancia (INFO, WARNING, ERROR, DEBUG).

**Implementación:** mapeo centralizado en `backend/src/utils/securityLogger.js` (`SEVERITY_BY_EVENT`):

| Nivel | Eventos |
|---|---|
| INFO | `login_exitoso`, `logout`, `perfil_actualizado` |
| WARNING | `login_fallido`, `acceso_no_autorizado`, `acceso_denegado_rol` |
| ERROR | `cuenta_bloqueada_temporalmente` |
| DEBUG | `token_verificado` (solo visible con `LOG_LEVEL=debug`) |

Distribución real generada durante esta sesión de pruebas:

```sql
SELECT nivel, COUNT(*) FROM logs_seguridad GROUP BY nivel ORDER BY nivel;
```

```
  nivel  | count
---------+-------
 ERROR   |     2
 INFO    |     5
 WARNING |     6
```

Cada evento se registra simultáneamente con el nivel correspondiente tanto en `logs_seguridad` (columna `nivel`) como en el logger de Pino (`logger.info/warn/error/debug`), que es el archivo de log clasificado pedido como producto de esta práctica.

---

## Práctica 8 — Proyecto integrador

**Objetivo:** aplicación web funcionando que registre login, roles, logs de autenticación, cambios de datos y errores.

**Verificación end-to-end realizada sobre el stack real** (`docker compose`, Postgres + Redis + backend + frontend):

1. `npm run migrate:up` → tablas `usuarios` y `logs_seguridad` creadas correctamente.
2. `npm run seed:usuarios` → usuarios demo `admin@nominas.local` y `usuario@nominas.local` creados.
3. Flujo completo ejercitado por HTTP real: login exitoso, login fallido, bloqueo tras 5 intentos, acceso sin sesión (401), acceso con rol insuficiente (403), acceso permitido con rol correcto (200), auditoría de cambio de perfil, logout — todos verificados arriba con respuestas y logs reales.
4. **Errores**: el `errorHandler` existente (`backend/src/middleware/errorHandler.js`, ya presente antes de esta práctica) sigue capturando y logueando cualquier error de aplicación o de base de datos con Pino, sin filtrar detalles internos al cliente.
5. **Suite de pruebas automatizadas**, corrida real en esta sesión:
   - Backend: `npm test` → **8 archivos, 117 tests, todos en verde** (incluye el nuevo `auth.test.js` con 13 casos de login/roles/auditoría, y los casos de rol añadidos a `admin.test.js`).
   - Frontend: `npm test` → **5 archivos, 18 tests, todos en verde** (incluye el nuevo `LoginPage.test.tsx`).
   - Lint backend (`eslint`) y frontend (`oxlint`): sin errores.

---

## Criterios de evaluación — autoevaluación

| Criterio | Evidencia |
|---|---|
| Implementación correcta (40%) | Flujos de login/roles/auditoría verificados con peticiones HTTP reales (secciones 1-6 y 8), 135 tests automatizados en verde |
| Calidad de los logs (20%) | Estructura consistente `{usuario, evento, nivel, detalle}` en BD y Pino, niveles de severidad bien mapeados (Práctica 7) |
| Buenas prácticas de seguridad (20%) | Contraseñas con bcrypt, JWT en cookie httpOnly, bloqueo por fuerza bruta, redacción de datos sensibles en logs (Práctica 3), rate limiting en `/api/auth/login` |
| Documentación y evidencias (20%) | Este documento (con capturas reales de la aplicación funcionando) + [ADR 0004](./decisions/0004-autenticacion-jwt-y-logs-seguridad.md) + ADR 0001 marcada como reemplazada |
