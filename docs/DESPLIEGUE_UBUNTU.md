# Guía de Despliegue en Ubuntu Nativo

Esta guía te ayudará a configurar y ejecutar el proyecto en Ubuntu después de clonarlo desde GitHub.

## Requisitos Previos

- Ubuntu instalado (20.04 o superior)
- Acceso a internet
- Permisos de sudo

## Paso 1: Instalar Node.js y npm

\`\`\`bash
# Actualizar el sistema
sudo apt update
sudo apt upgrade -y

# Instalar Node.js 22.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node -v  # Debe mostrar v22.x.x
npm -v   # Debe mostrar 10.x.x
\`\`\`

## Paso 2: Instalar y Configurar PostgreSQL

\`\`\`bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Iniciar el servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar que está corriendo
sudo systemctl status postgresql
\`\`\`

## Paso 3: Configurar la Base de Datos

\`\`\`bash
# Cambiar al usuario postgres
sudo -u postgres psql

# Dentro de psql, ejecutar:
CREATE DATABASE gestor_horas;
CREATE USER gestor_admin WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE gestor_horas TO gestor_admin;
\q
\`\`\`

## Paso 4: Clonar el Proyecto

\`\`\`bash
# Clonar desde GitHub
cd ~
git clone https://github.com/TU_USUARIO/gestor-horas-linux.git
cd gestor-horas-linux

# Instalar dependencias
npm install
\`\`\`

## Paso 5: Configurar Variables de Entorno

\`\`\`bash
# Crear archivo .env.local
nano .env.local
\`\`\`

Agregar el siguiente contenido (ajusta la contraseña):

\`\`\`env
DATABASE_URL="postgresql://gestor_admin:tu_password_seguro@localhost:5432/gestor_horas"
JWT_SECRET="tu_clave_secreta_muy_larga_y_segura_minimo_32_caracteres"
\`\`\`

Guardar con `Ctrl+O`, Enter, y salir con `Ctrl+X`.

## Paso 6: Inicializar la Base de Datos

\`\`\`bash
# Ejecutar scripts de creación de tablas
PGPASSWORD=tu_password_seguro psql -U gestor_admin -d gestor_horas -f scripts/001-create-schema.sql

# Insertar datos de prueba
PGPASSWORD=tu_password_seguro psql -U gestor_admin -d gestor_horas -f scripts/002-seed-data.sql
\`\`\`

## Paso 7: Crear Carpeta de Uploads

\`\`\`bash
# Crear carpeta para archivos subidos
mkdir -p public/uploads
chmod 755 public/uploads
\`\`\`

## Paso 8: Ejecutar la Aplicación

\`\`\`bash
# Modo desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:3000
\`\`\`

## Paso 9: Probar el Sistema

Abre tu navegador y ve a `http://localhost:3000`

**Credenciales de prueba:**

- **Administrador:**
  - Matrícula: `admin001`
  - Contraseña: `admin123`

- **Maestro:**
  - Matrícula: `20001234`
  - Contraseña: `maestro123`

- **Alumno:**
  - Matrícula: `21480680`
  - Contraseña: `alumno123`

## Configuración para Producción

### Ejecutar en Segundo Plano con PM2

\`\`\`bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Construir la aplicación
npm run build

# Iniciar con PM2
pm2 start npm --name "gestor-horas" -- start

# Configurar para que inicie automáticamente
pm2 startup
pm2 save

# Ver logs
pm2 logs gestor-horas

# Detener
pm2 stop gestor-horas

# Reiniciar
pm2 restart gestor-horas
\`\`\`

### Configurar Nginx como Proxy Inverso (Opcional)

\`\`\`bash
# Instalar Nginx
sudo apt install nginx -y

# Crear configuración
sudo nano /etc/nginx/sites-available/gestor-horas
\`\`\`

Agregar:

\`\`\`nginx
server {
    listen 80;
    server_name tu_dominio.com;  # O tu IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

\`\`\`bash
# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/gestor-horas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

## Solución de Problemas

### Error de conexión a PostgreSQL

\`\`\`bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Verificar que puedes conectarte
psql -U gestor_admin -d gestor_horas -h localhost
\`\`\`

### Error de permisos en uploads

\`\`\`bash
# Dar permisos correctos
chmod -R 755 public/uploads
\`\`\`

### Puerto 3000 ya en uso

\`\`\`bash
# Ver qué proceso usa el puerto
sudo lsof -i :3000

# Matar el proceso (reemplaza PID con el número que aparece)
kill -9 PID
\`\`\`

### Actualizar el proyecto

\`\`\`bash
# Detener la aplicación
pm2 stop gestor-horas

# Actualizar código
git pull origin main

# Reinstalar dependencias si es necesario
npm install

# Reconstruir
npm run build

# Reiniciar
pm2 restart gestor-horas
\`\`\`

## Respaldos de Base de Datos

### Crear respaldo

\`\`\`bash
# Respaldo completo
pg_dump -U gestor_admin -d gestor_horas > backup_$(date +%Y%m%d).sql

# Con contraseña
PGPASSWORD=tu_password_seguro pg_dump -U gestor_admin -d gestor_horas > backup_$(date +%Y%m%d).sql
\`\`\`

### Restaurar respaldo

\`\`\`bash
PGPASSWORD=tu_password_seguro psql -U gestor_admin -d gestor_horas < backup_20250419.sql
\`\`\`

## Seguridad Adicional

### Configurar Firewall

\`\`\`bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Verificar estado
sudo ufw status
\`\`\`

### Cambiar contraseñas por defecto

Una vez que inicies sesión, cambia todas las contraseñas de prueba desde el panel de administrador.

## Monitoreo

\`\`\`bash
# Ver logs de la aplicación
pm2 logs gestor-horas

# Ver uso de recursos
pm2 monit

# Ver estado de PostgreSQL
sudo systemctl status postgresql
