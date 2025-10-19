-- Script de creación del esquema de base de datos para el Gestor de Horas
-- PostgreSQL 12+

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  matricula VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('administrador', 'maestro', 'alumno')),
  password_hash VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_usuarios_matricula ON usuarios(matricula);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- Tabla de cursos
CREATE TABLE IF NOT EXISTS cursos (
  id SERIAL PRIMARY KEY,
  nombre_grupo VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('servicio_social', 'taller_curso')),
  maestro_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para cursos
CREATE INDEX idx_cursos_maestro ON cursos(maestro_id);
CREATE INDEX idx_cursos_tipo ON cursos(tipo);
CREATE INDEX idx_cursos_activo ON cursos(activo);

-- Tabla de tareas
CREATE TABLE IF NOT EXISTS tareas (
  id SERIAL PRIMARY KEY,
  curso_id INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  prioridad VARCHAR(20) NOT NULL CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  fecha_vencimiento TIMESTAMP NOT NULL,
  asignacion_horas INTEGER, -- Solo para servicio social
  limite_alumnos INTEGER, -- Solo para servicio social
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para tareas
CREATE INDEX idx_tareas_curso ON tareas(curso_id);
CREATE INDEX idx_tareas_prioridad ON tareas(prioridad);
CREATE INDEX idx_tareas_fecha_vencimiento ON tareas(fecha_vencimiento);
CREATE INDEX idx_tareas_activo ON tareas(activo);

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
CREATE INDEX idx_inscripciones_alumno ON inscripciones(alumno_id);
CREATE INDEX idx_inscripciones_curso ON inscripciones(curso_id);
CREATE INDEX idx_inscripciones_activo ON inscripciones(activo);

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
CREATE INDEX idx_entregas_tarea ON entregas(tarea_id);
CREATE INDEX idx_entregas_alumno ON entregas(alumno_id);
CREATE INDEX idx_entregas_estado ON entregas(estado);

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
CREATE INDEX idx_archivos_entrega ON archivos(entrega_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON cursos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tareas_updated_at BEFORE UPDATE ON tareas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
