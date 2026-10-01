// KhaataAI Backend - Environment Checker
// Prints OK or MISSING for each required variable — NEVER prints values

const required = [
  'DATABASE_URL',
  'DATABASE_URL_MIGRATE',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'JWT_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'FRONTEND_URL',
  'PORT',
  'NODE_ENV',
];

import { config } from 'dotenv';
config();

let allOk = true;
console.log('\nKhaataAI Environment Check\n' + '='.repeat(40));
for (const name of required) {
  const value = process.env[name];
  const status = value && value.trim() ? 'OK' : 'MISSING';
  if (status === 'MISSING') allOk = false;
  console.log(`  ${name}: ${status}`);
}
console.log('='.repeat(40));
console.log(allOk ? '\n✓ All variables set.\n' : '\n✗ Some variables are missing. Fill them in backend/.env\n');
process.exit(allOk ? 0 : 1);
