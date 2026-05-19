import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { getUserById } from "./auth"
import type { SessionUser } from "./auth"
import { sql } from "./db"
import crypto from "crypto"

const COOKIE_NAME = "session"
const ISSUER = "gestor-servicio"
const AUDIENCE = "gestor-servicio-api"
const REFRESH_COOKIE_NAME = "refresh_token"
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
}

function getSecretKey(): Uint8Array {
    const secret = process.env.SESSION_SECRET
    if (!secret) throw new Error("SESSION_SECRET environment variable is required but not set")
    return new TextEncoder().encode(secret)
}

// Crear sesión — firma todos los campos necesarios para reconstruir el usuario sin BD
export async function createSession(user: SessionUser, userAgent: string = "", ipAddress: string = ""): Promise<void> {
    // 1. Eliminar cualquier sesión previa para limpiar la BD (Fuerza Single-Session por Usuario)
    await sql`DELETE FROM sesiones WHERE usuario_id = ${user.id}`

    // 2. Generar e insertar Refresh Token en Base de Datos (Ghost Token architecture)
    const refreshToken = crypto.randomBytes(32).toString("hex")
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")

    // Expires in 7 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const result = await sql`
        INSERT INTO sesiones (usuario_id, refresh_token, user_agent, ip_address, expires_at)
        VALUES (${user.id}, ${refreshTokenHash}, ${userAgent}, ${ipAddress}, ${expiresAt})
        RETURNING id
    `
    const sessionId = result[0].id

    // 2. Generar Access Token (JWT) válido por 15 minutos
    const token = await new SignJWT({
        // Sólo guardamos datos no sensibles en el token para el Edge Middleware (proxy.ts)
        session_id: sessionId,
        tipo_usuario: user.tipo_usuario,
        departamento_id: user.departamento_id ?? null,
        pendiente_verificacion: user.pendiente_verificacion,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(String(user.id))
        .setIssuedAt()
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime("15m")
        .sign(getSecretKey())

    const cookieStore = await cookies()
    // Cookie de sesión rápida (15 min)
    cookieStore.set(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge: 15 * 60 })
    // Cookie de refresh (7 días)
    cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 })
}

// Obtener sesión — reconstruye el usuario desde el JWT, sin consultar la BD
export async function getSession(): Promise<SessionUser | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) return null

    try {
        const { payload } = await jwtVerify(token, getSecretKey(), {
            issuer: ISSUER,
            audience: AUDIENCE,
        })

        const userId = Number(payload.sub)
        const sessionId = payload.session_id as string
        if (!userId || !sessionId) return null

        // MATA GHOST TOKENS de manera instantánea validando que la sesión en la DB siga activa
        const sessionCheck = await sql`
            SELECT activo FROM sesiones WHERE id = ${sessionId} AND activo = true
        `
        if (sessionCheck.length === 0) {
            // Sesión fue revocada desde admin (Ghost Token)
            return null
        }

        // Ahora el JWT ya no lleva PII, así que recuperamos el usuario completo de la BD
        const dbUser = await getUserById(userId)
        
        return dbUser
    } catch (error) {
        const name = (error as Error)?.name ?? ""
        const msg  = (error as Error)?.message ?? ""
        // Solo logueamos — no borramos la cookie aquí porque getSession() puede
        // llamarse desde Server Components donde modificar cookies tiene side-effects no deseados.
        console.warn(`[session] jwtVerify falló (${name}: ${msg})`)
        return null
    }
}


// Destruir sesión
export async function destroySession(): Promise<void> {
    const cookieStore = await cookies()
    
    // Tratamos de invalidar activamente en Base de datos antes de limpiar cookies
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (token) {
        try {
            const { payload } = await jwtVerify(token, getSecretKey(), { issuer: ISSUER, audience: AUDIENCE })
            if (payload.session_id) {
                await sql`UPDATE sesiones SET activo = false WHERE id = ${payload.session_id}`
            }
        } catch (e) {
            // Si expira o falla durante logout, también podemos tratar de matar por refresh token
            const fallbackToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value
            if (fallbackToken) {
                const fallbackHash = crypto.createHash("sha256").update(fallbackToken).digest("hex")
                await sql`UPDATE sesiones SET activo = false WHERE refresh_token = ${fallbackHash}`
            }
        }
    }

    cookieStore.delete(COOKIE_NAME)
    cookieStore.delete(REFRESH_COOKIE_NAME)
}

// Verificar si el usuario tiene un rol específico
export async function requireRole(
    allowedRoles: Array<"main_admin" | "administrador" | "maestro" | "alumno" | "pre_candidato">,
): Promise<SessionUser | null> {
    const user = await getSession()

    if (!user) return null

    if (user.tipo_usuario === "main_admin") return user

    if (!allowedRoles.includes(user.tipo_usuario)) return null

    return user
}
