import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils.js';

/**
 * Require valid JWT token
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }

    const user = await userRepository.findById(decoded.sub);
    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_DISABLED');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Require admin role
 */
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403, 'FORBIDDEN'));
  }
  next();
};
