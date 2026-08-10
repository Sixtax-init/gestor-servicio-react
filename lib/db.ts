import { Pool, types } from "pg"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined")
}

// node-postgres reads TIMESTAMP WITHOUT TIME ZONE as local server time.
// Since the server may run in UTC-6 (Windows) and values are stored as UTC,
// this parser forces all TIMESTAMP values to be interpreted as UTC.
types.setTypeParser(1114, (str: string) => (str ? new Date(str + "Z") : null))

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Función sql para usar con template literals
export async function sql(query: TemplateStringsArray, ...params: any[]) {
  // Reconstruimos el query con placeholders $1, $2, ...
  let text = ""
  for (let i = 0; i < query.length; i++) {
    text += query[i]
    if (i < params.length) {
      text += `$${i + 1}`
    }
  }

  const client = await pool.connect()
  try {
    const res = await client.query(text, params)
    return res.rows
  } finally {
    client.release()
  }
}

/**
 * Igual que `sql`, pero ligado a un único cliente dentro de una transacción.
 */
export type SqlTx = (query: TemplateStringsArray, ...params: any[]) => Promise<any[]>

/**
 * Ejecuta varias consultas como una sola unidad: o se aplican todas o ninguna.
 *
 * Hace falta donde un cambio abarca varias tablas y dejarlo a medias corrompe
 * el estado — por ejemplo crear un programa junto con su curso, o confirmar una
 * inscripción (que convierte al usuario en alumno y lo inscribe a su curso).
 * `sql` toma un cliente distinto del pool en cada llamada, así que por sí solo
 * no puede dar esa garantía.
 */
export async function withTransaction<T>(fn: (tx: SqlTx) => Promise<T>): Promise<T> {
  const client = await pool.connect()

  const tx: SqlTx = async (query, ...params) => {
    let text = ""
    for (let i = 0; i < query.length; i++) {
      text += query[i]
      if (i < params.length) text += `$${i + 1}`
    }
    const res = await client.query(text, params)
    return res.rows
  }

  try {
    await client.query("BEGIN")
    const resultado = await fn(tx)
    await client.query("COMMIT")
    return resultado
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {})
    throw error
  } finally {
    client.release()
  }
}

export type TipoUsuario = "main_admin" | "administrador" | "maestro" | "alumno" | "pre_candidato"

export type EstadoConvocatoria = "borrador" | "activa" | "en_seleccion" | "repechaje" | "cerrada"
export type EstadoSolicitud =
  | "pendiente"
  | "aprobada"
  | "rechazada"
  | "en_seleccion"
  | "programa_seleccionado"
  | "confirmada"
  | "desistio"
export type TipoDocumento =
  | "kardex"
  | "horario"
  | "solicitud_prestador"
  | "fotografia"
  | "constancia_laboral"
  | "propuesta_formato"
export type TipoUbicacion = "interno" | "externo"
export type EstadoTurno = "pendiente" | "activo" | "usado" | "vencido"
export type EstadoInscripcionPrograma =
  | "pendiente_oficio"
  | "oficio_enviado"
  | "firmado_subido"
  | "confirmada"
  | "rechazada_programa"
export type EstadoPropuesta = "pendiente" | "aprobada" | "rechazada"

export interface Convocatoria {
  id: number
  nombre: string
  descripcion: string | null
  fecha_inicio_registro: Date
  fecha_fin_registro: Date
  fecha_platica: Date | null
  fecha_inicio_seleccion: Date | null
  fecha_fin_seleccion: Date | null
  fecha_inicio_repechaje: Date | null
  fecha_fin_repechaje: Date | null
  estado: EstadoConvocatoria
  activo: boolean
  created_at: Date
  updated_at: Date
}

export interface Programa {
  id: number
  convocatoria_id: number
  departamento_id: number | null
  curso_id: number | null
  nombre: string
  descripcion: string | null
  objetivo: string | null
  tipo_ubicacion: TipoUbicacion
  actividades: string | null
  carreras_permitidas: string[] | null
  requiere_constancia_laboral: boolean
  requisitos_adicionales: string | null
  responsable_dependencia_nombre: string | null
  responsable_dependencia_puesto: string | null
  responsable_programa_nombre: string | null
  responsable_programa_puesto: string | null
  domicilio: string | null
  telefono: string | null
  email_contacto: string | null
  tipo_programa: string | null
  activo: boolean
  created_at: Date
  updated_at: Date
}

export interface HorarioPrograma {
  id: number
  programa_id: number
  dias: string
  hora_inicio: string
  hora_fin: string
  plazas: number
  created_at: Date
}

export interface SolicitudInscripcion {
  id: number
  usuario_id: number
  convocatoria_id: number
  estado: EstadoSolicitud
  motivo_rechazo: string | null
  revisado_por: number | null
  fecha_revision: Date | null
  semestre: string | null
  periodo: string | null
  horas_previas_acreditadas: number
  created_at: Date
  updated_at: Date
}
export type TipoCurso = "servicio_social" | "taller_curso"
export type Prioridad = "baja" | "media" | "alta" | "urgente"
export type EstadoEntrega = "pendiente" | "revisada" | "aprobada" | "rechazada"

export interface Departamento {
  id: number
  nombre: string
  codigo: string
  descripcion: string | null
  activo: boolean
  created_at: Date
  updated_at: Date
}

export interface Usuario {
  id: number
  matricula: string
  nombre: string
  apellidos: string
  email: string
  tipo_usuario: TipoUsuario
  departamento_id: number | null
  /** Referencia al catálogo de carreras; sólo aplica a alumno y pre_candidato. */
  carrera_id: number | null
  password_hash: string
  pendiente_verificacion: boolean
  token_accion: string | null
  token_accion_expires_at: Date | null
  activo: boolean
  created_at: Date
  updated_at: Date
}
export interface Curso {
  id: number
  nombre_grupo: string
  tipo: TipoCurso
  maestro_id: number | null
  departamento_id: number | null
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