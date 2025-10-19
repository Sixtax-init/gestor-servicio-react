# Configuración Rápida de PostgreSQL

## Paso 1: Configurar PostgreSQL en Ubuntu

### 1.1 Acceder a PostgreSQL
\`\`\`bash
sudo -u postgres psql
\`\`\`

### 1.2 Crear la base de datos y usuario
Ejecuta estos comandos dentro de `psql`:

\`\`\`sql
-- Crear usuario
CREATE USER gestor_admin WITH PASSWORD 'tu_password_seguro';

-- Crear base de datos
CREATE DATABASE gestor_horas OWNER gestor_admin;

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE gestor_horas TO gestor_admin;

-- Salir
\q
\`\`\`

### 1.3 Configurar acceso remoto (si Windows y Ubuntu están separados)

**Si usas WSL2, salta este paso.**

Edita el archivo de configuración:
\`\`\`bash
sudo nano /etc/postgresql/*/main/postgresql.conf
\`\`\`

Busca y modifica:
\`\`\`
listen_addresses = '*'
\`\`\`

Edita el archivo de autenticación:
\`\`\`bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
\`\`\`

Agrega al final:
\`\`\`
host    all             all             0.0.0.0/0               md5
\`\`\`

Reinicia PostgreSQL:
\`\`\`bash
sudo systemctl restart postgresql
\`\`\`

### 1.4 Obtener la IP de Ubuntu

**Para WSL2:**
\`\`\`bash
hostname -I
\`\`\`
Usa la primera IP que aparece (ejemplo: 172.x.x.x)

**Para VM o servidor:**
\`\`\`bash
ip addr show
\`\`\`
Busca la IP en la interfaz de red principal.

---

## Paso 2: Ejecutar los Scripts SQL

### 2.1 Copiar scripts a Ubuntu

Desde Windows, copia los archivos SQL a Ubuntu:

**Si usas WSL2:**
\`\`\`bash
# En Ubuntu/WSL2
cd ~
mkdir gestor-horas-sql
\`\`\`

Luego copia manualmente los archivos desde:
`C:\Users\SixPC\OneDrive - Instituto Tecnológico de Nuevo Leon\Escritorio\gestor-horas\scripts`

A la carpeta en Ubuntu.

**O usa este comando en WSL2:**
\`\`\`bash
cp /mnt/c/Users/SixPC/OneDrive\ -\ Instituto\ Tecnológico\ de\ Nuevo\ Leon/Escritorio/gestor-horas/scripts/*.sql ~/gestor-horas-sql/
\`\`\`

### 2.2 Ejecutar los scripts

\`\`\`bash
# Script 1: Crear tablas
psql -U gestor_admin -d gestor_horas -f ~/gestor-horas-sql/001-create-schema.sql

# Script 2: Datos de prueba
psql -U gestor_admin -d gestor_horas -f ~/gestor-horas-sql/002-seed-data.sql
\`\`\`

Te pedirá la contraseña que creaste en el paso 1.2.

---

## Paso 3: Configurar Variables de Entorno en Windows

### 3.1 Crear archivo .env.local

En tu proyecto de Windows, crea el archivo `.env.local` en la raíz:

\`\`\`env
# Conexión a PostgreSQL
DATABASE_URL="postgresql://gestor_admin:tu_password_seguro@IP_DE_UBUNTU:5432/gestor_horas"

# Ejemplo para WSL2:
# DATABASE_URL="postgresql://gestor_admin:tu_password_seguro@172.20.10.2:5432/gestor_horas"

# Ejemplo para servidor local:
# DATABASE_URL="postgresql://gestor_admin:tu_password_seguro@192.168.1.100:5432/gestor_horas"

# Ejemplo para localhost (si PostgreSQL está en Windows):
# DATABASE_URL="postgresql://gestor_admin:tu_password_seguro@localhost:5432/gestor_horas"
\`\`\`

**Reemplaza:**
- `tu_password_seguro` con la contraseña del paso 1.2
- `IP_DE_UBUNTU` con la IP que obtuviste en el paso 1.4

---

## Paso 4: Probar la Conexión

### 4.1 Reiniciar el servidor de desarrollo

En Windows:
\`\`\`bash
# Detén el servidor si está corriendo (Ctrl+C)
npm run dev
\`\`\`

### 4.2 Verificar en el navegador

1. Abre http://localhost:3000
2. Haz clic en "Iniciar Sesión"
3. Usa las credenciales de prueba:
   - **Administrador:**
     - Matrícula: `ADMIN001`
     - Contraseña: `admin123`
   - **Maestro:**
     - Matrícula: `PROF001`
     - Contraseña: `maestro123`
   - **Alumno:**
     - Matrícula: `21480680`
     - Contraseña: `alumno123`

---

## Solución de Problemas

### Error: "Connection refused"
- Verifica que PostgreSQL esté corriendo: `sudo systemctl status postgresql`
- Verifica la IP en DATABASE_URL
- Si usas firewall, permite el puerto 5432

### Error: "password authentication failed"
- Verifica el usuario y contraseña en DATABASE_URL
- Verifica que el usuario tenga permisos: `psql -U postgres -c "\du"`

### Error: "database does not exist"
- Verifica que la base de datos existe: `psql -U postgres -c "\l"`
- Crea la base de datos si no existe (paso 1.2)

### No se ejecutan los scripts SQL
- Verifica la ruta de los archivos
- Verifica que tengas permisos de lectura
- Ejecuta con sudo si es necesario

---

## Resumen Rápido

\`\`\`bash
# En Ubuntu
sudo -u postgres psql
CREATE USER gestor_admin WITH PASSWORD 'tu_password';
CREATE DATABASE gestor_horas OWNER gestor_admin;
GRANT ALL PRIVILEGES ON DATABASE gestor_horas TO gestor_admin;
\q

# Ejecutar scripts
psql -U gestor_admin -d gestor_horas -f ~/gestor-horas-sql/001-create-schema.sql
psql -U gestor_admin -d gestor_horas -f ~/gestor-horas-sql/002-seed-data.sql
\`\`\`

\`\`\`env
# En Windows: .env.local
DATABASE_URL="postgresql://gestor_admin:tu_password@IP_UBUNTU:5432/gestor_horas"
\`\`\`

\`\`\`bash
# En Windows
npm run dev
\`\`\`

Listo, tu sistema está funcionando con PostgreSQL.
