import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import { getPrivateUploadRoot, resolveWithinRoot } from "@/lib/file-upload"

type Params = { params: Promise<{ id: string; docId: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["administrador", "main_admin"])
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { id, docId } = await params
    const solicitudId = Number.parseInt(id)
    const documentoId = Number.parseInt(docId)

    const [documento] = await sql`
      SELECT id, nombre_archivo, ruta_archivo, tipo_mime
      FROM documentos_solicitud
      WHERE id = ${documentoId} AND solicitud_id = ${solicitudId}
    `
    if (!documento) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    // ruta_archivo = "/uploads/solicitudes/{id}/{filename}"
    // Los expedientes viven fuera de public/ — se resuelven contra la raíz privada.
    const relativePath = documento.ruta_archivo.replace(/^\/uploads\//, "")
    const filePath = resolveWithinRoot(getPrivateUploadRoot(), relativePath)

    // Prevent path traversal
    if (!filePath) {
      return NextResponse.json({ error: "Ruta inválida" }, { status: 400 })
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Archivo no encontrado en el servidor" }, { status: 404 })
    }

    const buffer = await readFile(filePath)
    const contentType = documento.tipo_mime || "application/octet-stream"
    const safeFilename = encodeURIComponent(documento.nombre_archivo)

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeFilename}"`,
        "Cache-Control": "private, no-cache",
      },
    })
  } catch (error) {
    console.error("[admin/solicitudes/id/documentos/docId] GET:", error)
    return NextResponse.json({ error: "Error al obtener documento" }, { status: 500 })
  }
}
