const fs = require('fs');
const path = require('path');
const db = require('./client');

async function migrate() {
  console.log('Starting migration to Turso DB...');
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Split statements by semicolon
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing statement:\n${statement.substring(0, 50)}...`);
      await db.execute(statement);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
