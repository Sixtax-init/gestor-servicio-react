import nodemailer from "nodemailer"

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

function buildWelcomeHtml(data: WelcomeEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
  const loginUrl = `${appUrl}${basePath}/login`
  const tipoLabel = getTipoLabel(data.tipo_usuario)
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido al Sistema de Servicio Social</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #18181b; padding: 28px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { color: #a1a1aa; margin: 6px 0 0; font-size: 13px; }
    .body { padding: 32px; }
    .greeting { font-size: 18px; font-weight: 600; color: #18181b; margin: 0 0 8px; }
    .intro { font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 24px; }
    .badge { display: inline-block; background: #18181b; color: #ffffff; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; margin-bottom: 20px; }
    .credentials-box { background: #f4f4f5; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; }
    .credentials-title { font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 16px; }
    .credential-item { margin-bottom: 14px; }
    .credential-item:last-child { margin-bottom: 0; }
    .cred-label { font-size: 12px; color: #71717a; font-weight: 500; margin-bottom: 4px; }
    .cred-value { font-size: 15px; font-weight: 700; color: #18181b; font-family: 'Courier New', monospace; background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e4e4e7; word-break: break-all; display: block; }
    .warning { background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #713f12; line-height: 1.5; margin-bottom: 24px; }
    .warning strong { display: block; margin-bottom: 4px; }
    .cta { text-align: center; margin: 24px 0 8px; }
    .btn { display: inline-block; background: #18181b; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 36px; border-radius: 8px; }
    .footer { padding: 18px 32px; border-top: 1px solid #f4f4f5; text-align: center; }
    .footer p { font-size: 11px; color: #a1a1aa; margin: 0; line-height: 1.5; }
    @media only screen and (max-width: 480px) {
      .wrapper { margin: 0; border-radius: 0; }
      .header { padding: 24px 20px; }
      .body { padding: 24px 20px; }
      .credentials-box { padding: 16px 18px; }
      .footer { padding: 16px 20px; }
      .btn { display: block; text-align: center; padding: 14px 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Sistema de Servicio Social</h1>
      <p>Gestión de Horas y Actividades</p>
    </div>

    <div class="body">
      <p class="greeting">Hola, ${data.nombre} ${data.apellidos} 👋</p>
      <p class="intro">
        Tu cuenta ha sido creada en el Sistema de Servicio Social. A continuación encontrarás tus credenciales de acceso.
        Guárdalas en un lugar seguro.
      </p>

      <span class="badge">${tipoLabel}</span>

      <div class="credentials-box">
        <p class="credentials-title">Tus credenciales</p>

        <div class="credential-item">
          <p class="cred-label">Matrícula</p>
          <span class="cred-value">${data.matricula}</span>
        </div>
        <div class="credential-item">
          <p class="cred-label">Contraseña</p>
          <span class="cred-value">${data.password}</span>
        </div>
        <div class="credential-item">
          <p class="cred-label">Correo</p>
          <span class="cred-value">${data.email}</span>
        </div>
      </div>

      <div class="warning">
        <strong>⚠️ Contraseña temporal</strong>
        La contraseña mostrada arriba es de un solo uso. Al iniciar sesión por primera vez, el sistema te pedirá obligatoriamente que la cambies antes de continuar.
        Nunca compartas tus credenciales con nadie.
      </div>

      <div class="cta">
        <a class="btn" href="${loginUrl}">Iniciar sesión →</a>
      </div>
    </div>

    <div class="footer">
      <p>© ${year} Sistema de Servicio Social<br>Este correo fue generado automáticamente, no respondas a él.</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER

  await transporter.sendMail({
    from: `"Sistema de Servicio Social" <${from}>`,
    to: data.email,
    subject: `Bienvenido al Sistema de Servicio Social — ${data.matricula}`,
    html: buildWelcomeHtml(data),
  })
}
