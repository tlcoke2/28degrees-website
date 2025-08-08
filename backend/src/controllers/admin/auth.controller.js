// src/controllers/admin.controller.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const isProd = process.env.NODE_ENV === 'production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@28degreeswest.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Fail fast on boot if missing
  console.warn('⚠️  JWT_SECRET is not set. Admin auth will fail.');
}

function constantTimeEqual(a = '', b = '') {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) {
    // Ensure timing is not obviously shorter on length mismatch
    // Still return false, but compare with itself to normalize timing a bit
    try { crypto.timingSafeEqual(ba, ba); } catch {}
    return false;
  }
  try {
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function signAdminToken(payload, expiresIn = '2h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function setAdminCookie(res, token) {
  res.cookie('adminToken', token, {
    httpOnly: true,
    secure: isProd,          // true on Railway
    sameSite: 'none',        // GH Pages <-> API (cross-site)
    path: '/',
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * POST /api/v1/admin/auth/login
 * body: { email, password }
 */
export const adminLogin = (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Email and password are required' });
    }
    if (!JWT_SECRET) {
      return res.status(500).json({ status: 'error', message: 'Auth not configured' });
    }

    const okEmail = constantTimeEqual(email, String(ADMIN_EMAIL).toLowerCase());
    const okPass  = constantTimeEqual(password, String(ADMIN_PASSWORD));

    if (!okEmail || !okPass) {
      // Generic message: do not reveal which one failed
      return res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
    }

    const token = signAdminToken({ sub: email, role: 'admin', email });
    setAdminCookie(res, token);

    return res.status(200).json({
      status: 'success',
      data: {
        token, // kept for your current localStorage flow
        user: { email, role: 'admin', name: 'Administrator' },
        expiresIn: 7200,
      },
    });
  } catch (err) {
    console.error('adminLogin error:', err);
    return res.status(500).json({ status: 'error', message: 'Unable to login' });
  }
};

/**
 * GET /api/v1/admin/auth/me
 * Reads JWT from Authorization: Bearer <token> or cookie adminToken
 */
export const adminMe = (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const bearerToken = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    const cookieToken = req.cookies?.adminToken;

    const token = bearerToken || cookieToken;
    if (!token) return res.status(401).json({ status: 'fail', message: 'Not authenticated' });
    if (!JWT_SECRET) return res.status(500).json({ status: 'error', message: 'Auth not configured' });

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded?.role !== 'admin') {
      return res.status(403).json({ status: 'fail', message: 'Forbidden' });
    }

    return res.status(200).json({
      status: 'success',
      data: { user: { email: decoded.email, role: 'admin', name: 'Administrator' } },
    });
  } catch (err) {
    return res.status(401).json({ status: 'fail', message: 'Invalid or expired token' });
  }
};

/**
 * POST /api/v1/admin/auth/logout
 * Clears the admin cookie
 */
export const adminLogout = (_req, res) => {
  res.clearCookie('adminToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'none',
    path: '/',
  });
  return res.status(200).json({ status: 'success', message: 'Logged out' });
};

