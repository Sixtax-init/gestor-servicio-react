import nodemailer from "nodemailer"

// Función auxiliar para esperar una cantidad de milisegundos
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true = puerto 465, false = STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface WelcomeEmailData {
  nombre: string
  apellidos: string
  email: string
  matricula: string
  password: string
  tipo_usuario: string
}

function getTipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    alumno: "Alumno",
    maestro: "Maestro",
    administrador: "Administrador",
    main_admin: "Administrador General",
  }
  return labels[tipo] ?? tipo
}

function buildBaseHtml(title: string, bodyContent: string, ctaContent?: string): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0f172a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 24px; overflow: hidden; border: 1px solid #334155; }
    .header { padding: 40px 48px; text-align: center; border-bottom: 1px solid #334155; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { color: #94a3b8; margin: 8px 0 0; font-size: 14px; font-weight: 500; }
    .body { padding: 48px; }
    .greeting { font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 16px; }
    .content-text { font-size: 15px; color: #cbd5e1; line-height: 1.7; margin-bottom: 24px; }
    .info-card { background: #0f172a; border-radius: 16px; padding: 24px; border: 1px solid #3b82f633; margin: 24px 0; }
    .info-label { font-size: 11px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: block; }
    .info-value { font-size: 16px; font-weight: 600; color: #ffffff; }
    .badge { display: inline-block; background: #3b82f622; color: #3b82f6; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 99px; margin-bottom: 20px; border: 1px solid #3b82f644; }
    .btn { display: inline-block; background: #3b82f6; color: #ffffff !important; text-decoration: none !font-weight: 700; font-size: 15px; padding: 14px 40px; border-radius: 12px; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
    .warning { background: #450a0a22; border: 1px solid #991b1b44; border-radius: 16px; padding: 20px; font-size: 14px; color: #fca5a5; margin-top: 32px; }
    .footer { padding: 32px 48px; text-align: center; border-top: 1px solid #334155; background: #1e293b; }
    .footer p { font-size: 12px; color: #64748b; margin: 0; line-height: 1.6; }
    @media only screen and (max-width: 480px) {
      .wrapper { margin: 0; border-radius: 0; border: none; }
      .header, .body, .footer { padding: 32px 24px; }
      .btn { display: block; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>GESTIÓN DE SERVICIO</h1>
      <p>Sistema Académico e Institucional</p>
    </div>
    <div class="body">
      ${bodyContent}
      ${ctaContent ? `<div style="text-align: center; margin-top: 32px;">${ctaContent}</div>` : ""}
    </div>
    <div class="footer">
      <p>© ${year} Gestión de Servicio React.<br>Este mensaje es generado por el sistema, por favor no responda directamente.</p>
    </div>
  </div>
</body>
</html>`
}

function buildWelcomeHtml(data: WelcomeEmailData): string {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`

  const safeNombre = escapeHtml(data.nombre)
  const safeApellidos = escapeHtml(data.apellidos)
  const safeMatricula = escapeHtml(data.matricula)
  const safePassword = escapeHtml(data.password)
  const safeTipoUsuarioLabel = escapeHtml(getTipoLabel(data.tipo_usuario))
  
  return buildBaseHtml(
    "Bienvenido al Sistema",
    `
    <p class="greeting">Hola, ${safeNombre} ${safeApellidos} 👋</p>
    <div class="badge">${safeTipoUsuarioLabel}</div>
    <p class="content-text">Se ha creado exitosamente su cuenta en la plataforma de Gestión de Servicio. A continuación se presentan sus credenciales de acceso institucional.</p>
    
    <div class="info-card">
      <div style="margin-bottom: 20px;">
        <span class="info-label">Matrícula / Usuario</span>
        <span class="info-value" style="font-family: monospace;">${safeMatricula}</span>
      </div>
      <div>
        <span class="info-label">Contraseña Temporal</span>
        <span class="info-value" style="font-family: monospace;">${safePassword}</span>
      </div>
    </div>

    <div class="warning">
      <strong>⚠️ Seguridad</strong><br>
      La contraseña proporcionada es temporal. Para garantizar la seguridad de su información, el sistema le solicitará cambiarla obligatoriamente en su primer inicio de sesión.
    </div>
    `,
    `<a class="btn" href="${loginUrl}">Acceder al Portal →</a>`
  )
}

interface PasswordResetEmailData {
  nombre: string
  apellidos: string
  email: string
  resetUrl: string
}

function buildPasswordResetHtml(data: PasswordResetEmailData): string {
  return buildBaseHtml(
    "Recuperación de Acceso",
    `
    <p class="greeting">Hola, ${data.nombre} ${data.apellidos}</p>
    <p class="content-text">
      Hemos recibido una solicitud para restablecer la contraseña asociada a su cuenta de correo electrónico. 
      Si usted realizó esta solicitud, puede continuar haciendo clic en el botón de abajo.
    </p>
    <div class="info-card" style="text-align: center; border-color: #f59e0b44;">
      <p style="color: #f59e0b; margin: 0; font-size: 13px; font-weight: 600;">Este enlace expirará en 60 minutos por motivos de seguridad.</p>
    </div>
    
    <div class="warning" style="background: transparent; color: #94a3b8; border: 1px dashed #334155;">
      Si usted no solicitó este cambio, puede ignorar este mensaje de forma segura. Su contraseña actual no sufrirá modificaciones.
    </div>
    `,
    `<a class="btn" href="${data.resetUrl}">Restablecer Contraseña →</a>`
  )
}

interface CourseEnrollmentData {
  nombreAlumno: string
  nombreCurso: string
  nombreMaestro: string
  emailAlumno: string
}

// Función auxiliar para escapar caracteres especiales en HTML para prevenir XSS
function escapeHtml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildCourseEnrollmentHtml(data: CourseEnrollmentData): string {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`
  
  return buildBaseHtml(
    "Nueva Inscripción Académica",
    `
    <p class="greeting">Confirmación de Inscripción 👋</p>
    <p class="content-text">Estimado(a) ${escapeHtml(data.nombreAlumno)}, le informamos que ha sido inscrito formalmente en el siguiente curso/taller bajo la supervisión del docente <strong>${escapeHtml(data.nombreMaestro)}</strong>.</p>
    
    <div class="info-card">
      <span class="info-label">Curso Asignado</span>
      <span class="info-value">${escapeHtml(data.nombreCurso)}</span>
    </div>

    <p class="content-text">A partir de este momento puede visualizar el programa, materiales y calendario de entregas desde su panel de control.</p>
    `,
    `<a class="btn" href="${loginUrl}">Ver mis Cursos</a>`
  )
}

interface NewTaskData {
  titulo: string
  descripcion: string
  cursoNombre: string
  prioridad: string
  deadline?: string
}

function buildNewTaskHtml(data: NewTaskData): string {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`
  const priorityColors: Record<string, string> = {
    urgente: "#ef4444", alta: "#f97316", media: "#3b82f6", baja: "#10b981"
  }
  const pColor = priorityColors[data.prioridad.toLowerCase()] ?? "#3b82f6"

  return buildBaseHtml(
    "Nueva Tarea Asignada",
    `
    <div class="badge" style="background: ${pColor}22; color: ${pColor}; border-color: ${pColor}44;">PRIORIDAD ${data.prioridad.toUpperCase()}</div>
    <p class="greeting">Nuevo Trabajo Asignado</p>
    <p class="content-text">Su docente ha publicado una nueva actividad académica en el curso <strong>${escapeHtml(data.cursoNombre)}</strong>. Por favor, revise las instrucciones y los plazos de entrega.</p>
    
    <div class="info-card">
      <span class="info-label">Título de la Actividad</span>
      <span class="info-value">${escapeHtml(data.titulo)}</span>
      
      <div style="margin-top: 16px; padding: 12px; background: #0f172a88; border-radius: 8px; font-size: 13px; color: #94a3b8; border-left: 3px solid ${pColor};">
        ${escapeHtml(data.descripcion.length > 150 ? data.descripcion.substring(0, 150) + '...' : data.descripcion)}
      </div>
    </div>

    ${data.deadline ? `
    <div style="display: flex; align-items: center; gap: 8px; color: #fca5a5; font-size: 14px; font-weight: 600;">
       <span>📅 Fecha Límite:</span> <span>${escapeHtml(data.deadline)}</span>
    </div>` : ""}
    `,
    `<a class="btn" href="${loginUrl}">Ver Instrucciones Completas</a>`
  )
}

interface ReviewData {
  nombreAlumno: string
  tituloTarea: string
  estado: string
  comentario: string
  horasAsignadas?: number
  emailAlumno: string
}

function buildTaskReviewedHtml(data: ReviewData): string {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`
  const statusColor = data.estado === "rechazada" ? "#ef4444" : (data.estado === "aprobada" ? "#10b981" : "#3b82f6")

  return buildBaseHtml(
    "Calificación de Actividad",
    `
    <p class="greeting">Resultado de su Revisión</p>
    <p class="content-text">Su docente ha evaluado el avance enviado para la actividad <strong>${escapeHtml(data.tituloTarea)}</strong>. El resultado de la revisión se detalla a continuación:</p>
    
    <div class="info-card" style="border-color: ${statusColor}44;">
      <span class="info-label">Estado de la Entrega</span>
      <span class="info-value" style="color: ${statusColor}; text-transform: uppercase;">${escapeHtml(data.estado)}</span>
      
      ${data.comentario ? `
      <div style="margin-top: 16px; padding: 16px; background: #ffffff05; border-radius: 12px; font-size: 14px; color: #94a3b8; border: 1px solid #334155;">
        "${escapeHtml(data.comentario)}"
      </div>` : ""}
    </div>

    ${data.horasAsignadas ? `
    <div style="background: #10b98111; padding: 12px 20px; border-radius: 12px; display: inline-block; border: 1px solid #10b98133;">
      <span style="color: #10b981; font-weight: 700; font-size: 14px;">⏱️ Horas Acreditadas: ${data.horasAsignadas}</span>
    </div>` : ""}
    `,
    `<a class="btn" href="${loginUrl}">Ver Detalle en el Panel</a>`
  )
}

interface AdvanceNotificationData {
  nombreMaestro: string
  nombreAlumno: string
  tituloTarea: string
  emailMaestro: string
}

function buildNewAdvanceHtml(data: AdvanceNotificationData): string {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`
  
  return buildBaseHtml(
    "Notificación de Entrega",
    `
    <p class="greeting">Estimado(a) Docente,</p>
    <p class="content-text">El estudiante <strong>${escapeHtml(data.nombreAlumno)}</strong> ha registrado una nueva entrega o avance significativo en la siguiente actividad:</p>
    
    <div class="info-card">
      <span class="info-label">Tarea / Proyecto</span>
      <span class="info-value" style="color: #3b82f6;">${escapeHtml(data.tituloTarea)}</span>
    </div>

    <p class="content-text">Favor de ingresar al sistema para realizar la evaluación correspondiente y acreditar las horas de servicio si procede.</p>
    `,
    `<a class="btn" href="${loginUrl}">Evaluar Entrega Ahora →</a>`
  )
}

// ─── Email verification ───────────────────────────────────────────────────────

interface EmailVerificationData {
  nombre: string
  apellidos: string
  email: string
  verifyUrl: string
}

function buildEmailVerificationHtml(data: EmailVerificationData): string {
  return buildBaseHtml(
    "Verifica tu correo electrónico",
    `
    <p class="greeting">Hola, ${escapeHtml(data.nombre)} ${escapeHtml(data.apellidos)} 👋</p>
    <p class="content-text">
      Gracias por registrarte en el Sistema de Gestión de Servicio Social.<br>
      Para activar tu cuenta y comenzar el proceso de inscripción, confirma tu correo electrónico haciendo clic en el botón de abajo.
    </p>
    <div class="info-card" style="text-align: center; border-color: #10b98144;">
      <p style="color: #10b981; margin: 0; font-size: 13px; font-weight: 600;">
        Este enlace es válido por <strong>24 horas</strong>.
      </p>
    </div>
    <div class="warning" style="background: transparent; color: #94a3b8; border: 1px dashed #334155;">
      Si no creaste esta cuenta, puedes ignorar este mensaje de forma segura.
    </div>
    `,
    `<a class="btn" href="${data.verifyUrl}" style="background:#10b981; box-shadow:0 4px 12px rgba(16,185,129,0.3);">Verificar mi correo →</a>`
  )
}

export async function sendEmailVerificationEmail(data: EmailVerificationData): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
  await transporter.sendMail({
    from: `"Gestión de Servicio Social" <${from}>`,
    to: data.email,
    subject: "Verifica tu correo — Servicio Social",
    html: buildEmailVerificationHtml(data),
  })
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
  await transporter.sendMail({
    from: `"Gestión Académica" <${from}>`,
    to: data.email,
    subject: `Recuperación de Contraseña — Sistema de Gestión`,
    html: buildPasswordResetHtml(data),
  })
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
  const safeMatriculaForSubject = escapeHtml(data.matricula)
  await transporter.sendMail({
    from: `"Gestión Académica" <${from}>`,
    to: data.email,
    subject: `Acceso al Sistema — ${safeMatriculaForSubject}`,
    html: buildWelcomeHtml(data),
  })
}

export async function sendCourseEnrollmentEmail(data: CourseEnrollmentData): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
  await transporter.sendMail({
    from: `"Gestión Académica" <${from}>`,
    to: data.emailAlumno,
    subject: `Confirmación de Inscripción: ${data.nombreCurso}`,
    html: buildCourseEnrollmentHtml(data),
  })
}

export async function sendNewTaskEmailsBulk(emails: string[], data: NewTaskData): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: `"Gestión Académica" <${from}>`,
        to: email,
        subject: `Nueva Tarea Asignada: ${data.titulo}`,
        html: buildNewTaskHtml(data),
      })
      await sleep(2000)
    } catch (err) {
      console.error("[email] Error enviando correo:", err)
    }
  }
}

export async function sendTaskReviewedEmail(data: ReviewData): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
  await transporter.sendMail({
    from: `"Gestión Académica" <${from}>`,
    to: data.emailAlumno,
    subject: `Calificación Disponible: ${data.tituloTarea}`,
    html: buildTaskReviewedHtml(data),
  })
}

export async function sendNewAdvanceNotificationEmail(data: AdvanceNotificationData): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
  await transporter.sendMail({
    from: `"Gestión Académica" <${from}>`,
    to: data.emailMaestro,
    subject: `Nueva Entrega de ${data.nombreAlumno} — ${data.tituloTarea}`,
    html: buildNewAdvanceHtml(data),
  })
}

// ─── Inscripción: aprobación / rechazo ───────────────────────────────────────

interface SolicitudRevisadaData {
  nombre: string
  apellidos: string
  email: string
  convocatoriaNombre: string
  motivo_rechazo?: string
}

function buildSolicitudAprobadaHtml(data: SolicitudRevisadaData): string {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/inscripcion`
  return buildBaseHtml(
    "Solicitud Aprobada",
    `
    <p class="greeting">¡Felicidades, ${escapeHtml(data.nombre)}!</p>
    <p class="content-text">
      Tu solicitud de inscripción al servicio social ha sido <strong style="color:#10b981;">aprobada</strong> por el departamento.
    </p>
    <div class="info-card" style="border-color:#10b98144;">
      <span class="info-label">Convocatoria</span>
      <span class="info-value">${escapeHtml(data.convocatoriaNombre)}</span>
    </div>
    <p class="content-text">
      Próximamente se te asignará un número de turno para que puedas seleccionar tu programa de servicio social.
      Mantente pendiente de tu portal de inscripción.
    </p>
    `,
    `<a class="btn" href="${loginUrl}" style="background:#10b981; box-shadow:0 4px 12px rgba(16,185,129,0.3);">Ver mi portal →</a>`
  )
}

function buildSolicitudRechazadaHtml(data: SolicitudRevisadaData): string {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/inscripcion`
  return buildBaseHtml(
    "Solicitud Rechazada",
    `
    <p class="greeting">Hola, ${escapeHtml(data.nombre)} ${escapeHtml(data.apellidos)}</p>
    <p class="content-text">
      Lamentablemente, tu solicitud de inscripción al servicio social ha sido <strong style="color:#ef4444;">rechazada</strong>.
      A continuación encontrarás el motivo indicado por el departamento.
    </p>
    <div class="info-card" style="border-color:#ef444444;">
      <span class="info-label">Motivo del rechazo</span>
      <span class="info-value" style="color:#fca5a5; font-size:14px; font-weight:500;">${escapeHtml(data.motivo_rechazo ?? "Sin especificar")}</span>
    </div>
    <p class="content-text">
      Puedes corregir los documentos indicados y volver a enviar tu solicitud desde el portal de inscripción,
      <strong>siempre que la convocatoria siga abierta</strong>.
    </p>
    <div class="warning">
      Si tienes dudas, acude al departamento de Servicio Social en el Edificio 20.
    </div>
    `,
    `<a class="btn" href="${loginUrl}">Corregir y reenviar →</a>`
  )
}

export async function sendSolicitudAprobadaEmail(data: SolicitudRevisadaData): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
  await transporter.sendMail({
    from: `"Servicio Social" <${from}>`,
    to: data.email,
    subject: `Solicitud aprobada — ${escapeHtml(data.convocatoriaNombre)}`,
    html: buildSolicitudAprobadaHtml(data),
  })
}

