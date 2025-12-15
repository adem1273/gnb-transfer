/**
 * Authentication routes - token refresh and logout
 *
 * @module routes/authRoutes
 * @description Handles refresh token rotation and logout (token revocation)
 */

import express from 'express';
import {
  verifyAndRotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  getDeviceInfo,
  getClientIP,
} from '../services/authService.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { strictRateLimiter } from '../middlewares/rateLimiter.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Refresh access token using refresh token (with automatic token rotation for security)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Current refresh token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: New access token (15 min expiry)
 *                     refreshToken:
 *                       type: string
 *                       description: New refresh token (30 day expiry)
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid or missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Refresh token expired or revoked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token (with rotation)
 * @access  Public (but requires valid refresh token)
 * @body    {string} refreshToken - Current refresh token
 * @returns {object} - New access token, new refresh token, and user details
 *
 * Security - Refresh Token Rotation:
 * - Validates the provided refresh token
 * - Checks it's not revoked and not expired
 * - Revokes the old refresh token
 * - Issues new access token (short-lived: 15 minutes)
 * - Issues new refresh token (long-lived: 30 days)
 * - Stores new refresh token (hashed)
 *
 * This prevents token reuse attacks:
 * - If an attacker steals a refresh token and uses it, the legitimate user's next
 *   refresh attempt will fail, alerting them to potential compromise
 *
 * Rate limiting:
 * - Limited to 5 refresh attempts per 15 minutes per IP
 * - Prevents brute force attacks on stolen tokens
 */
router.post('/refresh', strictRateLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.apiError('Refresh token is required', 400);
    }

    // Get client IP for security logging
    const ipAddress = getClientIP(req);

    // Verify and rotate refresh token
    const result = await verifyAndRotateRefreshToken(refreshToken, ipAddress);

    return res.apiSuccess(
      {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
      'Token refreshed successfully'
    );
  } catch (err) {
    // Don't expose detailed error messages for security
    logger.error('Refresh token error:', { error: err.message, stack: err.stack });
    return res.apiError('Invalid or expired refresh token', 401);
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and revoke refresh token
 * @access  Private (requires authentication)
 * @body    {string} [refreshToken] - Refresh token to revoke (optional)
 * @returns {object} - Success message
 *
 * Security:
 * - Requires valid access token (authentication)
 * - Revokes the provided refresh token
 * - If no refresh token provided, can still logout (clears client-side tokens)
 *
 * Client should:
 * 1. Call this endpoint with refresh token
 * 2. Clear access token from memory/storage
 * 3. Clear refresh token from storage
 * 4. Redirect to login page
 */
router.post('/logout', requireAuth(), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke the specific refresh token
      await revokeRefreshToken(refreshToken, 'logout');
    }

    return res.apiSuccess(null, 'Logout successful');
  } catch (err) {
    logger.error('Logout error:', { error: err.message, stack: err.stack });
    // Still return success even if revocation fails
    // Client should clear tokens regardless
    return res.apiSuccess(null, 'Logout successful');
  }
});

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout user from all devices (revoke all refresh tokens)
 * @access  Private (requires authentication)
 * @returns {object} - Success message with count of revoked tokens
 *
 * Security:
 * - Requires valid access token
 * - Revokes ALL refresh tokens for the authenticated user
 *
 * Use cases:
 * - User suspects account compromise
 * - User wants to logout from all devices
 * - Password change (should call this automatically)
 * - Admin action for security
 */
router.post('/logout-all', requireAuth(), async (req, res) => {
  try {
    const userId = req.user.id;

    // Revoke all refresh tokens for this user
    const result = await revokeAllUserTokens(userId, 'logout');

    return res.apiSuccess(
      {
        revokedCount: result.modifiedCount || 0,
      },
      'Logged out from all devices successfully'
    );
  } catch (err) {
    logger.error('Logout all error:', { error: err.message, stack: err.stack });
    return res.apiError('Failed to logout from all devices', 500);
  }
});

/**
 * @route   GET /api/auth/sessions
 * @desc    Get active sessions (refresh tokens) for current user
 * @access  Private (requires authentication)
 * @returns {array} - List of active sessions with device info
 *
 * Security:
 * - Shows only the user's own sessions
 * - Doesn't expose actual token values
 * - Useful for security auditing
 */
router.get('/sessions', requireAuth(), async (req, res) => {
  try {
    const userId = req.user.id;

    // Import RefreshToken model here to avoid circular dependency
    const RefreshToken = (await import('../models/RefreshToken.mjs')).default;

    // Get active sessions
    const sessions = await RefreshToken.find({
      userId,
      revoked: false,
      expiresAt: { $gt: new Date() },
    })
      .select('-tokenHash') // Don't expose token hash
      .sort({ createdAt: -1 })
      .lean();

    return res.apiSuccess(
      sessions.map((session) => ({
        id: session._id,
        deviceInfo: session.deviceInfo,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
      })),
      'Sessions retrieved successfully'
    );
  } catch (err) {
    logger.error('Get sessions error:', { error: err.message, stack: err.stack });
    return res.apiError('Failed to retrieve sessions', 500);
  }
});

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke a specific session (refresh token)
 * @access  Private (requires authentication)
 * @param   {string} sessionId - Refresh token document ID
 * @returns {object} - Success message
 *
 * Security:
 * - User can only revoke their own sessions
 * - Useful for "logout from device" feature
 */
router.delete('/sessions/:sessionId', requireAuth(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    // Import RefreshToken model
    const RefreshToken = (await import('../models/RefreshToken.mjs')).default;

    // Find and verify ownership
    const session = await RefreshToken.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      return res.apiError('Session not found', 404);
    }

    // Revoke the session
    await session.revoke('logout');

    return res.apiSuccess(null, 'Session revoked successfully');
  } catch (err) {
    logger.error('Revoke session error:', { error: err.message, stack: err.stack });
    return res.apiError('Failed to revoke session', 500);
  }
});

export default router;
