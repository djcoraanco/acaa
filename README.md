Academia de Cuerdas - Antonio Aquino

Sistema de gestión académica, evaluaciones y control de asistencia.

Instrucciones rápidas para subir este repositorio a GitHub:

1. Si aún no tienes un repo remoto, crea uno en GitHub (ej: `git@github.com:usuario/acaa.git`).
2. Ejecuta el script para inicializar y subir todo:

```bash
chmod +x scripts/push-to-github.sh
scripts/push-to-github.sh git@github.com:TU_USUARIO/TU_REPO.git main
```

Si prefieres usar HTTPS con token, usa la URL HTTPS en lugar de la SSH remote.

Despliegue recomendado:

- Para el backend completo, usa tu VPS con Docker + Portainer (contiene `docker-compose.yml`).
- Para CDN/hosting del frontend, puedes desplegar solo el `dist` en Vercel/Netlify.

Archivos importantes:

- `server.ts` - servidor Express/TypeScript
- `server/db.ts` - manejo de SQLite
- `docker-compose.yml` - stack para Docker/Portainer

Si quieres que haga el push ahora, proporciona la URL remota y confirma si tu máquina tiene acceso SSH configurado.

# 🎻 Academia de Cuerdas Antonio Aquino

### Sistema de Gestión Académica, Evaluaciones, Asistencias y Auditoría

Sistema web integral diseñado para la gestión de cátedras de cuerdas (Violín, Viola, Violonchelo, Contrabajo) y secciones grupales de lectura musical. Incluye evaluaciones semanales, notas técnicas, repertorios, reportes de notas mensuales y semestrales, control de asistencia, auditoría de cambios por profesor y base de datos SQLite persistente.

---

## 🚀 Características Principales

- **Gestión de Instrumentos y Grupos:** Alumnos por profesor, cátedras individuales y secciones colectivas de lectura musical.
- **Evaluaciones y Asistencias:** Calificaciones semana a semana, observaciones pedagógicas y control de puntualidad/asistencia.
- **Boletines de Calificaciones (Admin):** Generación y exportación de reportes mensuales y consolidados semestrales.
- **Módulo de Auditoría y Conexiones:** Monitoreo para el Administrador de IPs, dispositivos, ubicaciones y registro cronológico de cambios realizados por cada profesor.
- **Base de Datos SQLite Persistente:** Almacenamiento local seguro y opción de descarga/respaldo directo en formatos `.sqlite` y `.json`.
- **Despliegue Listo para Contenedores:** Dockerfile multi-etapa optimizado y `docker-compose.yml` compatible al 100% con **Portainer**, Docker Swarm o servidores VPS.

---

## 🔐 Credenciales Iniciales de Acceso

| Rol               | Usuario                | Contraseña             | Notas                                                                          |
| :---------------- | :--------------------- | :--------------------- | :----------------------------------------------------------------------------- |
| **Administrador** | `admin`                | `12345`                | Cambiar desde el botón **"Clave"** o panel de auditoría tras el primer ingreso |
| **Profesores**    | Asignados por el Admin | Asignadas por el Admin | Cada profesor inicia con formulario de login vacío y privado                   |

---

## 📦 Estructura de Archivos para Despliegue

```text
├── Dockerfile              # Construcción multi-stage ligera y segura (Node 22 Alpine, usuario no-root)
├── docker-compose.yml      # Stack para despliegue directo en Portainer o Docker Compose
├── .dockerignore           # Exclusión de archivos temporales para builds rápidos
├── .gitignore              # Protección para no subir datos sensibles ni archivos binarios
├── server.ts               # Servidor Express + API REST + Middleware SPA de producción
├── server/
│   └── db.ts               # Manejo y persistencia de SQLite (sql.js)
├── data/
│   └── .gitkeep            # Directorio montado como volumen persistente en Docker (/app/data)
└── src/                    # Frontend en React 19 + TypeScript + Tailwind CSS
```

---

## 📤 Paso 1: Subir el Proyecto a GitHub

1. Inicializa el repositorio Git en tu máquina local si aún no lo has hecho:

   ```bash
   git init
   ```

2. Añade los archivos y haz el primer commit:

   ```bash
   git add .
   git commit -m "feat: Sistema Academia de Cuerdas listo para Portainer y Docker"
   ```

