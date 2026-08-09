import type { TipoUsuario } from "./db"

export const TIPOS_USUARIO: TipoUsuario[] = [
  "main_admin",
  "administrador",
  "maestro",
  "alumno",
  "pre_candidato",
]

/**
 * Roles que cada perfil puede asignar al crear o editar usuarios.
 *
 * Un `administrador` gestiona únicamente al personal y alumnado de su
 * departamento: no puede crear ni promover a `administrador` ni a `main_admin`,
 * porque eso le permitiría escalar privilegios sobre toda la institución.
 */
const ROLES_ASIGNABLES: Record<"main_admin" | "administrador", TipoUsuario[]> = {
  main_admin: ["main_admin", "administrador", "maestro", "alumno", "pre_candidato"],
  administrador: ["maestro", "alumno", "pre_candidato"],
}

export function esTipoUsuario(valor: unknown): valor is TipoUsuario {
  return typeof valor === "string" && (TIPOS_USUARIO as string[]).includes(valor)
}

/** ¿`actor` puede asignar el rol `objetivo`? */
export function puedeAsignarRol(actor: TipoUsuario, objetivo: unknown): objetivo is TipoUsuario {
  if (!esTipoUsuario(objetivo)) return false
  if (actor !== "main_admin" && actor !== "administrador") return false
  return ROLES_ASIGNABLES[actor].includes(objetivo)
}

export function rolesAsignablesPor(actor: TipoUsuario): TipoUsuario[] {
  if (actor !== "main_admin" && actor !== "administrador") return []
  return ROLES_ASIGNABLES[actor]
}
