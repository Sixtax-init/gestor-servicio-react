require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ ERROR: DATABASE_URL no está configurada");
    process.exit(1);
  }

  console.log("🔄 Conectando a la base de datos...");

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();

    // Verificar conexión
    await client.query('SELECT 1');
    console.log("✅ Conexión exitosa\n");

    // Leer y ejecutar el script de datos de prueba
    console.log("🌱 Insertando datos de prueba...");
    const seedSQL = fs.readFileSync(path.join(__dirname, "002-seed-data.sql"), "utf8");

    await client.query(seedSQL);
    console.log("✅ Datos de prueba insertados exitosamente\n");

    console.log("🎉 Base de datos lista para usar");
    console.log("\n👤 Usuarios de prueba creados:");
    console.log("   Admin:   admin@escuela.edu / admin123");
    console.log("   Maestro: maestro@escuela.edu / maestro123");
    console.log("   Alumno:  21480680@escuela.edu / alumno123");
    console.log('\n🚀 Ejecuta "npm run dev" para iniciar la aplicación\n');

    await client.end();
  } catch (error) {
    console.error("❌ Error al insertar datos de prueba:");
    console.error(error.message);
    console.log('\n💡 Asegúrate de haber ejecutado "npm run db:init" primero\n');
    await client.end();
    process.exit(1);
  }
}

seedDatabase();
