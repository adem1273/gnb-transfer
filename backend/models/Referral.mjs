/**
 * Referral Model
 *
 * @module models/Referral
 * @description Manages referral program tracking
 */

import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    referredUsers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
        firstBookingCompleted: {
          type: Boolean,
          default: false,
        },
        rewardClaimed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    totalReferrals: {
      type: Number,
      default: 0,
      min: 0,
    },
    successfulReferrals: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRewards: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Reward configuration
    rewardType: {
      type: String,
      enum: ['discount', 'credit', 'percentage'],
      default: 'discount',
    },
    rewardValue: {
      type: Number,
      default: 10, // 10% discount or $10 credit
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
referralSchema.index({ referrer: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ 'referredUsers.user': 1 });

// Method to add a new referral
referralSchema.methods.addReferral = function (userId) {
  // Check if user already referred
  const alreadyReferred = this.referredUsers.some(
    (ref) => ref.user.toString() === userId.toString()
  );

  if (alreadyReferred) {
    return { success: false, message: 'User already referred' };
  }

  this.referredUsers.push({
    user: userId,
    registeredAt: new Date(),
    firstBookingCompleted: false,
    rewardClaimed: false,
  });

  this.totalReferrals += 1;

  return { success: true, message: 'Referral added successfully' };
};

// Method to mark referral as successful (when they complete first booking)
referralSchema.methods.markReferralSuccessful = async function (userId) {
  const referral = this.referredUsers.find((ref) => ref.user.toString() === userId.toString());

  if (!referral) {
    return { success: false, message: 'Referral not found' };
  }

  if (referral.firstBookingCompleted) {
    return { success: false, message: 'Referral already marked as successful' };
  }

  referral.firstBookingCompleted = true;
  this.successfulReferrals += 1;

  return { success: true, message: 'Referral marked as successful' };
};

// Method to claim reward
referralSchema.methods.claimReward = function (userId) {
  const referral = this.referredUsers.find((ref) => ref.user.toString() === userId.toString());

  if (!referral) {
    return { success: false, message: 'Referral not found' };
  }

  if (!referral.firstBookingCompleted) {
    return { success: false, message: 'Referral has not completed first booking yet' };
  }

  if (referral.rewardClaimed) {
    return { success: false, message: 'Reward already claimed' };
  }

  referral.rewardClaimed = true;
  this.totalRewards += this.rewardValue;

  return {
    success: true,
    message: 'Reward claimed successfully',
    rewardType: this.rewardType,
    rewardValue: this.rewardValue,
  };
};

const Referral = mongoose.models.Referral || mongoose.model('Referral', referralSchema);

export default Referral;
