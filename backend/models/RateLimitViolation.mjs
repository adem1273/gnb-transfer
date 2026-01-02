/**
 * Rate Limit Violation Model
 * Tracks rate limit violations, bans, and abuse patterns
 */

import mongoose from 'mongoose';

const rateLimitViolationSchema = new mongoose.Schema(
  {
    // Identifier (IP address or user ID)
    identifier: {
      type: String,
      required: true,
      index: true,
    },
    
    // Type of identifier (ip or userId)
    identifierType: {
      type: String,
      enum: ['ip', 'userId'],
      required: true,
      default: 'ip',
    },
    
    // Endpoint that was violated
    endpoint: {
      type: String,
      required: true,
    },
    
    // Number of violations
    violationCount: {
      type: Number,
      default: 1,
    },
    
    // Ban status
    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Ban expiration time
    banExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    
    // Current penalty level (0 = no penalty, 1 = warning, 2 = 5min ban, 3 = 1hour ban)
    penaltyLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    
    // Last violation timestamp
    lastViolationAt: {
      type: Date,
      default: Date.now,
    },
    
    // User agent (for bot detection)
    userAgent: {
      type: String,
      default: '',
    },
    
    // Request metadata for pattern detection
    requestMetadata: {
      method: String,
      path: String,
      payloadSize: Number,
    },
    
    // Suspicious pattern flags
    suspiciousPatterns: {
      rapidRequests: { type: Boolean, default: false },
      largePayload: { type: Boolean, default: false },
      suspiciousBot: { type: Boolean, default: false },
    },
    
    // Notes (admin can add notes about manual actions)
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
rateLimitViolationSchema.index({ identifier: 1, endpoint: 1 });
rateLimitViolationSchema.index({ isBanned: 1, banExpiresAt: 1 });

// TTL index to auto-delete old violations after 30 days
rateLimitViolationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

/**
 * Check if a ban is currently active
 */
rateLimitViolationSchema.methods.isCurrentlyBanned = function () {
  if (!this.isBanned) return false;
  if (!this.banExpiresAt) return true; // Permanent ban
  return new Date() < this.banExpiresAt;
};

/**
 * Apply penalty based on violation count
 */
rateLimitViolationSchema.methods.applyPenalty = function () {
  this.violationCount += 1;
  this.lastViolationAt = new Date();
  
  if (this.violationCount === 1) {
    // First violation: Warning only
    this.penaltyLevel = 1;
  } else if (this.violationCount === 2) {
    // Second violation: 5-minute ban
    this.penaltyLevel = 2;
    this.isBanned = true;
    this.banExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  } else if (this.violationCount >= 3) {
    // Third+ violation: 1-hour ban
    this.penaltyLevel = 3;
    this.isBanned = true;
    this.banExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  }
  
  return this.save();
};

/**
 * Clear ban and reset penalty
 */
rateLimitViolationSchema.methods.clearBan = function () {
  this.isBanned = false;
  this.banExpiresAt = null;
  this.penaltyLevel = 0;
  return this.save();
};

/**
 * Static method to find or create violation record
 */
rateLimitViolationSchema.statics.findOrCreate = async function (identifier, identifierType, endpoint) {
  let violation = await this.findOne({ identifier, endpoint });
  
  if (!violation) {
    violation = new this({
      identifier,
      identifierType,
      endpoint,
    });
  }
  
  return violation;
};

/**
 * Static method to check if identifier is banned
 */
rateLimitViolationSchema.statics.checkBan = async function (identifier, endpoint) {
  const violation = await this.findOne({ 
    identifier, 
    endpoint, 
    isBanned: true,
  });
  
  if (!violation) return null;
  
  // Check if ban has expired
  if (violation.banExpiresAt && new Date() >= violation.banExpiresAt) {
    await violation.clearBan();
    return null;
  }
  
  return violation;
};

/**
 * Static method to get violation statistics
 */
rateLimitViolationSchema.statics.getStats = async function () {
  const totalViolations = await this.countDocuments();
  const activeBans = await this.countDocuments({ 
    isBanned: true,
    $or: [
      { banExpiresAt: null },
      { banExpiresAt: { $gt: new Date() } },
    ],
  });
  
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentViolations = await this.countDocuments({
    lastViolationAt: { $gte: last24Hours },
  });
  
  return {
    totalViolations,
    activeBans,
    recentViolations,
  };
};

export const RateLimitViolation = mongoose.model('RateLimitViolation', rateLimitViolationSchema);
