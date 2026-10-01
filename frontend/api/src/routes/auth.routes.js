import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rate-limit.middleware.js';

const router = Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', requireAuth, authController.me);
router.put('/preferences', requireAuth, authController.updatePreferences);

export default router;
