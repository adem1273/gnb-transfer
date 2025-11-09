/**
 * System Log Model
 *
 * @module models/SystemLog
 * @description Centralized logging to MongoDB
 */

import mongoose from 'mongoose';

const systemLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'debug'],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    service: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    error: {
      stack: String,
      message: String,
      code: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
systemLogSchema.index({ createdAt: -1 });
systemLogSchema.index({ level: 1, createdAt: -1 });
systemLogSchema.index({ service: 1, createdAt: -1 });

// TTL index to automatically delete logs older than 90 days
systemLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const SystemLog = mongoose.models.SystemLog || mongoose.model('SystemLog', systemLogSchema);

export default SystemLog;
