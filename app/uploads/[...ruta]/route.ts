import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { getSession } from "@/lib/session.server"
import { sql } from "@/lib/db"
import {
  getPrivateUploadRoot,
  isUploadType,
  isPublicUploadType,
  resolveWithinRoot,
} from "@/lib/file-upload"
import type { SessionUser } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Los archivos privados ya NO viven en public/: dejaron de servirse como
// estáticos y pasan por aquí, donde se comprueba sesión y propiedad.
// La URL pública (/uploads/{tipo}/{id}/{archivo}) no cambia.

type Params = { params: Promise<{ ruta: string[] }> }

// Carpeta histórica en singular, sin subcarpeta de id: /uploads/curso/{archivo}
const LEGACY_TIPO = "curso"

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".txt": "text/plain; charset=utf-8",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}

// Sólo estos se muestran incrustados; el resto se descarga.
const INLINE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/gif"])

function contentTypeFor(filename: string): string {
  const dot = filename.lastIndexOf(".")
  const ext = dot === -1 ? "" : filename.slice(dot).toLowerCase()
  return CONTENT_TYPES[ext] ?? "application/octet-stream"
}

function esPersonal(user: SessionUser): boolean {
  return user.tipo_usuario === "administrador" || user.tipo_usuario === "main_admin"
}

/** Resuelve si `user` puede leer el archivo cuya URL pública es `rutaPublica`. */
async function puedeLeer(user: SessionUser, tipo: string, rutaPublica: string): Promise<boolean> {
  // El personal administrativo revisa expedientes y entregas por función.
  if (esPersonal(user)) return true

  switch (tipo) {
    case "solicitudes": {
      // Documentos del expediente de inscripción y oficios de asignación.
      const [doc] = await sql`
        SELECT si.usuario_id
        FROM documentos_solicitud d
        JOIN solicitudes_inscripcion si ON si.id = d.solicitud_id
        WHERE d.ruta_archivo = ${rutaPublica}
        UNION
        SELECT si.usuario_id
        FROM inscripciones_programa ip
        JOIN solicitudes_inscripcion si ON si.id = ip.solicitud_id
        WHERE ip.oficio_url = ${rutaPublica} OR ip.oficio_firmado_url = ${rutaPublica}
        LIMIT 1
      `
      return Boolean(doc) && doc.usuario_id === user.id
    }

    case "entregas": {
      const [archivo] = await sql`
        SELECT e.alumno_id, c.maestro_id
        FROM archivos a
        JOIN entregas e ON e.id = a.entrega_id
        LEFT JOIN tareas t ON t.id = e.tarea_id
        LEFT JOIN cursos c ON c.id = t.curso_id
        WHERE a.ruta_archivo = ${rutaPublica}
        LIMIT 1
      `
      if (!archivo) return false
      return archivo.alumno_id === user.id || archivo.maestro_id === user.id
    }

    case "avances": {
      const [avance] = await sql`
        SELECT av.alumno_id, c.maestro_id
        FROM entregas_avances av
        LEFT JOIN tareas t ON t.id = av.tarea_id
        LEFT JOIN cursos c ON c.id = t.curso_id
        WHERE av.archivo_url = ${rutaPublica}
        LIMIT 1
      `
      if (!avance) return false
      return avance.alumno_id === user.id || avance.maestro_id === user.id
    }

    // Material docente: visible para cualquier cuenta de la institución
    // con sesión activa (alumnos inscritos, maestros y personal).
    case "cursos":
    case "tareas":
    case "instrucciones":
    case LEGACY_TIPO:
      return true

    default:
      return false
  }
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { ruta } = await params

    if (!Array.isArray(ruta)) {
      return NextResponse.json({ error: "Ruta inválida" }, { status: 400 })
    }

    let tipo: string
    let id: string
    let filename: string

    if (ruta.length === 2 && ruta[0] === LEGACY_TIPO) {
      // Forma histórica /uploads/curso/{archivo}, sin carpeta de id.
      // La escribía app/api/maestro/tareas antes de usar saveFile.
      ;[tipo, filename] = ruta
      id = ""
    } else if (ruta.length === 3) {
      // Estructura actual: /uploads/{tipo}/{id}/{archivo}
      ;[tipo, id, filename] = ruta

      if (!isUploadType(tipo) || isPublicUploadType(tipo)) {
        // Los tipos públicos (logos) los sirve Next desde public/ como estáticos;
        // si llegan aquí es que el archivo no existe.
        return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
      }
      if (!/^\d+$/.test(id)) {
        return NextResponse.json({ error: "Ruta inválida" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Ruta inválida" }, { status: 400 })
    }

    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const rutaPublica = id ? `/uploads/${tipo}/${id}/${filename}` : `/uploads/${tipo}/${filename}`
    if (!(await puedeLeer(user, tipo, rutaPublica))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const segmentos = id ? [tipo, id, filename] : [tipo, filename]
    const filePath = resolveWithinRoot(getPrivateUploadRoot(), ...segmentos)
    if (!filePath) {
      return NextResponse.json({ error: "Ruta inválida" }, { status: 400 })
    }

    // Se lee directamente en vez de comprobar antes con stat(): un
    // comprobar-luego-usar deja una ventana en la que el archivo puede cambiar
    // entre ambas llamadas. Los casos de "no existe" o "es un directorio"
    // llegan como error de readFile y se traducen a 404.
    let buffer: Buffer
    try {
      buffer = await readFile(filePath)
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code
      if (code === "ENOENT" || code === "EISDIR" || code === "ENOTDIR") {
        return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
      }
      throw err
    }

    const contentType = contentTypeFor(filename)
    const disposition = INLINE_TYPES.has(contentType) ? "inline" : "attachment"

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    console.error("[uploads] GET:", error)
    return NextResponse.json({ error: "Error al obtener el archivo" }, { status: 500 })
  }
}
