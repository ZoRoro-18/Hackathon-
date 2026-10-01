import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from current directory, parent directory, and backend folder
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_URL_MIGRATE: z.string().optional(),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(6).optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('\n[Config Warning] Environment validation issues:');
  for (const issue of parsed.error.issues) {
    console.warn(`  ${issue.path.join('.')}: ${issue.message}`);
  }
}

const envData = parsed.success ? parsed.data : process.env;

export const config = {
  databaseUrl: envData.DATABASE_URL || '',
  databaseUrlMigrate: envData.DATABASE_URL_MIGRATE,
  geminiApiKey: envData.GEMINI_API_KEY || '',
  geminiModel: envData.GEMINI_MODEL || 'gemini-3.8-flash',
  jwtSecret: envData.JWT_SECRET || 'khaata-secure-jwt-secret-min-16-chars',
  adminEmail: envData.ADMIN_EMAIL,
  adminPassword: envData.ADMIN_PASSWORD,
  frontendUrl: envData.FRONTEND_URL || 'http://localhost:5173',
  port: parseInt(envData.PORT || '5000', 10),
  nodeEnv: envData.NODE_ENV || 'development',
};
