import { NextResponse, type NextRequest } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session.server"
import { saveFile } from "@/lib/file-upload"
import path from "path"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  console.log("[upload-curso] Request received")

  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const cursoId = formData.get("cursoId") as string

    if (!file || !cursoId) {
      return NextResponse.json({ error: "Faltan parámetros (file o cursoId)" }, { status: 400 })
    }

    // Verificar que el curso exista
    const curso = await sql`SELECT * FROM cursos WHERE id = ${Number(cursoId)}`
    if (curso.length === 0) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })
    }

    console.log("[upload-curso] Saving file to /uploads/cursos")

    const savedPath = await saveFile(file, Number(cursoId), "cursos") // 👈 Nuevo parámetro 'cursos'
    const publicPath = `/uploads/cursos/${cursoId}/${path.basename(savedPath)}`

    const result = await sql`
      INSERT INTO archivos_curso (curso_id, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes)
      VALUES (${cursoId}, ${file.name}, ${publicPath}, ${file.type}, ${file.size})
      RETURNING *
    `

    console.log("[upload-curso] File stored:", result[0])
    return NextResponse.json({ archivo: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[upload-curso] Error uploading:", error)
    return NextResponse.json(
      { error: "Error al subir archivo", details: error instanceof Error ? error.message : "Desconocido" },
      { status: 500 }
    )
  }
}
export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const cursos = await sql`
      SELECT id, nombre_grupo
      FROM cursos
      WHERE maestro_id = ${user.id} AND activo = true
      ORDER BY nombre_grupo ASC
    `

    return NextResponse.json({ cursos })
  } catch (error) {
    console.error("[v0] Error fetching cursos del maestro:", error)
    return NextResponse.json({ error: "Error al obtener cursos" }, { status: 500 })
  }
}

