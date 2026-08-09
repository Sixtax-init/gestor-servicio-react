import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"
import type { EstadoConvocatoria } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

const TRANSICIONES_VALIDAS: Record<EstadoConvocatoria, EstadoConvocatoria[]> = {
  borrador:      ["activa"],
  activa:        ["en_seleccion", "cerrada"],
  en_seleccion:  ["repechaje", "cerrada"],
  repechaje:     ["cerrada"],
  cerrada:       [],
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const convocatoriaId = Number.parseInt(id)

    const body = await request.json()
    const nuevoEstado = body.estado as EstadoConvocatoria

    if (!nuevoEstado) {
      return NextResponse.json({ error: "El campo estado es requerido" }, { status: 400 })
    }

    const [convocatoria] = await sql`
      SELECT id, estado FROM convocatorias WHERE id = ${convocatoriaId}
    `
    if (!convocatoria) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 })
    }

    const estadoActual = convocatoria.estado as EstadoConvocatoria
    const transicionesPermitidas = TRANSICIONES_VALIDAS[estadoActual]

    if (!transicionesPermitidas.includes(nuevoEstado)) {
      return NextResponse.json(
        {
          error: `No se puede cambiar de '${estadoActual}' a '${nuevoEstado}'`,
          transiciones_permitidas: transicionesPermitidas,
        },
        { status: 422 }
      )
    }

    const [actualizada] = await sql`
      UPDATE convocatorias SET estado = ${nuevoEstado} WHERE id = ${convocatoriaId} RETURNING *
    `

    return NextResponse.json({ convocatoria: actualizada })
  } catch (error) {
    console.error("[admin/convocatorias/id/estado] PATCH:", error)
    return NextResponse.json({ error: "Error al cambiar estado" }, { status: 500 })
  }
}
