# Sistema de Auditoría y Consulta de Nóminas (SEP 2018)

Este repositorio contiene una solución completa de ingeniería de datos y desarrollo de software para procesar, consultar y visualizar la nómina pública de personal gubernamental/educativo (correspondiente a la quincena 06 de 2018 — segunda quincena de marzo de 2018).

---

## Estado del Proyecto

| Indicador | Estado |
|---|---|
| CI (lint + typecheck + build) | ![CI](https://github.com/alexander-tinoco/nominas/actions/workflows/ci.yml/badge.svg) |
| CD (build Docker + push GHCR) | ![CD](https://github.com/alexander-tinoco/nominas/actions/workflows/cd.yml/badge.svg) |
| Cobertura de tests | **98.76 % statements · 100 % funciones** |
| Tests | **88 tests** (Vitest + Supertest) |

---

## Contexto de los Datos

Los datos de entrada constan de dos archivos Excel:
* **`archivo_1.xlsx` (Maestro):** Registros de pago únicos por plaza contable. Incluye la clave RFC, nombre del empleado, adscripción (Unidad/Subunidad/Centro de Trabajo) e importes totales agrupados.
* **`archivo_2.xlsx` (Detalle):** Desglose concepto por concepto (percepciones y deducciones como sueldo base, ISR, seguridad social, seguros de vida) ligados al maestro por consecutivo.

---

## Estructura del Repositorio

El proyecto está diseñado bajo una arquitectura modular y limpia:

```text
nominas/
├── docker-compose.yml         → Orquesta PostgreSQL, backend y frontend
├── README.md                  → Esta guía general de inicio rápido
├── raw_data/                  → Almacena los archivos excel originales
│
├── .github/workflows/
│   ├── ci.yml                 → Pipeline CI: lint, typecheck, tests y build
│   └── cd.yml                 → Pipeline CD: build Docker + push a GHCR
│
├── etl/                       → MÓDULO PYTHON (ETL)
│   ├── etl_nomina.py          → Script ETL de producción parametrizado
│   └── helpers/               → Scripts individuales de prueba (desarrollo)
│
├── backend/                   → MÓDULO NODE.JS (API REST)
│   ├── src/
│   │   ├── controllers/       → Lógica de negocio por recurso
│   │   ├── routes/            → Definición de rutas Express
│   │   ├── middleware/        → Logger (Pino) y manejador de errores
│   │   ├── config/db.js       → Pool de conexiones PostgreSQL
│   │   ├── app.js             → Configuración de Express (CORS, Helmet, rate-limit)
│   │   └── __tests__/         → Suite de tests unitarios (88 tests)
│   ├── vitest.config.js       → Configuración de Vitest
│   ├── eslint.config.js       → Configuración de ESLint (Flat Config)
│   ├── Dockerfile             → Imagen multi-stage para producción
│   └── README.md              → Documentación detallada de endpoints
│
└── frontend/                  → MÓDULO REACT (DASHBOARD)
    ├── src/                   → Vistas, componentes contables y hooks de react-query
    ├── Dockerfile             → Imagen Nginx para producción
    └── README.md              → Guía de compilación del frontend
```

---

## Cómo Empezar

### Opción A — Entorno completo con Docker (recomendado)

Levanta los tres servicios (PostgreSQL, backend y frontend) con un solo comando:

```bash
docker compose up -d
```

| Servicio | URL |
|---|---|
| Frontend (Dashboard) | http://localhost:80 |
| Backend (API REST) | http://localhost:3000 |
| PostgreSQL | localhost:5433 |

Luego ejecuta el ETL para cargar los datos (ver Opción B, paso 2).

---

### Opción B — Desarrollo local (servicio por servicio)

#### 1. Iniciar la Base de Datos (Docker)
```bash
docker compose up -d db
```
*PostgreSQL se expone en el puerto `5433` para evitar conflictos con el 5432 local.*

#### 2. Ejecutar el Pipeline ETL (Python)
```bash
# Crear entorno virtual e instalar librerías
python3 -m venv .venv
.venv/bin/pip install pandas openpyxl sqlalchemy psycopg2-binary

# Correr el pipeline ETL (limpia, valida y carga 292k registros en ~35 segundos)
.venv/bin/python etl/etl_nomina.py --mode initial --chunksize 10000
```

#### 3. Ejecutar la API REST (Node.js)
```bash
cd backend
npm install
npm run dev
```
*El backend corre en `http://localhost:3000`.*

#### 4. Ejecutar el Dashboard (React)
```bash
cd frontend
npm install
npm run dev
```
*El dashboard corre en `http://localhost:5173`.*

---

## Testing

El backend cuenta con una suite de **88 tests de integración** usando **Vitest** y **Supertest**, organizados en un archivo por controlador/endpoint:

```
backend/src/__tests__/
├── health.test.js       →  3 tests  — GET /health
├── empleados.test.js    → 14 tests  — GET /api/empleados y /:rfc
├── nomina.test.js       → 44 tests  — GET /api/nomina y /:num_cons
├── reportes.test.js     → 19 tests  — GET /api/reportes/*
└── middleware.test.js   →  8 tests  — errorHandler y logger
```

### Ejecutar los tests

```bash
cd backend

# Correr todos los tests una vez
npm test

# Modo watch (re-ejecuta al guardar cambios)
npm run test:watch

# Reporte de cobertura de código
npm run test:coverage
```

### Cobertura de código

| Archivo | Statements | Branch | Funciones | Líneas |
|---|---|---|---|---|
| **Total** | **98.76%** | **93.83%** | **100%** | **98.75%** |
| `app.js` | 100% | 100% | 100% | 100% |
| `routes/*.js` | 100% | 100% | 100% | 100% |
| `controllers/empleados.js` | 100% | 80% | 100% | 100% |
| `controllers/nomina.js` | 100% | 98.9% | 100% | 100% |
| `controllers/reportes.js` | 100% | 100% | 100% | 100% |
| `middleware/errorHandler.js` | 100% | 87.5% | 100% | 100% |
| `middleware/logger.js` | 100% | 100% | 100% | 100% |
| `config/db.js` | 66.7%* | 50%* | 100% | 66.7%* |

> \* `db.js` contiene el bloque `await pool.connect()` que se ejecuta al importar el módulo real. En los tests este módulo está completamente mockeado, por lo que esas líneas son **físicamente inalcanzables** sin una base de datos activa.

---

## CI / CD

### Pipeline CI (`.github/workflows/ci.yml`)

Se ejecuta en cada `push` y `pull_request` a `main`:

| Job | Qué hace |
|---|---|
| `backend-ci` | ESLint · Vitest (88 tests) · `tsc --noEmit` |
| `frontend-ci` | ESLint · TypeScript · `vite build` |

### Pipeline CD (`.github/workflows/cd.yml`)

Se ejecuta en cada `push` a `main`:

| Paso | Qué hace |
|---|---|
| Build backend | Imagen Docker multi-stage (Node 22 → alpine) |
| Build frontend | Imagen Docker multi-stage (Node 22 → Nginx alpine) |
| Push | Publica ambas imágenes en `ghcr.io/alexander-tinoco/nominas-*` |

---

## Características de Diseño Contable (Dashboard)

* **Filtro de Quincenas Integrado:** La línea de tiempo superior simula talonarios perforados físicos. Puedes moverte entre periodos haciendo clic o usando las **flechas izquierda/derecha de tu teclado**.
* **Visualización de Balances:** Gráficas con la paleta contable tradicional (verde papel de fondo, tinta índigo, percepciones en oro y deducciones en rojo).
* **Talón de Pago Digitalizado:** Al hacer clic en un empleado, el sistema renderiza un recibo de nómina con bordes perforados en CSS, desgloses detallados y soporte nativo para impresión.
* **Seguridad y Accesibilidad:** Enmascaramiento preventivo de RFCs en logs y analítica, cifras monoespaciadas para correcta alineación y manejo fluido del estado asíncrono con React Query.
