-- Script de creación del esquema de base de datos para el Gestor de Horas
-- PostgreSQL 12+
-- Actualizado con soporte para Multi-Tenancy (Departamentos)

-- =========================================================
-- Tabla de departamentos
-- Permite separar lógicamente diferentes áreas/grupos
-- =========================================================
CREATE TABLE IF NOT EXISTS departamentos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para departamentos
CREATE INDEX IF NOT EXISTS idx_departamentos_codigo ON departamentos(codigo);
CREATE INDEX IF NOT EXISTS idx_departamentos_activo ON departamentos(activo);

-- =========================================================
-- Tabla de usuarios
-- Actualizada para incluir departamento_id y rol super_admin
-- =========================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  matricula VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('main_admin', 'administrador', 'maestro', 'alumno')),
  departamento_id INTEGER REFERENCES departamentos(id) ON DELETE SET NULL,
  password_hash VARCHAR(255) NOT NULL,
  debe_cambiar_password BOOLEAN DEFAULT true,
  reset_token VARCHAR(255),
  reset_token_expires_at TIMESTAMP,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_usuarios_matricula ON usuarios(matricula);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- Asegurar columna departamento_id en usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS departamento_id INTEGER REFERENCES departamentos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_usuarios_departamento ON usuarios(departamento_id);

-- Columnas para cambio de contraseña forzado al primer login
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN DEFAULT true;

-- Columnas para reset de contraseña por correo (uso único, expira en 1 hora)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;

-- Actualizar constraint de tipo_usuario para incluir main_admin
DO $$ 
BEGIN 
    ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_tipo_usuario_check;
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_tipo_usuario_check 
    CHECK (tipo_usuario IN ('main_admin', 'administrador', 'maestro', 'alumno'));
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'No se pudo actualizar el constraint de tipo_usuario automáticamente.';
END $$;

-- =========================================================
-- Tabla de cursos
-- Actualizada para incluir departamento_id
-- =========================================================
CREATE TABLE IF NOT EXISTS cursos (
  id SERIAL PRIMARY KEY,
  nombre_grupo VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('servicio_social', 'taller_curso')),
  maestro_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  departamento_id INTEGER REFERENCES departamentos(id) ON DELETE SET NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para cursos
CREATE INDEX IF NOT EXISTS idx_cursos_maestro ON cursos(maestro_id);
CREATE INDEX IF NOT EXISTS idx_cursos_tipo ON cursos(tipo);
CREATE INDEX IF NOT EXISTS idx_cursos_activo ON cursos(activo);

-- Asegurar columna departamento_id en cursos
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS departamento_id INTEGER REFERENCES departamentos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cursos_departamento ON cursos(departamento_id);

