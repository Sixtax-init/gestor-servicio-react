const { neon } = require("@neondatabase/serverless")
const fs = require("fs")
const path = require("path")

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error("❌ ERROR: DATABASE_URL no está configurada")
    console.log("\n📝 Pasos para configurar:")
    console.log("1. Copia .env.example a .env.local")
    console.log("2. Edita .env.local y agrega tu DATABASE_URL")
    console.log("3. Ejemplo: DATABASE_URL=postgresql://postgres:password@localhost:5432/gestor_horas\n")
    process.exit(1)
  }

  console.log("🔄 Conectando a la base de datos...")

  try {
    const sql = neon(databaseUrl)

    // Verificar conexión
    await sql`SELECT 1`
    console.log("✅ Conexión exitosa a la base de datos\n")

    // Leer y ejecutar el script de creación de esquema
    console.log("📋 Creando esquema de base de datos...")
    const schemaSQL = fs.readFileSync(path.join(__dirname, "001-create-schema.sql"), "utf8")

    // Ejecutar el script completo
    await sql.unsafe(schemaSQL)
    console.log("✅ Esquema creado exitosamente\n")

    console.log("🎉 Base de datos inicializada correctamente")
    console.log('\n📝 Siguiente paso: Ejecuta "npm run db:seed" para agregar datos de prueba\n')
  } catch (error) {
    console.error("❌ Error al inicializar la base de datos:")
    console.error(error.message)
    console.log("\n💡 Verifica que:")
    console.log("- PostgreSQL esté corriendo")
    console.log("- La DATABASE_URL sea correcta")
    console.log("- La base de datos exista (CREATE DATABASE gestor_horas;)\n")
    process.exit(1)
  }
}

initDatabase()
