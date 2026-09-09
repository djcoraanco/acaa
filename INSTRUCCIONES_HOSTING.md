# Sistema de Gestión para Academia de Música (SQLite & Roles)

Este proyecto incluye una arquitectura full-stack con base de datos **SQLite**, autenticación de doble rol (**Profesor** y **Administrador**), fichas de alumnos, repertorios, comentarios técnicos y registro de asistencia semanal (Septiembre 2026 - Junio 2027).

---

## 🔑 Credenciales de Acceso por Defecto:

### 1. Rol Administrador:
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Permisos:**
  - Crear nuevos profesores y asignarles sus credenciales de acceso.
  - **Modificar el usuario y la contraseña de cualquier profesor** mediante el botón "Usuario y Clave" en la cabecera de cada cátedra.
  - **Eliminar cátedras y profesores** (con diálogo de confirmación seguro).
  - **Eliminar alumnos** de cualquier cátedra (botón "Quitar Alumno" exclusivo para administradores).
  - Ver y editar todas las fichas de estudiantes de todos los profesores.

### 2. Rol Profesor:
- **Profesores de ejemplo disponibles:**
  - **Piano:** `clara` / `clara123` (Prof. Clara Schumann)
  - **Cuerda (Violín):** `niccolo` / `niccolo123` (Prof. Niccolò Paganini)
  - **Guitarra:** `andres` / `andres123` (Prof. Andrés Segovia)
- **Permisos:**
  - **Solo puede ver y editar a sus propios estudiantes.**
  - Puede agregar nuevos estudiantes a su propia cátedra.
  - **NO PUEDE eliminar alumnos** (el botón está deshabilitado/oculto para profesores y protegido en la API).
  - Puede llenar y editar el repertorio esperado del ciclo, recitales y exámenes.
  - Puede registrar los comentarios de evaluación técnica.
  - Puede marcar la asistencia semanal para todo el curso 2026-2027.
  - No puede ver ni modificar los alumnos de otros profesores, ni agregar ni eliminar cátedras.

---

## 🗄️ Base de Datos SQLite:
- Archivo físico: `data/academia.sqlite`
- Los datos se guardan y persisten automáticamente en cada cambio o actualización.
- En cualquier momento puedes descargar o respaldar el archivo `data/academia.sqlite`.

---

## 🚀 Despliegue y Ejecución:
- **Desarrollo:** `npm run dev` (Inicia el servidor Node.js + Express con Vite en el puerto 3000)
- **Producción:** `npm run build` (Compila el cliente en `dist/` y el servidor en `dist/server.cjs`)
- **Iniciar Producción:** `npm start` (Ejecuta `node dist/server.cjs`)
