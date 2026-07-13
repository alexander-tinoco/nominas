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
| **Cobertura de tests** | **98.76 % statements · 100 % funciones** |

---

## Arquitectura del Sistema

El siguiente diagrama muestra el flujo de datos y la relación entre los distintos módulos del ecosistema:

```mermaid
graph TD
    subgraph Cliente
        A[Dashboard React + Vite]
    end
    subgraph Servidor
        B[API REST Express]
        E[Swagger UI /api/docs]
    end
    subgraph Almacenamiento
        C[(Base de Datos PostgreSQL 16)]
    end
    subgraph Procesamiento
        D[ETL Pipeline Python]
    end

    A -->|Peticiones HTTP/JSON| B
    B -->|Consulta SQL| C
    E -->|Consulta Esquema| B
    D -->|Carga masiva SQL| C
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
* **Escalabilidad de seguridad:** En caso de migrar a un entorno corporativo o con datos privados, se requeriría incorporar un middleware de autenticación (por ejemplo, JWT con OAuth2) y autorización basada en roles (RBAC) para restringir el acceso a los registros.

---

## Estructura del Repositorio

El proyecto está diseñado bajo una arquitectura modular y limpia:

```text
nominas/
├── docker-compose.yml         → Orquesta PostgreSQL, backend y frontend
├── README.md                  → Esta guía general de inicio rápido
├── raw_data/                  → Almacena los archivos excel originales
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml             → Pipeline CI: lint, typecheck, tests y build
│   │   └── cd.yml             → Pipeline CD: build Docker + push a GHCR
│   ├── ISSUE_TEMPLATE/        → Plantillas para Bugs y Features
│   └── PULL_REQUEST_TEMPLATE.md → Plantilla de revisión para PRs
│
├── etl/                       → MÓDULO PYTHON (ETL)
│   ├── etl_nomina.py          → Script ETL de producción parametrizado
│   └── tests/                 → Pruebas unitarias de las transformaciones
│
├── backend/                   → MÓDULO NODE.JS (API REST)
│   ├── src/
│   │   ├── controllers/       → Lógica de control y mapeo HTTP
│   │   ├── services/          → Lógica de negocio y construcción de filtros
│   │   ├── repositories/      → Acceso y consultas directas SQL
│   │   ├── routes/            → Definición de rutas Express
│   │   ├── middleware/        → Logger (Pino) y manejador de errores
│   │   ├── config/db.js       → Pool de conexiones PostgreSQL
│   │   ├── config/swagger.js  → Configuración de Swagger OpenAPI
│   │   └── __tests__/         → Suite de tests (96 tests)
│   ├── eslint.config.js       → Configuración de ESLint (Flat Config)
│   ├── Dockerfile             → Imagen multi-stage para producción
│   └── README.md              → Documentación detallada de endpoints
│
└── frontend/                  → MÓDULO REACT (DASHBOARD)
    ├── src/                   → Vistas, componentes contables y hooks de react-query
    ├── Dockerfile             → Imagen Nginx para producción
    └── README.md              → Guía de compilación del frontend
```

### Diagrama de Clases UML (Arquitectura de 3 Capas - Backend)

El backend sigue estrictamente el principio de separación de responsabilidades a través de tres capas desacopladas, lo cual permite mockear fácilmente y testear de forma aislada:

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
    class DB_Pool {
        +query(sql, params)
    }

    Router --> Controller : "Rutea a"
    Controller --> Service : "Invoca a"
    Service --> Repository : "Consulta mediante"
    Repository --> DB_Pool : "Ejecuta sobre"
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
| `LOG_LEVEL` | Nivel mínimo para logger (Pino) | `info` |

### Frontend (`frontend/.env`)

| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `VITE_API_URL` | Endpoint base de la API REST del backend | `http://localhost:3000` |

---

## Cómo Ejecutar con Docker (Recomendado)

Puedes inicializar todo el ecosistema (Base de Datos + API REST + Dashboard Frontend) en segundo plano con un solo comando:

```bash
docker compose up -d
```

| Servicio | URL |
|---|---|
| **Dashboard Frontend** | [http://localhost:80](http://localhost:80) |
| **API REST Backend** | [http://localhost:3000](http://localhost:3000) |
| **Documentación de API (Swagger)** | [http://localhost:3000/api/docs](http://localhost:3000/api/docs) |
| **Base de Datos (PostgreSQL)** | `localhost:5433` |

*Nota: Una vez levantado el entorno, debes ejecutar el ETL para poblar la base de datos (ver Paso 2 en la sección siguiente).*

---

## Cómo Ejecutar de Forma Local (Desarrollo)

### Diagrama de Secuencia UML (Proceso del ETL Pipeline)

El ciclo de vida del pipeline ETL de Python (Extracción, Limpieza y Transformación en funciones puras y Carga en lotes) se ilustra en el siguiente diagrama:

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

#### 1. Levantar Base de Datos
```bash
docker compose up -d db
```

#### 2. Ejecutar Pipeline ETL (Python)
```bash
# Crear entorno virtual e instalar librerías
python3 -m venv .venv
source .venv/bin/activate
pip install -r etl/requirements.txt

# Correr el pipeline ETL (limpia, valida y carga 292k registros en ~35 segundos)
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

* **`GET /health`** - Chequeo de estado de salud del sistema.
* **`GET /api/docs`** - Interfaz de documentación interactiva de Swagger/OpenAPI.
* **`GET /api/empleados`** - Lista paginada y filtrable de empleados ordenados por nombre.
* **`GET /api/empleados/:rfc`** - Historial detallado de recibos del empleado asociado a un RFC.
* **`GET /api/nomina`** - Consulta estructurada de recibos de nómina con soporte de 32 filtros combinados y resumen de acumulados.
* **`GET /api/nomina/:num_cons`** - Desglose de percepciones y deducciones de un recibo específico.
* **`GET /api/reportes/por-unidad`** - Acumulados financieros agrupados por unidad y/o subunidad organizativa.
* **`GET /api/reportes/conceptos`** - Sumatorias acumuladas globales para cada concepto de nómina.

---

## Testing

### Backend (Vitest + Supertest)

```bash
cd backend
npm test               # Ejecutar los 96 tests una vez
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
PYTHONPATH=. pytest etl/tests/ # Ejecutar los 5 tests de transformaciones
```

---

## Características de Diseño Contable (Dashboard)

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
