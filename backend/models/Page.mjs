import mongoose from 'mongoose';

/**
 * Page Model
 *
 * @module models/Page
 * @description Mongoose model for CMS page management
 *
 * Features:
 * - Unique slug for URL-friendly access
 * - Section-based content with flexible types
 * - SEO metadata support
 * - Published/draft status
 * - Timestamps for tracking
 */

const sectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Section type is required'],
      enum: {
        values: ['text', 'image', 'markdown'],
        message: 'Section type must be text, image, or markdown',
      },
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Section content is required'],
    },
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must be lowercase alphanumeric with hyphens only',
      ],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    sections: {
      type: [sectionSchema],
      default: [],
      validate: {
        validator: function (sections) {
          return Array.isArray(sections);
        },
        message: 'Sections must be an array',
      },
    },
    seo: {
      title: {
        type: String,
        trim: true,
        maxlength: [60, 'SEO title cannot exceed 60 characters'],
      },
      description: {
        type: String,
        trim: true,
        maxlength: [160, 'SEO description cannot exceed 160 characters'],
      },
      canonical: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            if (!v) return true; // Allow empty
            // Use URL constructor for robust validation
            try {
              new URL(v);
              return true;
            } catch {
              return false;
            }
          },
          message: 'Canonical URL must be a valid URL',
        },
      },
    },
    structuredData: {
      enabled: {
        type: Boolean,
        default: true,
      },
    },
    published: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for efficient queries
pageSchema.index({ slug: 1 });
pageSchema.index({ published: 1, createdAt: -1 });
pageSchema.index({ createdAt: -1 });

/**
 * Instance method: Check if page is published
 */
pageSchema.methods.isPublished = function () {
  return this.published === true;
};

/**
 * Static method: Find all published pages
 */
pageSchema.statics.findPublished = function () {
  return this.find({ published: true }).sort({ createdAt: -1 });
};

/**
 * Static method: Find page by slug
 */
pageSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug: slug.toLowerCase() });
};

const Page = mongoose.models.Page || mongoose.model('Page', pageSchema);
export default Page;
