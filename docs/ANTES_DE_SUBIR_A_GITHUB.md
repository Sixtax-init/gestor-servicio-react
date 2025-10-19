# Antes de Subir a GitHub

## Archivos que NO debes subir

El archivo `.gitignore` ya está configurado para ignorar archivos sensibles, pero verifica lo siguiente:

### 1. Archivo .env.local

**NUNCA subas este archivo a GitHub** porque contiene:
- Contraseñas de base de datos
- Claves secretas JWT
- Información sensible

El `.gitignore` ya lo excluye automáticamente (línea `.env*`).

### 2. Carpeta node_modules

Ya está excluida en `.gitignore`. Nunca la subas porque:
- Pesa mucho
- Se puede regenerar con `npm install`

### 3. Carpeta uploads (si tiene archivos)

Si ya creaste la carpeta `public/uploads` con archivos de prueba, considera:

\`\`\`bash
# Agregar al .gitignore si tiene archivos sensibles
echo "public/uploads/*" >> .gitignore
echo "!public/uploads/.gitkeep" >> .gitignore
\`\`\`

## Pasos Antes de Subir

### 1. Verificar que .gitignore está correcto

\`\`\`bash
# Ver qué archivos se subirán
git status

# NO debes ver:
# - .env.local
# - node_modules/
# - .next/
\`\`\`

### 2. Crear archivo .env.example

Ya existe en el proyecto, pero verifica que tenga valores de ejemplo (no reales):

\`\`\`env
DATABASE_URL="postgresql://usuario:password@localhost:5432/nombre_db"
JWT_SECRET="clave_secreta_minimo_32_caracteres"
\`\`\`

### 3. Actualizar README.md

El README ya tiene instrucciones, pero puedes personalizarlo con:
- Nombre de tu institución
- Información específica de tu implementación

## Comandos para Subir a GitHub

\`\`\`bash
# Inicializar git (si no lo has hecho)
git init

# Agregar todos los archivos (respetando .gitignore)
git add .

# Verificar qué se agregará
git status

# Hacer commit
git commit -m "Initial commit: Sistema de gestión de horas con PostgreSQL"

# Agregar repositorio remoto (reemplaza con tu URL)
git remote add origin https://github.com/TU_USUARIO/gestor-horas-linux.git

# Subir a GitHub
git push -u origin main
\`\`\`

## Después de Clonar en Ubuntu

Sigue la guía `DESPLIEGUE_UBUNTU.md` para:
1. Instalar dependencias
2. Configurar PostgreSQL
3. Crear tu propio archivo `.env.local` con tus credenciales
4. Ejecutar los scripts de base de datos
5. Iniciar la aplicación

## Seguridad

### Generar JWT_SECRET seguro

En Ubuntu, después de clonar:

\`\`\`bash
# Generar clave aleatoria segura
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

Usa el resultado en tu `.env.local`.

## Checklist Final

Antes de hacer `git push`:

- [ ] Verificar que `.env.local` NO está en el repositorio
- [ ] Verificar que `node_modules/` NO está en el repositorio
- [ ] El archivo `.env.example` tiene valores de ejemplo (no reales)
- [ ] El README.md tiene instrucciones claras
- [ ] Los scripts SQL están en la carpeta `scripts/`
- [ ] La documentación está en la carpeta `docs/`

## Colaboración

Si trabajarás con más personas:

1. **Nunca compartan credenciales por GitHub**
2. Cada persona debe crear su propio `.env.local`
3. Usen variables de entorno diferentes para desarrollo y producción
4. Documenten cualquier cambio en el esquema de base de datos

## Recursos Adicionales

- `docs/DESPLIEGUE_UBUNTU.md` - Guía completa de instalación en Ubuntu
- `docs/CONFIGURACION_RAPIDA.md` - Configuración rápida de PostgreSQL
- `docs/INSTALACION.md` - Instalación general en Linux
