import mongoose from 'mongoose';

/**
 * AdminLog Model
 *
 * @module models/AdminLog
 * @description Mongoose model for tracking admin actions
 *
 * Features:
 * - Track all CRUD operations by admins
 * - Search and filter capabilities
 * - Audit trail for compliance
 */

const adminLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'VIEW',
        'EXPORT',
        'SETTINGS_CHANGE',
        'CAMPAIGN_CREATE',
        'CAMPAIGN_UPDATE',
        'CAMPAIGN_DELETE',
      ],
    },
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      email: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    target: {
      type: { type: String, required: true }, // e.g., 'User', 'Booking', 'Tour', 'Settings'
      id: { type: mongoose.Schema.Types.ObjectId }, // Optional, not all actions have target ID
      name: { type: String }, // Human-readable name
    },
    metadata: { type: mongoose.Schema.Types.Mixed }, // Additional context
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

// Performance indexes
adminLogSchema.index({ 'user.id': 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ 'target.type': 1, createdAt: -1 });
adminLogSchema.index({ createdAt: -1 }); // For recent logs query

const AdminLog = mongoose.models.AdminLog || mongoose.model('AdminLog', adminLogSchema);
export default AdminLog;
