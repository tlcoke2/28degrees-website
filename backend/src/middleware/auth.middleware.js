import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/User.model.js';

// Main JWT verification middleware
const verifyJWT = async (req, res, next) => {
  try {
    let token;

    // 1) Getting token and check if it's there
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'You are not logged in! Please log in to get access.',
      });
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'User recently changed password! Please log in again.',
      });
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Please log in to get access.',
      error: error.message,
    });
  }
};

// Permission verification middleware
const verifyPermission = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Only for rendered pages, no errors!
const isLoggedIn = async (req, res, next) => {
  if (req.cookies.token) {
    try {
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.token,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// Export all middleware functions with both old and new names for compatibility
export {
  verifyJWT as protect,
  verifyJWT,
  verifyPermission as authorize,
  verifyPermission,
  isLoggedIn
};

// Default export for backward compatibility
export default {
  protect: verifyJWT,
  verifyJWT,
  authorize: verifyPermission,
  verifyPermission,
  isLoggedIn,
};
