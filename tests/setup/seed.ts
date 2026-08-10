/**
 * Prepara la base de pruebas: aplica el esquema consolidado y siembra un
 * usuario de cada rol, más los datos mínimos para ejercitar la inscripción.
 *
 * Se ejecuta antes de la suite (ver playwright.config.ts → globalSetup).
 * La base vive en el contenedor del puerto 5434 y es efímera, así que esto
 * puede correr tantas veces como haga falta.
 */
import { Client } from "pg"
import { readFileSync } from "fs"
import { join } from "path"
import bcrypt from "bcryptjs"

/** Contraseña única para todas las cuentas sembradas. */
export const PASSWORD_PRUEBAS = "Prueba1234!"

/** Matrículas de cada rol, para que las pruebas inicien sesión sin adivinar. */
export const CUENTAS = {
  main_admin: "ADMIN001",
  administrador: "ADMIN002",
  maestro: "MAES001",
  alumno: "21480001",
  alumno_ajeno: "21480002",
  pre_candidato: "21480003",
} as const

export type Rol = keyof typeof CUENTAS

/** Identificadores creados al sembrar, para que las pruebas los referencien. */
export interface DatosSembrados {
  departamento_id: number
  otro_departamento_id: number
  carrera_isc_id: number
  carrera_ii_id: number
  convocatoria_id: number
  programa_id: number
  horario_id: number
  curso_id: number
  usuarios: Record<Rol, number>
  solicitud_pre_candidato_id: number
}

function urlBasePruebas(): string {
  const url = process.env.TEST_DATABASE_URL
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL no está definida. Levanta la base con:\n" +
        "  docker compose -f docker-compose.test.yml up -d",
    )
  }
  // Salvaguarda: que un error de configuración no pueda tocar desarrollo.
  if (!url.includes("5434")) {
    throw new Error(
      `TEST_DATABASE_URL apunta a "${url}", que no es el puerto 5434 de la base ` +
        "de pruebas. Se aborta para no escribir sobre datos reales.",
    )
  }
  return url
}

export async function sembrar(): Promise<DatosSembrados> {
  const client = new Client({ connectionString: urlBasePruebas() })
  await client.connect()

  try {
    // 1. Esquema desde cero. Se borra el schema completo para que cada corrida
    //    parta del mismo estado, sin residuos de la anterior.
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
    const esquema = readFileSync(join(process.cwd(), "scripts/setup-complete-db.sql"), "utf8")
    await client.query(esquema)

    // 2. Departamentos: dos, para poder comprobar el aislamiento entre ellos.
    const { rows: [dep] } = await client.query(
      `INSERT INTO departamentos (nombre, codigo) VALUES ('Sistemas', 'SIS') RETURNING id`)
    const { rows: [otroDep] } = await client.query(
      `INSERT INTO departamentos (nombre, codigo) VALUES ('Industrial', 'IND') RETURNING id`)

    const { rows: [isc] } = await client.query(`SELECT id FROM carreras WHERE clave = 'ISC'`)
    const { rows: [ii] } = await client.query(`SELECT id FROM carreras WHERE clave = 'II'`)

    // 3. Un usuario por rol. Mismo hash para todos: se calcula una vez porque
    //    bcrypt es deliberadamente lento y aquí se repetiría seis veces.
    const hash = await bcrypt.hash(PASSWORD_PRUEBAS, 10)
    const usuarios = {} as Record<Rol, number>

    const alta = async (
      rol: Rol,
      tipo: string,
      extras: { departamento_id?: number; carrera_id?: number; pendiente?: boolean } = {},
    ) => {
      const { rows: [u] } = await client.query(
        `INSERT INTO usuarios (matricula, nombre, apellidos, email, tipo_usuario,
                               password_hash, activo, pendiente_verificacion,
                               departamento_id, carrera_id)
         VALUES ($1, $2, 'Pruebas', $3, $4, $5, true, $6, $7, $8)
         RETURNING id`,
        [
          CUENTAS[rol],
          rol,
          `${rol}@pruebas.test`,
          tipo,
          hash,
          extras.pendiente ?? false,
          extras.departamento_id ?? null,
          extras.carrera_id ?? null,
        ],
      )
      usuarios[rol] = u.id
    }

    await alta("main_admin", "main_admin")
    await alta("administrador", "administrador", { departamento_id: dep.id })
    await alta("maestro", "maestro", { departamento_id: dep.id })
    await alta("alumno", "alumno", { departamento_id: dep.id, carrera_id: isc.id })
    await alta("alumno_ajeno", "alumno", { departamento_id: otroDep.id, carrera_id: ii.id })
    await alta("pre_candidato", "pre_candidato", { carrera_id: isc.id })

    // 4. Convocatoria activa con un programa, su curso y un horario con cupo.
    const { rows: [curso] } = await client.query(
      `INSERT INTO cursos (nombre_grupo, tipo, maestro_id, departamento_id, activo)
       VALUES ('Programa de pruebas', 'servicio_social', $1, $2, true) RETURNING id`,
      [usuarios.maestro, dep.id])

    const { rows: [conv] } = await client.query(
      `INSERT INTO convocatorias (nombre, fecha_inicio_registro, fecha_fin_registro, estado, activo)
       VALUES ('Convocatoria de pruebas', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 'activa', true)
       RETURNING id`)

    const { rows: [prog] } = await client.query(
      `INSERT INTO programas (convocatoria_id, departamento_id, curso_id, nombre,
                              tipo_ubicacion, carreras_permitidas, activo)
       VALUES ($1, $2, $3, 'Programa de pruebas', 'interno', NULL, true) RETURNING id`,
      [conv.id, dep.id, curso.id])

    const { rows: [horario] } = await client.query(
      `INSERT INTO horarios_programa (programa_id, dias, hora_inicio, hora_fin, plazas)
       VALUES ($1, 'Lunes a Viernes', '08:00', '12:00', 5) RETURNING id`,
      [prog.id])

    // 5. El alumno del curso, para las pruebas de propiedad.
    await client.query(
      `INSERT INTO inscripciones (alumno_id, curso_id, horas_completadas, activo)
       VALUES ($1, $2, 0, true)`,
      [usuarios.alumno, curso.id])

    // 6. Una solicitud del pre_candidato, lista para los estados de inscripción.
    const { rows: [sol] } = await client.query(
      `INSERT INTO solicitudes_inscripcion (usuario_id, convocatoria_id, estado)
       VALUES ($1, $2, 'borrador') RETURNING id`,
      [usuarios.pre_candidato, conv.id])

    return {
      departamento_id: dep.id,
      otro_departamento_id: otroDep.id,
      carrera_isc_id: isc.id,
      carrera_ii_id: ii.id,
      convocatoria_id: conv.id,
      programa_id: prog.id,
      horario_id: horario.id,
      curso_id: curso.id,
      usuarios,
      solicitud_pre_candidato_id: sol.id,
    }
  } finally {
    await client.end()
  }
}
