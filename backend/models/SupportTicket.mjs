/**
 * SupportTicket Model - Handles fallback when AI cannot resolve queries
 *
 * @module models/SupportTicket
 */

import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema(
  {
    // User information
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    
    // Ticket details
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    
    // Ticket metadata
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    category: {
      type: String,
      enum: ['booking', 'payment', 'general', 'technical', 'other'],
      default: 'general',
    },
    
    // AI context
    aiAttempted: {
      type: Boolean,
      default: false,
    },
    aiResponse: {
      type: String,
      default: null,
    },
    conversationHistory: [{
      role: { type: String, enum: ['user', 'assistant', 'system'] },
      content: String,
      timestamp: { type: Date, default: Date.now },
    }],
    
    // Language
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'tr', 'de', 'fr', 'es', 'it', 'ru', 'ar'],
    },
    
    // Related entities
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    
    // Resolution
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolution: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
supportTicketSchema.index({ email: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: -1 });
supportTicketSchema.index({ createdAt: -1 });

// Virtual for ticket age
supportTicketSchema.virtual('age').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60)); // hours
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;
