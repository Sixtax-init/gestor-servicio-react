#!/usr/bin/env node
/**
 * Migración: mueve los archivos con datos personales fuera de `public/uploads`
 * hacia el directorio privado, que ya no se sirve como estático.
 *
 * Motivo: cualquier archivo bajo public/ lo sirve Next sin pasar por sesión, de
 * modo que kardex, fotografías, constancias y entregas quedaban accesibles con
 * sólo conocer la URL. Tras esta migración los sirve app/uploads/[...ruta].
 *
 * Los logos institucionales (`institucion`) se quedan en public/: son públicos
 * por diseño y se muestran en la pantalla de login.
 *
 * Uso:
 *   node scripts/migrate-uploads-privados.js            # aplicar
 *   node scripts/migrate-uploads-privados.js --dry-run  # simular
 *   node scripts/migrate-uploads-privados.js --rollback # revertir a public/
 */

const fs = require("fs")
const path = require("path")

// "curso" (singular) es la carpeta histórica que escribía app/api/maestro/tareas
// antes de usar saveFile; se migra igual para que deje de ser pública.
const TIPOS_PRIVADOS = ["entregas", "cursos", "tareas", "avances", "solicitudes", "instrucciones", "curso"]

const PUBLIC_ROOT = path.resolve(process.cwd(), "public/uploads")
const PRIVATE_ROOT = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "private-uploads"))

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const rollback = args.includes("--rollback")

function moverDirectorio(origen, destino) {
  if (!fs.existsSync(origen)) return { movidos: 0, omitidos: 0 }

  let movidos = 0
  let omitidos = 0

  for (const entry of fs.readdirSync(origen, { withFileTypes: true })) {
    const rutaOrigen = path.join(origen, entry.name)
    const rutaDestino = path.join(destino, entry.name)

    if (entry.isDirectory()) {
      const r = moverDirectorio(rutaOrigen, rutaDestino)
      movidos += r.movidos
      omitidos += r.omitidos
      // Limpiar el directorio de origen si quedó vacío
      if (!dryRun && fs.existsSync(rutaOrigen) && fs.readdirSync(rutaOrigen).length === 0) {
        fs.rmdirSync(rutaOrigen)
      }
      continue
    }

    if (fs.existsSync(rutaDestino)) {
      console.warn(`  ! ya existe en destino, se omite: ${rutaDestino}`)
      omitidos++
      continue
    }

    if (dryRun) {
      console.log(`  [dry-run] ${rutaOrigen} -> ${rutaDestino}`)
    } else {
      fs.mkdirSync(path.dirname(rutaDestino), { recursive: true })
      fs.renameSync(rutaOrigen, rutaDestino)
    }
    movidos++
  }

  return { movidos, omitidos }
}

function main() {
  const origenRoot = rollback ? PRIVATE_ROOT : PUBLIC_ROOT
  const destinoRoot = rollback ? PUBLIC_ROOT : PRIVATE_ROOT

  console.log(rollback ? "↩️  ROLLBACK: privado -> public/uploads" : "🔒 Migrando public/uploads -> privado")
  console.log(`   origen : ${origenRoot}`)
  console.log(`   destino: ${destinoRoot}`)
  if (dryRun) console.log("   (simulación, no se mueve nada)\n")

  let totalMovidos = 0
  let totalOmitidos = 0

  for (const tipo of TIPOS_PRIVADOS) {
    const origen = path.join(origenRoot, tipo)
    if (!fs.existsSync(origen)) continue

    console.log(`\n· ${tipo}`)
    const { movidos, omitidos } = moverDirectorio(origen, path.join(destinoRoot, tipo))
    console.log(`  ${movidos} archivo(s) movido(s)${omitidos ? `, ${omitidos} omitido(s)` : ""}`)
    totalMovidos += movidos
    totalOmitidos += omitidos

    if (!dryRun && fs.existsSync(origen) && fs.readdirSync(origen).length === 0) {
      fs.rmdirSync(origen)
    }
  }

  console.log(`\n✅ Total: ${totalMovidos} archivo(s) movido(s)${totalOmitidos ? `, ${totalOmitidos} omitido(s)` : ""}`)

  if (!rollback && !dryRun) {
    console.log("\nLas rutas guardadas en la base de datos NO cambian: siguen siendo")
    console.log("/uploads/{tipo}/{id}/{archivo} y ahora las resuelve app/uploads/[...ruta].")
  }
}

main()
