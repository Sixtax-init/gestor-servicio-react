import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("Iniciando migración de base de datos...")
    
    // Añadir token_accion si no existe
    await sql`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS token_accion VARCHAR(255),
      ADD COLUMN IF NOT EXISTS token_accion_expires_at TIMESTAMP
    `

    // Añadir comentario_revision a entregas_avances si no existe
    await sql`
      ALTER TABLE entregas_avances
      ADD COLUMN IF NOT EXISTS comentario_revision TEXT
    `
    
    console.log("Migración completada con éxito.")
    return NextResponse.json({ message: "Migración de base de datos completada con éxito." })
  } catch (error) {
    console.error("Error en la migración:", error)
    return NextResponse.json({ error: "Error en la migración", detail: error }, { status: 500 })
  }
}
