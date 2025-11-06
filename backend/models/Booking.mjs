/**
 * Booking model with validation and indexes
 */

import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Customer email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'Tour reference is required']
  },
  tourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour'
  },
  date: {
    type: Date,
    default: Date.now
  },
  guests: {
    type: Number,
    default: 1,
    min: [1, 'Must have at least 1 guest']
  },
  amount: {
    type: Number,
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'stripe'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'paid'],
    default: 'pending',
    index: true
  }
}, {
  timestamps: true
});

// Compound index for user + status queries
bookingSchema.index({ user: 1, status: 1 });

// Index on email for quick lookups
bookingSchema.index({ email: 1 });

// Compound index for tourId lookups
bookingSchema.index({ tourId: 1, status: 1 });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default Booking;

