# Gestor de Horas - Sistema de Servicio Social

Sistema completo de gestión de servicio social y cursos para instituciones educativas, con seguimiento de horas, gestión de tareas y dashboards diferenciados por rol.

## Características

- **Autenticación segura** con roles (Administrador, Maestro, Alumno)
- **Dashboard de Administrador**: Gestión completa de usuarios, cursos y tareas
- **Dashboard de Maestro**: Creación y gestión de cursos y tareas propias
- **Dashboard de Alumno**: Inscripción a cursos y seguimiento de horas de servicio social
- **Sistema de archivos**: Subida de entregas de tareas
- **Base de datos PostgreSQL**: Almacenamiento robusto y escalable

## Inicio Rápido (Solo ver la interfaz)

Si solo quieres ver la interfaz sin configurar la base de datos:

\`\`\`bash
npm install
npm run dev
\`\`\`

Abre http://localhost:3000 y verás la landing page con todas las características del sistema.

## Instalación Completa (Windows)

### 1. Instalar dependencias

\`\`\`bash
npm install
\`\`\`

### 2. Instalar PostgreSQL

**Opción A: PostgreSQL nativo**
- Descarga: https://www.postgresql.org/download/windows/
- Instala con puerto 5432 y anota tu contraseña

**Opción B: Docker**
\`\`\`bash
docker-compose up -d
\`\`\`

### 3. Crear la base de datos

\`\`\`bash
# Abre PowerShell
psql -U postgres
CREATE DATABASE gestor_horas;
\q
\`\`\`

### 4. Configurar variables de entorno

\`\`\`bash
# Copia el archivo de ejemplo
copy .env.example .env.local

# Edita .env.local y agrega:
DATABASE_URL=postgresql://postgres:tu_contraseña@localhost:5432/gestor_horas
\`\`\`

### 5. Inicializar base de datos

\`\`\`bash
# Crear tablas
npm run db:init

# Agregar datos de prueba
npm run db:seed
\`\`\`

### 6. Iniciar la aplicación

\`\`\`bash
npm run dev
\`\`\`

Abre http://localhost:3000

## Usuarios de Prueba

| Rol | Email | Contraseña | Matrícula |
|-----|-------|------------|-----------|
| Administrador | admin@escuela.edu | admin123 | - |
| Maestro | maestro@escuela.edu | maestro123 | - |
| Alumno | 21480680@escuela.edu | alumno123 | 21480680 |

## Scripts Disponibles

\`\`\`bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Compilar para producción
npm run start        # Iniciar servidor de producción
npm run db:init      # Crear esquema de base de datos
npm run db:seed      # Insertar datos de prueba
npm run db:reset     # Eliminar todas las tablas (¡cuidado!)
\`\`\`

## Estructura del Proyecto

\`\`\`
gestor-horas/
├── app/                    # Páginas y rutas de Next.js
│   ├── admin/             # Dashboard de administrador
│   ├── maestro/           # Dashboard de maestro
│   ├── alumno/            # Dashboard de alumno
│   ├── api/               # API Routes
│   └── login/             # Página de login
├── components/            # Componentes React
│   ├── admin/            # Componentes de admin
│   ├── maestro/          # Componentes de maestro
│   ├── alumno/           # Componentes de alumno
│   └── ui/               # Componentes UI base
├── lib/                   # Utilidades y configuración
│   ├── db.ts             # Conexión a base de datos
│   ├── auth.ts           # Utilidades de autenticación
│   └── session.ts        # Manejo de sesiones
├── scripts/               # Scripts SQL y de inicialización
│   ├── 001-create-schema.sql
│   ├── 002-seed-data.sql
│   ├── init-db.js
│   └── seed-db.js
└── docs/                  # Documentación
    ├── INSTALACION.md
    ├── INSTALACION_WINDOWS.md
    └── CONFIGURACION_ARCHIVOS.md
\`\`\`

## Documentación Adicional

- [Instalación en Linux](docs/INSTALACION.md)
- [Instalación en Windows](docs/INSTALACION_WINDOWS.md)
- [Configuración de archivos](docs/CONFIGURACION_ARCHIVOS.md)

## Esquema de Base de Datos

### Usuarios
- Matrícula (alfanumérica)
- Nombre, apellidos, email
- Tipo: administrador, maestro, alumno
- Contraseña encriptada (bcrypt)
- Estado activo/inactivo

### Cursos
- Nombre del grupo
- Tipo: servicio social o taller/curso
- Maestro responsable
- Descripción
- Estado activo/inactivo

### Tareas
- Título, descripción
- Prioridad (alta, media, baja)
- Fecha de vencimiento
- Horas asignadas (servicio social)
- Límite de alumnos
- Subida de archivos

### Inscripciones
- Relación alumno-curso
- Seguimiento de horas completadas
- Estado de inscripción

## Despliegue en Producción

Para desplegar en tu servidor Linux:

1. Instala PostgreSQL en el servidor
2. Configura las variables de entorno
3. Ejecuta los scripts de base de datos
4. Compila la aplicación: `npm run build`
5. Inicia el servidor: `npm start`

Ver [INSTALACION.md](docs/INSTALACION.md) para instrucciones detalladas.

## Soporte

Para problemas o preguntas, consulta la documentación en la carpeta `docs/`.

## Licencia

Este proyecto es de uso educativo.
