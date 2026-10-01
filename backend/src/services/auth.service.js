import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { userRepository } from '../repositories/user.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError } from '../utils.js';

export const authService = {
  async register({ email, password, fullName, businessName, gstin, state }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new AppError('Email is already registered', 400, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    const userId = await userRepository.createUserWithProfile({
      email,
      passwordHash,
      fullName,
      businessName,
      gstin,
      state
    });

    await auditRepository.log(userId, 'USER_REGISTERED', { email });

    return this.generateAuthResponse(userId, 'merchant');
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_DISABLED');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    await userRepository.updateLastLogin(user.id);
    await auditRepository.log(user.id, 'USER_LOGGED_IN');

    return this.generateAuthResponse(user.id, user.role);
  },

  generateAuthResponse(userId, role) {
    const token = jwt.sign(
      { sub: userId, role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    return { token, role };
  }
};
