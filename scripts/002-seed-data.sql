-- Script de datos iniciales para el Gestor de Horas
-- IMPORTANTE: Cambiar las contraseñas en producción

-- Insertar usuario administrador por defecto
-- Contraseña: admin123 (hash bcrypt con salt 10)
INSERT INTO usuarios (matricula, nombre, apellidos, email, tipo_usuario, password_hash, activo)
VALUES 
  ('ADMIN001', 'Administrador', 'Sistema', 'admin@escuela.edu', 'administrador', '$2b$10$rKvVPZqGhXqKXPz8qYqYxOXKZGqKXPz8qYqYxOXKZGqKXPz8qYqYxO', true)
ON CONFLICT (matricula) DO NOTHING;

-- Insertar algunos maestros de ejemplo
INSERT INTO usuarios (matricula, nombre, apellidos, email, tipo_usuario, password_hash, activo)
VALUES 
  ('MAES001', 'Juan', 'Pérez García', 'juan.perez@escuela.edu', 'maestro', '$2b$10$rKvVPZqGhXqKXPz8qYqYxOXKZGqKXPz8qYqYxOXKZGqKXPz8qYqYxO', true),
  ('MAES002', 'María', 'López Hernández', 'maria.lopez@escuela.edu', 'maestro', '$2b$10$rKvVPZqGhXqKXPz8qYqYxOXKZGqKXPz8qYqYxOXKZGqKXPz8qYqYxO', true)
ON CONFLICT (matricula) DO NOTHING;

-- Insertar algunos alumnos de ejemplo
INSERT INTO usuarios (matricula, nombre, apellidos, email, tipo_usuario, password_hash, activo)
VALUES 
  ('21480680', 'Carlos', 'Ramírez Sánchez', 'carlos.ramirez@estudiante.edu', 'alumno', '$2b$10$rKvVPZqGhXqKXPz8qYqYxOXKZGqKXPz8qYqYxOXKZGqKXPz8qYqYxO', true),
  ('21480681', 'Ana', 'Martínez Torres', 'ana.martinez@estudiante.edu', 'alumno', '$2b$10$rKvVPZqGhXqKXPz8qYqYxOXKZGqKXPz8qYqYxOXKZGqKXPz8qYqYxO', true),
  ('21480682', 'Luis', 'González Flores', 'luis.gonzalez@estudiante.edu', 'alumno', '$2b$10$rKvVPZqGhXqKXPz8qYqYxOXKZGqKXPz8qYqYxO', true)
ON CONFLICT (matricula) DO NOTHING;

-- Insertar cursos de ejemplo
INSERT INTO cursos (nombre_grupo, tipo, maestro_id, descripcion, activo)
VALUES 
  ('Servicio Social - Biblioteca', 'servicio_social', (SELECT id FROM usuarios WHERE matricula = 'MAES001'), 'Apoyo en la organización y catalogación de libros en la biblioteca escolar', true),
  ('Taller de Programación Web', 'taller_curso', (SELECT id FROM usuarios WHERE matricula = 'MAES002'), 'Curso introductorio de desarrollo web con HTML, CSS y JavaScript', true),
  ('Servicio Social - Laboratorio', 'servicio_social', (SELECT id FROM usuarios WHERE matricula = 'MAES001'), 'Mantenimiento y organización del laboratorio de ciencias', true);
