import * as fs from 'fs';
import * as path from 'path';
import { pool, query } from './pool';

async function migrate() {
  const client = await pool.connect();
  try {
    // Ensure migrations log table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations_log (
        id         SERIAL PRIMARY KEY,
        filename   VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.resolve(__dirname, '../../../db/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const applied = await query<{ filename: string }>('SELECT filename FROM migrations_log');
    const appliedSet = new Set(applied.map(r => r.filename));

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  skip  ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      console.log(`  apply ${file}...`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO migrations_log (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  done  ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
