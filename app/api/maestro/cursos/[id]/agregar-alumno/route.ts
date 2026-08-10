import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session.server"
import { sql } from "@/lib/db"
import { sendCourseEnrollmentEmail } from "@/lib/email"

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireRole(["maestro"])
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const cursoId = Number((await context.params).id)
        const body = await req.json()
        const alumnoId = Number(body?.alumnoId)

        if (!Number.isInteger(alumnoId) || alumnoId <= 0) {
            return NextResponse.json({ error: "ID de alumno requerido" }, { status: 400 })
        }

        // 1. Verificar que el curso pertenece al maestro
        const curso = await sql`
      SELECT id FROM cursos
      WHERE id = ${cursoId} AND maestro_id = ${user.id} AND activo = true
    `

        if (curso.length === 0) {
            return NextResponse.json({ error: "Curso no encontrado o no autorizado" }, { status: 404 })
        }

        // 1b. El id llega del cliente y antes se insertaba tal cual: se podía
        // inscribir a un administrador o main_admin en el curso y, a partir de
        // ahí, leer sus datos por la lista de alumnos del grupo.
        const [alumno] = await sql`
      SELECT id FROM usuarios
      WHERE id = ${alumnoId} AND tipo_usuario = 'alumno' AND activo = true
    `

        if (!alumno) {
            return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 })
        }

        // 2. Verificar si ya está inscrito
        const existente = await sql`
      SELECT id FROM inscripciones
      WHERE curso_id = ${cursoId} AND alumno_id = ${alumnoId} AND activo = true
    `

        if (existente.length > 0) {
            return NextResponse.json({ error: "El alumno ya está inscrito en este curso" }, { status: 400 })
        }

        // 3. Inscribir al alumno
        await sql`
      INSERT INTO inscripciones (alumno_id, curso_id, fecha_inscripcion, horas_completadas, activo)
      VALUES (${alumnoId}, ${cursoId}, NOW(), 0, true)
    `

        // 4. Notificar por correo
        try {
            const [data] = await sql`
                SELECT 
                    a.nombre as nombre_alumno, a.email as email_alumno,
                    c.nombre_grupo as nombre_curso,
                    m.nombre as nombre_maestro, m.apellidos as apellidos_maestro
                FROM usuarios a
                CROSS JOIN cursos c
                INNER JOIN usuarios m ON c.maestro_id = m.id
                WHERE a.id = ${alumnoId} AND c.id = ${cursoId}
            `
            if (data) {
                await sendCourseEnrollmentEmail({
                    nombreAlumno: data.nombre_alumno as string,
                    nombreCurso: data.nombre_curso as string,
                    nombreMaestro: `${data.nombre_maestro} ${data.apellidos_maestro}`,
                    emailAlumno: data.email_alumno as string
                })
            }
        } catch (emailError) {
            console.error("Error al enviar correo de inscripcion:", emailError)
            // No bloqueamos la respuesta exitosa por un error de correo
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error agregando alumno:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
