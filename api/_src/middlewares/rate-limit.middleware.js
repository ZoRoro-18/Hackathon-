import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { AppError } from '../utils.js';

const createLimiter = (options) => {
  return rateLimit({
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      next(new AppError('Too many requests, please try again later.', 429, 'RATE_LIMIT_EXCEEDED'));
    }
  });
};

// Global limit: 300 per 15 min per IP
export const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
});

// Auth limit: 1000 per 15 min per IP (increased for hackathon)
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});

// Upload limit: 40 per hour per user (keyGenerator by user ID)
export const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 40,
  keyGenerator: (req, res) => req.user?.id || ipKeyGenerator(req, res), 
  skip: (req) => !req.user, // skip if not authed since it's per user
});

// Chat limit: 40 per hour per user (keyGenerator by user ID)
export const chatLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 40,
  keyGenerator: (req, res) => req.user?.id || ipKeyGenerator(req, res),
  skip: (req) => !req.user,
});
