import mongoose from 'mongoose';

/**
 * Media Model
 *
 * @module models/Media
 * @description Mongoose model for media file management
 *
 * Features:
 * - Track uploaded files (images, documents)
 * - Reference to uploading user
 * - Usage count tracking for safe deletion
 * - File metadata storage
 */

const mediaSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      enum: {
        values: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/gif',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        message: 'Unsupported file type: {VALUE}',
      },
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
      max: [10 * 1024 * 1024, 'File size cannot exceed 10MB'], // 10MB max
    },
    storagePath: {
      type: String,
      required: [true, 'Storage path is required'],
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader reference is required'],
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count cannot be negative'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for efficient queries
mediaSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaSchema.index({ mimeType: 1 });
mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ usageCount: 1 });

// Virtual for file URL (can be customized based on storage strategy)
mediaSchema.virtual('url').get(function () {
  // For local storage, construct URL path
  // This can be extended to support CDN URLs in the future
  return `/uploads/${this.storagePath}`;
});

// Ensure virtuals are included when converting to JSON
mediaSchema.set('toJSON', { virtuals: true });
mediaSchema.set('toObject', { virtuals: true });

/**
 * Instance method: Increment usage count
 */
mediaSchema.methods.incrementUsage = async function () {
  this.usageCount += 1;
  return this.save();
};

/**
 * Instance method: Decrement usage count
 */
mediaSchema.methods.decrementUsage = async function () {
  if (this.usageCount > 0) {
    this.usageCount -= 1;
    return this.save();
  }
  return this;
};

/**
 * Instance method: Check if media can be safely deleted
 */
mediaSchema.methods.canDelete = function () {
  return this.usageCount === 0;
};

const Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);
export default Media;
