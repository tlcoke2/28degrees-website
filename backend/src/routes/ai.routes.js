import express from 'express';
import rateLimit from 'express-rate-limit';
import { chatStream } from '../controllers/ai.controller.js';
// Optional: if you want admin-only AI, import verifyAdmin and use it

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60,             // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/chat/stream', aiLimiter, chatStream);
router.post('/chat/stream', aiLimiter, chatStream); // alt POST usage

export default router;
