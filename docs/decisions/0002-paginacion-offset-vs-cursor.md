# Decision: Paginación OFFSET vs Cursor para Búsquedas Contables

## Status
Aceptado

## Contexto
El visor maneja ~292,000 registros detallados. Los usuarios realizan filtros avanzados muy dinámicos (rfc, unidad, puesto, rango de sueldos, edad) que reducen el conjunto de datos de forma drástica.

## Decisión
Se decidió implementar **Paginación clásica OFFSET** (`LIMIT / OFFSET` en PostgreSQL) en lugar de paginación por Cursor (Keyset).

## Consecuencias
- **Búsqueda Bidireccional Fácil:** Facilita la navegación rápida a cualquier página específica en la UI del libro contable (ej. saltar directamente a la página 5 o 10), lo cual es difícil en esquemas de cursor puro.
- **Rendimiento Aceptable:** Aunque `OFFSET` se degrada en tablas gigantescas al pedir páginas lejanas, el impacto en un dataset de <300k filas con índices optimizados en `unidad`, `qna_pago` y `cat_puesto` es insignificante (<15ms).
- **Simplicidad:** La lógica del backend y frontend se mantiene limpia y acoplada a las consultas tradicionales de paginación de tablas.
