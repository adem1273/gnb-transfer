/**
 * Tour model with validation and indexes
 */

import mongoose from 'mongoose';
import { invalidateTag } from '../utils/cache.mjs';
import logger from '../config/logger.mjs';

const tourSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tour title is required'],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    title_ar: { type: String, trim: true },
    title_ru: { type: String, trim: true },
    title_es: { type: String, trim: true },
    title_zh: { type: String, trim: true },
    title_hi: { type: String, trim: true },
    title_de: { type: String, trim: true },
    title_it: { type: String, trim: true },
    description: {
      type: String,
      required: [true, 'Tour description is required'],
      trim: true,
    },
    description_ar: { type: String, trim: true },
    description_ru: { type: String, trim: true },
    description_es: { type: String, trim: true },
    description_zh: { type: String, trim: true },
    description_hi: { type: String, trim: true },
    description_de: { type: String, trim: true },
    description_it: { type: String, trim: true },
    category: {
      type: String,
      enum: ['transfer', 'tour', 'vip', 'airport', 'city', 'excursion', 'package'],
      default: 'transfer',
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Tour price is required'],
      min: [0, 'Price cannot be negative'],
      index: true,
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    isCampaign: {
      type: Boolean,
      default: false,
      index: true,
    },
    availableSeats: {
      type: Number,
      min: [0, 'Available seats cannot be negative'],
      // Optional field - if not set, booking system should check availability
    },
    image: {
      type: String,
      trim: true,
      // Cloudinary URL for tour image
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to auto-generate slug from title
tourSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }
  next();
});

// Text index on title and description for search functionality
tourSchema.index({ title: 'text', description: 'text' });

// Compound index for active tours by category and price
tourSchema.index({ active: 1, category: 1, price: -1 });
tourSchema.index({ active: 1, isCampaign: 1, price: -1 }); // Active campaign tours

// Additional performance indexes for filtering and sorting
tourSchema.index({ price: 1 }); // Price range queries
tourSchema.index({ duration: 1 }); // Duration-based filtering
tourSchema.index({ createdAt: -1 }); // Recent tours
tourSchema.index({ slug: 1 }, { unique: true, sparse: true }); // SEO-friendly URLs

// Cache invalidation hooks
tourSchema.post('save', async function(doc) {
  try {
    await invalidateTag('tours');
    logger.debug('Tour cache invalidated after save', { tourId: doc._id });
  } catch (error) {
    logger.error('Failed to invalidate tour cache', { error: error.message });
  }
});

tourSchema.post('findOneAndUpdate', async function(doc) {
  try {
    await invalidateTag('tours');
    logger.debug('Tour cache invalidated after update');
  } catch (error) {
    logger.error('Failed to invalidate tour cache', { error: error.message });
  }
});

tourSchema.post('findOneAndDelete', async function(doc) {
  try {
    await invalidateTag('tours');
    logger.debug('Tour cache invalidated after delete');
  } catch (error) {
    logger.error('Failed to invalidate tour cache', { error: error.message });
  }
});

tourSchema.post('deleteOne', async function() {
  try {
    await invalidateTag('tours');
    logger.debug('Tour cache invalidated after deleteOne');
  } catch (error) {
    logger.error('Failed to invalidate tour cache', { error: error.message });
  }
});

tourSchema.post('deleteMany', async function() {
  try {
    await invalidateTag('tours');
    logger.debug('Tour cache invalidated after deleteMany');
  } catch (error) {
    logger.error('Failed to invalidate tour cache', { error: error.message });
  }
});

const Tour = mongoose.models.Tour || mongoose.model('Tour', tourSchema);

export default Tour;
