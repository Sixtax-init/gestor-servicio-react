import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole } from "@/lib/session.server"

export async function GET() {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const [config] = await sql`SELECT * FROM configuracion_institucional WHERE id = 1`
    return NextResponse.json({ config: config ?? null })
  } catch (error) {
    console.error("[configuracion] GET error:", error)
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole(["main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const body = await request.json()
    const {
      nombre, abreviatura, direccion, email, telefono, logo_url,
      encargado_nombre, encargado_cargo, encargado_email, encargado_telefono,
      ciclo_nombre, ciclo_inicio, ciclo_fin, horas_minimas,
    } = body

    const toNull = (v: unknown) => (v === "" || v === undefined ? null : v)

    const [updated] = await sql`
      UPDATE configuracion_institucional SET
        nombre               = ${toNull(nombre)},
        abreviatura          = ${toNull(abreviatura)},
        direccion            = ${toNull(direccion)},
        email                = ${toNull(email)},
        telefono             = ${toNull(telefono)},
        logo_url             = ${toNull(logo_url)},
        encargado_nombre     = ${toNull(encargado_nombre)},
        encargado_cargo      = ${toNull(encargado_cargo)},
        encargado_email      = ${toNull(encargado_email)},
        encargado_telefono   = ${toNull(encargado_telefono)},
        ciclo_nombre         = ${toNull(ciclo_nombre)},
        ciclo_inicio         = ${toNull(ciclo_inicio)},
        ciclo_fin            = ${toNull(ciclo_fin)},
        horas_minimas        = ${horas_minimas ?? 480},
        updated_at           = CURRENT_TIMESTAMP
      WHERE id = 1
      RETURNING *
    `

    return NextResponse.json({ config: updated })
  } catch (error) {
    console.error("[configuracion] PUT error:", error)
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 })
  }
}
