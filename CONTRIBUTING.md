# Guía de Contribución

¡Gracias por tu interés en colaborar con el proyecto de nóminas! Para mantener la consistencia, limpieza y calidad del código, por favor lee las siguientes pautas.

---

## 1. Flujo de Trabajo

1. **Crear un Fork** del repositorio oficial.
2. **Crear una rama de característica o corrección** partiendo de `main`:
   ```bash
   git checkout -b feat/nueva-caracteristica
   # o bien:
   git checkout -b fix/correccion-de-bug
   ```
3. **Desarrollar y comprobar de forma local** siguiendo las pautas de estilo y testing.
4. **Hacer commits limpios** siguiendo el estándar de Conventional Commits (ver más abajo).
5. **Enviar un Pull Request** dirigido a la rama `main` del repositorio original.

---

## 2. Convenciones de Código

### Backend (Node.js/Express)
- Utiliza **JavaScript ESM** (ES Modules).
- Los nombres de variables y funciones deben usar `camelCase`.
- Respeta la arquitectura de tres capas: **Controlador** (HTTP mapping) $\rightarrow$ **Servicio** (Lógica de negocio/orquestación) $\rightarrow$ **Repositorio** (SQL directo con pool de conexiones).
- Antes de commitear, corre el formateador y linter:
   ```bash
   cd backend
   npm run lint
   ```

### Frontend (React/Vite/TypeScript)
- Usa **TypeScript estricto** en todo momento. Evita el uso de `any` a menos que sea estrictamente necesario.
- Los componentes deben declararse como constantes usando `React.FC`.
- No dupliques helpers comunes. Helpers matemáticos o de formato deben residir en `frontend/src/utils/`.
- Comprueba que no hay advertencias de tipo antes de proponer cambios:
   ```bash
   cd frontend
   npx tsc --noEmit
   npm run lint
   ```

### ETL (Python)
- Sigue las guías de estilo de **PEP 8**.
- Divide las transformaciones en funciones puras para facilitar su testeo.
- Utiliza anotaciones de tipos en la firma de las funciones cuando sea práctico.

---

## 3. Convenciones de Commits

Seguimos la convención de [Conventional Commits](https://www.conventionalcommits.org/es/). La estructura de los mensajes de commit debe ser:

```text
<tipo>(<alcance>): <descripción corta en minúsculas>

[cuerpo opcional detallado]
```

### Tipos comunes:
- **`feat`**: Nueva funcionalidad para el usuario.
- **`fix`**: Corrección de un error o bug.
- **`docs`**: Cambios únicamente en documentación (ej. README, CONTRIBUTING).
- **`style`**: Cambios de estilo y formato visual o tipográfico que no afectan la lógica del código.
- **`refactor`**: Reestructuración de código que no corrige un bug ni añade funcionalidad.
- **`test`**: Añadir o modificar suites de pruebas.
- **`chore`**: Tareas de mantenimiento, actualización de dependencias o builds.

### Alcances comunes (`scope`):
- `backend`, `frontend`, `etl`, `ci`, `docker`, `docs`

### Ejemplos:
- `feat(api): add age range filter in GET /api/nomina`
- `fix(frontend): repair timeline arrow navigation binding`
- `test(etl): append columns schema validation tests`
- `refactor(backend): isolate db pool queries into reportesRepository`

---

## 4. Pruebas Locales (Mandatorio)

Antes de enviar tu Pull Request, asegúrate de que todos los tests pasen exitosamente de manera local en tu máquina:

```bash
# Correr tests del backend
cd backend && npm test

# Correr tests del frontend
cd frontend && npm test

# Correr tests de Python para el ETL
PYTHONPATH=. pytest etl/tests/
```
