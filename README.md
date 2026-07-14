# Sistema de Auditoría y Consulta de Nóminas (SEP 2018)

Este repositorio contiene una solución completa de ingeniería de datos y desarrollo de software para procesar, consultar y visualizar la nómina pública de personal gubernamental/educativo (correspondiente a la quincena 06 de 2018 — segunda quincena de marzo de 2018).

---

## Estado del Proyecto

| Indicador | Estado |
|---|---|
| **CI (Integración Continua)** | ![CI](https://github.com/alexander-tinoco/nominas/actions/workflows/ci.yml/badge.svg) |
| **CD (Despliegue Continuo)** | ![CD](https://github.com/alexander-tinoco/nominas/actions/workflows/cd.yml/badge.svg) |
| **Documentación de API** | [![API Docs](https://img.shields.io/badge/OpenAPI-Swagger-green.svg)](http://localhost:3000/api/docs) |
| **Licencia** | [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) |
| **Docker** | [![Docker Compose](https://img.shields.io/badge/Docker-Compose-blue.svg)](#cómo-ejecutar-con-docker) |
| **Calidad de Commits** | **Convencionales (Husky + Commitlint)** |
| **Gobernanza** | **ADRs (docs/decisions) & Release-it** |
| **Cobertura de tests (Backend)** | **100 % verde (97 tests unitarios)** |


---

## Arquitectura del Sistema

El siguiente diagrama muestra el flujo de datos y la relación entre los distintos módulos del ecosistema, incluyendo la capa de caché con Redis, el monitoreo con Prometheus/Grafana y el seguimiento de excepciones con Sentry:

```mermaid
graph TD
    subgraph Cliente
        A[Dashboard React + Vite]
        S_Front[Sentry SDK React]
    end
    subgraph Servidor
        B[API REST Express]
        E[Swagger UI /api/docs]
        S_Back[Sentry SDK Node]
    end
    subgraph Almacenamiento_Caché
        C[(Base de Datos PostgreSQL 16)]
        R[(Servidor Redis 7)]
    end
    subgraph Monitoreo
        P[(Prometheus Server)]
        G[Grafana Dashboards]
    end
    subgraph Procesamiento
        D[ETL Pipeline Python]
    end

    A -->|Peticiones HTTP/JSON| B
    A -.->|Reporta errores| S_Front
    B -->|Consulta SQL| C
    B <-->|Caché de reportes| R
    B -.->|Reporta excepciones| S_Back
    E -->|Consulta Esquema| B
    D -->|Carga masiva SQL| C
    P -->|Raspa /metrics| B
    G -->|Muestra paneles| P
```

---

## Contexto de los Datos

Los datos de entrada constan de dos archivos Excel:
* **`archivo_1.xlsx` (Maestro):** Registros de pago únicos por plaza contable. Incluye la clave RFC, nombre del empleado, adscripción (Unidad/Subunidad/Centro de Trabajo) e importes totales agrupados.
* **`archivo_2.xlsx` (Detalle):** Desglose concepto por concepto (percepciones y deducciones como sueldo base, ISR, seguridad social, seguros de vida) ligados al maestro por consecutivo.

### Diagrama UML de Entidad-Relación (ERD)

La estructura física del esquema relacional diseñado e indexado en PostgreSQL se detalla en el siguiente modelo de datos (notación Crow's Foot):

```mermaid
erDiagram
    conceptos_catalogo {
        varchar concepto PK
    }
    nomina_registros {
        int num_cons PK
        varchar rfc
        varchar nom_emp
        int ent_fed
        varchar ct_clasif
        varchar ct_id
        int ct_secuencial
        varchar ct_digito_ver
        int cod_pago
        int unidad
        int subunidad
        varchar cat_puesto
        int horas
        int cons_plaza
        int nivel_sueldo
        int mot_mov
        int qna_ini
        int qna_fin
        int qna_pago
        numeric tot_perc_cheque
        numeric tot_ded_cheque
        numeric tot_net_cheque
    }
    nomina_conceptos {
        int id PK
        int num_cons FK
        char perc_ded
        varchar concepto FK
        numeric importe
        int qna_ini
        int qna_fin
    }

    nomina_registros ||--o{ nomina_conceptos : "contiene"
    conceptos_catalogo ||--o{ nomina_conceptos : "clasifica"
```

---

## Seguridad y acceso a los datos

* **Datos de acceso público:** Todos los endpoints expuestos en el backend son de solo lectura (métodos `GET`) y operan sobre información de nómina que es de carácter gubernamental público (SEP 2018).
* **Ausencia de autenticación:** Al tratarse de datos abiertos y de libre consulta, no se implementó un mecanismo de autenticación en este proyecto.
* **Escalabilidad de seguridad:** En caso de migrar a un entorno corporativo o con datos privados, se requeriría incorporar un middleware de autenticación (por ejemplo, JWT con OAuth2) y autorización basada en roles (RBAC) para abrir endpoints de escritura de forma segura.

---

## Estructura del Repositorio

El proyecto está diseñado bajo una arquitectura modular y limpia:

```text
nominas/
├── docker-compose.yml         → Orquesta PostgreSQL, Redis, Prometheus, Grafana, backend y frontend
├── prometheus.yml             → Configura los intervalos de raspado de métricas para Prometheus
├── README.md                  → Esta guía general de inicio rápido
├── commitlint.config.js       → Reglas para validar mensajes de commits convencionales
├── .release-it.json           → Configuración para la generación de releases, tags y changelogs
├── .husky/                    → Hooks de Git (pre-commit y commit-msg) para control de calidad
├── raw_data/                  → Almacena los archivos excel originales (excluidos del commit)
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml             → Pipeline CI: lint, typecheck, tests, scan de secretos y build
│   │   └── cd.yml             → Pipeline CD: build Docker + push a GHCR
│   ├── ISSUE_TEMPLATE/        → Plantillas para Bugs y Features
│   └── PULL_REQUEST_TEMPLATE.md → Plantilla de revisión para PRs
│
├── docs/                      → DOCUMENTACIÓN GENERAL
│   └── decisions/             → Architecture Decision Records (ADRs) de diseño
│
├── etl/                       → MÓDULO PYTHON (ETL)
│   ├── etl_nomina.py          → Script ETL de producción (valida y carga en base de datos)
│   └── tests/                 → Pruebas unitarias de las transformaciones
│
├── backend/                   → MÓDULO NODE.JS (API REST)
│   ├── migrations/            → Migraciones DDL versionadas de la base de datos (node-pg-migrate)
│   ├── src/
│   │   ├── controllers/       → Lógica de control y mapeo HTTP
│   │   ├── services/          → Lógica de negocio, filtros dinámicos y caché de Redis
│   │   ├── repositories/      → Acceso y consultas directas SQL
│   │   ├── routes/            → Definición de rutas Express con rate-limiters específicos
│   │   ├── middleware/        → Logger, error-handler, métricas y validateRequest (Zod)
│   │   ├── schemas/           → Esquemas de validación estricta de parámetros usando Zod
│   │   ├── config/db.js       → Pool de conexiones PostgreSQL
│   │   ├── config/env.js      → Validador estricto fail-fast de variables de entorno
│   │   ├── config/redis.js    → Cliente y helpers de caché Redis
│   │   ├── config/swagger.js  → Configuración de Swagger OpenAPI
│   │   └── __tests__/         → Suite de tests (97 tests con mocks de base de datos)
│   ├── eslint.config.js       → Configuración de ESLint (Flat Config)
│   ├── Dockerfile             → Imagen multi-stage para producción
│   └── README.md              → Documentación detallada de endpoints
│
└── frontend/                  → MÓDULO REACT (DASHBOARD)
    ├── src/                   → Vistas, componentes, tracking de errores con Sentry
    ├── Dockerfile             → Imagen Nginx para producción
    └── README.md              → Guía de compilación del frontend
```

### Diagrama de Clases UML (Arquitectura de 3 Capas - Backend)

El backend sigue el principio de separación de responsabilidades a través de tres capas desacopladas, interactuando de manera resiliente con Redis y reportando excepciones no controladas a Sentry:

```mermaid
classDiagram
    direction LR
    class Router {
        +get(path, handler)
    }
    class Controller {
        +getEmployees(req, res)
        +getNomina(req, res)
        +getReports(req, res)
    }
    class Service {
        +getEmployeesList(query)
        +getNominaDetails(query)
        +getReportsSummary(query)
    }
    class Repository {
        +findAll()
        +findById(id)
        +findAndCount()
    }
    class Redis_Cache {
        +getCache(key)
        +setCache(key, val, ttl)
    }
    class Sentry_SDK {
        +setupExpressErrorHandler()
    }

    Router --> Controller : "Rutea a"
    Controller --> Service : "Invoca a"
    Service --> Repository : "Consulta SQL"
    Service <--> Redis_Cache : "Verifica/Guarda"
    Controller --> Sentry_SDK : "Captura fallas"
```

---

## Variables de Entorno

El proyecto se configura dinámicamente mediante las siguientes variables de entorno:

### Backend (`backend/.env`)

| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `PORT` | Puerto de escucha de la API REST | `3000` |
| `PGHOST` | Servidor de base de datos PostgreSQL | `localhost` |
| `PGPORT` | Puerto de base de datos PostgreSQL | `5433` |
| `PGUSER` | Usuario de base de datos PostgreSQL | `postgres` |
| `PGPASSWORD` | Contraseña de base de datos PostgreSQL | `postgres_password` |
| `PGDATABASE` | Nombre de la base de datos | `nominas` |
| `CORS_ORIGIN` | Orígenes CORS permitidos | `*` |
| `REDIS_URL` | URL de conexión para el almacén de caché Redis | `redis://localhost:6379` |
| `SENTRY_DSN` | DSN de Sentry para error tracking en producción | `""` |
| `LOG_LEVEL` | Nivel mínimo para logger (Pino) | `info` |

### Frontend (`frontend/.env`)

| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `VITE_API_URL` | Endpoint base de la API REST del backend | `http://localhost:3000` |
| `VITE_SENTRY_DSN` | DSN de Sentry para el dashboard React | `""` |

---

## Cómo Ejecutar con Docker (Recomendado)

Puedes inicializar todo el ecosistema (Base de Datos + Redis + Prometheus + Grafana + API REST + Dashboard Frontend) en segundo plano con un solo comando:

```bash
docker compose up -d
```

| Servicio | URL |
|---|---|
| **Dashboard Frontend** | [http://localhost:80](http://localhost:80) |
| **API REST Backend** | [http://localhost:3000](http://localhost:3000) |
| **Swagger Docs** | [http://localhost:3000/api/docs](http://localhost:3000/api/docs) |
| **Métricas (Prometheus compatible)** | [http://localhost:3000/metrics](http://localhost:3000/metrics) |
| **Servidor Prometheus** | [http://localhost:9090](http://localhost:9090) |
| **Paneles Grafana** (User: `admin` / Pwd: `admin`) | [http://localhost:3001](http://localhost:3001) |
| **Base de Datos (PostgreSQL)** | `localhost:5433` |
| **Servidor Redis** | `localhost:6379` |

*Nota: Una vez levantado el entorno, debes ejecutar el ETL para poblar la base de datos (ver Paso 2 en la sección siguiente). Grafana viene pre-configurado con Prometheus como origen de datos y un Dashboard de producción llamado "Auditoría de Nóminas - NodeJS Metrics" cargado automáticamente.*

---

## Cómo Ejecutar de Forma Local (Desarrollo)

### Diagrama de Secuencia UML (Proceso del ETL Pipeline)

El ciclo de vida del pipeline ETL de Python (Extracción, Limpieza y Transformación en funciones puras y Carga en lotes con índices optimizados) se ilustra en el siguiente diagrama:

```mermaid
sequenceDiagram
    autonumber
    actor CLI as Usuario (CLI)
    participant ETL as Script etl_nomina.py
    participant Excel1 as Archivo Maestro (.xlsx)
    participant Excel2 as Archivo Detalle (.xlsx)
    participant DB as PostgreSQL 16

    CLI->>ETL: Ejecuta con parámetros (--mode, --chunksize)
    activate ETL
    ETL->>Excel1: Lee y parsea filas (pd.read_excel)
    Excel1-->>ETL: DataFrame Maestro
    ETL->>Excel2: Lee y parsea detalles (pd.read_excel)
    Excel2-->>ETL: DataFrame Detalle
    Note over ETL: Etapa de Transformación:<br/>1. Clean text (strip)<br/>2. Cast types (int/float)<br/>3. Filter orphan rows (Integridad Referencial)
    ETL->>DB: Trunca/Crea tablas (DDL - Mode: initial)
    DB-->>ETL: Confirmación
    ETL->>DB: Carga Catálogo Conceptos únicos
    ETL->>DB: Inserta Registros Maestros (en lotes/chunks)
    ETL->>DB: Inserta Registros de Detalle (en lotes/chunks)
    DB-->>ETL: Éxito en la transaccionalidad de carga
    ETL-->>CLI: Pipeline finalizado con éxito
    deactivate ETL
```

### Instrucciones de ejecución local:

#### 1. Levantar Servicios Requeridos (BD y Redis)
```bash
docker compose up -d db redis
```

#### 2. Ejecutar Pipeline ETL (Python)
```bash
# Crear entorno virtual e instalar librerías
python3 -m venv .venv
source .venv/bin/activate
pip install -r etl/requirements.txt

# Correr el pipeline ETL (limpia, valida y carga 292k registros en ~35 segundos e indexa la base de datos)
python etl/etl_nomina.py --mode initial --chunksize 10000
```

#### 3. Ejecutar API REST (Node.js)
```bash
cd backend
npm install
npm run dev
```

#### 4. Ejecutar Dashboard Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

---

## Endpoints Disponibles (API)

A continuación se detallan las rutas principales expuestas por la API REST:

* **`GET /health`** - Chequeo de estado de salud mejorado del sistema (DB status, uptime, uso de memoria).
* **`GET /metrics`** - Exposición de métricas globales del sistema en formato Prometheus (peticiones HTTP, duración de respuestas).
* **`GET /api/docs`** - Interfaz de documentación interactiva de Swagger/OpenAPI.

#### Documentación Interactiva con Swagger

El backend expone la especificación OpenAPI de todos sus endpoints de forma interactiva en `/api/docs`:

| Vista de Endpoints en Swagger | Detalle de Modelos y Parámetros |
| :---: | :---: |
| ![Swagger Endpoints](docs/images/swagger_docs_1.png) | ![Swagger Detalle](docs/images/swagger_docs_2.png) |
* **`GET /api/empleados`** - Lista paginada y filtrable de empleados ordenados por nombre.
* **`GET /api/empleados/:rfc`** - Historial detallado de recibos del empleado asociado a un RFC.
* **`GET /api/nomina`** - Consulta estructurada de recibos de nómina con soporte de 32 filtros combinados y resumen de acumulados.
* **`GET /api/nomina/:num_cons`** - Desglose de percepciones y deducciones de un recibo específico.
* **`GET /api/reportes/por-unidad`** - Acumulados financieros agrupados por unidad y/o subunidad (Cacheado en Redis con TTL de 10 min).
* **`GET /api/reportes/conceptos`** - Sumatorias acumuladas globales para cada concepto de nómina (Cacheado en Redis con TTL de 10 min).

---

## Gobernanza, Calidad y Estabilidad

El proyecto incorpora un ecosistema moderno para garantizar la calidad del código, versionado y control de despliegues:

1. **Migraciones Versionadas**: La creación del esquema y los índices en PostgreSQL se encuentra separada del script ETL y es administrada por `node-pg-migrate` bajo `backend/migrations/`. El contenedor del backend las ejecuta automáticamente al iniciar.
2. **Validación con Zod**: Todos los parámetros de query y de ruta (como `num_cons`) en los endpoints se validan rígidamente en tiempo de ejecución. Los errores se formatean en respuestas estandarizadas `400 Bad Request` para mejorar la seguridad y la consistencia.
3. **Calidad de Commits (Git Hooks)**: Configurado con `husky` y `lint-staged`. Cada commit convencional es validado por `commitlint`, garantizando que se respete el estándar de commits convencionales. Adicionalmente, `lint-staged` corre linters (ESLint y Oxlint) y unit tests locales para evitar código inestable en el historial de Git.
4. **Architecture Decision Records (ADRs)**: Se documentan las decisiones técnicas fundamentales del portafolio en `docs/decisions/` para transparentar supuestos de diseño y facilitar la incorporación de colaboradores.
5. **Releases Automatizados**: Integra `release-it` para versionar la aplicación de manera semántica (`patch`, `minor`, `major`), actualizar el `CHANGELOG.md` automáticamente a partir de commits convencionales, crear tags de Git y publicar el release en GitHub.

---

## Testing

### Backend (Vitest + Supertest)

```bash
cd backend
npm test               # Ejecutar los 97 tests una vez
npm run test:watch     # Ejecutar tests en modo watch
npm run test:coverage  # Generar reporte de cobertura de código
```

### Frontend (Vitest + React Testing Library)

```bash
cd frontend
npm test               # Ejecutar los 7 tests de componentes
```

### ETL (Pytest)

```bash
cd etl
PYTHONPATH=.. .venv/bin/pytest # Ejecutar los 5 tests de transformaciones
```

---

## Características de Diseño Contable (Dashboard)

### Capturas de Pantalla de la Interfaz

| Vista Principal del Dashboard | Búsqueda Avanzada y Balances |
| :---: | :---: |
| ![Dashboard Principal](docs/images/dashboard_main.png) | ![Búsqueda Avanzada](docs/images/advanced_search.png) |

### Diagrama de Estados UML (Navegación y Estados en React)

El flujo de estados y transiciones en la interfaz contable del frontend (dashboard) gestionada por Zustand se describe a continuación:

```mermaid
stateDiagram-v2
    [*] --> VistaCuentas : Carga inicial del Dashboard
    
    state VistaCuentas {
        [*] --> CatalogoPersonal : Tab por defecto (Búsqueda Simple)
        CatalogoPersonal --> BúsquedaAvanzada : Clic en tab "Filtros Avanzados"
        BúsquedaAvanzada --> CatalogoPersonal : Clic en tab "Personal"
    }

    state VisualizacionRecibo {
        [*] --> ReciboCerrado
        ReciboCerrado --> ReciboAbierto : Seleccionar Empleado (Fila RFC)
        ReciboAbierto --> ReciboAbierto : Cambiar Quincena (Clic o ArrowLeft/ArrowRight)
        ReciboAbierto --> ReciboCerrado : Limpiar selección
    }

    VistaCuentas --> VisualizacionRecibo : Selecciona Empleado (Zustand Store)
```

### Detalles de la interfaz:
* **Filtro de Quincenas Integrado:** La línea de tiempo superior simula talonarios perforados físicos. Puedes moverte entre periodos haciendo clic o usando las **flechas izquierda/derecha de tu teclado**.
* **Visualización de Balances:** Gráficas con la paleta contable tradicional (verde papel de fondo, tinta índigo, percepciones en oro y deducciones en rojo).
* **Talón de Pago Digitalizado:** Al hacer clic en un empleado, el sistema renderiza un recibo de nómina con bordes perforados en CSS, desgloses detallados y soporte nativo para impresión.
* **Seguridad y Accesibilidad:** Enmascaramiento preventivo de RFCs en logs y analítica, cifras monoespaciadas para correcta alineación y manejo fluido del estado asíncrono con React Query.
