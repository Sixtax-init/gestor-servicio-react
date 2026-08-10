import { defineConfig } from "@playwright/test"
import { config as cargarEnv } from "dotenv"

// .env.test define TEST_DATABASE_URL y los secretos con los que arranca el
// servidor de pruebas. Nunca se lee .env.local: las pruebas no deben poder
// tocar la base de desarrollo.
cargarEnv({ path: ".env.test" })

const PUERTO = Number(process.env.TEST_PORT ?? 3100)
const BASE_URL = `http://127.0.0.1:${PUERTO}`

export default defineConfig({
  testDir: "./tests",
  // El estado de la base es compartido, así que las pruebas no corren en
  // paralelo entre archivos: se pisarían entre sí.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  // Siembra la base antes de que arranque nada.
  globalSetup: "./tests/setup/global-setup.ts",

  use: {
    baseURL: BASE_URL,
    // Traza sólo al reintentar: da el detalle donde hace falta sin pagar el
    // coste en cada corrida.
    trace: "on-first-retry",
    extraHTTPHeaders: { Accept: "application/json" },
  },

  // Levanta la app apuntando a la base de pruebas. `reuseExistingServer` evita
  // reiniciarla en cada corrida local, pero en CI siempre arranca limpia.
  webServer: {
    command: `pnpm exec next dev --port ${PUERTO}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
      SESSION_SECRET: process.env.SESSION_SECRET ?? "secreto_solo_para_pruebas_min_32_caracteres",
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: BASE_URL,
      NEXT_PUBLIC_BASE_PATH: "",
      // SMTP inexistente a propósito: las rutas que mandan correo no deben
      // fallar la prueba por ello — el envío va en segundo plano y con catch.
      SMTP_HOST: "localhost",
      SMTP_PORT: "1025",
    },
  },

  projects: [
    {
      // Capa 1: autorización a nivel de API. Sin navegador, así que es rápida.
      name: "api",
      testMatch: /.*\.api\.spec\.ts/,
    },
  ],
})
