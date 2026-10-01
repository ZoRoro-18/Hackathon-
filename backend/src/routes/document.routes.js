import { Router } from 'express';
import multer from 'multer';
import { documentController } from '../controllers/document.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { uploadLimiter } from '../middlewares/rate-limit.middleware.js';
import path from 'path';
import { AppError } from '../utils.js';

// Setup multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Will create this dir if not exists (in app startup)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only PDF and images are allowed.', 400));
    }
  }
});

const router = Router();

router.use(requireAuth);

router.post('/upload', uploadLimiter, upload.single('document'), documentController.upload);
router.get('/', documentController.list);

export default router;
