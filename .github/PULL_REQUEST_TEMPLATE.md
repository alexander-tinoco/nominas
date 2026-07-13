## Descripción del Cambio

Por favor, incluye un resumen de los cambios introducidos y qué problema resuelve. Menciona también los tickets o issues relacionados (ej. "Cierra #12").

---

## Checklist de Revisión

Por favor, marca con una `x` los elementos que aplican a esta contribución antes de solicitar la revisión:

- [ ] **Estilo de código:** Los cambios cumplen con las reglas del linter en la carpeta correspondiente (`npm run lint` u `oxlint`).
- [ ] **Tipado estricto (Frontend):** Al ejecutar `npx tsc --noEmit` en el frontend, compila de forma limpia y sin errores.
- [ ] **Tests locales pasados:**
  - [ ] Los tests del backend siguen pasando al 100% (`npm test` en backend).
  - [ ] Los tests de componentes del frontend siguen pasando al 100% (`npm test` en frontend).
  - [ ] Los tests del ETL de Python pasan al 100% (`pytest` con `PYTHONPATH=.`).
- [ ] **Integridad de Contrato API:** No se alteró la estructura ni el formato de respuesta JSON original de los endpoints REST existentes.
- [ ] **Docker:** El archivo `docker-compose.yml` y los correspondientes `Dockerfile` compilan correctamente.
- [ ] **Documentación:** Se actualizó el archivo `README.md` o se agregaron anotaciones OpenAPI de Swagger si los cambios involucran nuevos endpoints o filtros.
- [ ] **Commits:** El formato de los mensajes de commit sigue la convención de `Conventional Commits` descrita en [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Capturas de Pantalla (Opcional)

Si el cambio afecta de manera visual al Frontend (Dashboard), por favor incluye imágenes del comportamiento del antes y después.
