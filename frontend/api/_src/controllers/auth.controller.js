import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { success, asyncHandler, AppError } from '../utils.js';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required').max(255),
  businessName: z.string().min(1, 'Business name is required').max(255),
  gstin: z.string().max(15).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal(''))
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

const prefsSchema = z.object({
  language: z.enum(['en','hi','mr','gu','bn','ta','te','kn']).optional(),
  theme: z.enum(['system','light','dark']).optional(),
  text_size: z.enum(['normal','large','xl']).optional()
});

export const authController = {
  register: asyncHandler(async (req, res) => {
    const rawData = {
      email: req.body.email?.trim(),
      password: req.body.password,
      fullName: (req.body.fullName || req.body.full_name || req.body.name || '').trim(),
      businessName: (req.body.businessName || req.body.business_name || 'My Business').trim(),
      gstin: req.body.gstin?.trim() || undefined,
      state: req.body.state?.trim() || undefined
    };

    const parseResult = registerSchema.safeParse(rawData);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid registration data';
      throw new AppError(firstError, 400, 'VALIDATION_ERROR', parseResult.error.issues);
    }

    const result = await authService.register(parseResult.data);
    return success(res, result, 201);
  }),

  login: asyncHandler(async (req, res) => {
    const parseResult = loginSchema.safeParse({
      email: req.body.email?.trim(),
      password: req.body.password
    });
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid email or password';
      throw new AppError(firstError, 400, 'VALIDATION_ERROR');
    }

    const result = await authService.login(parseResult.data);
    return success(res, result);
  }),

  me: asyncHandler(async (req, res) => {
    const profile = await userRepository.getProfile(req.user.id);
    if (!profile) {
      throw new AppError('User profile not found', 404, 'NOT_FOUND');
    }
    return success(res, profile);
  }),

  updatePreferences: asyncHandler(async (req, res) => {
    const parseResult = prefsSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError('Invalid preferences data', 400, 'VALIDATION_ERROR');
    }
    await userRepository.updatePreferences(req.user.id, parseResult.data);
    return success(res, { message: 'Preferences updated successfully' });
  })
};
