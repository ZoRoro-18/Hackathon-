import { Router } from 'express';
import multer from 'multer';
import { documentController } from '../controllers/document.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { uploadLimiter } from '../middlewares/rate-limit.middleware.js';
import { AppError } from '../utils.js';

// Memory storage keeps file buffer readily available without disk overhead
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Unsupported file type. Only PDF, JPEG, PNG, and WebP files are allowed.', 415, 'UNSUPPORTED_MEDIA_TYPE'));
    }
  }
});

const router = Router();

router.use(requireAuth);

// Routes
router.post('/upload', uploadLimiter, upload.single('file'), documentController.upload);
router.get('/dashboard', documentController.getDashboard);
router.get('/', documentController.list);
router.get('/:id', documentController.getById);
router.get('/:id/file', documentController.getFile);
router.put('/:id', documentController.update);
router.patch('/:id/payment-status', documentController.setPaymentStatus);
router.patch('/:id/direction', documentController.setDirection);
router.post('/:id/retry', documentController.retry);
router.delete('/:id', documentController.delete);

export default router;
