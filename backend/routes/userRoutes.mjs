/**
 * User routes - authentication and user management
 */

import express from 'express';
import crypto from 'crypto';
import User from '../models/User.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { strictRateLimiter } from '../middlewares/rateLimiter.mjs';
import { sendEmail } from '../services/emailService.mjs';
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  getDeviceInfo,
  getClientIP,
  revokeAllUserTokens,
} from '../services/authService.mjs';
import {
  validateUserRegistration,
  validateUserLogin,
  validateMongoId,
} from '../validators/index.mjs';

const router = express.Router();

/**
 * @route   POST /api/users/register
 * @desc    Register a new user account
 * @access  Public
 * @body    {string} name - User's full name (2-100 characters)
 * @body    {string} email - Valid email address
 * @body    {string} password - Password (min 6 chars, must contain uppercase, lowercase, and number)
 * @returns {object} - Access token, refresh token, and user details (without password)
 *
 * Security measures:
 * - Rate limited to 5 requests per 15 minutes
 * - Password is hashed with bcrypt before storage (see User model)
 * - Default role is 'user' to prevent privilege escalation
 * - Access token expires in 15 minutes
 * - Refresh token expires in 30 days (stored hashed)
 * - Email uniqueness is enforced at database level
 */
router.post('/register', strictRateLimiter, validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.apiError('Name, email, and password are required', 400);
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.apiError('Email already registered', 409);
    }

    // Create new user with 'user' role by default
    // Note: Role assignment restricted to prevent privilege escalation
    const user = new User({
      name,
      email,
      password,
      role: 'user', // Always default to 'user' role for security
    });
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Store refresh token (hashed)
    const deviceInfo = getDeviceInfo(req);
    const ipAddress = getClientIP(req);
    await storeRefreshToken(user._id, refreshToken, deviceInfo, ipAddress);

    return res.apiSuccess(
      {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      'User registered successfully',
      201
    );
  } catch (err) {
    return res.apiError(err.message, 500);
  }
});

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user and return JWT tokens
 * @access  Public
 * @body    {string} email - User's email address
 * @body    {string} password - User's password
 * @returns {object} - Access token, refresh token, and user details (without password)
 *
 * Security measures:
 * - Rate limited to 5 requests per 15 minutes
 * - Password verified using bcrypt compare (see User.comparePassword method)
 * - Access token expires in 15 minutes
 * - Refresh token expires in 30 days (stored hashed)
 * - Generic error message on invalid credentials (security best practice)
 */
router.post('/login', strictRateLimiter, validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.apiError('Email and password are required', 400);
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.apiError('Invalid credentials', 401);
    }

    // Verify password using comparePassword helper
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.apiError('Invalid credentials', 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Store refresh token (hashed)
    const deviceInfo = getDeviceInfo(req);
    const ipAddress = getClientIP(req);
    await storeRefreshToken(user._id, refreshToken, deviceInfo, ipAddress);

    return res.apiSuccess(
      {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      'Login successful'
    );
  } catch (err) {
    return res.apiError(err.message, 500);
  }
});

/**
 * @route   GET /api/users/profile
 * @desc    Get current authenticated user's profile
 * @access  Private (requires valid JWT token)
 * @headers Authorization: Bearer <token>
 * @returns {object} - User profile (without password)
 *
 * Security:
 * - Requires valid JWT token in Authorization header
 * - Password field is excluded from response
 */
router.get('/profile', requireAuth(), async (req, res) => {
  try {
    if (!req.user) {
      return res.apiError('Not authenticated', 401);
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.apiError('User not found', 404);
    }

    return res.apiSuccess(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      'Profile retrieved successfully'
    );
  } catch (error) {
    return res.apiError(`Failed to retrieve profile: ${error.message}`, 500);
  }
});

/**
 * @route   GET /api/users/permissions
 * @desc    Get current user's permissions based on role
 * @access  Private (requires valid JWT token)
 * @headers Authorization: Bearer <token>
 * @returns {object} - User permissions
 */