3. Vincula tu repositorio remoto de GitHub (crea un nuevo repo en https://github.com/new):
   ```bash
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```

---

## 🐳 Paso 2: Despliegue en Portainer

Hay dos formas muy sencillas de montarlo en Portainer:

### Opción A: Despliegue Directo desde GitHub (Recomendado para Actualizaciones Fáciles)

1. Abre tu panel de **Portainer**.
2. Dirígete a **Stacks** en el menú lateral y haz clic en **Add stack**.
3. Ingresa un nombre para el stack (por ejemplo: `academia-cuerdas`).
4. En **Build method**, selecciona **Repository**.
5. Completa los datos:
   - **Repository URL:** `https://github.com/TU_USUARIO/TU_REPOSITORIO.git`
   - **Repository reference:** `refs/heads/main` (o `main`)
   - **Compose path:** `docker-compose.yml`
6. _(Opcional)_ Si tu repositorio es privado, activa **Authentication** e introduce tu usuario y un Personal Access Token (PAT) de GitHub.
7. _(Opcional)_ Activa **Automatic updates** (Webhook o Polling) para que cada vez que hagas `git push` a GitHub, Portainer recompile y actualice la app automáticamente.
8. Haz clic en el botón inferior **Deploy the stack**.

---

### Opción B: Despliegue Pegando el `docker-compose.yml` (Web Editor)

1. En Portainer, ve a **Stacks** ➔ **Add stack**.
2. Asigna un nombre (ej. `academia-cuerdas`).
3. En **Build method**, selecciona **Web editor**.
4. Pega el contenido de `docker-compose.yml`:

   ```yaml
   version: "3.8"

   services:
     academia-app:
       build:
         context: .
         dockerfile: Dockerfile
       image: academia-cuerdas:latest
       container_name: academia-cuerdas
       restart: unless-stopped
       ports:
         - "3000:3000"
       volumes:
         - academia_data:/app/data
       environment:
         - NODE_ENV=production
         - PORT=3000
         - DATA_DIR=/app/data
         - DATABASE_FILE=/app/data/academia.sqlite
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
         interval: 30s
         timeout: 5s
         retries: 3
         start_period: 10s

   volumes:
     academia_data:
       name: academia_data
       driver: local
   ```

5. Haz clic en **Deploy the stack**.

---

## 💻 Paso 3: Despliegue Rápido en Terminal (Docker Compose CLI)

Si prefieres levantarlo desde la terminal en un servidor Ubuntu/Debian:

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
cd TU_REPOSITORIO

# Construir y levantar en segundo plano
docker compose up -d --build

# Ver logs en tiempo real
docker compose logs -f
```

La aplicación estará accesible en:
👉 `http://IP_DE_TU_SERVIDOR:3000`

---

## 💾 Persistencia y Seguridad de Datos

1. **Volumen Docker `academia_data`:**
   - La base de datos SQLite se almacena en el volumen persistente de Docker en la ruta `/app/data/academia.sqlite`.
   - Aunque detengas, borres o reconstruyas el contenedor con una nueva versión del código, **los datos nunca se perderán**.

2. **Descarga de Respaldo desde la Aplicación:**
   - El Administrador puede hacer clic en el botón con ícono de base de datos (`Respaldos`) en la cabecera superior.
   - Podrá descargar una copia exacta de la base de datos SQLite (`.sqlite`) o una copia en formato legible `.json`.

3. **Seguridad del Contenedor:**
   - El Dockerfile ejecuta la aplicación bajo el usuario sin privilegios `node` (UID 1000), bloqueando ataques de escalada de privilegios a nivel de sistema operativo.
   - Cuenta con healthcheck nativo en `/api/health` que reporta el estado de salud al dashboard de Portainer.

---

## 🌐 Configuración con Dominio y SSL (Nginx Proxy Manager / Traefik / Caddy)

Si usas un gestor de proxy inverso con certificado SSL (HTTPS):

- **Forward Hostname / IP:** `academia-cuerdas` (o la IP local del servidor Docker)
- **Forward Port:** `3000`
- **Websockets Support:** Activado
- **Block Common Exploits:** Activado
