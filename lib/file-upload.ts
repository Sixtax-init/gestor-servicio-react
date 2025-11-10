import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// ✅ Ahora acepta un tercer parámetro opcional `type`
export async function saveFile(file: File, id: number, type: "entregas" | "cursos" | "tareas" | "avances" = "entregas"): Promise<string> {
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 📁 Directorio según tipo
    const uploadDir = join(process.cwd(), "public/uploads", type, id.toString())
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 🧾 Nombre único del archivo
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = join(uploadDir, fileName)

    // 💾 Guardar archivo físicamente
    await writeFile(filePath, buffer)

    // 🔗 Retornar ruta relativa pública
    return `/uploads/${type}/${id}/${fileName}`
  } catch (error) {
    console.error("[v0] Error saving file:", error)
    throw new Error("Error al guardar archivo")
  }
}

// 🔍 Utilidades existentes (sin cambios)
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
