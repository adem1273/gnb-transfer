/**
 * LoyaltyPoints Model
 *
 * @module models/LoyaltyPoints
 * @description Manages customer loyalty points and rewards
 */

import mongoose from 'mongoose';

const pointTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['earn', 'redeem', 'expire', 'bonus', 'adjustment'],
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    description: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const loyaltyPointsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    availablePoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimePoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    totalRides: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactions: [pointTransactionSchema],
    // Reward tracking
    rewards: [
      {
        type: {
          type: String,
          enum: ['free_ride', 'discount', 'upgrade', 'bonus_points'],
        },
        value: Number,
        earned: { type: Boolean, default: false },
        used: { type: Boolean, default: false },
        earnedAt: Date,
        usedAt: Date,
        expiresAt: Date,
        booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
      },
    ],
    // Milestone tracking
    nextMilestone: {
      rides: { type: Number, default: 5 },
      reward: { type: String, default: '20% discount' },
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
loyaltyPointsSchema.index({ user: 1 }, { unique: true });
loyaltyPointsSchema.index({ totalPoints: -1 });
loyaltyPointsSchema.index({ tier: 1 });

// Calculate tier based on lifetime points
loyaltyPointsSchema.methods.calculateTier = function () {
  const points = this.lifetimePoints;
  if (points >= 10000) return 'platinum';
  if (points >= 5000) return 'gold';
  if (points >= 1000) return 'silver';
  return 'bronze';
};

// Add points
loyaltyPointsSchema.methods.addPoints = async function (points, bookingId, description) {
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Points expire in 1 year

  this.transactions.push({
    type: 'earn',
    points,
    booking: bookingId,
    description: description || 'Points earned from booking',
    expiresAt,
  });

  this.totalPoints += points;
  this.availablePoints += points;
  this.lifetimePoints += points;
  this.totalRides += 1;
  this.lastActivityAt = new Date();
  this.tier = this.calculateTier();

  // Check for milestone rewards
  await this.checkMilestones();

  return this.save();
};

// Redeem points
loyaltyPointsSchema.methods.redeemPoints = async function (points, bookingId, description) {
  if (points > this.availablePoints) {
    throw new Error('Insufficient points');
  }

  this.transactions.push({
    type: 'redeem',
    points: -points,
    booking: bookingId,
    description: description || 'Points redeemed',
  });

  this.totalPoints -= points;
  this.availablePoints -= points;
  this.lastActivityAt = new Date();

  return this.save();
};

// Check and award milestone rewards
loyaltyPointsSchema.methods.checkMilestones = async function () {
  const Settings = mongoose.model('Settings');
  const settings = await Settings.getGlobalSettings();
  const loyaltySettings = settings.loyalty;

  // Check for 5th ride discount
  if (this.totalRides === loyaltySettings.discountAfterRides) {
    this.rewards.push({
      type: 'discount',
      value: loyaltySettings.discountPercent,
      earned: true,
      earnedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    this.nextMilestone = {
      rides: loyaltySettings.freeRideThreshold,
      reward: 'Free ride',
    };
  }

  // Check for 10th ride free
  if (this.totalRides === loyaltySettings.freeRideThreshold) {
    this.rewards.push({
      type: 'free_ride',
      value: 100,
      earned: true,
      earnedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    });
    this.nextMilestone = {
      rides: this.totalRides + 5,
      reward: '20% discount',
    };
  }
};

// Get available rewards
loyaltyPointsSchema.methods.getAvailableRewards = function () {
  return this.rewards.filter(
    (r) => r.earned && !r.used && (!r.expiresAt || r.expiresAt > new Date())
  );
};

// Static method to get or create loyalty record for user
loyaltyPointsSchema.statics.getOrCreateForUser = async function (userId) {
  let record = await this.findOne({ user: userId });
  if (!record) {
    record = await this.create({ user: userId });
  }
  return record;
};

// Static method to get leaderboard
loyaltyPointsSchema.statics.getLeaderboard = function (limit = 10) {
  return this.find()
    .populate('user', 'name email')
    .sort({ lifetimePoints: -1 })
    .limit(limit);
};

const LoyaltyPoints = mongoose.models.LoyaltyPoints || mongoose.model('LoyaltyPoints', loyaltyPointsSchema);

export default LoyaltyPoints;
