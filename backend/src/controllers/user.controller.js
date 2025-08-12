// src/controllers/user.controller.js
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import sharp from 'sharp';
import User from '../models/User.model.js';
import AppError from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendWelcomeEmail } from '../utils/email.js';

/* --------------------------------- Helpers -------------------------------- */

function sanitizeUser(doc) {
  if (!doc) return null;
  const u = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete u.password;
  delete u.passwordResetToken;
  delete u.passwordResetExpires;
  delete u.__v;
  return u;
}

function filterFields(obj, ...allowed) {
  const out = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) {
      out[k] = obj[k];
    }
  }
  return out;
}

/* ---------------------------- Multer + Sharp ------------------------------- */

// Store file in memory; we will resize and write to disk with sharp.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new AppError('Please upload an image file (jpg, png, webp)', 400));
  },
});

// Expose as middleware: expect field name "photo"
export const uploadUserPhoto = upload.single('photo');

// Ensure output directory exists
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

const USERS_IMG_DIR = path.resolve('public', 'img', 'users');

/**
 * Resize image to 500x500 and save as JPEG 90% quality.
 * Sets req.body.photo to the stored filename so update handlers can persist it.
 */
export const resizeUserPhoto = catchAsync(async (req, _res, next) => {
  if (!req.file) return next();

  await ensureDir(USERS_IMG_DIR);

  const filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  const targetPath = path.join(USERS_IMG_DIR, filename);

  await sharp(req.file.buffer)
    .rotate() // respect EXIF orientation
    .resize(500, 500, { fit: 'cover' })
    .jpeg({ quality: 90 })
    .toFile(targetPath);

  req.body.photo = filename;
  return next();
});

/* ------------------------------- Controllers ------------------------------- */

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
export const getAllUsers = catchAsync(async (_req, res) => {
  const users = await User.find().lean();
  const sanitized = users.map((u) => sanitizeUser(u));
  res.status(200).json({
    status: 'success',
    results: sanitized.length,
    data: { users: sanitized },
  });
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin (or self via getMe)
export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('No user found with that ID', 404));

  res.status(200).json({
    status: 'success',
    data: { user: sanitizeUser(user) },
  });
});

// @desc    Create new user (admin only)
// @route   POST /api/v1/users
// @access  Private/Admin
export const createUser = catchAsync(async (req, res) => {
  const { name, email, password, passwordConfirm, role, phone } = req.body || {};

  const created = await User.create({
    name,
    email: email?.toLowerCase(),
    password,
    passwordConfirm: passwordConfirm ?? password,
    role: role || 'user',
    phone: phone || '',
  });

  // Send welcome email (best-effort; don't fail if email sending throws)
  try {
    await sendWelcomeEmail(created);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Welcome email failed:', e?.message || e);
  }

  res.status(201).json({
    status: 'success',
    data: { user: sanitizeUser(created) },
  });
});

// @desc    Update user (admin only) — no password updates here
// @route   PATCH /api/v1/users/:id
// @access  Private/Admin
export const updateUser = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('Use /auth/update-my-password to change passwords', 400));
  }

  const updates = filterFields(
    req.body,
    'name',
    'email',
    'role',
    'phone',
    'photo',
    'active' // if you allow admin to toggle
  );
  if (updates.email) updates.email = String(updates.email).toLowerCase();

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) return next(new AppError('No user found with that ID', 404));

  res.status(200).json({
    status: 'success',
    data: { user: sanitizeUser(user) },
  });
});

// @desc    Delete user (admin only)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError('No user found with that ID', 404));
  res.status(204).json({ status: 'success', data: null });
});

// @desc    Get current user (middleware)
// @route   GET /api/v1/users/me
// @access  Private
export const getMe = (req, _res, next) => {
  req.params.id = req.user.id; // reuse getUser
  next();
};

// @desc    Update current user (self)
// @route   PATCH /api/v1/users/update-me
// @access  Private
export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('This route is not for password updates. Please use /auth/update-my-password.', 400)
    );
  }

  const updates = filterFields(req.body, 'name', 'email', 'phone', 'photo');
  if (updates.email) updates.email = String(updates.email).toLowerCase();

  const updated = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user: sanitizeUser(updated) },
  });
});

// @desc    Delete current user (soft delete)
// @route   DELETE /api/v1/users/delete-me
// @access  Private
export const deleteMe = catchAsync(async (req, res) => {
  // Soft delete if your schema supports it; otherwise, deleteOne
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({ status: 'success', data: null });
});
