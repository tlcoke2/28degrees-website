// src/middleware/adminAuth.js
import jwt from 'jsonwebtoken';

const isProd = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISS = process.env.ADMIN_JWT_ISS; // optional
const JWT_AUD = process.env.ADMIN_JWT_AUD; // optional

function getTokenFromRequest(req) {
  // Prefer Authorization header
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);

  // Fallback to cookie (for HttpOnly cookie-based auth)
  const cookieToken = req.cookies?.adminToken;
  if (cookieToken) return cookieToken;

  return null;
}

function verifyToken(token) {
  const options = {
    clockTolerance: 5, // seconds of leeway for clock skew
  };
  if (JWT_ISS) options.issuer = JWT_ISS;
  if (JWT_AUD) options.audience = JWT_AUD;

  return jwt.verify(token, JWT_SECRET, options);
}

/**
 * Strict admin-only guard
 */
export const verifyAdmin = (req, res, next) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ status: 'error', message: 'Auth not configured' });
    }

    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ status: 'fail', message: 'Forbidden' });
    }

    // Attach to request for downstream handlers
    req.admin = {
      sub: decoded.sub || decoded.email,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
      iss: decoded.iss,
      aud: decoded.aud,
    };

    return next();
  } catch (err) {
    const msg =
      err?.name === 'TokenExpiredError'
        ? 'Token expired'
        : err?.message?.includes('invalid') || err?.name === 'JsonWebTokenError'
        ? 'Invalid token'
        : 'Unauthorized';
    const code = err?.name === 'TokenExpiredError' ? 401 : 401;
    return res.status(code).json({ status: 'fail', message: msg });
  }
};

/**
 * Flexible role guard, e.g. verifyRole(['admin', 'guide'])
 */
export const verifyRole =
  (roles = []) =>
  (req, res, next) => {
    try {
      if (!JWT_SECRET) {
        return res.status(500).json({ status: 'error', message: 'Auth not configured' });
      }

      const token = getTokenFromRequest(req);
      if (!token) {
        return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
      }

      const decoded = verifyToken(token);
      if (!decoded || (roles.length && !roles.includes(decoded.role))) {
        return res.status(403).json({ status: 'fail', message: 'Forbidden' });
      }

      req.user = decoded; // generic attachment
      return next();
    } catch (err) {
      const msg =
        err?.name === 'TokenExpiredError'
          ? 'Token expired'
          : err?.message?.includes('invalid') || err?.name === 'JsonWebTokenError'
          ? 'Invalid token'
          : 'Unauthorized';
      return res.status(401).json({ status: 'fail', message: msg });
    }
  };
