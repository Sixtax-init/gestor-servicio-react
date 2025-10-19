import { neon } from "@neondatabase/serverless"

// Configuración de la conexión a PostgreSQL
// En producción, usar variable de entorno DATABASE_URL
const sql = neon(process.env.DATABASE_URL || "")

export { sql }

// Tipos TypeScript para las tablas
export type TipoUsuario = "administrador" | "maestro" | "alumno"
export type TipoCurso = "servicio_social" | "taller_curso"
export type Prioridad = "baja" | "media" | "alta" | "urgente"
export type EstadoEntrega = "pendiente" | "revisada" | "aprobada" | "rechazada"

export interface Usuario {
  id: number
  matricula: string
  nombre: string
  apellidos: string
  email: string
  tipo_usuario: TipoUsuario
  password_hash: string
  activo: boolean
  created_at: Date
  updated_at: Date
}

export interface Curso {
  id: number
  nombre_grupo: string
  tipo: TipoCurso
  maestro_id: number | null
  descripcion: string | null
  activo: boolean
  created_at: Date
  updated_at: Date
}

export interface Tarea {
  id: number
  curso_id: number
  titulo: string
  descripcion: string | null
  prioridad: Prioridad
  fecha_vencimiento: Date
  asignacion_horas: number | null
  limite_alumnos: number | null
  activo: boolean
  created_at: Date
  updated_at: Date
}

export interface Inscripcion {
  id: number
  alumno_id: number
  curso_id: number
  fecha_inscripcion: Date
  horas_completadas: number
  activo: boolean
}

export interface Entrega {
  id: number
  tarea_id: number
  alumno_id: number
  fecha_entrega: Date
  comentario: string | null
  calificacion: number | null
  horas_registradas: number
  estado: EstadoEntrega
}

export interface Archivo {
  id: number
  entrega_id: number
  nombre_archivo: string
  ruta_archivo: string
  tipo_mime: string | null
  tamano_bytes: number | null
  uploaded_at: Date
}
