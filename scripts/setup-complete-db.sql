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
  pendiente_verificacion BOOLEAN DEFAULT true,
  token_accion VARCHAR(255),
  token_accion_expires_at TIMESTAMP,
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

-- Columna de verificación pendiente (email para pre_candidato, cambio de contraseña para otros)
--
-- Migración 010: la columna se llamaba debe_cambiar_password. En una BD que
-- venga de antes hay que RENOMBRARLA, no añadir una nueva: si sólo se añade,
-- los datos reales se quedan en la columna vieja y todos los usuarios heredan
-- el DEFAULT true, que los deja encerrados en /cambiar-password (ver proxy.ts).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'usuarios' AND column_name = 'debe_cambiar_password'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'usuarios' AND column_name = 'pendiente_verificacion'
    ) THEN
        ALTER TABLE usuarios RENAME COLUMN debe_cambiar_password TO pendiente_verificacion;
        RAISE NOTICE 'Columna debe_cambiar_password renombrada a pendiente_verificacion.';
    END IF;
END $$;

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pendiente_verificacion BOOLEAN DEFAULT true;

-- Token de acción único: reset de contraseña O verificación de email (expira en 1–24h)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_accion VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_accion_expires_at TIMESTAMP;

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

-- =========================================================
-- Tabla de configuración institucional (fila única id=1)
-- =========================================================
CREATE TABLE IF NOT EXISTS configuracion_institucional (
  id INTEGER PRIMARY KEY DEFAULT 1,
  nombre VARCHAR(200),
  abreviatura VARCHAR(20),
  direccion TEXT,
  email VARCHAR(255),
  telefono VARCHAR(50),
  logo_url VARCHAR(500),
  encargado_nombre VARCHAR(200),
  encargado_cargo VARCHAR(200),
  encargado_email VARCHAR(255),
  encargado_telefono VARCHAR(50),
  ciclo_nombre VARCHAR(100),
  ciclo_inicio DATE,
  ciclo_fin DATE,
  horas_minimas INTEGER DEFAULT 480,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO configuracion_institucional (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 007 — Módulo de Inscripción Digital al Servicio Social
-- =========================================================

DO $$
BEGIN
    ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_tipo_usuario_check;
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_tipo_usuario_check
        CHECK (tipo_usuario IN ('main_admin', 'administrador', 'maestro', 'alumno', 'pre_candidato'));
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error al actualizar constraint de tipo_usuario: %', SQLERRM;
END $$;

CREATE TABLE IF NOT EXISTS convocatorias (
    id                      SERIAL PRIMARY KEY,
    nombre                  VARCHAR(200) NOT NULL,
    descripcion             TEXT,
    fecha_inicio_registro   TIMESTAMP NOT NULL,
    fecha_fin_registro      TIMESTAMP NOT NULL,
    fecha_platica           TIMESTAMP,
    fecha_inicio_seleccion  TIMESTAMP,
    fecha_fin_seleccion     TIMESTAMP,
    fecha_inicio_repechaje  TIMESTAMP,
    fecha_fin_repechaje     TIMESTAMP,
    estado                  VARCHAR(20) NOT NULL DEFAULT 'borrador'
                                CHECK (estado IN ('borrador', 'activa', 'en_seleccion', 'repechaje', 'cerrada')),
    activo                  BOOLEAN DEFAULT true,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_convocatorias_estado ON convocatorias(estado);
CREATE INDEX IF NOT EXISTS idx_convocatorias_activo ON convocatorias(activo);

DROP TRIGGER IF EXISTS update_convocatorias_updated_at ON convocatorias;
CREATE TRIGGER update_convocatorias_updated_at
    BEFORE UPDATE ON convocatorias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS programas (
    id                              SERIAL PRIMARY KEY,
    convocatoria_id                 INTEGER NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
    departamento_id                 INTEGER REFERENCES departamentos(id) ON DELETE SET NULL,
    curso_id                        INTEGER REFERENCES cursos(id) ON DELETE SET NULL,
    nombre                          VARCHAR(200) NOT NULL,
    descripcion                     TEXT,
    objetivo                        TEXT,
    tipo_ubicacion                  VARCHAR(20) NOT NULL DEFAULT 'interno'
                                        CHECK (tipo_ubicacion IN ('interno', 'externo')),
    actividades                     TEXT,
    carreras_permitidas             TEXT[],
    requiere_constancia_laboral     BOOLEAN DEFAULT false,
    requisitos_adicionales          TEXT,
    responsable_dependencia_nombre  VARCHAR(200),
    responsable_dependencia_puesto  VARCHAR(200),
    responsable_programa_nombre     VARCHAR(200),
    responsable_programa_puesto     VARCHAR(200),
    domicilio                       TEXT,
    telefono                        VARCHAR(50),
    email_contacto                  VARCHAR(255),
    nombre_dependencia              TEXT,
    departamento_externo            TEXT,
    activo                          BOOLEAN DEFAULT true,
    created_at                      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_programas_convocatoria ON programas(convocatoria_id);
CREATE INDEX IF NOT EXISTS idx_programas_departamento ON programas(departamento_id);
CREATE INDEX IF NOT EXISTS idx_programas_activo       ON programas(activo);

DROP TRIGGER IF EXISTS update_programas_updated_at ON programas;
CREATE TRIGGER update_programas_updated_at
    BEFORE UPDATE ON programas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS horarios_programa (
    id          SERIAL PRIMARY KEY,
    programa_id INTEGER NOT NULL REFERENCES programas(id) ON DELETE CASCADE,
    dias        VARCHAR(100) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin    TIME NOT NULL,
    plazas      INTEGER NOT NULL CHECK (plazas > 0),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_horarios_programa ON horarios_programa(programa_id);

CREATE TABLE IF NOT EXISTS solicitudes_inscripcion (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    convocatoria_id INTEGER NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
    estado          VARCHAR(30) NOT NULL DEFAULT 'borrador'
                        CHECK (estado IN (
                            'borrador', 'pendiente', 'aprobada', 'rechazada',
                            'en_seleccion', 'programa_seleccionado',
                            'confirmada', 'desistio'
                        )),
    motivo_rechazo  TEXT,
    revisado_por    INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_revision  TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, convocatoria_id)
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario      ON solicitudes_inscripcion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_convocatoria ON solicitudes_inscripcion(convocatoria_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado       ON solicitudes_inscripcion(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_revisado_por ON solicitudes_inscripcion(revisado_por);

DROP TRIGGER IF EXISTS update_solicitudes_inscripcion_updated_at ON solicitudes_inscripcion;
CREATE TRIGGER update_solicitudes_inscripcion_updated_at
    BEFORE UPDATE ON solicitudes_inscripcion
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS documentos_solicitud (
    id              SERIAL PRIMARY KEY,
    solicitud_id    INTEGER NOT NULL REFERENCES solicitudes_inscripcion(id) ON DELETE CASCADE,
    tipo_documento  VARCHAR(30) NOT NULL
                        CHECK (tipo_documento IN (
                            'kardex', 'horario', 'solicitud_prestador',
                            'fotografia', 'constancia_laboral', 'propuesta_formato'
                        )),
    nombre_archivo  VARCHAR(255) NOT NULL,
    ruta_archivo    VARCHAR(500) NOT NULL,
    tipo_mime       VARCHAR(100),
    tamano_bytes    INTEGER,
    uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(solicitud_id, tipo_documento)
);

CREATE INDEX IF NOT EXISTS idx_documentos_solicitud ON documentos_solicitud(solicitud_id);

CREATE TABLE IF NOT EXISTS turnos (
    id              SERIAL PRIMARY KEY,
    solicitud_id    INTEGER NOT NULL UNIQUE REFERENCES solicitudes_inscripcion(id) ON DELETE CASCADE,
    convocatoria_id INTEGER NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
    numero_turno    INTEGER NOT NULL,
    tipo            VARCHAR(20) NOT NULL DEFAULT 'normal'
                        CHECK (tipo IN ('normal', 'repechaje')),
    fecha_inicio    TIMESTAMP NOT NULL,
    fecha_fin       TIMESTAMP NOT NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'activo', 'usado', 'vencido')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(convocatoria_id, numero_turno, tipo)
);

CREATE INDEX IF NOT EXISTS idx_turnos_convocatoria ON turnos(convocatoria_id);
CREATE INDEX IF NOT EXISTS idx_turnos_estado       ON turnos(estado);

CREATE TABLE IF NOT EXISTS preferencias_programa (
    id           SERIAL PRIMARY KEY,
    solicitud_id INTEGER NOT NULL REFERENCES solicitudes_inscripcion(id) ON DELETE CASCADE,
    programa_id  INTEGER NOT NULL REFERENCES programas(id) ON DELETE CASCADE,
    orden        SMALLINT NOT NULL CHECK (orden IN (1, 2, 3)),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(solicitud_id, orden),
    UNIQUE(solicitud_id, programa_id)
);

CREATE INDEX IF NOT EXISTS idx_preferencias_solicitud ON preferencias_programa(solicitud_id);

CREATE TABLE IF NOT EXISTS inscripciones_programa (
    id                    SERIAL PRIMARY KEY,
    solicitud_id          INTEGER NOT NULL UNIQUE REFERENCES solicitudes_inscripcion(id) ON DELETE CASCADE,
    horario_programa_id   INTEGER REFERENCES horarios_programa(id) ON DELETE RESTRICT,
    convocatoria_id       INTEGER NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
    estado                VARCHAR(30) NOT NULL DEFAULT 'pendiente_oficio'
                              CHECK (estado IN (
                                  'pendiente_oficio', 'oficio_enviado',
                                  'firmado_subido', 'confirmada', 'rechazada_programa'
                              )),
    oficio_url            VARCHAR(500),
    oficio_firmado_url    VARCHAR(500),
    confirmado_por        INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_confirmacion    TIMESTAMP,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inscripciones_prog_horario      ON inscripciones_programa(horario_programa_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_prog_convocatoria ON inscripciones_programa(convocatoria_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_prog_estado       ON inscripciones_programa(estado);

DROP TRIGGER IF EXISTS update_inscripciones_programa_updated_at ON inscripciones_programa;
CREATE TRIGGER update_inscripciones_programa_updated_at
    BEFORE UPDATE ON inscripciones_programa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- 008 — Propuestas de programa + campos documentos oficiales
-- =========================================================

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS carrera   VARCHAR(100),
    ADD COLUMN IF NOT EXISTS sexo      VARCHAR(1) CHECK (sexo IN ('H', 'M')),
    ADD COLUMN IF NOT EXISTS telefono  VARCHAR(50),
    ADD COLUMN IF NOT EXISTS domicilio TEXT;

ALTER TABLE solicitudes_inscripcion
    ADD COLUMN IF NOT EXISTS semestre                  VARCHAR(50),
    ADD COLUMN IF NOT EXISTS periodo                   VARCHAR(50),
    ADD COLUMN IF NOT EXISTS horas_previas_acreditadas INTEGER NOT NULL DEFAULT 0;

ALTER TABLE programas
    ADD COLUMN IF NOT EXISTS tipo_programa VARCHAR(30)
        CHECK (tipo_programa IN (
            'educacion_adultos', 'desarrollo_comunidad', 'actividades_deportivas',
            'actividades_civicas', 'actividades_culturales', 'medio_ambiente',
            'desarrollo_sustentable', 'apoyo_salud', 'otros'
        ));

CREATE TABLE IF NOT EXISTS propuestas_programa (
    id                       SERIAL PRIMARY KEY,
    solicitud_id             INTEGER NOT NULL UNIQUE
                                 REFERENCES solicitudes_inscripcion(id) ON DELETE CASCADE,
    tipo_ubicacion           VARCHAR(20) NOT NULL DEFAULT 'externo'
                                 CHECK (tipo_ubicacion IN ('interno', 'externo')),
    dependencia              VARCHAR(200) NOT NULL,
    responsable_nombre       VARCHAR(200) NOT NULL,
    responsable_puesto       VARCHAR(100),
    departamento_solicitante VARCHAR(200),
    nombre_programa          VARCHAR(200) NOT NULL,
    actividades              TEXT,
    objetivo                 TEXT,
    domicilio                TEXT,
    telefono                 VARCHAR(50),
    email_contacto           VARCHAR(255),
    horario                  VARCHAR(200),
    tipo_programa            VARCHAR(30)
                                 CHECK (tipo_programa IN (
                                     'educacion_adultos', 'desarrollo_comunidad', 'actividades_deportivas',
                                     'actividades_civicas', 'actividades_culturales', 'medio_ambiente',
                                     'desarrollo_sustentable', 'apoyo_salud', 'otros'
                                 )),
    estado                   VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                                 CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    motivo_rechazo           TEXT,
    revisado_por             INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_revision           TIMESTAMP,
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_propuestas_solicitud ON propuestas_programa(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_propuestas_estado    ON propuestas_programa(estado);

DROP TRIGGER IF EXISTS update_propuestas_programa_updated_at ON propuestas_programa;
CREATE TRIGGER update_propuestas_programa_updated_at
    BEFORE UPDATE ON propuestas_programa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE inscripciones_programa
    ADD COLUMN IF NOT EXISTS propuesta_id             INTEGER
        REFERENCES propuestas_programa(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS numero_oficio            VARCHAR(50),
    ADD COLUMN IF NOT EXISTS fecha_inicio_actividades DATE,
    ADD COLUMN IF NOT EXISTS fecha_fin_actividades    DATE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_inscripcion_fuente'
    ) THEN
        ALTER TABLE inscripciones_programa
            ADD CONSTRAINT chk_inscripcion_fuente
                CHECK (
                    (horario_programa_id IS NOT NULL AND propuesta_id IS NULL) OR
                    (horario_programa_id IS NULL     AND propuesta_id IS NOT NULL)
                );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inscripciones_prog_propuesta ON inscripciones_programa(propuesta_id);

-- =========================================================
-- 011 — nombre_dependencia en programas
-- =========================================================

ALTER TABLE programas
    ADD COLUMN IF NOT EXISTS nombre_dependencia TEXT;

-- =========================================================
-- 012 — Ampliar semestre y periodo a VARCHAR(50)
-- =========================================================

ALTER TABLE solicitudes_inscripcion
    ALTER COLUMN semestre TYPE VARCHAR(50),
    ALTER COLUMN periodo  TYPE VARCHAR(50);

-- =========================================================
-- 013 — Estado 'borrador' en solicitudes_inscripcion
-- =========================================================

DO $$
BEGIN
    ALTER TABLE solicitudes_inscripcion
        DROP CONSTRAINT IF EXISTS solicitudes_inscripcion_estado_check;
    ALTER TABLE solicitudes_inscripcion
        ADD CONSTRAINT solicitudes_inscripcion_estado_check
        CHECK (estado IN (
            'borrador', 'pendiente', 'aprobada', 'rechazada',
            'en_seleccion', 'programa_seleccionado', 'confirmada', 'desistio'
        ));
    ALTER TABLE solicitudes_inscripcion
        ALTER COLUMN estado SET DEFAULT 'borrador';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error al actualizar constraint de solicitudes estado: %', SQLERRM;
END $$;

-- =========================================================
-- 014 — Estado 'firmado_subido' en inscripciones_programa
-- =========================================================

DO $$
BEGIN
    ALTER TABLE inscripciones_programa
        DROP CONSTRAINT IF EXISTS inscripciones_programa_estado_check;
    ALTER TABLE inscripciones_programa
        ADD CONSTRAINT inscripciones_programa_estado_check
        CHECK (estado IN (
            'pendiente_oficio', 'oficio_enviado',
            'firmado_subido', 'confirmada', 'rechazada_programa'
        ));
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error al actualizar constraint de inscripciones estado: %', SQLERRM;
END $$;

-- =========================================================
-- 015 — departamento_externo en programas
-- =========================================================

ALTER TABLE programas
    ADD COLUMN IF NOT EXISTS departamento_externo TEXT;