-- =========================================================
-- Tabla de tareas
-- =========================================================
CREATE TABLE IF NOT EXISTS tareas (
  id SERIAL PRIMARY KEY,
  curso_id INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  prioridad VARCHAR(20) NOT NULL CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  fecha_vencimiento TIMESTAMP,
  asignacion_horas INTEGER, -- Solo para servicio social
  limite_alumnos INTEGER, -- Solo para servicio social
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para tareas
CREATE INDEX IF NOT EXISTS idx_tareas_curso ON tareas(curso_id);
CREATE INDEX IF NOT EXISTS idx_tareas_prioridad ON tareas(prioridad);
CREATE INDEX IF NOT EXISTS idx_tareas_fecha_vencimiento ON tareas(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_tareas_activo ON tareas(activo);

-- Tabla de inscripciones (alumnos inscritos en cursos)
CREATE TABLE IF NOT EXISTS inscripciones (
  id SERIAL PRIMARY KEY,
  alumno_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  curso_id INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
  fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  horas_completadas INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  UNIQUE(alumno_id, curso_id)
);

-- Índices para inscripciones
CREATE INDEX IF NOT EXISTS idx_inscripciones_alumno ON inscripciones(alumno_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_curso ON inscripciones(curso_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_activo ON inscripciones(activo);

-- Tabla de entregas de tareas
CREATE TABLE IF NOT EXISTS entregas (
  id SERIAL PRIMARY KEY,
  tarea_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
  alumno_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  comentario TEXT,
  calificacion INTEGER CHECK (calificacion >= 0 AND calificacion <= 100),
  horas_registradas INTEGER DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'revisada', 'aprobada', 'rechazada')),
  UNIQUE(tarea_id, alumno_id)
);

-- Índices para entregas
CREATE INDEX IF NOT EXISTS idx_entregas_tarea ON entregas(tarea_id);
CREATE INDEX IF NOT EXISTS idx_entregas_alumno ON entregas(alumno_id);
CREATE INDEX IF NOT EXISTS idx_entregas_estado ON entregas(estado);

-- Tabla de archivos adjuntos
CREATE TABLE IF NOT EXISTS archivos (
  id SERIAL PRIMARY KEY,
  entrega_id INTEGER REFERENCES entregas(id) ON DELETE CASCADE,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  tipo_mime VARCHAR(100),
  tamano_bytes INTEGER,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para archivos
CREATE INDEX IF NOT EXISTS idx_archivos_entrega ON archivos(entrega_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cursos_updated_at ON cursos;
CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON cursos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tareas_updated_at ON tareas;
CREATE TRIGGER update_tareas_updated_at BEFORE UPDATE ON tareas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Agregar campo de archivo a la tabla de cursos
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS archivo_adjunto VARCHAR(500);
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS archivo_nombre VARCHAR(255);

-- Índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_cursos_archivo ON cursos(archivo_adjunto);-- Agregar campo de archivo de instrucciones a tareas
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS archivo_instrucciones VARCHAR(500);

-- Comentario para la columna
COMMENT ON COLUMN tareas.archivo_instrucciones IS 'Ruta del archivo de instrucciones subido por el maestro';-- =========================================================
-- Tabla: archivos_curso
-- Archivos o materiales adjuntos pertenecientes a un curso
-- =========================================================

CREATE TABLE IF NOT EXISTS archivos_curso (
  id SERIAL PRIMARY KEY,
  curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  nombre_archivo TEXT NOT NULL,
  ruta_archivo TEXT NOT NULL,
  tipo_mime TEXT,
  tamano_bytes INTEGER,
  fecha_subida TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas rápidas por curso
CREATE INDEX IF NOT EXISTS idx_archivos_curso_curso_id ON archivos_curso(curso_id);
-- =========================================
-- Tabla: entregas_avances
-- Descripción: Guarda entregas parciales de una entrega principal
-- =========================================

CREATE TABLE IF NOT EXISTS entregas_avances (
    id SERIAL PRIMARY KEY,
    entrega_id INTEGER NOT NULL REFERENCES entregas(id) ON DELETE CASCADE,
    tarea_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
    alumno_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    archivo_url TEXT, -- ruta del archivo subido (si aplica)
    comentario TEXT,  -- comentario del alumno
    comentario_revision TEXT, -- retroalimentación del maestro
    horas_asignadas DECIMAL(5,2) DEFAULT 0, -- horas de esta entrega parcial (solo informativo)
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'revisada', 'aprobada', 'rechazada')),
    es_final BOOLEAN DEFAULT false, -- true = el alumno lo marcó como entrega final
    fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revisado_por INTEGER REFERENCES usuarios(id), -- maestro que revisó
    fecha_revision TIMESTAMP
);

-- =========================================================
-- Semilla de datos inicial (Departamentos y Migración)
-- =========================================================

-- Insertar departamentos iniciales
INSERT INTO departamentos (nombre, codigo, descripcion, activo)
VALUES 
('Servicio Social', 'SS', 'Departamento de Gestión de Servicio Social y Prácticas', true),
('Linux', 'LX', 'Departamento de Tecnologías Linux y Software Libre', true)
ON CONFLICT (codigo) DO NOTHING;

-- Asignar usuarios existentes al primer departamento (Servicio Social) por defecto
UPDATE usuarios 
SET departamento_id = (SELECT id FROM departamentos WHERE codigo = 'SS')
WHERE departamento_id IS NULL;

-- Asignar cursos existentes al primer departamento (Servicio Social) por defecto
UPDATE cursos
SET departamento_id = (SELECT id FROM departamentos WHERE codigo = 'SS')
WHERE departamento_id IS NULL;

-- Elevar ADMIN001 a main_admin para permitir la gestión global
UPDATE usuarios
SET tipo_usuario = 'main_admin'
WHERE matricula = 'ADMIN001';

-- Comentario final
-- El sistema está listo para ser usado con multi-tenancy.

-- =========================================================
-- Tabla de sesiones (Ghost Tokens y Refresh Tokens)
-- Mantiene las sesiones activas persistentes en el servidor
-- =========================================================

CREATE TABLE IF NOT EXISTS sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  user_agent VARCHAR(500),
  ip_address VARCHAR(45),
  activo BOOLEAN DEFAULT true,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas en sesiones
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sesiones_activo ON sesiones(activo);
