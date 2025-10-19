import { sql } from "./db"
import type { Usuario } from "./db"
import bcrypt from "bcryptjs"

export interface SessionUser {
  id: number
  matricula: string
  nombre: string
  apellidos: string
  email: string
  tipo_usuario: "administrador" | "maestro" | "alumno"
}

// Verificar credenciales de usuario
export async function verifyCredentials(matricula: string, password: string): Promise<SessionUser | null> {
  try {
    const result = await sql`
      SELECT id, matricula, nombre, apellidos, email, tipo_usuario, password_hash, activo
      FROM usuarios
      WHERE matricula = ${matricula}
      LIMIT 1
    `

    if (result.length === 0) {
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
    }
  } catch (error) {
    console.error("[v0] Error verifying credentials:", error)
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
  tipo_usuario: "administrador" | "maestro" | "alumno"
}): Promise<SessionUser | null> {
  try {
    // Hash de la contraseña
    const password_hash = await bcrypt.hash(data.password, 10)

    const result = await sql`
      INSERT INTO usuarios (matricula, nombre, apellidos, email, tipo_usuario, password_hash, activo)
      VALUES (${data.matricula}, ${data.nombre}, ${data.apellidos}, ${data.email}, ${data.tipo_usuario}, ${password_hash}, true)
      RETURNING id, matricula, nombre, apellidos, email, tipo_usuario
    `

    if (result.length === 0) {
      return null
    }

    return result[0] as SessionUser
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    return null
  }
}

// Obtener usuario por ID
export async function getUserById(id: number): Promise<SessionUser | null> {
  try {
    const result = await sql`
      SELECT id, matricula, nombre, apellidos, email, tipo_usuario
      FROM usuarios
      WHERE id = ${id} AND activo = true
      LIMIT 1
    `

    if (result.length === 0) {
      return null
    }

    return result[0] as SessionUser
  } catch (error) {
    console.error("[v0] Error getting user by id:", error)
    return null
  }
}

// Cambiar contraseña
export async function changePassword(userId: number, newPassword: string): Promise<boolean> {
  try {
    const password_hash = await bcrypt.hash(newPassword, 10)

    await sql`
      UPDATE usuarios
      SET password_hash = ${password_hash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `

    return true
  } catch (error) {
    console.error("[v0] Error changing password:", error)
    return false
  }
}
