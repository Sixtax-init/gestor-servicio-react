import { test, expect, type APIRequestContext } from "@playwright/test"
import { comoRol, sinSesion, datosSembrados } from "./setup/sesion"
import type { Rol } from "./setup/seed"

/**
 * Capa 1 — Autorización.
 *
 * Cada caso corresponde a un agujero real que se cerró en la auditoría del
 * 2026-08-09. El objetivo no es cubrir por cubrir: es que si alguien vuelve a
 * abrir uno de estos, la suite lo diga antes de que llegue a producción.
 */

const datos = datosSembrados()

// Contextos compartidos: iniciar sesión es lento (bcrypt), así que se hace una
// vez por rol y se reutiliza en todo el archivo.
const ctx = {} as Record<Rol | "anonimo", APIRequestContext>

test.beforeAll(async ({ baseURL }) => {
  const url = baseURL!
  ctx.anonimo = await sinSesion(url)
  for (const rol of ["main_admin", "administrador", "maestro", "alumno", "alumno_ajeno", "pre_candidato"] as Rol[]) {
    ctx[rol] = await comoRol(rol, url)
  }
})

test.afterAll(async () => {
  await Promise.all(Object.values(ctx).map((c) => c.dispose()))
})

// ─────────────────────────────────────────────────────────────────────────────
test.describe("Rutas protegidas rechazan a los anónimos", () => {
  const rutas = [
    "/api/admin/usuarios",
    "/api/admin/solicitudes",
    "/api/main-admin/carreras",
    "/api/main-admin/departamentos",
    "/api/maestro/cursos",
    "/api/alumno/me",
  ]

  for (const ruta of rutas) {
    test(`GET ${ruta} sin sesión`, async () => {
      const res = await ctx.anonimo.get(ruta)
      expect(res.status(), `${ruta} debería exigir sesión`).toBeGreaterThanOrEqual(401)
      expect(res.status()).toBeLessThan(404)
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
test.describe("El módulo de inscripción es sólo de main_admin", () => {
  // Antes aceptaban `administrador` aunque la interfaz nunca se lo mostrara:
  // 13 rutas donde un admin de departamento podía leer y modificar solicitudes,
  // convocatorias y programas de toda la institución.
  const rutas = [
    "/api/admin/solicitudes",
    "/api/admin/convocatorias",
  ]

  for (const ruta of rutas) {
    test(`administrador NO entra a ${ruta}`, async () => {
      const res = await ctx.administrador.get(ruta)
      expect(res.status(), "un administrador no gestiona servicio social").toBe(403)
    })

    test(`main_admin sí entra a ${ruta}`, async () => {
      const res = await ctx.main_admin.get(ruta)
      expect(res.ok(), `main_admin debería poder leer ${ruta}`).toBeTruthy()
    })
  }

  test("la carta de asignación no la ve un administrador", async () => {
    const res = await ctx.administrador.get("/api/inscripcion/carta-asignacion/1")
    expect(res.status()).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
test.describe("Escalada de privilegios en la gestión de usuarios", () => {
  // El rol venía del cuerpo de la petición sin validar: un administrador podía
  // crear un main_admin, o promoverse a sí mismo.
  test("administrador NO puede crear un main_admin", async () => {
    const res = await ctx.administrador.post("/api/admin/usuarios", {
      data: {
        matricula: "99999901",
        nombre: "Intruso",
        apellidos: "Escalada",
        email: "intruso1@pruebas.test",
        tipo_usuario: "main_admin",
      },
    })
    expect(res.status(), "no debe poder asignar main_admin").toBe(403)
  })

  test("administrador NO puede crear otro administrador", async () => {
    const res = await ctx.administrador.post("/api/admin/usuarios", {
      data: {
        matricula: "99999902",
        nombre: "Intruso",
        apellidos: "Escalada",
        email: "intruso2@pruebas.test",
        tipo_usuario: "administrador",
      },
    })
    expect(res.status()).toBe(403)
  })

  test("administrador sí puede crear un maestro de su departamento", async () => {
    const res = await ctx.administrador.post("/api/admin/usuarios", {
      data: {
        matricula: "99999903",
        nombre: "Maestro",
        apellidos: "Legitimo",
        email: "maestro-legitimo@pruebas.test",
        tipo_usuario: "maestro",
      },
    })
    expect(res.status(), "crear personal de su departamento es su función").toBe(201)
  })

  test("administrador NO puede promoverse a sí mismo", async () => {
    const res = await ctx.administrador.put(`/api/admin/usuarios/${datos.usuarios.administrador}`, {
      data: {
        matricula: "ADMIN002",
        nombre: "administrador",
        apellidos: "Pruebas",
        email: "administrador@pruebas.test",
        tipo_usuario: "main_admin",
        activo: true,
      },
    })
    expect(res.status()).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
test.describe("IDOR: un alumno no lee los datos de otro", () => {
  test("el alumno sí lee los suyos", async () => {
    const res = await ctx.alumno.get(`/api/alumno/${datos.usuarios.alumno}`)
    expect(res.ok()).toBeTruthy()
  })

  test("el alumno NO lee los de otro alumno", async () => {
    const res = await ctx.alumno.get(`/api/alumno/${datos.usuarios.alumno_ajeno}`)
    expect(res.status(), "antes bastaba con tener sesión para leer a cualquiera").toBe(403)
  })

  test("un pre_candidato tampoco", async () => {
    const res = await ctx.pre_candidato.get(`/api/alumno/${datos.usuarios.alumno}`)
    expect(res.status()).toBe(403)
  })

  test("el maestro sí lee al alumno que tiene inscrito", async () => {
    const res = await ctx.maestro.get(`/api/alumno/${datos.usuarios.alumno}`)
    expect(res.ok(), "tiene relación real con ese alumno").toBeTruthy()
  })

  test("el maestro NO lee a un alumno ajeno a sus cursos", async () => {
    const res = await ctx.maestro.get(`/api/alumno/${datos.usuarios.alumno_ajeno}`)
    expect(res.status()).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
test.describe("Un maestro no mete a cualquiera en sus cursos", () => {
  // El id llegaba del cliente sin comprobar a quién apuntaba: se podía inscribir
  // a un main_admin y leer sus datos desde la lista de alumnos del grupo.
  test("no puede inscribir a un main_admin", async () => {
    const res = await ctx.maestro.post(`/api/maestro/cursos/${datos.curso_id}/agregar-alumno`, {
      data: { alumnoId: datos.usuarios.main_admin },
    })
    expect(res.status(), "sólo se inscribe a alumnos").toBe(404)
  })

  test("no puede inscribir a un administrador", async () => {
    const res = await ctx.maestro.post(`/api/maestro/cursos/${datos.curso_id}/agregar-alumno`, {
      data: { alumnoId: datos.usuarios.administrador },
    })
    expect(res.status()).toBe(404)
  })

  test("un alumno no puede inscribirse a sí mismo por esta vía", async () => {
    const res = await ctx.alumno.post(`/api/maestro/cursos/${datos.curso_id}/agregar-alumno`, {
      data: { alumnoId: datos.usuarios.alumno_ajeno },
    })
    expect(res.status()).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
test.describe("Subida de archivos", () => {
  // El parámetro `type` se usaba para construir una ruta en disco sin validar,
  // lo que permitía escribir fuera del directorio de subidas.
  const travesias = ["../../../../etc", "..", "../", "entregas/../..", "/etc/passwd"]

  for (const payload of travesias) {
    test(`type="${payload}" es rechazado`, async () => {
      const res = await ctx.alumno.post("/api/upload", {
        multipart: {
          type: payload,
          referenceId: "0",
          file: { name: "prueba.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") },
        },
      })
      expect(res.status(), "sólo se aceptan tipos de la lista blanca").toBe(400)
    })
  }

  test("un tipo válido sí se acepta", async () => {
    const res = await ctx.alumno.post("/api/upload", {
      multipart: {
        type: "avances",
        referenceId: "0",
        file: { name: "avance.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") },
      },
    })
    expect(res.status()).toBe(201)
  })

  test("un alumno no sube logos institucionales", async () => {
    const res = await ctx.alumno.post("/api/upload", {
      multipart: {
        type: "institucion",
        referenceId: "0",
        file: { name: "logo.png", mimeType: "image/png", buffer: Buffer.from("\x89PNG") },
      },
    })
    expect(res.status()).toBe(403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
test.describe("Redirección abierta en el refresco de sesión", () => {
  // ?continue=//evil.com producía new URL("//evil.com", origen) = https://evil.com
  const payloads = ["//evil.com", "/\\evil.com", "https://evil.com", "//user:pass@evil.com"]

  for (const payload of payloads) {
    test(`continue="${payload}" no sale del sitio`, async ({ baseURL }) => {
      const res = await ctx.alumno.get(
        `/api/auth/refresh?continue=${encodeURIComponent(payload)}`,
        { maxRedirects: 0 },
      )
      const destino = res.headers()["location"] ?? ""
      if (destino) {
        // Se compara el hostname contra los que somos nosotros: la app redirige
        // a una ruta relativa, que el cliente resuelve contra el host de la
        // petición (localhost), no contra el baseURL de la configuración
        // (127.0.0.1). Ambos son el mismo servidor.
        const { hostname } = new URL(destino, baseURL)
        expect(["localhost", "127.0.0.1"], `redirigía a un dominio ajeno: ${destino}`)
          .toContain(hostname)
      }
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
test.describe("El endpoint de migración quedó eliminado", () => {
  // Ejecutaba DDL sobre la base sin pedir sesión, y no estaba en el matcher
  // del proxy: cualquiera en internet podía invocarlo.
  test("/api/temp-migrate ya no existe", async () => {
    const res = await ctx.anonimo.get("/api/temp-migrate")
    expect(res.status()).toBe(404)
  })
})
