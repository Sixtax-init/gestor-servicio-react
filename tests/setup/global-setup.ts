import { sembrar } from "./seed"

/**
 * Corre una vez antes de toda la suite: deja la base de pruebas en un estado
 * conocido. Los identificadores sembrados se guardan en un archivo para que
 * cada prueba los lea sin volver a consultar la base.
 */
async function globalSetup() {
  const inicio = Date.now()
  const datos = await sembrar()

  const { writeFileSync } = await import("fs")
  const { join } = await import("path")
  writeFileSync(
    join(process.cwd(), "tests/setup/datos-sembrados.json"),
    JSON.stringify(datos, null, 2),
  )

  console.log(`\n🌱 Base de pruebas sembrada en ${Date.now() - inicio}ms\n`)
}

export default globalSetup
