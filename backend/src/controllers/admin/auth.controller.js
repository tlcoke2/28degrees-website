// src/controllers/admin/auth.controller.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../../models/User.model.js'; // DB-backed admins (role: 'admin')

// ---- Env / config ----
const isProd = process.env.NODE_ENV === 'production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@28degreeswest.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET;

// Fail fast (logged once at startup path import time)
if (!JWT_SECRET) {
  // Do not throw here to avoid crashing worker; login will 500 clearly instead.
  console.warn('⚠️  JWT_SECRET is not set. Admin auth will fail.');
}

/* ---------------------------- Helper functions --------------------------- */

function constantTimeEqual(a = '', b = '') {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) {
    try { crypto.timingSafeEqual(ba, ba); } catch { /* noop */ }
    return false;
  }
  try { return crypto.timingSafeEqual(ba, bb); } catch { return false; }
}

function getJwtExpiresIn() {
  const str = process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE;
  if (!str) return '2h';                // admin tokens short-lived by default
  if (/^\d+$/.test(str)) return Number(str);
  return str;
}

function signAdminToken(payload, expiresIn = getJwtExpiresIn()) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function getCookieOptions() {
  const cookieHours = parseInt(process.env.ADMIN_JWT_COOKIE_HOURS || '2', 10); // default 2h
  const secure = isProd;
  const sameSite = secure ? 'none' : 'lax';
  const domain = process.env.COOKIE_DOMAIN || undefined; // e.g., '.28degreeswest.com'
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: cookieHours * 60 * 60 * 1000,
    ...(domain ? { domain } : {}),
  };
}

function serializeUser(userDoc) {
  if (!userDoc) return null;
  const u = typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc };
  return {
    id: String(u._id || u.id || ''),
    name: u.name || 'Administrator',
    email: u.email,
    role: u.role || 'admin',
    phone: u.phone,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

function respondWithToken(res, userPayload, statusCode = 200) {
  const token = signAdminToken(userPayload); // includes role/email/sub
  res.cookie('adminToken', token, getCookieOptions());
  return res.status(statusCode).json({
    status: 'success',
    token, // keep returning token for SPA localStorage flow
    user: {
      name: userPayload.name || 'Administrator',
      email: userPayload.email,
      role: userPayload.role || 'admin',
      id: userPayload.id || undefined,
    },
    expiresIn: typeof getJwtExpiresIn() === 'number' ? getJwtExpiresIn() : undefined,
  });
}

/* -------------------------------- Register --------------------------------
 * POST /api/v1/admin/auth/register
 * body: { name, email, password, phone? }
 * Creates a DB admin user. Useful after initial bootstrap via env admin.
 ---------------------------------------------------------------------------*/
export const adminRegister = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ status: 'fail', message: 'name, email, and password are required' });
    }

    const found = await User.findOne({ email: String(email).toLowerCase() }).lean();
    if (found) return res.status(409).json({ status: 'fail', message: 'Email already registered' });

    const created = await User.create({
      name,
      email: String(email).toLowerCase(),
      phone: phone || '',
      role: 'admin',
      password,
      passwordConfirm: password, // if schema requires confirm, mirror it
    });

    return respondWithToken(res, {
      sub: created._id.toString(),
      id: created._id.toString(),
      email: created.email,
      role: 'admin',
      name: created.name,
    }, 201);
  } catch (err) {
    console.error('adminRegister error:', err);
    return res.status(500).json({ status: 'error', message: 'Unable to register admin' });
  }
};

/* --------------------------------- Login ----------------------------------
 * POST /api/v1/admin/auth/login
 * body: { email, password }
 * 1) Try DB admin user (role: 'admin'). If not found or wrong password,
 * 2) Fallback to bootstrap env-based admin credentials.
 ---------------------------------------------------------------------------*/
export const adminLogin = async (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Email and password are required' });
    }
    if (!JWT_SECRET) {
      return res.status(500).json({ status: 'error', message: 'Auth not configured' });
    }

    // 1) DB-backed admin
    const dbUser = await User.findOne({ email }).select('+password');
    if (dbUser && dbUser.role === 'admin') {
      const ok = await dbUser.matchPassword(password, dbUser.password);
      if (ok) {
        return respondWithToken(res, {
          sub: dbUser._id.toString(),
          id: dbUser._id.toString(),
          email: dbUser.email,
          role: 'admin',
          name: dbUser.name || 'Administrator',
        });
      }
    }

    // 2) Env bootstrap admin fallback
    const okEmail = constantTimeEqual(email, String(ADMIN_EMAIL).toLowerCase());
    const okPass  = constantTimeEqual(password, String(ADMIN_PASSWORD));
    if (!okEmail || !okPass) {
      return res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
    }

    return respondWithToken(res, {
      sub: email,
      email,
      role: 'admin',
      name: 'Administrator',
    });
  } catch (err) {
    console.error('adminLogin error:', err);
    return res.status(500).json({ status: 'error', message: 'Unable to login' });
  }
};

/* ---------------------------------- Me ------------------------------------
 * GET /api/v1/admin/auth/me
 * Reads token from Authorization: Bearer <token> OR cookie: adminToken
 ---------------------------------------------------------------------------*/
export const adminMe = (req, res) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ status: 'error', message: 'Auth not configured' });
    }

    const auth = req.headers.authorization || '';
    const bearerToken = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    const cookieToken = req.cookies?.adminToken;
    const token = bearerToken || cookieToken;

    if (!token) return res.status(401).json({ status: 'fail', message: 'Not authenticated' });

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded?.role !== 'admin') {
      return res.status(403).json({ status: 'fail', message: 'Forbidden' });
    }

    // If token has DB id, enrich from DB (best-effort; do not fail if missing)
    if (decoded?.id || decoded?.sub) {
      // optional: fetch latest user info
    }

    return res.status(200).json({
      status: 'success',
      user: {
        email: decoded.email || ADMIN_EMAIL,
        role: 'admin',
        name: decoded.name || 'Administrator',
        id: decoded.id || decoded.sub || undefined,
      },
    });
  } catch (err) {
    return res.status(401).json({ status: 'fail', message: 'Invalid or expired token' });
  }
};

/* -------------------------------- Logout ----------------------------------
 * POST /api/v1/admin/auth/logout
 * Clears the admin cookie
 ---------------------------------------------------------------------------*/
export const adminLogout = (_req, res) => {
  res.clearCookie('adminToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
  });
  return res.status(200).json({ status: 'success', message: 'Logged out' });
};
