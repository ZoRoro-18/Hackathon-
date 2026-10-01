// KhaataAI Backend - Configuration
// Validates all required environment variables at startup using Zod.

import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_URL_MIGRATE: z.string().optional(),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('ef3d863bfee8e13c119970348d75170cdf07ef74930070932df3abfe8367c8a4'),
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email').default('kr.kparmar17@gmail.com'),
  ADMIN_PASSWORD: z.string().min(6).default('Krishna@1702@08'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\nEnvironment validation failed:\n');
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
