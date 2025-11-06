/**
 * Booking model with validation and indexes
 */

import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'Tour reference is required']
  },
  amount: {
    type: Number,
    required: [true, 'Booking amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index on user for faster lookups by user
bookingSchema.index({ user: 1 });

// Compound index for user + status queries
bookingSchema.index({ user: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
