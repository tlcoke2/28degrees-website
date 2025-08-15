import express from 'express';
import { getPublicSettings } from '../../controllers/admin/settings.controller.js';

const router = express.Router();
router.get('/', getPublicSettings);

export default router;
