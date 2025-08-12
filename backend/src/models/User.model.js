// src/models/User.model.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
        'Please add a valid email',
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
    photo: {
      type: String, // filename stored by upload/resize pipeline
    },

    // Auth fields
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // Only runs on CREATE and SAVE
        validator: function (val) {
          // If password not modified, skip validation
          if (!this.isModified('password')) return true;
          return val === this.password;
        },
        message: 'Passwords do not match',
      },
      select: false,
    },
    passwordChangedAt: Date,

    // Reset tokens (match controllers)
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Soft delete
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ----------------------------- Middleware ----------------------------- */

// Hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  // Do not persist confirm field
  this.passwordConfirm = undefined;
  return next();
});

// Set passwordChangedAt when password is updated
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  // Subtract 1s to avoid token issued just before this being considered valid
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// Optionally exclude inactive users from all find queries
userSchema.pre(/^find/, function (next) {
  this.where({ active: { $ne: false } });
  next();
});

/* ------------------------------- Virtuals ------------------------------- */

userSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'user',
  justOne: false,
});

/* -------------------------------- Methods -------------------------------- */

// Sign JWT (kept for backward compatibility; controllers also sign)
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '90d',
  });
};

// Compare candidate password
userSchema.methods.matchPassword = async function (enteredPassword, hashed) {
  return bcrypt.compare(enteredPassword, hashed || this.password);
};

// Check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Create password reset token and set expiry
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

/* ------------------------------ Export model ----------------------------- */

export default mongoose.models.User || mongoose.model('User', userSchema);
