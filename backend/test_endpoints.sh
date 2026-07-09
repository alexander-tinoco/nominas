#!/bin/bash
API_URL="http://localhost:3000"

echo "=== INICIANDO PRUEBA DE ENDPOINTS ==="
echo ""

echo "1. GET /health (Salud del servidor)"
curl -s "$API_URL/health" | json_pp
echo ""

echo "2. GET /api/empleados?limit=2&page=1 (Paginación de empleados)"
curl -s "$API_URL/api/empleados?limit=2&page=1" | json_pp
echo ""

echo "3. GET /api/empleados?search=GILBERTO&limit=1 (Búsqueda por filtro)"
curl -s "$API_URL/api/empleados?search=GILBERTO&limit=1" | json_pp
echo ""

echo "4. GET /api/empleados/AEBG620203SV1 (Detalle por RFC)"
curl -s "$API_URL/api/empleados/AEBG620203SV1" | json_pp | head -n 25
echo "..."
echo ""

echo "5. GET /api/empleados/NON_EXISTENT (404 de RFC inexistente)"
curl -s -w "\nHTTP Status: %{http_code}\n" "$API_URL/api/empleados/NON_EXISTENT"
echo ""

echo "6. GET /api/nomina?limit=1&page=2 (Paginación de nómina)"
curl -s "$API_URL/api/nomina?limit=1&page=2" | json_pp
echo ""

echo "7. GET /api/nomina?unidad=15&subunidad=4&limit=1 (Filtros de nómina)"
curl -s "$API_URL/api/nomina?unidad=15&subunidad=4&limit=1" | json_pp
echo ""

echo "8. GET /api/nomina/0 (Detalle de nómina num_cons con JOIN y desglose)"
curl -s "$API_URL/api/nomina/0" | json_pp | head -n 35
echo "..."
echo ""

echo "9. GET /api/nomina/999999 (404 de num_cons inexistente)"
curl -s -w "\nHTTP Status: %{http_code}\n" "$API_URL/api/nomina/999999"
echo ""

echo "10. GET /api/reportes/por-unidad?qna=201806 (Reporte por unidad)"
curl -s "$API_URL/api/reportes/por-unidad?qna=201806" | json_pp | head -n 20
echo "..."
echo ""

echo "11. GET /api/reportes/conceptos?qna_start=201806&qna_end=201806 (Reporte de conceptos en rango)"
curl -s "$API_URL/api/reportes/conceptos?qna_start=201806&qna_end=201806" | json_pp | head -n 20
echo "..."
echo ""

echo "=== PRUEBA DE ENDPOINTS FINALIZADA ==="
