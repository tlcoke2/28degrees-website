import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyJWT, verifyPermission } from '../middleware/auth.middleware.js';
import { getPublicPage, getAdminPage, upsertPage } from '../controllers/content.controller.js';

const router = Router();

// Light rate limit
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(limiter);

// Public
router.get('/:page', getPublicPage);

// Admin
router.use(verifyJWT);
router.use(verifyPermission(['admin']));
router.get('/:page/admin', getAdminPage);
router.put('/:page', upsertPage);

export default router;
