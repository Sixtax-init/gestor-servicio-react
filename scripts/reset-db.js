require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function resetDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ ERROR: DATABASE_URL no está configurada");
    process.exit(1);
  }

  console.log("⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos");
  console.log("🔄 Conectando a la base de datos...\n");

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();

    // Verificar conexión
    await client.query('SELECT 1');

    console.log("🗑️  Eliminando todas las tablas...");

    // Eliminar tablas en orden correcto (respetando foreign keys)
    await client.query('DROP TABLE IF EXISTS entregas_tareas CASCADE');
    await client.query('DROP TABLE IF EXISTS inscripciones CASCADE');
    await client.query('DROP TABLE IF EXISTS tareas CASCADE');
    await client.query('DROP TABLE IF EXISTS cursos CASCADE');
    await client.query('DROP TABLE IF EXISTS usuarios CASCADE');

    console.log("✅ Tablas eliminadas\n");
    console.log("📝 Ejecuta los siguientes comandos para recrear la base de datos:");
    console.log("   npm run db:init");
    console.log("   npm run db:seed\n");

    await client.end();
  } catch (error) {
    console.error("❌ Error al resetear la base de datos:");
    console.error(error.message);
    await client.end();
    process.exit(1);
  }
}

resetDatabase();
