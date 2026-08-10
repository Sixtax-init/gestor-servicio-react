import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

/**
 * Catálogo de carreras para el formulario de registro, que es público: el
 * pre_candidato todavía no tiene cuenta cuando lo necesita.
 *
 * Sólo expone nombre y clave de las carreras activas — no hay nada sensible
 * aquí, es la misma lista que aparece en la convocatoria impresa.
 */
export async function GET() {
  try {
    const carreras = await sql`
      SELECT id, nombre, clave
      FROM carreras
      WHERE activo = true
      ORDER BY nombre ASC
    `
    return NextResponse.json({ carreras })
  } catch (error) {
    console.error("[public/carreras] GET:", error)
    return NextResponse.json({ error: "Error al obtener carreras" }, { status: 500 })
  }
}
