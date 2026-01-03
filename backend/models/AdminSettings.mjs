import mongoose from 'mongoose';

/**
 * AdminSettings Model
 *
 * @module models/AdminSettings
 * @description Mongoose model for managing system-wide admin settings
 *
 * Features:
 * - Enable/disable major system modules (tours, users, bookings, payments)
 * - Notification preferences for automated emails
 * - Single document pattern (only one settings document)
 */

const adminSettingsSchema = new mongoose.Schema(
  {
    activeModules: {
      tours: { type: Boolean, default: true },
      users: { type: Boolean, default: true },
      bookings: { type: Boolean, default: true },
      payments: { type: Boolean, default: true },
    },
    notificationSettings: {
      bookingConfirmation: { type: Boolean, default: true },
      paymentReceived: { type: Boolean, default: true },
      campaignStarted: { type: Boolean, default: true },
      systemAlerts: { type: Boolean, default: true },
    },
    emailConfig: {
      fromEmail: { type: String, default: 'noreply@gnbtransfer.com' },
      fromName: { type: String, default: 'GNB Transfer' },
    },
  },
  { timestamps: true }
);

// Index for timestamp queries (singleton pattern - only one document but useful for auditing)
adminSettingsSchema.index({ updatedAt: -1 });

const AdminSettings =
  mongoose.models.AdminSettings || mongoose.model('AdminSettings', adminSettingsSchema);
export default AdminSettings;