export async function sendSolicitudRechazadaEmail(data: SolicitudRevisadaData): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
  await transporter.sendMail({
    from: `"Servicio Social" <${from}>`,
    to: data.email,
    subject: `Solicitud rechazada — ${escapeHtml(data.convocatoriaNombre)}`,
    html: buildSolicitudRechazadaHtml(data),
  })
}

// ─── Inscripción: oficio listo ────────────────────────────────────────────────

interface OficioListoData {
  nombre: string
  apellidos: string
  email: string
  numero_oficio: string
  cartaUrl: string
}

function buildOficioListoHtml(data: OficioListoData): string {
  return buildBaseHtml(
    "Tu carta de asignación está lista",
    `
    <p class="greeting">Hola, ${escapeHtml(data.nombre)} 👋</p>
    <p class="content-text">
      Tu carta de asignación ha sido generada y ya está disponible en tu portal.
      Descárgala, imprímela y llévala <strong>personalmente</strong> a la dependencia donde realizarás tu servicio social para que la firmen y sellen.
    </p>
    <div class="info-card" style="border-color:#3b82f644;">
      <span class="info-label">Número de Oficio</span>
      <span class="info-value" style="font-family: monospace;">${escapeHtml(data.numero_oficio)}</span>
    </div>
    <p class="content-text">
      Una vez que la dependencia firme y selle la carta, <strong>escanea o fotografía el documento</strong> y súbelo desde tu portal de inscripción para continuar con el proceso.
    </p>
    <div class="warning" style="background: transparent; color: #94a3b8; border: 1px dashed #334155;">
      Si tienes dudas sobre el proceso, acude al Departamento de Gestión Tecnológica y Vinculación.
    </div>
    `,
    `<a class="btn" href="${data.cartaUrl}">Ver e Imprimir mi Carta →</a>`
  )
}

export async function sendOficioListoEmail(data: OficioListoData): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
  await transporter.sendMail({
    from: `"Servicio Social" <${from}>`,
    to: data.email,
    subject: `Tu carta de asignación está lista — Oficio ${escapeHtml(data.numero_oficio)}`,
    html: buildOficioListoHtml(data),
  })
}
