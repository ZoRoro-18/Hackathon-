// KhaataAI Backend - Configuration
// Validates all required environment variables at startup using Zod.

import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required — get it from Supabase Dashboard > Connect > Transaction Pooler (port 6543)'),
  DATABASE_URL_MIGRATE: z.string().min(1, 'DATABASE_URL_MIGRATE is required — get it from Supabase Dashboard > Connect > Session Pooler (port 5432)'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required — get it from https://aistudio.google.com/apikey'),
  GEMINI_MODEL: z.string().min(1, 'GEMINI_MODEL is required — set it to a Gemini model name (e.g. gemini-2.0-flash). No default is provided.'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email'),
  ADMIN_PASSWORD: z.string().min(10, 'ADMIN_PASSWORD must be at least 10 characters'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n✗ Environment validation failed:\n');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('\nFix the above in backend/.env and try again.\n');
  process.exit(1);
}

export const config = {
  databaseUrl: parsed.data.DATABASE_URL,
  databaseUrlMigrate: parsed.data.DATABASE_URL_MIGRATE,
  geminiApiKey: parsed.data.GEMINI_API_KEY,
  geminiModel: parsed.data.GEMINI_MODEL,
  jwtSecret: parsed.data.JWT_SECRET,
  adminEmail: parsed.data.ADMIN_EMAIL,
  adminPassword: parsed.data.ADMIN_PASSWORD,
  frontendUrl: parsed.data.FRONTEND_URL,
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
};
