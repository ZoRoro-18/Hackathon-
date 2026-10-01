import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const jwtSecret = randomBytes(32).toString('hex');

const content = [
  `DATABASE_URL=`,
  `DATABASE_URL_MIGRATE=`,
  `GEMINI_API_KEY=`,
  `GEMINI_MODEL=`,
  `JWT_SECRET=${jwtSecret}`,
  `ADMIN_EMAIL=`,
  `ADMIN_PASSWORD=`,
  `FRONTEND_URL=http://localhost:5173`,
  `PORT=5000`,
  `NODE_ENV=development`,
  ``
].join('\n');

const envPath = join(process.cwd(), '.env');
writeFileSync(envPath, content, 'utf8');
console.log('Backend .env created with auto-generated JWT_SECRET (value not printed).');
