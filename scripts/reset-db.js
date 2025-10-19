const { neon } = require("@neondatabase/serverless")

async function resetDatabase() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error("❌ ERROR: DATABASE_URL no está configurada")
    process.exit(1)
  }

  console.log("⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos")
  console.log("🔄 Conectando a la base de datos...\n")

  try {
    const sql = neon(databaseUrl)

    // Verificar conexión
    await sql`SELECT 1`

    console.log("🗑️  Eliminando todas las tablas...")

    // Eliminar tablas en orden correcto (respetando foreign keys)
    await sql`DROP TABLE IF EXISTS entregas_tareas CASCADE`
    await sql`DROP TABLE IF EXISTS inscripciones CASCADE`
    await sql`DROP TABLE IF EXISTS tareas CASCADE`
    await sql`DROP TABLE IF EXISTS cursos CASCADE`
    await sql`DROP TABLE IF EXISTS usuarios CASCADE`

    console.log("✅ Tablas eliminadas\n")
    console.log("📝 Ejecuta los siguientes comandos para recrear la base de datos:")
    console.log("   npm run db:init")
    console.log("   npm run db:seed\n")
  } catch (error) {
    console.error("❌ Error al resetear la base de datos:")
    console.error(error.message)
    process.exit(1)
  }
}

resetDatabase()
