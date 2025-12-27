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
        'PAGE_CREATE',
        'PAGE_UPDATE',
        'PAGE_DELETE',
        'SUPER_ADMIN_ACTION',
        'KILL_SWITCH_ACTIVATED',
        'SYSTEM_SETTINGS_UPDATE',
        'FEATURE_FLAG_CHANGE',
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
    endpoint: { type: String }, // API endpoint that was called
    method: { type: String }, // HTTP method (GET, POST, PUT, DELETE)
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
