# API de Consulta de Nóminas

API RESTful desarrollada en Node.js y Express para consultar y reportar información de nómina cargada en PostgreSQL.

---

## Requisitos Previos

* Node.js (v18 o superior)
* Base de datos PostgreSQL en funcionamiento (con el esquema de nóminas cargado)

---

## Instalación y Configuración

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia el archivo `.env.example` como `.env` y edita los valores con las credenciales de tu base de datos:
   ```bash
   cp .env.example .env
   ```

---

## Modos de Ejecución

* **Desarrollo (con recarga automática mediante nodemon):**
  ```bash
  npm run dev
  ```

* **Producción:**
  ```bash
  npm start
  ```

---

## Documentación de Endpoints

### 1. Estado del Servidor
* **`GET /health`**
  * **Descripción:** Verifica el estado de salud de la API.
  * **Ejemplo de respuesta (200 OK):**
    ```json
    {
      "status": "ok",
      "timestamp": "2026-07-09T20:31:53.000Z"
    }
    ```

### 2. Empleados
* **`GET /api/empleados`**
  * **Descripción:** Retorna la lista paginada de empleados únicos (sin duplicar RFC).
  * **Query Params:**
    * `search`: Búsqueda parcial e insensible a mayúsculas por RFC o Nombre.
    * `page`: Número de página (Por defecto: `1`).
    * `limit`: Cantidad de resultados (Por defecto: `20`, máximo: `100`).
  * **Ejemplo de respuesta (200 OK):**
    ```json
    {
      "data": [
        { "rfc": "AASL980830F96", "nom_emp": "ABRAHAM SALAZAR LESLIE SAHIAN" }
      ],
      "pagination": {
        "total": 10957,
        "page": 1,
        "limit": 1,
        "totalPages": 10957
      }
    }
    ```

* **`GET /api/empleados/:rfc`**
  * **Descripción:** Retorna el historial de registros de nómina de un empleado específico ordenado cronológicamente.
  * **Ejemplo de respuesta (200 OK):**
    ```json
    {
      "rfc": "AEBG620203SV1",
      "nombre": "ABREGO BATREZ GILBERTO",
      "historial": [
        {
          "num_cons": 618,
          "rfc": "AEBG620203SV1",
          "nom_emp": "ABREGO BATREZ GILBERTO",
          "tot_net_cheque": "3914.67",
          "qna_pago": 201806
          // ... resto de propiedades del registro maestro
        }
      ]
    }
    ```

### 3. Nómina
* **`GET /api/nomina`**
  * **Descripción:** Lista los registros maestros de nómina. No incluye los conceptos de detalle por desempeño.
  * **Query Params:**
    * `unidad`, `subunidad`, `cat_puesto`, `qna_ini`, `qna_fin` (Filtros exactos opcionales).
    * `page`, `limit` (Paginación).
  * **Ejemplo de respuesta (200 OK):**
    ```json
    {
      "data": [
        {
          "num_cons": 0,
          "rfc": "AAAA540923MV5",
          "nom_emp": "ADAME ALBA ALFONSO",
          "tot_net_cheque": "253.67",
          "qna_pago": 201806
        }
      ],
      "pagination": { "total": 15401, "page": 1, "limit": 1, "totalPages": 15401 }
    }
    ```

* **`GET /api/nomina/:num_cons`**
  * **Descripción:** Detalle completo de un registro de nómina por su consecutivo, incluyendo un desglose separado de percepciones y deducciones.
  * **Ejemplo de respuesta (200 OK):**
    ```json
    {
      "num_cons": 0,
      "rfc": "AAAA540923MV5",
      "nom_emp": "ADAME ALBA ALFONSO",
      "tot_net_cheque": "253.67",
      "percepciones": [
        { "concepto": "1", "importe": 200.36, "qna_ini": 201806, "qna_fin": 201806 }
      ],
      "deducciones": [
        { "concepto": "51", "importe": 43.42, "qna_ini": 201806, "qna_fin": 201806 }
      ]
    }
    ```

### 4. Reportes
* **`GET /api/reportes/por-unidad`**
  * **Descripción:** Totales acumulados de percepciones, deducciones y neto agrupados por unidad para una quincena específica.
  * **Query Params:**
    * `qna` (**Requerido**): Quincena a reportar (ej. `201806`).
    * `subunidad`: Si se envía `true`, desglosa y agrupa el reporte también por subunidad.
  * **Ejemplo de respuesta (200 OK):**
    ```json
    {
      "qna": 201806,
      "groupedBySubunidad": false,
      "data": [
        {
          "etiqueta": "Unidad 10",
          "unidad": 10,
          "total_percepciones": 68462073.34,
          "total_deducciones": 26852326.09,
          "total_neto": 41609747.25
        }
      ]
    }
    ```

* **`GET /api/reportes/conceptos`**
  * **Descripción:** Sumatoria monetaria de cada concepto ordenados de mayor a menor importancia financiera.
  * **Query Params:**
    * `qna_start`, `qna_end` (Filtros de rango de quincenas opcionales).
  * **Ejemplo de respuesta (200 OK):**
    ```json
    {
      "filters": { "qna_start": null, "qna_end": null },
      "data": [
        {
          "etiqueta": "C-1 (P)",
          "concepto": "1",
          "perc_ded": "P",
          "total_importe": 43902461.62
        }
      ]
    }
    ```
