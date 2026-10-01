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
  register: asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    return success(res, result, 201);
  }),

  login: asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    return success(res, result);
  }),

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
