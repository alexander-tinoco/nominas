# Decision: Caché con Redis para Endpoints de Reportes y Agregaciones

## Status
Aceptado

## Contexto
El cálculo de agregaciones financieras globales (e.g. balances por unidad o rankings de conceptos) para quincenas contables requiere consultas pesadas de base de datos (`SUM` y `GROUP BY` sobre millones de registros indexados). Esto incrementa la carga del CPU en PostgreSQL si múltiples usuarios refrescan la interfaz.

## Decisión
Se decidió introducir **Redis como almacén de caché intermedio** (TTL de 10 minutos) exclusivamente para los endpoints de reportes agregados (`/api/reportes/por-unidad` y `/api/reportes/conceptos`).

## Consecuencias
- **Latencia de sub-milisegundos:** Las peticiones subsecuentes responden en <5ms en lugar de ~50ms.
- **Resiliencia de la Base de Datos:** Libera de hilos de agregación redundantes a PostgreSQL.
- **Consistencia:** Se implementó una invalidación proactiva de caché al detectar la inserción de nuevos datos contables vía el script ETL, evitando que los analistas visualicen información obsoleta.
