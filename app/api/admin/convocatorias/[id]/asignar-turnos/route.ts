import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const convocatoriaId = Number.parseInt(id)

    const [convocatoria] = await sql`
      SELECT id, estado FROM convocatorias WHERE id = ${convocatoriaId}
    `
    if (!convocatoria) {
      return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 })
    }
    if (!["en_seleccion", "repechaje"].includes(convocatoria.estado)) {
      return NextResponse.json(
        { error: "La convocatoria debe estar en estado 'en_seleccion' o 'repechaje' para asignar turnos" },
        { status: 422 }
      )
    }

    const body = await request.json()
    const { fecha_inicio_base, duracion_minutos = 30, tipo = "normal", alumnos_por_grupo = 1 } = body

    if (!fecha_inicio_base) {
      return NextResponse.json({ error: "La fecha y hora de inicio es requerida" }, { status: 400 })
    }
    if (!["normal", "repechaje"].includes(tipo)) {
      return NextResponse.json({ error: "El tipo debe ser 'normal' o 'repechaje'" }, { status: 400 })
    }
    if (duracion_minutos < 5 || duracion_minutos > 120) {
      return NextResponse.json({ error: "La duración debe estar entre 5 y 120 minutos" }, { status: 400 })
    }
    if (!Number.isInteger(alumnos_por_grupo) || alumnos_por_grupo < 1 || alumnos_por_grupo > 100) {
      return NextResponse.json({ error: "El grupo debe tener entre 1 y 100 alumnos" }, { status: 400 })
    }

    // Solicitudes aprobadas sin turno asignado del tipo solicitado
    const solicitudes = await sql`
      SELECT si.id
      FROM solicitudes_inscripcion si
      LEFT JOIN turnos t ON t.solicitud_id = si.id AND t.tipo = ${tipo}
      WHERE si.convocatoria_id = ${convocatoriaId}
        AND si.estado = 'aprobada'
        AND t.id IS NULL
      ORDER BY si.id
    `

    if (solicitudes.length === 0) {
      return NextResponse.json(
        { error: "No hay solicitudes aprobadas sin turno asignado para este tipo" },
        { status: 422 }
      )
    }

    // Verificar que no haya conflicto de turnos del mismo tipo en esta convocatoria
    const [existente] = await sql`
      SELECT 1 FROM turnos
      WHERE convocatoria_id = ${convocatoriaId} AND tipo = ${tipo}
      LIMIT 1
    `
    if (existente) {
      return NextResponse.json(
        { error: `Ya existen turnos de tipo '${tipo}' para esta convocatoria. Elimínalos antes de reasignar.` },
        { status: 409 }
      )
    }

    // Sorteo aleatorio (Fisher-Yates)
    const shuffled = shuffleArray(solicitudes.map((s: { id: number }) => s.id))

    const base = new Date(fecha_inicio_base)
    const durMs = duracion_minutos * 60 * 1000
    const totalGrupos = Math.ceil(shuffled.length / alumnos_por_grupo)

    // Cada grupo comparte la misma ventana de tiempo. Alumnos dentro del grupo
    // tienen numero_turno distinto pero idénticos fecha_inicio y fecha_fin.
    for (let i = 0; i < shuffled.length; i++) {
      const grupoIndex = Math.floor(i / alumnos_por_grupo)
      const inicio = new Date(base.getTime() + grupoIndex * durMs)
      const fin   = new Date(inicio.getTime() + durMs)

      await sql`
        INSERT INTO turnos (solicitud_id, convocatoria_id, numero_turno, tipo, fecha_inicio, fecha_fin, estado)
        VALUES (
          ${shuffled[i]},
          ${convocatoriaId},
          ${i + 1},
          ${tipo},
          ${inicio.toISOString()},
          ${fin.toISOString()},
          'pendiente'
        )
      `
    }

    return NextResponse.json({
      ok: true,
      total_turnos: shuffled.length,
      total_grupos: totalGrupos,
      alumnos_por_grupo,
      primer_turno: base.toISOString(),
      ultimo_turno: new Date(base.getTime() + (totalGrupos - 1) * durMs).toISOString(),
    })
  } catch (error) {
    console.error("[admin/convocatorias/id/asignar-turnos] POST:", error)
    return NextResponse.json({ error: "Error al asignar turnos" }, { status: 500 })
  }
}

// Eliminar turnos de un tipo para poder reasignar
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id } = await params
    const convocatoriaId = Number.parseInt(id)

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") ?? "normal"

    const result = await sql`
      DELETE FROM turnos
      WHERE convocatoria_id = ${convocatoriaId}
        AND tipo = ${tipo}
        AND estado = 'pendiente'
      RETURNING id
    `

    return NextResponse.json({ eliminados: result.length })
  } catch (error) {
    console.error("[admin/convocatorias/id/asignar-turnos] DELETE:", error)
    return NextResponse.json({ error: "Error al eliminar turnos" }, { status: 500 })
  }
}
