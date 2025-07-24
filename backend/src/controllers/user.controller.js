import { promisify } from 'util';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import AppError from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendWelcomeEmail } from '../utils/email.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  // Remove password from output
  user.password = undefined;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
export const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// @desc    Create new user
// @route   POST /api/v1/users
// @access  Private/Admin
export const createUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  // Send welcome email
  await sendWelcomeEmail(newUser);

  createSendToken(newUser, 201, res);
});

// @desc    Update user
// @route   PATCH /api/v1/users/:id
// @access  Private/Admin
export const updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// @desc    Get current user
// @route   GET /api/v1/users/me
// @access  Private
export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// @desc    Update current user
// @route   PATCH /api/v1/users/updateMe
// @access  Private
export const updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = {
    name: req.body.name,
    email: req.body.email,
  };
  
  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// @desc    Delete current user
// @route   DELETE /api/v1/users/deleteMe
// @access  Private
export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// @desc    Upload user photo
// @route   POST /api/v1/users/uploadPhoto
// @access  Private
export const uploadUserPhoto = (req, res, next) => {
  if (!req.files || !req.files.photo) {
    return next(new AppError('Please upload a photo', 400));
  }

  const file = req.files.photo;
  
  // Check if the file is an image
  if (!file.mimetype.startsWith('image')) {
    return next(new AppError('Please upload an image file', 400));
  }

  // Check file size (max 1MB)
  if (file.size > 1024 * 1024) {
    return next(
      new AppError('Please upload an image less than 1MB', 400)
    );
  }

  // Create custom filename
  const fileName = `user-${req.user.id}-${Date.now()}.${file.mimetype.split('/')[1]}`;
  
  // Move file to public/img/users
  file.mv(`public/img/users/${fileName}`, async (err) => {
    if (err) {
      console.error('Error uploading file:', err);
      return next(new AppError('Error uploading file', 500));
    }
    
    // Update user document with photo
    await User.findByIdAndUpdate(req.user.id, { photo: fileName });
    
    res.status(200).json({
      status: 'success',
      data: {
        photo: fileName,
      },
    });
  });
};

// @desc    Resize user photo
// @route   - (middleware)
// @access  Private
export const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files.photo) return next();
  
  req.body.photo = `user-${req.user.id}-${Date.now()}.jpeg`;
  
  // Resize image using sharp
  await sharp(req.files.photo.data)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.body.photo}`);
    
  next();
});
