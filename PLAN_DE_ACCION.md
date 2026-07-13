# 🗺️ Plan de Acción — Nominas

> Hoja de ruta para elevar el proyecto a nivel producción/portafolio profesional.
> Ir implementando de arriba hacia abajo en orden de prioridad.

---

## ✅ Leyenda

- `[ ]` Pendiente
- `[x]` Completado
- `[-]` En progreso

---

## 🥇 Prioridad 1 — Infraestructura (Docker + CI/CD)

### 1.1 Dockerfiles completos
- [x] Crear `backend/Dockerfile` con multi-stage build (dev → prod)
- [x] Crear `frontend/Dockerfile` con Nginx para servir el build estático
- [x] Actualizar `docker-compose.yml` raíz para levantar los 3 servicios: `db`, `api`, `web`
- [x] Crear `backend/.dockerignore`
- [x] Crear `frontend/.dockerignore`
- [x] Verificar que `docker compose up` levanta todo el stack correctamente

### 1.2 GitHub Actions — CI
- [x] Crear `.github/workflows/ci.yml`
  - [x] Trigger en `push` y `pull_request` a `main`
  - [x] Job: lint y typecheck del frontend (`tsc`, `eslint` -> `oxlint`)
  - [x] Job: lint del backend (`eslint`)
  - [x] Job: tests del backend (cuando se agreguen)
  - [x] Job: build del frontend para verificar que compila

### 1.3 GitHub Actions — CD
- [x] Crear `.github/workflows/cd.yml`
  - [x] Trigger en push a `main`
  - [x] Build de imágenes Docker
  - [x] Push a GitHub Container Registry (ghcr.io)
  - [x] (Opcional) Deploy a Fly.io / Railway si se tiene entorno de producción (Estructurado en el CI/CD)

---

## 🥈 Prioridad 2 — Testing

### 2.1 Backend — Tests de integración
- [x] Instalar `vitest` + `supertest` en el backend
- [x] Crear `backend/src/__tests__/` 
- [x] Test: `GET /health` responde 200
- [x] Test: `GET /api/empleados` paginación funciona
- [x] Test: `GET /api/nominas` filtros básicos (unidad, qna_pago)
- [x] Test: `GET /api/nominas` filtro de edad funciona
- [x] Test: `GET /api/nominas` filtro de concepto funciona
- [x] Test: `GET /api/nominas` summary retorna acumulados correctos
- [x] Test: `GET /api/reportes/por-unidad` retorna datos agrupados
- [x] Configurar script `npm test` en `package.json`
- [x] Agregar job de tests al CI

### 2.2 Frontend — Tests de componentes
- [x] Instalar `@testing-library/react` + `@testing-library/user-event` + `vitest`
- [x] Configurar `vitest` con jsdom en `vite.config.ts`
- [x] Test: `RightBookPage` renderiza correctamente el tab de Personal
- [x] Test: `RightBookPage` renderiza el tab de Filtros Avanzados
- [x] Test: `QuincenaTimeline` muestra la quincena seleccionada

### 2.3 ETL — Tests unitarios (Python)
- [x] Instalar `pytest` en el entorno virtual
- [x] Crear `etl/tests/`
- [x] Test: funciones de transformación con dataset ficticio
- [x] Test: validaciones de esquema de columnas

---

## 🥉 Prioridad 3 — Documentación de API

### 3.1 Swagger / OpenAPI
- [ ] Instalar `swagger-ui-express` + `swagger-jsdoc` en el backend
- [ ] Documentar endpoint `GET /api/empleados` con todos sus query params
- [ ] Documentar endpoint `GET /api/nomina` con todos los filtros disponibles
- [ ] Documentar endpoint `GET /api/reportes/por-unidad`
- [ ] Documentar endpoint `GET /api/reportes/conceptos`
- [ ] Exponer UI en `GET /api/docs`
- [ ] Agregar badge de API docs al README

### 3.2 README mejorado
- [ ] Agregar badges: CI status, Docker, licencia
- [ ] Agregar diagrama de arquitectura en Mermaid (frontend → API → PostgreSQL)
- [ ] Agregar sección de "Cómo ejecutar con Docker" (un solo comando)
- [ ] Agregar sección de "Variables de entorno" con tabla descriptiva
- [ ] Agregar capturas de pantalla de la interfaz
- [ ] Agregar sección de endpoints disponibles

