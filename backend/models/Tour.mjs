/**
 * Tour model with validation and indexes
 */

import mongoose from 'mongoose';

const tourSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tour title is required'],
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Tour description is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Tour price is required'],
    min: [0, 'Price cannot be negative']
  },
  availableSeats: {
    type: Number,
    required: [true, 'Available seats is required'],
    min: [0, 'Available seats cannot be negative'],
    default: 0
  }
}, {
  timestamps: true
});

// Text index on title and description for search functionality
tourSchema.index({ title: 'text', description: 'text' });

const Tour = mongoose.models.Tour || mongoose.model('Tour', tourSchema);

export default Tour;

