# Instalación y Configuración en Windows

## Opción 1: PostgreSQL en Windows (Recomendado)

### Instalación de PostgreSQL

1. **Descargar PostgreSQL**
   - Ve a: https://www.postgresql.org/download/windows/
   - Descarga el instalador de PostgreSQL (versión 15 o superior)
   - Ejecuta el instalador

2. **Durante la instalación:**
   - Puerto: `5432` (por defecto)
   - Contraseña del superusuario (postgres): Elige una contraseña segura
   - Instala pgAdmin 4 (herramienta gráfica incluida)

3. **Verificar instalación**
   \`\`\`bash
   # Abre PowerShell o CMD
   psql --version
   \`\`\`

### Configuración de la Base de Datos

1. **Crear la base de datos**
   \`\`\`bash
   # Abre PowerShell como administrador
   psql -U postgres
   
   # Dentro de psql:
   CREATE DATABASE gestor_horas;
   \q
   \`\`\`

2. **Ejecutar los scripts de creación**
   \`\`\`bash
   # Desde la raíz del proyecto
   psql -U postgres -d gestor_horas -f scripts/001-create-schema.sql
   psql -U postgres -d gestor_horas -f scripts/002-seed-data.sql
   \`\`\`

3. **Configurar variables de entorno**
   - Copia `.env.example` a `.env.local`
   - Edita `.env.local`:
   \`\`\`env
   DATABASE_URL=postgresql://postgres:tu_contraseña@localhost:5432/gestor_horas
   \`\`\`

### Instalar dependencias y ejecutar

\`\`\`bash
npm install
npm run dev
\`\`\`

Abre http://localhost:3000 y usa las credenciales de prueba:
- **Admin**: admin@escuela.edu / admin123
- **Maestro**: maestro@escuela.edu / maestro123
- **Alumno**: 21480680@escuela.edu / alumno123

---

## Opción 2: Docker (Si tienes Docker Desktop)

### Requisitos
- Docker Desktop para Windows instalado

### Pasos

1. **Crear archivo docker-compose.yml** (ya incluido en el proyecto)

2. **Levantar PostgreSQL con Docker**
   \`\`\`bash
   docker-compose up -d
   \`\`\`

3. **Ejecutar scripts de base de datos**
   \`\`\`bash
   # Espera 10 segundos para que PostgreSQL inicie
   docker exec -i gestor-horas-db psql -U postgres -d gestor_horas < scripts/001-create-schema.sql
   docker exec -i gestor-horas-db psql -U postgres -d gestor_horas < scripts/002-seed-data.sql
   \`\`\`

4. **Configurar .env.local**
   \`\`\`env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gestor_horas
   \`\`\`

5. **Ejecutar la aplicación**
   \`\`\`bash
   npm install
   npm run dev
   \`\`\`

---

## Opción 3: Neon (Base de datos en la nube - Gratis para desarrollo)

### Pasos

1. **Crear cuenta en Neon**
   - Ve a: https://neon.tech
   - Crea una cuenta gratuita
   - Crea un nuevo proyecto

2. **Obtener la cadena de conexión**
   - Copia la `DATABASE_URL` que te proporciona Neon
   - Pégala en `.env.local`

3. **Ejecutar scripts**
   - Puedes usar la consola SQL de Neon para ejecutar los scripts
   - O conectarte desde tu terminal:
   \`\`\`bash
   psql "tu_database_url_de_neon" -f scripts/001-create-schema.sql
   psql "tu_database_url_de_neon" -f scripts/002-seed-data.sql
   \`\`\`

4. **Ejecutar la aplicación**
   \`\`\`bash
   npm install
   npm run dev
   \`\`\`

---

## Solución de Problemas

### Error: "psql no se reconoce como comando"
- Agrega PostgreSQL al PATH de Windows:
  - Busca "Variables de entorno" en Windows
  - Edita la variable PATH
  - Agrega: `C:\Program Files\PostgreSQL\15\bin`

### Error de conexión a la base de datos
- Verifica que PostgreSQL esté corriendo:
  - Abre "Servicios" en Windows
  - Busca "postgresql-x64-15"
  - Debe estar en estado "En ejecución"

### Puerto 5432 ocupado
- Cambia el puerto en la instalación de PostgreSQL
- Actualiza la `DATABASE_URL` con el nuevo puerto

---

## Herramientas Útiles

### pgAdmin 4 (Interfaz gráfica)
- Se instala automáticamente con PostgreSQL
- Permite ver y editar la base de datos visualmente
- Útil para verificar que los datos se están guardando correctamente

### DBeaver (Alternativa multiplataforma)
- Descarga: https://dbeaver.io/
- Cliente SQL universal con interfaz moderna
