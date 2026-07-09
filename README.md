# Proyecto de Nóminas (ETL & API REST)

Este repositorio contiene una solución completa para procesar datos de nómina desde archivos Excel y exponerlos a través de una API RESTful.

---

## Estructura del Repositorio

El proyecto se divide en dos secciones principales:

* **[etl/](file:///home/alexander-tinoco/Documentos/github/nominas/etl/):** Contiene el pipeline ETL escrito en Python para extraer, limpiar, validar y cargar los datos desde los archivos Excel a una base de datos PostgreSQL.
  * **[etl_nomina.py](file:///home/alexander-tinoco/Documentos/github/nominas/etl/etl_nomina.py):** Script consolidado y parametrizado del pipeline ETL.
  * **[helpers/](file:///home/alexander-tinoco/Documentos/github/nominas/etl/helpers/):** Scripts auxiliares de desarrollo utilizados para las fases individuales de prueba (extracción, transformación, carga y validación).
* **[backend/](file:///home/alexander-tinoco/Documentos/github/nominas/backend/):** API RESTful construida con Node.js, Express y PostgreSQL para consultar los datos cargados.
  * **[src/](file:///home/alexander-tinoco/Documentos/github/nominas/backend/src/):** Código fuente de la API (controladores, rutas, middlewares y configuración de base de datos).
  * **[test_endpoints.sh](file:///home/alexander-tinoco/Documentos/github/nominas/backend/test_endpoints.sh):** Script en Bash para probar de manera automatizada todos los endpoints de la API.
  * **[README.md](file:///home/alexander-tinoco/Documentos/github/nominas/backend/README.md):** Documentación detallada de los endpoints de la API con ejemplos de solicitudes y respuestas.
* **[raw_data/](file:///home/alexander-tinoco/Documentos/github/nominas/raw_data/):** Carpeta destinada a almacenar los archivos Excel de entrada (`archivo_1.xlsx` y `archivo_2.xlsx`).
* **[docker-compose.yml](file:///home/alexander-tinoco/Documentos/github/nominas/docker-compose.yml):** Archivo de configuración de Docker Compose para levantar una base de datos PostgreSQL 16 local.

---

## Cómo Empezar

### 1. Iniciar la Base de Datos (Docker)
Para levantar el contenedor PostgreSQL en segundo plano:
```bash
docker compose up -d
```
*Nota: PostgreSQL se expone en el puerto `5433` para evitar conflictos con instancias existentes del puerto `5432`.*

### 2. Ejecutar el Pipeline ETL (Python)
Asegúrate de tener configurado tu entorno virtual en la raíz del proyecto e instala las dependencias de Python si no lo has hecho:
```bash
.venv/bin/pip install pandas openpyxl sqlalchemy psycopg2-binary
```
Para ejecutar la carga de datos maestros y detalles a PostgreSQL:
```bash
.venv/bin/python etl/etl_nomina.py --mode initial --chunksize 10000
```

### 3. Ejecutar la API REST (Node.js)
Accede a la carpeta del backend, configura las variables en `.env` e inicia la aplicación:
```bash
cd backend
npm install
npm run dev
```

Para probar que todos los endpoints funcionan de forma automática:
```bash
# Estando dentro de la carpeta /backend
chmod +x test_endpoints.sh
./test_endpoints.sh
```
