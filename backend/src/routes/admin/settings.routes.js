import express from 'express';
import { protect, authorize } from '../../middleware/auth.middleware.js';
import {
  getAdminSettings,
  updateAdminSettings,
} from '../../controllers/admin/settings.controller.js';

const router = express.Router();

// All admin settings routes require admin
router.use(protect, authorize('admin'));

router.get('/', getAdminSettings);
router.put('/', updateAdminSettings);

export default router;
