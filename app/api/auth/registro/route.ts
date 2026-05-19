import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/auth"
import { createSession } from "@/lib/session.server"
import { sql } from "@/lib/db"
import { sendEmailVerificationEmail } from "@/lib/email"
import { randomBytes } from "crypto"

const MATRICULA_REGEX = /^V?\d{8}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      matricula,
      nombre,
      apellidos,
      email,
      carrera,
      sexo,
      telefono,
      domicilio,
      password,
      confirmPassword,
    } = body

    if (!matricula || !nombre || !apellidos || !email || !carrera || !password) {
      return NextResponse.json({ error: "Todos los campos obligatorios son requeridos" }, { status: 400 })
    }
    if (!MATRICULA_REGEX.test(matricula)) {
      return NextResponse.json({ error: "Formato de matrícula inválido. Debe ser 8 dígitos o V + 8 dígitos" }, { status: 400 })
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Formato de correo electrónico inválido" }, { status: 400 })
    }
    if (sexo && !["H", "M"].includes(sexo)) {
      return NextResponse.json({ error: "Sexo debe ser H o M" }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Las contraseñas no coinciden" }, { status: 400 })
    }

    const [duplicado] = await sql`
      SELECT id FROM usuarios
      WHERE matricula = ${matricula.toUpperCase()} OR email = ${email.toLowerCase()}
      LIMIT 1
    `
    if (duplicado) {
      return NextResponse.json({ error: "La matrícula o correo ya está registrado" }, { status: 409 })
    }

    const [convocatoria] = await sql`
      SELECT id FROM convocatorias
      WHERE activo = true AND estado = 'activa'
      ORDER BY created_at DESC LIMIT 1
    `
    if (!convocatoria) {
      return NextResponse.json(
        { error: "No hay una convocatoria activa en este momento. Consulta las fechas de la próxima convocatoria." },
        { status: 422 }
      )
    }

    // Crear cuenta — pendiente_verificacion=true bloquea acceso hasta verificar email
    const newUser = await createUser({
      matricula: matricula.toUpperCase(),
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      email: email.toLowerCase().trim(),
      password,
      tipo_usuario: "pre_candidato",
      pendiente_verificacion: true,
      carrera: carrera.trim(),
      sexo: sexo ?? null,
      telefono: telefono?.trim() ?? null,
      domicilio: domicilio?.trim() ?? null,
    })

    if (!newUser) {
      return NextResponse.json({ error: "Error al crear la cuenta. Intenta de nuevo." }, { status: 500 })
    }

    // Generar token de verificación (32 bytes hex, expira en 24h)
    const token = randomBytes(32).toString("hex")
    await sql`
      UPDATE usuarios
      SET token_accion            = ${token},
          token_accion_expires_at = NOW() + INTERVAL '24 hours',
          updated_at              = CURRENT_TIMESTAMP
      WHERE id = ${newUser.id}
    `

    // Enviar email con el enlace de verificación
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
    const verifyUrl = `${appUrl}${basePath}/api/auth/verificar-email?token=${token}`

    try {
      await sendEmailVerificationEmail({
        nombre: newUser.nombre,
        apellidos: newUser.apellidos,
        email: newUser.email,
        verifyUrl,
      })
    } catch (emailError) {
      // No bloqueamos el registro si el email falla — el usuario puede reenviar
      console.error("[registro] Error enviando email de verificación:", emailError)
    }

    // Auto-login con pendiente_verificacion=true — el proxy los redirige a /pendiente-verificacion
    const userAgent = request.headers.get("user-agent") ?? ""
    const ip = request.headers.get("x-forwarded-for") ?? ""
    await createSession(newUser, userAgent, ip)

    return NextResponse.json(
      {
        ok: true,
        usuario: {
          id: newUser.id,
          nombre: newUser.nombre,
          apellidos: newUser.apellidos,
          tipo_usuario: newUser.tipo_usuario,
        },
        convocatoria_id: convocatoria.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[auth/registro] POST:", error)
    return NextResponse.json({ error: "Error al registrarse. Intenta de nuevo." }, { status: 500 })
  }
}
