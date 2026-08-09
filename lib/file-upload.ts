import { writeFile, mkdir } from "fs/promises"
import { join, resolve, sep } from "path"
import { existsSync } from "fs"

// Tipos de archivo soportados. `institucion` (logos) es el único público:
// se sirve estáticamente desde public/. El resto contiene datos personales
// de alumnos y vive fuera de public/, detrás de la ruta autenticada /uploads.
export const PUBLIC_UPLOAD_TYPES = ["institucion"] as const
export const PRIVATE_UPLOAD_TYPES = [
  "entregas",
  "cursos",
  "tareas",
  "avances",
  "solicitudes",
  "instrucciones",
] as const

export type PublicUploadType = (typeof PUBLIC_UPLOAD_TYPES)[number]
export type PrivateUploadType = (typeof PRIVATE_UPLOAD_TYPES)[number]
export type UploadType = PublicUploadType | PrivateUploadType

const ALL_UPLOAD_TYPES: readonly string[] = [...PUBLIC_UPLOAD_TYPES, ...PRIVATE_UPLOAD_TYPES]

/** Valida que un valor recibido del cliente sea un tipo de subida conocido. */
export function isUploadType(value: unknown): value is UploadType {
  return typeof value === "string" && ALL_UPLOAD_TYPES.includes(value)
}

export function isPublicUploadType(type: UploadType): type is PublicUploadType {
  return (PUBLIC_UPLOAD_TYPES as readonly string[]).includes(type)
}

/** Raíz de los archivos privados (fuera de public/, nunca servida como estático). */
export function getPrivateUploadRoot(): string {
  return resolve(process.env.UPLOAD_DIR || join(process.cwd(), "private-uploads"))
}

/** Raíz de los archivos públicos (logos institucionales). */
export function getPublicUploadRoot(): string {
  return resolve(join(process.cwd(), "public/uploads"))
}

/**
 * Resuelve una ruta relativa dentro de una raíz, garantizando que el resultado
 * no escape del directorio base. Devuelve null si el intento sale de la raíz.
 */
export function resolveWithinRoot(root: string, ...segments: string[]): string | null {
  const resolvedRoot = resolve(root)
  const candidate = resolve(join(resolvedRoot, ...segments))
  if (candidate !== resolvedRoot && !candidate.startsWith(resolvedRoot + sep)) {
    return null
  }
  return candidate
}

// Extensiones que el navegador puede ejecutar en nuestro propio origen.
// Bloquearlas evita XSS almacenado aunque el archivo llegue a servirse inline.
const BLOCKED_EXTENSIONS = [
  ".html", ".htm", ".xhtml", ".svg", ".xml", ".js", ".mjs", ".cjs",
  ".php", ".phtml", ".jsp", ".asp", ".aspx", ".sh", ".bat", ".cmd", ".exe", ".htaccess",
]

export function hasBlockedExtension(filename: string): boolean {
  const lower = filename.toLowerCase()
  return BLOCKED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export async function saveFile(file: File, id: number, type: UploadType = "entregas"): Promise<string> {
  // Defensa en profundidad: aunque la ruta ya haya validado, nunca confiamos
  // en `type` para construir una ruta sin comprobarlo aquí.
  if (!isUploadType(type)) {
    throw new Error(`Tipo de subida inválido: ${String(type)}`)
  }
  if (!Number.isInteger(id) || id < 0) {
    throw new Error(`Identificador de subida inválido: ${String(id)}`)
  }
  if (hasBlockedExtension(file.name)) {
    throw new Error("Tipo de archivo no permitido")
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const baseDir = isPublicUploadType(type) ? getPublicUploadRoot() : getPrivateUploadRoot()
    const uploadDir = resolveWithinRoot(baseDir, type, id.toString())
    if (!uploadDir) {
      throw new Error("Ruta de destino inválida")
    }

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Nombre único y saneado — sin separadores ni secuencias de traversal.
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "_").slice(-120) || "archivo"
    const fileName = `${timestamp}-${safeName}`

    const filePath = resolveWithinRoot(uploadDir, fileName)
    if (!filePath) {
      throw new Error("Ruta de archivo inválida")
    }

    await writeFile(filePath, buffer)

    // La URL pública mantiene la misma forma para ambos casos. Los tipos
    // privados los resuelve el route handler app/uploads/[...ruta]/route.ts.
    return `/uploads/${type}/${id}/${fileName}`
  } catch (error) {
    console.error("[file-upload] Error saving file:", error)
    throw error instanceof Error ? error : new Error("Error al guardar archivo")
  }
}

// Utilidades existentes (sin cambios)
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
}

export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const ext = getFileExtension(filename).toLowerCase()
  return allowedTypes.includes(ext)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}
