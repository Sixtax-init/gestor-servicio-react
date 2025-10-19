# Instalación del Sistema Gestor de Horas

## Requisitos Previos

- Node.js 18+ 
- PostgreSQL 12+
- Sistema operativo Linux (Ubuntu/Debian recomendado)

## Paso 1: Instalar PostgreSQL

\`\`\`bash
# Actualizar repositorios
sudo apt update

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Verificar instalación
sudo systemctl status postgresql
\`\`\`

## Paso 2: Configurar Base de Datos

\`\`\`bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Dentro de psql, ejecutar:
CREATE DATABASE gestor_horas;
CREATE USER gestor_user WITH PASSWORD 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE gestor_horas TO gestor_user;
\q
\`\`\`

## Paso 3: Configurar el Proyecto

\`\`\`bash
# Clonar o copiar el proyecto
cd /ruta/al/proyecto

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env.local

# Editar .env.local con tus credenciales
nano .env.local
\`\`\`

Configurar en `.env.local`:
\`\`\`
DATABASE_URL=postgresql://gestor_user:tu_contraseña_segura@localhost:5432/gestor_horas
SESSION_SECRET=genera_un_secreto_aleatorio_aqui
\`\`\`

## Paso 4: Ejecutar Scripts de Base de Datos

Los scripts SQL se encuentran en la carpeta `scripts/`:

\`\`\`bash
# Ejecutar script de creación de esquema
psql -U gestor_user -d gestor_horas -f scripts/001-create-schema.sql

# Ejecutar script de datos iniciales
psql -U gestor_user -d gestor_horas -f scripts/002-seed-data.sql
\`\`\`

## Paso 5: Iniciar la Aplicación

\`\`\`bash
# Modo desarrollo
npm run dev

# Modo producción
npm run build
npm start
\`\`\`

## Credenciales Iniciales

**Administrador:**
- Matrícula: `ADMIN001`
- Contraseña: `admin123`

**IMPORTANTE:** Cambiar la contraseña del administrador después del primer inicio de sesión.

## Configuración de Firewall (Opcional)

\`\`\`bash
# Permitir tráfico en puerto 3000 (Next.js)
sudo ufw allow 3000

# Permitir PostgreSQL solo localmente (más seguro)
sudo ufw deny 5432
\`\`\`

## Respaldos de Base de Datos

\`\`\`bash
# Crear respaldo
pg_dump -U gestor_user gestor_horas > backup_$(date +%Y%m%d).sql

# Restaurar respaldo
psql -U gestor_user -d gestor_horas < backup_20250119.sql
\`\`\`

## Solución de Problemas

### Error de conexión a PostgreSQL
\`\`\`bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
\`\`\`

### Error de permisos
\`\`\`bash
# Dar permisos al usuario
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE gestor_horas TO gestor_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gestor_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gestor_user;
