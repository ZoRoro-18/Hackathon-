// KhaataAI Backend - Express Application
// This file builds and exports the Express app. It never calls listen().

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config.js';
import { globalLimiter } from './middlewares/rate-limit.middleware.js';

import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import documentRoutes from './routes/document.routes.js';

const app = express();

// Trust proxy (required for rate-limit behind Vercel/reverse proxies)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Global rate limiter
app.use(globalLimiter);

// CORS configuration - supports FRONTEND_URL and local dev
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin) || config.nodeEnv === 'development' || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Service banner
app.get('/', (_req, res) => {
  res.json({
    service: 'KhaataAI API',
    version: '1.0.0',
    status: 'running',
  });
});

// Health check (public)
app.get('/api/health', async (_req, res) => {
  try {
    const { pool } = await import('./db.js');
    await pool.query('SELECT 1');
    res.json({ success: true, data: { status: 'healthy', database: 'connected' } });
  } catch (err) {
    res.status(503).json({ success: false, error: { code: 'HEALTH_CHECK_FAILED', message: 'Database connection failed' } });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/documents', documentRoutes);

// 404 handler for unmatched API routes
app.use('/api', (_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
});

// Centralized error handler
app.use((err, _req, res, _next) => {
  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: { code: 'CORS_ERROR', message: 'Origin not allowed' },
    });
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: {
        code: 'LIMIT_FILE_SIZE',
        message: 'File is too large. Maximum allowed size is 10 MB.',
      },
    });
  }

  // Multer unexpected field
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: { code: 'UNEXPECTED_FILE', message: 'Unexpected file field. Please upload using field name "file".' },
    });
  }

  // Log full error stack to terminal (never log secrets or file bytes)
  console.error(`[ERROR] ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: err.details || undefined,
      ...(config.nodeEnv !== 'production' && { stack: err.stack }),
    },
  });
});

export default app;
