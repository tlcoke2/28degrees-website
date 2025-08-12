// src/controllers/auth.controller.js
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import AppError from '../utils/AppError.js';
import sendEmail from '../utils/email.js';

/* --------------------------- Helpers & Config --------------------------- */

function getJwtExpiresIn() {
  // Accept either "JWT_EXPIRES_IN" (e.g., '90d') or "JWT_EXPIRE" (seconds)
  const str = process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE;
  if (!str) return '90d';               // sensible default
  if (/^\d+$/.test(str)) return Number(str); // seconds
  return str;                           // string format '90d', '12h', etc.
}

function getCookieOptions() {
  const cookieDays = parseInt(process.env.JWT_COOKIE_EXPIRE || '90', 10);
  const secure = process.env.NODE_ENV === 'production';
  // If your frontend is on a different domain, SameSite must be 'none' + Secure
  const sameSite = secure ? 'none' : 'lax';
  const domain = process.env.COOKIE_DOMAIN || undefined; // e.g., '.28degreeswest.com'
  return {
    expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure,
    sameSite,
    ...(domain ? { domain } : {}),
  };
}

function signToken(id) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.sign({ sub: String(id) }, secret, { expiresIn: getJwtExpiresIn() });
}

function serializeUser(userDoc) {
  // Convert Mongoose doc to POJO and strip sensitive fields
  const u = typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc };
  delete u.password;
  delete u.passwordResetToken;
  delete u.passwordResetExpires;
  delete u.__v;
  return {
    id: String(u._id || u.id),
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

function createSendToken(user, statusCode, res) {
  const token = signToken(user._id);
  const cookieOptions = getCookieOptions();

  // Set cookie (optional for SPA; keeps server compatibility if you also use cookies)
  res.cookie('jwt', token, cookieOptions);

  const safeUser = serializeUser(user);

  return res.status(statusCode).json({
    status: 'success',
    token,          // SPA can store in localStorage if desired
    user: safeUser, // consistent shape expected by frontend
  });
}

/* -------------------------------- Register ------------------------------- */
// @route   POST /api/v1/auth/register  (and /api/v1/admin/auth/register)
export const register = async (req, res, next) => {
  try {
    const { name, email, password, passwordConfirm, phone, role } = req.body || {};
    if (!name || !email || !password) {
      return next(new AppError('name, email, and password are required', 400));
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() }).lean();
    if (existing) return next(new AppError('Email already registered', 409));

    const user = await User.create({
      name,
      email: String(email).toLowerCase(),
      phone: phone || '',
      role: role || 'user',
      password,
      // Some schemas require passwordConfirm; accept same value if caller omitted it
      passwordConfirm: passwordConfirm ?? password,
    });

    return createSendToken(user, 201, res);
  } catch (err) {
    return next(err);
  }
};

/* --------------------------------- Login --------------------------------- */
// @route   POST /api/v1/auth/login  (and /api/v1/admin/auth/login)
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
    if (!user) return next(new AppError('Incorrect email or password', 401));

    const ok = await user.matchPassword(password, user.password);
    if (!ok) return next(new AppError('Incorrect email or password', 401));

    return createSendToken(user, 200, res);
  } catch (err) {
    return next(err);
  }
};

/* -------------------------------- Logout --------------------------------- */
// @route   POST /api/v1/auth/logout  (GET alias may exist)
export const logout = (req, res) => {
  const options = getCookieOptions();
  // Clear by setting immediate expiry
  res.cookie('jwt', '', { ...options, expires: new Date(0) });
  return res.status(200).json({ status: 'success' });
};

/* ----------------------------- Forgot Password --------------------------- */
// @route   POST /api/v1/auth/forgot-password  (alias: /forgotPassword)
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return next(new AppError('Email is required', 400));

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return next(new AppError('There is no user with that email address', 404));

    const resetToken = user.createPasswordResetToken(); // sets hashed+expires on doc
    await user.save({ validateBeforeSave: false });

    // Use app base URL for frontend reset page if available
    const base = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const resetURL = `${base}/reset-password/${resetToken}`;

    const message =
      `Forgot your password?\n\n` +
      `Submit a request to: ${resetURL}\n\n` +
      `If you didn't request this, please ignore this email.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 minutes)',
        message,
      });

      return res.status(200).json({
        status: 'success',
        message: 'Reset token sent to email',
      });
    } catch (mailErr) {
      // rollback tokens if email sending fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('There was an error sending the email. Try again later.', 500));
    }
  } catch (err) {
    return next(err);
  }
};

/* ------------------------------ Reset Password --------------------------- */
// @route   PATCH /api/v1/auth/reset-password/:token  (alias: /resetPassword/:token)
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params || {};
    const { password, passwordConfirm } = req.body || {};
    if (!token || !password) {
      return next(new AppError('Token and new password are required', 400));
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) return next(new AppError('Token is invalid or has expired', 400));

    user.password = password;
    user.passwordConfirm = passwordConfirm ?? password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save(); // triggers pre-save hooks (password hashing, changedPasswordAt, etc.)

    return createSendToken(user, 200, res);
  } catch (err) {
    return next(err);
  }
};

/* ----------------------------- Update Password --------------------------- */
// @route   PATCH /api/v1/auth/update-my-password  (alias: /updateMyPassword)
// Requires `protect` middleware to set req.user
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, passwordConfirm } = req.body || {};
    if (!currentPassword || !newPassword) {
      return next(new AppError('currentPassword and newPassword are required', 400));
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return next(new AppError('User not found', 404));

    const ok = await user.matchPassword(currentPassword, user.password);
    if (!ok) return next(new AppError('Your current password is wrong', 401));

    user.password = newPassword;
    user.passwordConfirm = passwordConfirm ?? newPassword;
    await user.save(); // triggers hashing + changedPasswordAt

    return createSendToken(user, 200, res);
  } catch (err) {
    return next(err);
  }
};

