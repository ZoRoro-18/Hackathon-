import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { success, asyncHandler } from '../utils.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[a-zA-Z]/).regex(/[0-9]/, 'Password must contain at least one letter and one number'),
  fullName: z.string().min(1).max(255),
  businessName: z.string().min(1).max(255),
  gstin: z.string().optional(),
  state: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const prefsSchema = z.object({
  language: z.enum(['en','hi','mr','gu','bn','ta','te','kn']).optional(),
  theme: z.enum(['system','light','dark']).optional(),
  text_size: z.enum(['normal','large','xl']).optional()
});

export const authController = {
  register: async (req, res) => {
    try {
      // Map payload to match the Zod schema, allowing fallback to snake_case variables from frontend
      const payload = {
        email: req.body.email,
        password: req.body.password,
        fullName: req.body.fullName || req.body.full_name || 'Hackathon User',
        businessName: req.body.businessName || req.body.business_name || 'Hackathon Business',
        gstin: req.body.gstin,
        state: req.body.state
      };

      const data = registerSchema.parse(payload);
      const result = await authService.register(data);
      return success(res, result, 201);
    } catch (err) {
      console.error('[Register Controller Error]', err);
      // Ensure we always return a 500 with exact error for debugging
      return res.status(500).json({
        success: false,
        error: { message: err.message || 'Server error during registration', details: err.issues || [] }
      });
    }
  },

  login: async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      return success(res, result);
    } catch (err) {
      console.error('[Login Error]', err);
      return res.status(500).json({
        success: false,
        error: { message: err.message, stack: err.stack }
      });
    }
  },

  me: asyncHandler(async (req, res) => {
    // req.user is populated by auth middleware
    const profile = await userRepository.getProfile(req.user.id);
    return success(res, profile);
  }),

  updatePreferences: asyncHandler(async (req, res) => {
    const data = prefsSchema.parse(req.body);
    await userRepository.updatePreferences(req.user.id, data);
    return success(res, { message: 'Preferences updated successfully' });
  })
};
