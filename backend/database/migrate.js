// KhaataAI - Database Migration Script
// Runs schema.sql against the SESSION pooler (port 5432).
// Safe to re-run (all CREATE IF NOT EXISTS / DROP TRIGGER IF EXISTS).

import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { Client } = pg;

const migrateUrl = process.env.DATABASE_URL_MIGRATE;
if (!migrateUrl) {
  console.error('✗ DATABASE_URL_MIGRATE is not set in .env');
  process.exit(1);
}

async function migrate() {
  const client = new Client({
    connectionString: migrateUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to database (session pooler)...');
    await client.connect();

    const schemaPath = join(__dirname, '..', '..', 'database', 'schema.sql');
    const sql = readFileSync(schemaPath, 'utf8');

    console.log('Running migration...');
    await client.query(sql);

    console.log('✓ Migration completed successfully.');
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
