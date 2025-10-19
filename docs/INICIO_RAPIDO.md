# 🚀 Inicio Rápido - Solo con Node.js

## Opción 1: Base de Datos Gratuita en la Nube (Recomendado para testing)

### Paso 1: Obtener Base de Datos PostgreSQL Gratuita

**Usando Neon (Recomendado - 2 minutos)**

1. Ve a https://neon.tech
2. Crea una cuenta gratuita (con GitHub o email)
3. Crea un nuevo proyecto
4. Copia la **Connection String** que te dan (algo como: `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb`)

**Alternativa: Supabase**

1. Ve a https://supabase.com
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Ve a Settings → Database → Connection String
5. Copia la **Connection String** (modo "Session")

### Paso 2: Configurar el Proyecto

1. **Clonar/Descargar el proyecto**
   \`\`\`bash
   # Si aún no lo tienes descargado
   cd gestor-horas-linux
   \`\`\`

2. **Instalar dependencias**
   \`\`\`bash
   npm install
   \`\`\`

3. **Crear archivo .env**
   
   Crea un archivo llamado `.env` en la raíz del proyecto con este contenido:
   
   \`\`\`env
   # Pega aquí tu Connection String de Neon o Supabase
   DATABASE_URL=postgresql://user:password@host/database
   
   # Clave secreta para JWT (puedes usar cualquier texto largo y aleatorio)
   JWT_SECRET=mi-clave-super-secreta-cambiar-en-produccion-12345
   \`\`\`

4. **Inicializar la base de datos**
   \`\`\`bash
   npm run db:init
   \`\`\`
   
   Esto creará todas las tablas necesarias.

5. **Agregar datos de prueba (opcional)**
   \`\`\`bash
   npm run db:seed
   \`\`\`
   
   Esto agregará usuarios de prueba:
   - **Admin**: matrícula `admin`, contraseña `admin123`
   - **Maestro**: matrícula `20240001`, contraseña `maestro123`
   - **Alumno**: matrícula `21480680`, contraseña `alumno123`

### Paso 3: Iniciar el Servidor

\`\`\`bash
npm run dev
\`\`\`

Abre tu navegador en: **http://localhost:3000**

### Paso 4: Probar el Sistema

1. Ve a http://localhost:3000
2. Inicia sesión con cualquiera de los usuarios de prueba
3. Explora el dashboard según tu rol

---

## Opción 2: PostgreSQL Local en Windows

Si prefieres instalar PostgreSQL localmente:

### Paso 1: Instalar PostgreSQL

1. Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/
2. Ejecuta el instalador (versión 15 o superior)
3. Durante la instalación:
   - Puerto: `5432` (default)
   - Contraseña del superusuario: elige una y **recuérdala**
   - Instala Stack Builder: **NO** (no es necesario)

### Paso 2: Crear Base de Datos

Abre **pgAdmin 4** (se instaló con PostgreSQL):

1. Conéctate al servidor local (usa la contraseña que elegiste)
2. Click derecho en "Databases" → "Create" → "Database"
3. Nombre: `gestor_horas`
4. Click "Save"

### Paso 3: Configurar el Proyecto

Crea el archivo `.env`:

\`\`\`env
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/gestor_horas
JWT_SECRET=mi-clave-super-secreta-cambiar-en-produccion-12345
\`\`\`

Luego sigue los pasos 2-5 de la Opción 1.

---

## 🔧 Comandos Útiles

\`\`\`bash
# Iniciar servidor de desarrollo
npm run dev

# Inicializar base de datos (crear tablas)
npm run db:init

# Agregar datos de prueba
npm run db:seed

# Resetear base de datos (CUIDADO: borra todo)
npm run db:reset

# Ver logs de la base de datos
# Los errores de conexión aparecerán en la consola
\`\`\`

---

## ❓ Solución de Problemas

### Error: "connect ECONNREFUSED"

- **Causa**: No puede conectarse a la base de datos
- **Solución**: Verifica que tu `DATABASE_URL` en `.env` sea correcta

### Error: "relation does not exist"

- **Causa**: Las tablas no están creadas
- **Solución**: Ejecuta `npm run db:init`

### Error: "Invalid credentials"

- **Causa**: Usuario o contraseña incorrectos
- **Solución**: Verifica que hayas ejecutado `npm run db:seed` o crea un usuario manualmente

### La página no carga

- **Causa**: El servidor no está corriendo
- **Solución**: Asegúrate de ejecutar `npm run dev` y espera a que diga "Ready"

---

## 📝 Próximos Pasos

Una vez que hayas probado el sistema localmente:

1. **Para producción**: Sigue la guía `INSTALACION.md` para configurar PostgreSQL en tu servidor Linux
2. **Migrar datos**: Exporta los datos de tu base de datos de desarrollo e impórtalos en producción
3. **Configurar archivos**: Sigue `CONFIGURACION_ARCHIVOS.md` para el sistema de subida de archivos

---

## 🎯 Usuarios de Prueba

Después de ejecutar `npm run db:seed`:

| Rol | Matrícula | Contraseña | Descripción |
|-----|-----------|------------|-------------|
| Administrador | `admin` | `admin123` | Acceso completo al sistema |
| Maestro | `20240001` | `maestro123` | Puede crear cursos y tareas |
| Alumno | `21480680` | `alumno123` | Puede inscribirse a cursos |

**⚠️ IMPORTANTE**: Cambia estas contraseñas antes de usar en producción.
