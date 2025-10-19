# Conectar desde Windows a PostgreSQL en Ubuntu

Esta guía te ayudará a configurar PostgreSQL en Ubuntu y conectarte desde tu aplicación en Windows.

## Escenario 1: Ubuntu en WSL2 (Windows Subsystem for Linux)

### 1. Instalar PostgreSQL en Ubuntu (WSL2)

\`\`\`bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Iniciar servicio
sudo service postgresql start

# Verificar que esté corriendo
sudo service postgresql status
\`\`\`

### 2. Configurar PostgreSQL

\`\`\`bash
# Acceder a PostgreSQL como usuario postgres
sudo -u postgres psql

# Dentro de psql, ejecutar estos comandos:
CREATE DATABASE gestor_horas;
CREATE USER gestor_user WITH PASSWORD 'MiPassword123!';
GRANT ALL PRIVILEGES ON DATABASE gestor_horas TO gestor_user;

# Salir de psql
\q
\`\`\`

### 3. Configurar acceso desde Windows

\`\`\`bash
# Editar archivo de configuración de PostgreSQL
sudo nano /etc/postgresql/*/main/postgresql.conf

# Buscar la línea #listen_addresses y cambiarla a:
listen_addresses = '*'

# Guardar (Ctrl+O) y salir (Ctrl+X)

# Editar archivo de autenticación
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Agregar al final del archivo:
host    all             all             0.0.0.0/0               md5

# Guardar y salir

# Reiniciar PostgreSQL
sudo service postgresql restart
\`\`\`

### 4. Obtener IP de WSL2

\`\`\`bash
# En Ubuntu (WSL2), ejecutar:
ip addr show eth0 | grep inet | awk '{print $2}' | cut -d/ -f1

# Anota la IP que aparece (ejemplo: 172.18.0.2)
\`\`\`

### 5. Configurar tu proyecto en Windows

En tu proyecto de Windows, crea el archivo `.env.local`:

\`\`\`env
# Usar la IP de WSL2 que obtuviste
DATABASE_URL=postgresql://gestor_user:MiPassword123!@172.18.0.2:5432/gestor_horas
SESSION_SECRET=genera_un_secreto_aleatorio_de_al_menos_32_caracteres
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 6. Ejecutar scripts de base de datos

Desde Windows, en la carpeta de tu proyecto:

\`\`\`bash
# Instalar dependencias si no lo has hecho
npm install

# Ejecutar scripts de inicialización
npm run db:init
npm run db:seed
\`\`\`

O manualmente desde Ubuntu:

\`\`\`bash
# Copiar los scripts a Ubuntu (desde Windows)
# Luego en Ubuntu:
psql -U gestor_user -d gestor_horas -f scripts/001-create-schema.sql
psql -U gestor_user -d gestor_horas -f scripts/002-seed-data.sql
\`\`\`

---

## Escenario 2: Ubuntu en Máquina Virtual o Servidor Separado

### 1. Instalar PostgreSQL en Ubuntu

\`\`\`bash
sudo apt update && sudo apt upgrade -y
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql
sudo systemctl start postgresql
\`\`\`

### 2. Configurar PostgreSQL

\`\`\`bash
sudo -u postgres psql

CREATE DATABASE gestor_horas;
CREATE USER gestor_user WITH PASSWORD 'MiPassword123!';
GRANT ALL PRIVILEGES ON DATABASE gestor_horas TO gestor_user;
\q
\`\`\`

### 3. Configurar firewall en Ubuntu

\`\`\`bash
# Permitir conexiones a PostgreSQL desde tu red local
sudo ufw allow 5432/tcp

# O solo desde tu IP de Windows específica (más seguro)
sudo ufw allow from TU_IP_WINDOWS to any port 5432
\`\`\`

### 4. Configurar PostgreSQL para aceptar conexiones remotas

\`\`\`bash
sudo nano /etc/postgresql/*/main/postgresql.conf
# Cambiar: listen_addresses = '*'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Agregar: host    all    all    TU_IP_WINDOWS/32    md5
# O para toda la red local: host    all    all    192.168.1.0/24    md5

sudo systemctl restart postgresql
\`\`\`

### 5. Obtener IP de Ubuntu

\`\`\`bash
# En Ubuntu:
hostname -I
# Anota la primera IP (ejemplo: 192.168.1.100)
\`\`\`

### 6. Configurar proyecto en Windows

\`\`\`env
DATABASE_URL=postgresql://gestor_user:MiPassword123!@192.168.1.100:5432/gestor_horas
SESSION_SECRET=genera_un_secreto_aleatorio_de_al_menos_32_caracteres
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

---

## Verificar Conexión

### Desde Windows, probar conexión:

\`\`\`bash
# Instalar psql en Windows (opcional)
# O usar Node.js para probar:

node -e "const { neon } = require('@neondatabase/serverless'); const sql = neon(process.env.DATABASE_URL); sql\`SELECT version()\`.then(console.log).catch(console.error)"
\`\`\`

### Iniciar la aplicación:

\`\`\`bash
npm run dev
\`\`\`

Abre http://localhost:3000 y deberías ver la landing page. Haz clic en "Ir al Login" y usa:

**Credenciales de prueba:**
- Matrícula: `ADMIN001`
- Contraseña: `admin123`

---

## Solución de Problemas

### Error: "Connection refused"
- Verifica que PostgreSQL esté corriendo: `sudo service postgresql status`
- Verifica la IP correcta de Ubuntu
- Verifica que el firewall permita conexiones

### Error: "password authentication failed"
- Verifica el usuario y contraseña en DATABASE_URL
- Verifica que el usuario tenga permisos: `GRANT ALL PRIVILEGES...`

### Error: "database does not exist"
- Crea la base de datos: `CREATE DATABASE gestor_horas;`
- Ejecuta los scripts de inicialización

### WSL2: IP cambia al reiniciar
Crea un script para obtener la IP automáticamente:

\`\`\`bash
# En Windows, crear get-wsl-ip.bat:
@echo off
wsl hostname -I
\`\`\`

O usa `localhost` si tienes port forwarding configurado en WSL2.

---

## Comandos Útiles

\`\`\`bash
# Ver bases de datos
sudo -u postgres psql -c "\l"

# Ver usuarios
sudo -u postgres psql -c "\du"

# Conectar a la base de datos
psql -U gestor_user -d gestor_horas -h localhost

# Ver tablas
\dt

# Salir de psql
\q
\`\`\`

## Siguiente Paso

Una vez configurada la conexión, ejecuta:

\`\`\`bash
npm run db:init    # Crear tablas
npm run db:seed    # Insertar datos de prueba
npm run dev        # Iniciar aplicación
\`\`\`

Luego accede a http://localhost:3000 y prueba el login con las credenciales de administrador.
