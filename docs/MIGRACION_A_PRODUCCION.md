# 🚀 Migración de Desarrollo a Producción

Esta guía te ayudará a migrar tu sistema desde la base de datos de desarrollo (Neon/Supabase) a tu servidor Linux con PostgreSQL local.

---

## Paso 1: Preparar el Servidor Linux

### Instalar PostgreSQL

\`\`\`bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
\`\`\`

### Crear Base de Datos

\`\`\`bash
# Cambiar a usuario postgres
sudo -u postgres psql

# Dentro de psql:
CREATE DATABASE gestor_horas;
CREATE USER gestor_user WITH PASSWORD 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE gestor_horas TO gestor_user;
\q
\`\`\`

---

## Paso 2: Exportar Datos de Desarrollo

### Opción A: Desde Neon/Supabase

\`\`\`bash
# Instala pg_dump si no lo tienes (viene con PostgreSQL)
# En Windows, usa Git Bash o PowerShell

# Exportar toda la base de datos
pg_dump "postgresql://user:password@host/database" > backup.sql

# O solo los datos (sin estructura)
pg_dump --data-only "postgresql://user:password@host/database" > datos.sql
\`\`\`

### Opción B: Exportar desde la aplicación

Si tienes pocos datos, puedes usar las APIs del sistema para exportar:

\`\`\`bash
# Crear un script de exportación
node scripts/export-data.js
\`\`\`

---

## Paso 3: Importar en Producción

### Transferir archivos al servidor

\`\`\`bash
# Desde tu máquina local
scp backup.sql usuario@tu-servidor:/home/usuario/
scp -r gestor-horas-linux usuario@tu-servidor:/var/www/
\`\`\`

### Importar la base de datos

\`\`\`bash
# En el servidor Linux
psql -U gestor_user -d gestor_horas < backup.sql

# O si solo exportaste datos:
# Primero crea las tablas
psql -U gestor_user -d gestor_horas < scripts/001-create-schema.sql
# Luego importa los datos
psql -U gestor_user -d gestor_horas < datos.sql
\`\`\`

---

## Paso 4: Configurar la Aplicación en Producción

### Instalar Node.js en el servidor

\`\`\`bash
# Instalar Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node -v
npm -v
\`\`\`

### Configurar el proyecto

\`\`\`bash
cd /var/www/gestor-horas-linux

# Instalar dependencias
npm install

# Crear archivo .env de producción
nano .env
\`\`\`

Contenido del `.env` de producción:

\`\`\`env
# Base de datos local
DATABASE_URL=postgresql://gestor_user:tu_contraseña_segura@localhost:5432/gestor_horas

# Clave JWT (genera una nueva, diferente a desarrollo)
JWT_SECRET=clave-super-secreta-de-produccion-muy-larga-y-aleatoria-123456789

# Configuración de archivos
UPLOAD_DIR=/var/www/gestor-horas-linux/uploads
MAX_FILE_SIZE=10485760

# Entorno
NODE_ENV=production
\`\`\`

### Construir la aplicación

\`\`\`bash
npm run build
\`\`\`

---

## Paso 5: Configurar Servidor Web (Nginx)

### Instalar Nginx

\`\`\`bash
sudo apt install nginx
\`\`\`

### Configurar Nginx como proxy reverso

\`\`\`bash
sudo nano /etc/nginx/sites-available/gestor-horas
\`\`\`

Contenido:

\`\`\`nginx
server {
    listen 80;
    server_name tu-dominio.com;  # O tu IP

    # Archivos estáticos
    location /_next/static {
        alias /var/www/gestor-horas-linux/.next/static;
        expires 365d;
        access_log off;
    }

    # Archivos subidos
    location /uploads {
        alias /var/www/gestor-horas-linux/uploads;
        expires 30d;
    }

    # Proxy a Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

Activar el sitio:

\`\`\`bash
sudo ln -s /etc/nginx/sites-available/gestor-horas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

---

## Paso 6: Configurar PM2 (Gestor de Procesos)

### Instalar PM2

\`\`\`bash
sudo npm install -g pm2
\`\`\`

### Iniciar la aplicación

\`\`\`bash
cd /var/www/gestor-horas-linux

# Iniciar con PM2
pm2 start npm --name "gestor-horas" -- start

# Configurar inicio automático
pm2 startup
pm2 save
\`\`\`

### Comandos útiles de PM2

\`\`\`bash
# Ver estado
pm2 status

# Ver logs
pm2 logs gestor-horas

# Reiniciar
pm2 restart gestor-horas

# Detener
pm2 stop gestor-horas
\`\`\`

---

## Paso 7: Configurar Firewall

\`\`\`bash
# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir SSH (si no está permitido)
sudo ufw allow 22/tcp

# Activar firewall
sudo ufw enable
\`\`\`

---

## Paso 8: Configurar SSL (Opcional pero Recomendado)

### Usando Let's Encrypt (Gratis)

\`\`\`bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com

# Renovación automática (ya está configurada)
sudo certbot renew --dry-run
\`\`\`

---

## Paso 9: Verificar el Sistema

1. **Accede a tu dominio o IP**: http://tu-dominio.com
2. **Prueba el login** con los usuarios migrados
3. **Verifica las funcionalidades**:
   - Login de diferentes roles
   - Creación de cursos
   - Inscripción de alumnos
   - Subida de archivos
   - Seguimiento de horas

---

## 🔧 Mantenimiento

### Backups Automáticos

Crea un script de backup:

\`\`\`bash
sudo nano /usr/local/bin/backup-gestor.sh
\`\`\`

Contenido:

\`\`\`bash
#!/bin/bash
BACKUP_DIR="/var/backups/gestor-horas"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup de base de datos
pg_dump -U gestor_user gestor_horas > $BACKUP_DIR/db_$DATE.sql

# Backup de archivos subidos
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/gestor-horas-linux/uploads

# Mantener solo los últimos 7 días
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
\`\`\`

Hacer ejecutable y programar:

\`\`\`bash
sudo chmod +x /usr/local/bin/backup-gestor.sh

# Agregar a crontab (diario a las 2 AM)
sudo crontab -e
# Agregar esta línea:
0 2 * * * /usr/local/bin/backup-gestor.sh
\`\`\`

### Actualizar la Aplicación

\`\`\`bash
cd /var/www/gestor-horas-linux

# Descargar cambios
git pull  # Si usas Git

# Instalar dependencias nuevas
npm install

# Reconstruir
npm run build

# Reiniciar
pm2 restart gestor-horas
\`\`\`

---

## ⚠️ Checklist de Seguridad

- [ ] Cambiar todas las contraseñas de usuarios de prueba
- [ ] Usar contraseña fuerte para la base de datos
- [ ] Generar nuevo JWT_SECRET para producción
- [ ] Configurar SSL/HTTPS
- [ ] Configurar firewall
- [ ] Configurar backups automáticos
- [ ] Limitar permisos de archivos: `chmod 600 .env`
- [ ] Configurar logs de auditoría
- [ ] Actualizar PostgreSQL regularmente

---

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Revisa los logs: `pm2 logs gestor-horas`
2. Verifica la conexión a la base de datos
3. Revisa los permisos de archivos
4. Consulta la documentación de PostgreSQL y Nginx
