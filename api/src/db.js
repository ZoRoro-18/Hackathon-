// KhaataAI Backend - Database Pool
// Creates ONE pg.Pool per instance using the Transaction Pooler URL.

import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 3,
  ssl: { rejectUnauthorized: false },
  idleTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB POOL ERROR] Unexpected error on idle client:', err.message);
});

/**
 * Helper for single queries
 */
export async function query(text, params) {
  return pool.query(text, params);
}

/**
 * Helper to get a client for transactions
 */
export async function getClient() {
  return pool.connect();
}
