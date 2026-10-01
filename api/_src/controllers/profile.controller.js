import { z } from 'zod';
import { userRepository } from '../repositories/user.repository.js';
import { success, asyncHandler } from '../utils.js';

const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  businessName: z.string().min(1).max(255).optional(),
  gstin: z.string().max(15).optional(),
  state: z.string().max(100).optional(),
  address: z.string().optional()
});

export const profileController = {
  getProfile: asyncHandler(async (req, res) => {
    const profile = await userRepository.getProfile(req.user.id);
    return success(res, profile);
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const data = updateProfileSchema.parse(req.body);
    await userRepository.updateProfile(req.user.id, data);
    const updated = await userRepository.getProfile(req.user.id);
    return success(res, updated);
  })
};