router.get('/permissions', requireAuth(), async (req, res) => {
  try {
    if (!req.user) {
      return res.apiError('Not authenticated', 401);
    }

    const { getRolePermissions } = await import('../config/permissions.mjs');
    const permissions = getRolePermissions(req.user.role);

    return res.apiSuccess(
      {
        role: req.user.role,
        permissions,
      },
      'Permissions retrieved successfully'
    );
  } catch (error) {
    return res.apiError(`Failed to retrieve permissions: ${error.message}`, 500);
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all users (limited to 100)
 * @access  Private (admin only)
 * @headers Authorization: Bearer <token>
 * @returns {array} - Array of user objects (passwords excluded)
 *
 * Security:
 * - Requires admin role
 * - Limited to 100 results to prevent memory issues
 */
router.get('/', requireAuth(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password').limit(100);
    return res.apiSuccess(users, 'Users retrieved successfully');
  } catch (error) {
    return res.apiError(`Failed to retrieve users: ${error.message}`, 500);
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user by ID
 * @access  Private (admin only)
 * @headers Authorization: Bearer <token>
 * @param   {string} id - MongoDB ObjectId of the user to delete
 * @returns {null} - Success message on deletion
 *
 * Security:
 * - Requires admin role
 * - Rate limited to 5 requests per 15 minutes
 * - Validates MongoDB ObjectId format
 */
router.delete(
  '/:id',
  requireAuth(['admin']),
  validateMongoId,
  strictRateLimiter,
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.apiError('User not found', 404);
      }

      return res.apiSuccess(null, 'User deleted successfully');
    } catch (error) {
      return res.apiError(`Failed to delete user: ${error.message}`, 500);
    }
  }
);

/**
 * @route   POST /api/users/forgot-password
 * @desc    Request password reset email
 * @access  Public
 * @body    {string} email - User's email address
 * @returns {object} - Success message
 *
 * Security measures:
 * - Rate limited to 3 requests per 15 minutes
 * - Generates cryptographically secure random token
 * - Token expires after 1 hour
 * - Generic success message (doesn't reveal if email exists)
 */
router.post('/forgot-password', strictRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.apiError('Email is required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.apiSuccess(null, 'If that email exists, a password reset link has been sent');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiry to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request - GNB Transfer',
        html: `
          <h1>Password Reset Request</h1>
          <p>Hello ${user.name},</p>
          <p>You requested a password reset for your GNB Transfer account.</p>
          <p>Click the link below to reset your password (valid for 1 hour):</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${resetUrl}</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>GNB Transfer Team</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Clear the reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.apiError('Failed to send reset email. Please try again later.', 500);
    }

    return res.apiSuccess(null, 'If that email exists, a password reset link has been sent');
  } catch (error) {
    return res.apiError(`Failed to process request: ${error.message}`, 500);
  }
});

/**
 * @route   POST /api/users/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 * @param   {string} token - Reset token from email
 * @body    {string} password - New password (min 6 characters)
 * @returns {object} - Success message
 *
 * Security measures:
 * - Rate limited to 5 requests per 15 minutes
 * - Validates token hasn't expired
 * - Clears reset token after successful reset
 * - Password is hashed by User model pre-save hook
 * - Revokes ALL refresh tokens for security (user must re-login)
 */
router.post('/reset-password/:token', strictRateLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password) {
      return res.apiError('Password is required', 400);
    }

    if (password.length < 6) {
      return res.apiError('Password must be at least 6 characters', 400);
    }

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.apiError('Invalid or expired reset token', 400);
    }

    // Update password and clear reset fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Security: Revoke all refresh tokens (force re-login on all devices)
    await revokeAllUserTokens(user._id, 'password_change');

    return res.apiSuccess(
      null,
      'Password reset successful. You can now login with your new password.'
    );
  } catch (error) {
    return res.apiError(`Failed to reset password: ${error.message}`, 500);
  }
});

export default router;
