import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import * as controller from '../controllers/ai.controller.js';

const allowedExtensions = new Set(['.pdf', '.docx', '.txt']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
    if (allowedExtensions.has(extension)) callback(null, true);
    else callback(new AppError(400, 'Upload a PDF, DOCX, or TXT resume.'));
  },
});

const receiveResume = (req: Request, res: Response, next: NextFunction) => upload.single('resume')(req, res, (error: unknown) => {
  if (error instanceof multer.MulterError) {
    return next(new AppError(400, error.code === 'LIMIT_FILE_SIZE' ? 'Resume files must be 5 MB or smaller.' : 'Only one resume file can be uploaded at a time.'));
  }
  return next(error);
});

const router = Router();
router.use(authenticate);
router.get('/status', controller.status);
router.post('/career-roadmap', controller.careerRoadmap);
router.post('/resume-draft', controller.resumeDraft);
router.post('/resume-score', controller.resumeScore);
router.post('/resume-score/upload', receiveResume, controller.resumeUploadScore);
router.post('/trust-review', controller.trustReview);
export default router;