# Sistema de Auditoría y Consulta de Nóminas (SEP 2018)

Este repositorio contiene una solución completa de ingeniería de datos y desarrollo de software para procesar, consultar y visualizar la nómina pública de personal gubernamental/educativo (correspondiente a la quincena 06 de 2018 — segunda quincena de marzo de 2018).

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
├── docker-compose.yml         → Configura PostgreSQL 16-alpine (puerto 5433)
├── README.md                  → Esta guía general de inicio rápido
├── raw_data/                  → Almacena los archivos excel originales
│
├── etl/                       → MÓDULO PYTHON (ETL)
│   ├── etl_nomina.py          → Script ETL de producción parametrizado
│   └── helpers/               → Scripts individuales de prueba (desarrollo)
│
├── backend/                   → MÓDULO NODE.JS (API REST)
│   ├── src/                   → Controladores, rutas y middlewares de Express
│   ├── test_endpoints.sh      → Suite de pruebas automáticas con curl
│   └── README.md              → Documentación detallada de endpoints y ejemplos JSON
│
└── frontend/                  → MÓDULO REACT (DASHBOARD)
    ├── src/                   → Vistas, componentes contables y hooks de react-query
    └── README.md              → Guía de compilación del frontend
```

---

## Cómo Empezar

Sigue estos pasos en orden para levantar todo el ecosistema en tu máquina local:

### 1. Iniciar la Base de Datos (Docker)
Levanta el contenedor de PostgreSQL 16 en segundo plano:
```bash
docker compose up -d
```
*Nota: PostgreSQL se expone en el puerto `5433` de tu máquina para evitar conflictos con el puerto local 5432.*

### 2. Ejecutar el Pipeline ETL (Python)
Crea y activa un entorno virtual de Python, instala dependencias y ejecuta la carga:
```bash
# Crear entorno virtual e instalar librerías
python3 -m venv .venv
.venv/bin/pip install pandas openpyxl sqlalchemy psycopg2-binary

# Correr el pipeline ETL (limpia, valida y carga 292k registros en ~35 segundos)
.venv/bin/python etl/etl_nomina.py --mode initial --chunksize 10000
```

### 3. Ejecutar la API REST (Node.js)
Accede a la carpeta de backend, instala las dependencias e inicia el servidor en modo desarrollo:
```bash
cd backend
npm install
npm run dev
```
*El backend se ejecutará en `http://localhost:3000`. Puedes validar opcionalmente los endpoints ejecutando `./test_endpoints.sh` en otra terminal dentro de la misma carpeta.*

### 4. Ejecutar el Dashboard (React)
Accede a la carpeta de frontend, instala las dependencias e inicia el servidor de desarrollo de Vite:
```bash
cd ../frontend
npm install
npm run dev
```
*El dashboard se levantará en **`http://localhost:5173`**. Abre esta URL en tu navegador.*

---

## Características de Diseño Contable (Dashboard)

* **Filtro de Quincenas Integrado:** La línea de tiempo superior simula talonarios perforados físicos. Puedes moverte entre periodos haciendo clic o usando las **flechas izquierda/derecha de tu teclado**.
* **Visualización de Balances:** Gráficas con la paleta contable tradicional (verde papel de fondo, tinta índigo, percepciones en oro y deducciones en rojo).
* **Talón de Pago Digitalizado:** Al hacer clic en un empleado, el sistema renderiza un recibo de nómina con bordes perforados en CSS, desgloses detallados y soporte nativo para impresión.
* **Seguridad y Accesibilidad:** Enmascaramiento preventivo de RFCs en logs y analítica, cifras monoespaciadas para correcta alineación y manejo fluido del estado asíncrono con React Query.
