/**
 * Review Model
 *
 * @module models/Review
 * @description Customer reviews and ratings for transfers
 */

import mongoose from 'mongoose';
import crypto from 'crypto';

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    driverRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    vehicleRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    punctualityRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
      index: true,
    },
    showOnHomepage: {
      type: Boolean,
      default: false,
      index: true,
    },
    adminResponse: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin response cannot exceed 500 characters'],
    },
    adminResponseAt: {
      type: Date,
    },
    language: {
      type: String,
      default: 'en',
    },
    source: {
      type: String,
      enum: ['email', 'app', 'website', 'sms', 'whatsapp'],
      default: 'email',
    },
    reviewToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    tokenExpiry: {
      type: Date,
    },
    helpful: {
      type: Number,
      default: 0,
      min: 0,
    },
    notHelpful: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewSchema.index({ booking: 1 }, { unique: true }); // One review per booking
reviewSchema.index({ user: 1, createdAt: -1 }); // User reviews
reviewSchema.index({ driver: 1, status: 1 }); // Driver reviews
reviewSchema.index({ status: 1, showOnHomepage: 1, createdAt: -1 }); // Homepage reviews
reviewSchema.index({ rating: -1, status: 1 }); // Top-rated reviews
reviewSchema.index({ createdAt: -1 }); // Recent reviews
reviewSchema.index({ reviewToken: 1 }, { sparse: true }); // Token lookup
reviewSchema.index({ status: 1, rating: -1 }); // Status and rating queries

// Virtual for average rating
reviewSchema.virtual('averageDetailedRating').get(function () {
  const ratings = [this.driverRating, this.vehicleRating, this.punctualityRating].filter(Boolean);
  if (ratings.length === 0) return this.rating;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
});

// Static method to get homepage reviews
reviewSchema.statics.getHomepageReviews = function (limit = 10) {
  return this.find({ status: 'approved', showOnHomepage: true })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get average rating
reviewSchema.statics.getAverageRating = async function () {
  const result = await this.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { averageRating: 0, totalReviews: 0 };
};

// Static method to get driver average rating
reviewSchema.statics.getDriverRating = async function (driverId) {
  const result = await this.aggregate([
    { $match: { driver: driverId, status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$driverRating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { averageRating: 0, totalReviews: 0 };
};

// Generate review token
reviewSchema.methods.generateReviewToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.reviewToken = token;
  this.tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return token;
};

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;
