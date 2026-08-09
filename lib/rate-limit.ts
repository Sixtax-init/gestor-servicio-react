/**
 * Limitador de peticiones en memoria, sin dependencias.
 *
 * Vale para este despliegue porque la app corre como una sola instancia de PM2
 * en modo fork (ver PRODUCCION.md §7). Si algún día se pasa a `pm2 -i` (cluster)
 * o a varios servidores, cada proceso tendría su propio contador y habría que
 * mover esto a la base de datos o a Redis.
 */

type Ventana = { marcas: number[] }

const cubetas = new Map<string, Ventana>()

// Cota de seguridad: si el mapa crece mucho (muchas IPs distintas), se barren
// las entradas ya vencidas antes de seguir, para no acumular memoria.
const MAX_CLAVES = 10_000

function barrer(ahora: number, ventanaMs: number) {
  for (const [clave, ventana] of cubetas) {
    const vivas = ventana.marcas.filter((m) => ahora - m < ventanaMs)
    if (vivas.length === 0) cubetas.delete(clave)
    else ventana.marcas = vivas
  }
}

export interface ResultadoLimite {
  permitido: boolean
  restantes: number
  /** Segundos que faltan para poder reintentar (0 si está permitido). */
  reintentarEnSeg: number
}

/**
 * Registra un intento y dice si se pasó del límite.
 * Ventana deslizante: cuenta los intentos de los últimos `ventanaMs`.
 */
export function rateLimit(
  clave: string,
  { limite, ventanaMs }: { limite: number; ventanaMs: number },
): ResultadoLimite {
  const ahora = Date.now()

  if (cubetas.size > MAX_CLAVES) barrer(ahora, ventanaMs)

  const ventana = cubetas.get(clave) ?? { marcas: [] }
  ventana.marcas = ventana.marcas.filter((m) => ahora - m < ventanaMs)

  if (ventana.marcas.length >= limite) {
    cubetas.set(clave, ventana)
    const masAntigua = ventana.marcas[0]
    return {
      permitido: false,
      restantes: 0,
      reintentarEnSeg: Math.max(1, Math.ceil((ventanaMs - (ahora - masAntigua)) / 1000)),
    }
  }

  ventana.marcas.push(ahora)
  cubetas.set(clave, ventana)

  return { permitido: true, restantes: limite - ventana.marcas.length, reintentarEnSeg: 0 }
}

/** Borra los intentos de una clave. Útil tras un login correcto. */
export function limpiarLimite(clave: string): void {
  cubetas.delete(clave)
}

/**
 * IP del cliente real.
 *
 * Se prefiere X-Real-IP porque Nginx la fija con $remote_addr y el cliente no
 * puede falsificarla. X-Forwarded-For se arma con $proxy_add_x_forwarded_for,
 * que CONSERVA lo que mandó el cliente y añade la IP real al final: por eso,
 * si hay que recurrir a ella, se toma el último valor y no el primero.
 */
export function getClientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim()
  if (real) return real

  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const partes = forwarded.split(",").map((p) => p.trim()).filter(Boolean)
    if (partes.length > 0) return partes[partes.length - 1]
  }

  return "desconocida"
}

/** Respuesta 429 estándar, con Retry-After para que el cliente sepa cuándo volver. */
export function respuesta429(reintentarEnSeg: number, mensaje: string) {
  return Response.json(
    { error: mensaje },
    { status: 429, headers: { "Retry-After": String(reintentarEnSeg) } },
  )
}
