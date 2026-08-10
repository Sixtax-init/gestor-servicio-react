import { request, type APIRequestContext } from "@playwright/test"
import { readFileSync } from "fs"
import { join } from "path"
import { CUENTAS, PASSWORD_PRUEBAS, type Rol, type DatosSembrados } from "./seed"

/** Identificadores creados por la siembra (los escribe global-setup). */
export function datosSembrados(): DatosSembrados {
  return JSON.parse(
    readFileSync(join(process.cwd(), "tests/setup/datos-sembrados.json"), "utf8"),
  )
}

/**
 * Contexto HTTP autenticado como `rol`.
 *
 * Inicia sesión de verdad contra /api/auth/login para que las cookies sean las
 * que emite la app: si cambia el formato de sesión, las pruebas lo notan.
 */
export async function comoRol(rol: Rol, baseURL: string): Promise<APIRequestContext> {
  const ctx = await request.newContext({ baseURL })

  const res = await ctx.post("/api/auth/login", {
    data: { matricula: CUENTAS[rol], password: PASSWORD_PRUEBAS },
  })

  if (!res.ok()) {
    throw new Error(
      `No se pudo iniciar sesión como ${rol} (${CUENTAS[rol]}): ` +
        `${res.status()} ${await res.text()}`,
    )
  }

  return ctx
}

/** Contexto sin autenticar, para comprobar que las rutas rechazan anónimos. */
export async function sinSesion(baseURL: string): Promise<APIRequestContext> {
  return request.newContext({ baseURL })
}
