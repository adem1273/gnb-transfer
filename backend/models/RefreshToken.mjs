import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * RefreshToken Model
 *
 * @module models/RefreshToken
 * @description Mongoose model for managing JWT refresh tokens with rotation and revocation
 *
 * Security features:
 * - Tokens are hashed before storage (bcrypt)
 * - Supports token revocation (blacklisting)
 * - Automatic expiry via TTL index
 * - Device/browser fingerprinting for additional security
 * - Track IP addresses for suspicious activity detection
 *
 * Lifecycle:
 * - Created on login
 * - Rotated on refresh (old token revoked, new token issued)
 * - Revoked on logout or suspicious activity
 * - Automatically deleted after expiry via MongoDB TTL index
 */

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

const refreshTokenSchema = new mongoose.Schema(
  {
    /**
     * User reference - the owner of this refresh token
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /**
     * Hashed refresh token value
     * We store hash, not plaintext, so even if DB is compromised, tokens are protected
     */
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },

    /**
     * Token revocation status
     * When true, this token cannot be used to refresh access tokens
     */
    revoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * Reason for revocation (if applicable)
     * Useful for auditing and security analysis
     */
    revokedReason: {
      type: String,
      enum: ['logout', 'refresh', 'suspicious_activity', 'expired', 'admin_action', 'password_change'],
    },

    /**
     * Timestamp when token was revoked
     */
    revokedAt: {
      type: Date,
    },

    /**
     * Token expiration date
     * TTL index will automatically delete expired tokens
     */
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    /**
     * Device/browser information for security auditing
     */
    deviceInfo: {
      userAgent: { type: String },
      platform: { type: String },
      browser: { type: String },
      os: { type: String },
    },

    /**
     * IP address where token was issued
     * Useful for detecting suspicious activity
     */
    ipAddress: {
      type: String,
      index: true,
    },

    /**
     * Last time this token was used
     * Updated on each successful refresh
     */
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound indexes for efficient queries
refreshTokenSchema.index({ userId: 1, revoked: 1 }); // Find active tokens for user
refreshTokenSchema.index({ userId: 1, createdAt: -1 }); // Recent tokens for user
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

/**
 * Instance method to hash and store a refresh token
 *
 * @param {string} token - Plain text refresh token to hash and store
 * @returns {Promise<void>}
 *
 * Security: Uses bcrypt to hash token before storage
 */
refreshTokenSchema.methods.hashToken = async function (token) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.tokenHash = await bcrypt.hash(token, salt);
};

/**
 * Instance method to verify a refresh token
 *
 * @param {string} token - Plain text token to verify
 * @returns {Promise<boolean>} - True if token matches hash, false otherwise
 *
 * Security: Uses bcrypt compare for timing-attack resistant comparison
 */
refreshTokenSchema.methods.verifyToken = async function (token) {
  return bcrypt.compare(token, this.tokenHash);
};

/**
 * Instance method to revoke this token
 *
 * @param {string} reason - Reason for revocation
 * @returns {Promise<void>}
 */
refreshTokenSchema.methods.revoke = async function (reason = 'logout') {
  this.revoked = true;
  this.revokedReason = reason;
  this.revokedAt = new Date();
  await this.save();
};

/**
 * Static method to revoke all tokens for a user
 *
 * @param {ObjectId} userId - User ID
 * @param {string} reason - Reason for revocation
 * @returns {Promise<object>} - Result of update operation
 *
 * Use cases:
 * - User logs out from all devices
 * - Password change (security best practice)
 * - Suspicious activity detected
 * - Admin action
 */
refreshTokenSchema.statics.revokeAllForUser = async function (userId, reason = 'logout') {
  return this.updateMany(
    { userId, revoked: false },
    {
      $set: {
        revoked: true,
        revokedReason: reason,
        revokedAt: new Date(),
      },
    }
  );
};

/**
 * Static method to clean up old revoked tokens
 * Should be run periodically via cron job
 *
 * @param {number} daysOld - Delete revoked tokens older than this many days
 * @returns {Promise<object>} - Result of delete operation
 */
refreshTokenSchema.statics.cleanupOldRevoked = async function (daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    revoked: true,
    revokedAt: { $lt: cutoffDate },
  });
};

/**
 * Static method to get active token count for a user
 * Useful for detecting suspicious activity (too many active sessions)
 *
 * @param {ObjectId} userId - User ID
 * @returns {Promise<number>} - Count of active tokens
 */
refreshTokenSchema.statics.getActiveCountForUser = async function (userId) {
  return this.countDocuments({
    userId,
    revoked: false,
    expiresAt: { $gt: new Date() },
  });
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
