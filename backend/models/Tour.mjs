/**
 * Tour model with validation and indexes
 */

import mongoose from 'mongoose';

const tourSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tour title is required'],
      trim: true,
      index: true,
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
  },
  {
    timestamps: true,
  }
);

// Text index on title and description for search functionality
tourSchema.index({ title: 'text', description: 'text' });

// Compound index for campaign tours
tourSchema.index({ isCampaign: 1, price: -1 });

const Tour = mongoose.models.Tour || mongoose.model('Tour', tourSchema);

export default Tour;
