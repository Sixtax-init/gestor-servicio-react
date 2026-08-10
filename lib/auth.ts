import { sql } from "./db"
import type { Usuario } from "./db"
import bcrypt from "bcryptjs"

export interface SessionUser {
  id: number
  matricula: string
  nombre: string
  apellidos: string
  email: string
  tipo_usuario: "main_admin" | "administrador" | "maestro" | "alumno" | "pre_candidato"
  departamento_id: number | null
  pendiente_verificacion: boolean
}

// Verificar credenciales de usuario
export async function verifyCredentials(matricula: string, password: string): Promise<SessionUser | null> {
  try {
    const result = await sql`
      SELECT id, matricula, nombre, apellidos, email, tipo_usuario, departamento_id, password_hash, activo, pendiente_verificacion
      FROM usuarios
      WHERE matricula = ${matricula}
      LIMIT 1
    `

    if (result.length === 0) {
      // Dummy comparison para evitar enumeración de usuarios por timing
      await bcrypt.compare(password, "$2b$10$invaliddummyhashfortimingprotect00000000000000000000")
      return null
    }

    const usuario = result[0] as Usuario

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return null
    }

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, usuario.password_hash)

    if (!isValid) {
      return null
    }

    // Retornar datos de sesión (sin password_hash)
    return {
      id: usuario.id,
      matricula: usuario.matricula,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario,
      departamento_id: usuario.departamento_id,
      pendiente_verificacion: usuario.pendiente_verificacion ?? false,
    }
  } catch (error) {
    console.error("[auth] Error verifying credentials:", error)
    return null
  }
}

// Crear nuevo usuario
export async function createUser(data: {
  matricula: string
  nombre: string
  apellidos: string
  email: string
  password: string
  tipo_usuario: "main_admin" | "administrador" | "maestro" | "alumno" | "pre_candidato"
  departamento_id?: number | null
  pendiente_verificacion?: boolean
  /** Texto histórico; se conserva por compatibilidad con registros anteriores. */
  carrera?: string | null
  /** Referencia al catálogo de carreras — es la que se usa para filtrar programas. */
  carrera_id?: number | null
  sexo?: string | null
  telefono?: string | null
  domicilio?: string | null
}): Promise<SessionUser | null> {
  try {
    const password_hash = await bcrypt.hash(data.password, 10)
    const debe_cambiar = data.pendiente_verificacion ?? true

    const result = await sql`
      INSERT INTO usuarios (
        matricula, nombre, apellidos, email, tipo_usuario,
        departamento_id, password_hash, activo, pendiente_verificacion,
        carrera, carrera_id, sexo, telefono, domicilio
      )
      VALUES (
        ${data.matricula}, ${data.nombre}, ${data.apellidos}, ${data.email}, ${data.tipo_usuario},
        ${data.departamento_id || null}, ${password_hash}, true, ${debe_cambiar},
        ${data.carrera ?? null}, ${data.carrera_id ?? null}, ${data.sexo ?? null}, ${data.telefono ?? null}, ${data.domicilio ?? null}
      )
      RETURNING id, matricula, nombre, apellidos, email, tipo_usuario, departamento_id, pendiente_verificacion
    `

    if (result.length === 0) {
      return null
    }

    return result[0] as SessionUser
  } catch (error) {
    console.error("[auth] Error creating user:", error)
    return null
  }
}

// Obtener usuario por ID
export async function getUserById(id: number): Promise<SessionUser | null> {
  try {
    const result = await sql`
      SELECT id, matricula, nombre, apellidos, email, tipo_usuario, departamento_id, pendiente_verificacion
      FROM usuarios
      WHERE id = ${id} AND activo = true
      LIMIT 1
    `

    if (result.length === 0) {
      return null
    }

    return result[0] as SessionUser
  } catch (error) {
    console.error("[auth] Error getting user by id:", error)
    return null
  }
}

// Cambiar contraseña (requiere verificar la contraseña actual)
export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT password_hash FROM usuarios WHERE id = ${userId} AND activo = true LIMIT 1
    `

    if (result.length === 0) return false

    const isValid = await bcrypt.compare(currentPassword, result[0].password_hash as string)
    if (!isValid) return false

    const password_hash = await bcrypt.hash(newPassword, 10)

    await sql`
      UPDATE usuarios
      SET password_hash = ${password_hash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `

    return true
  } catch (error) {
    console.error("[auth] Error changing password:", error)
    return false
  }
}