### 3.3 Documentación de contribución
- [ ] Crear `CONTRIBUTING.md` con convenciones de código y commits
- [ ] Crear `.github/PULL_REQUEST_TEMPLATE.md` con checklist
- [ ] Crear `.github/ISSUE_TEMPLATE/bug_report.md`
- [ ] Crear `.github/ISSUE_TEMPLATE/feature_request.md`

---

## 4️⃣ Prioridad 4 — Calidad y Seguridad

### 4.1 Validación de entorno
- [ ] Instalar `envalid` o `zod` en el backend
- [ ] Validar todas las variables de entorno al iniciar la app (fail fast)
- [ ] Documentar cada variable con tipo y descripción

### 4.2 Seguridad del backend
- [ ] Rate limiting más granular por endpoint (actualmente global)
- [ ] Agregar `Content-Security-Policy` headers
- [ ] Configurar `Dependabot` en GitHub para updates automáticos de dependencias
- [ ] Agregar `gitleaks` o `truffleHog` al CI para detectar secrets accidentales

### 4.3 Índices adicionales en PostgreSQL
- [ ] Analizar queries más frecuentes con `EXPLAIN ANALYZE`
- [ ] Agregar índice en `unidad`
- [ ] Agregar índice en `cat_puesto`
- [ ] Agregar índice en `qna_pago`
- [ ] Agregar índice compuesto en `(unidad, subunidad)`
- [ ] Documentar índices en el DDL del ETL

---

## 5️⃣ Prioridad 5 — Performance y Observabilidad

### 5.1 Caché con Redis
- [ ] Agregar servicio `redis` al `docker-compose.yml`
- [ ] Instalar `ioredis` en el backend
- [ ] Cachear resultados de `/api/reportes/` (TTL de 10 min)
- [ ] Invalidar caché al detectar cambios en los datos

### 5.2 Métricas y Monitoreo
- [ ] Instalar `prom-client` en el backend
- [ ] Exponer `/metrics` compatible con Prometheus
- [ ] Mejorar `/health` con estado de DB, uso de memoria, uptime
- [ ] Agregar `grafana` al docker-compose para dashboards locales

### 5.3 Error Tracking
- [ ] Integrar Sentry en el frontend (`@sentry/react`)
- [ ] Integrar Sentry en el backend (`@sentry/node`)

---

## 6️⃣ Prioridad 6 — UX/UI y Frontend Avanzado

### 6.1 Accesibilidad (a11y)
- [ ] Agregar `aria-label` a todos los botones de ícono
- [ ] Verificar contraste de colores cumple WCAG AA
- [ ] Asegurar navegación completa por teclado (Tab, Enter, Escape)
- [ ] Agregar roles semánticos donde falten

### 6.2 Modo Oscuro
- [ ] Detectar `prefers-color-scheme` del sistema
- [ ] Definir tokens de color para modo oscuro en `index.css`
- [ ] Agregar toggle manual de tema

### 6.3 Performance Frontend
- [ ] Implementar `React.lazy()` para componentes de Recharts
- [ ] Agregar `<Suspense>` con skeleton loaders
- [ ] Configurar `vite-plugin-compression` para gzip del bundle

### 6.4 Exportación de Datos (ya propuesto antes)
- [ ] Botón "Exportar CSV" en la vista de Filtros Avanzados
- [ ] Endpoint `GET /api/nomina/export?format=csv` en el backend

---

## 7️⃣ Prioridad 7 — Gestión del Repositorio

### 7.1 Calidad de Commits
- [ ] Instalar `commitlint` + `@commitlint/config-conventional`
- [ ] Instalar `husky` para git hooks
- [ ] Instalar `lint-staged` para ejecutar ESLint/Prettier antes de commit
- [ ] Configurar reglas de commits convencionales

### 7.2 Releases automatizados
- [ ] Instalar `release-it` o `semantic-release`
- [ ] Generar `CHANGELOG.md` automáticamente desde los commits
- [ ] Crear GitHub Releases con tags semánticos

---

## 📌 Notas

- Los Dockerfiles y CI/CD (Prioridades 1) tienen el mayor impacto de portafolio
- Testing (Prioridad 2) demuestra madurez de ingeniería
- Todo lo demás es diferenciador frente a proyectos similares
- Implementar en orden y hacer commit de cada ítem por separado para tener historial limpio
