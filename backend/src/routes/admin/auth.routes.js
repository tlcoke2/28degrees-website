// src/routes/admin.auth.routes.js
import express from 'express';
import { adminLogin, adminMe, adminLogout } from '../../controllers/admin/auth.controller.js';

const router = express.Router();
router.post('/login', adminLogin);
router.get('/me', adminMe);
router.post('/logout', adminLogout);

export default router;

