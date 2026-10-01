import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');

// Read existing .env to preserve the JWT_SECRET
const existing = readFileSync(envPath, 'utf8');
const jwtMatch = existing.match(/^JWT_SECRET=(.+)$/m);
const jwtSecret = jwtMatch ? jwtMatch[1] : randomBytes(32).toString('hex');

// The Supabase password has @ symbols that must be URL-encoded as %40
const encodedPassword = 'YOUR_DB_PASSWORD';

const content = [
  `DATABASE_URL=postgresql://postgres.cjszihdqklwfuakgyfts:${encodedPassword}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`,
  `DATABASE_URL_MIGRATE=postgresql://postgres.cjszihdqklwfuakgyfts:${encodedPassword}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`,
  `GEMINI_API_KEY=YOUR_GEMINI_API_KEY`,
  `GEMINI_MODEL=gemini-2.0-flash`,
  `JWT_SECRET=${jwtSecret}`,
  `ADMIN_EMAIL=admin@example.com`,
  `ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD`,
  `FRONTEND_URL=http://localhost:5173`,
  `PORT=5000`,
  `NODE_ENV=development`,
  ``
].join('\n');

writeFileSync(envPath, content, 'utf8');
console.log('Backend .env updated with all credentials (values not printed).');
