-- Migración: agregar columnas para reset de contraseña
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;
