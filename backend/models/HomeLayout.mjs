import mongoose from 'mongoose';

/**
 * HomeLayout Model
 *
 * @module models/HomeLayout
 * @description Mongoose model for dynamic homepage layout management
 *
 * Features:
 * - Section-based layout with flexible types
 * - Drag & drop ordering support
 * - Toggle visibility per section
 * - Section-specific data validation
 * - Only one active layout at a time
 */

const sectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Section type is required'],
      enum: {
        values: [
          'hero',
          'features',
          'tours',
          'testimonials',
          'cta',
          'stats',
          'gallery',
          'text',
          'faq',
        ],
        message:
          'Section type must be one of: hero, features, tours, testimonials, cta, stats, gallery, text, faq',
      },
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Section data is required'],
      validate: {
        validator: function (data) {
          // Ensure data is an object
          return typeof data === 'object' && data !== null;
        },
        message: 'Section data must be an object',
      },
    },
    order: {
      type: Number,
      required: [true, 'Section order is required'],
      min: [0, 'Order must be at least 0'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const homeLayoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Layout name is required'],
      trim: true,
      maxlength: [100, 'Layout name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
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
    isActive: {
      type: Boolean,
      default: false,
      index: true,
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
      keywords: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for efficient queries
homeLayoutSchema.index({ isActive: 1, createdAt: -1 });
homeLayoutSchema.index({ createdAt: -1 });

/**
 * Pre-save middleware to ensure only one active layout
 */
homeLayoutSchema.pre('save', async function (next) {
  if (this.isActive && this.isModified('isActive')) {
    // Deactivate all other layouts
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { $set: { isActive: false } }
    );
  }
  next();
});

/**
 * Static method: Get the active homepage layout
 */
homeLayoutSchema.statics.getActiveLayout = async function () {
  return this.findOne({ isActive: true }).select('-__v');
};

/**
 * Static method: Set a layout as active (deactivates others)
 */
homeLayoutSchema.statics.setActiveLayout = async function (layoutId) {
  // Deactivate all layouts first
  await this.updateMany({}, { $set: { isActive: false } });
  
  // Activate the specified layout
  const layout = await this.findByIdAndUpdate(
    layoutId,
    { $set: { isActive: true } },
    { new: true, runValidators: true }
  );
  
  return layout;
};

/**
 * Instance method: Validate section data based on type
 */
homeLayoutSchema.methods.validateSectionData = function (section) {
  const { type, data } = section;

  switch (type) {
    case 'hero':
      // Hero section should have title, subtitle, image, cta
      return (
        data.title &&
        typeof data.title === 'string' &&
        data.title.length > 0 &&
        data.title.length <= 200
      );

    case 'features':
      // Features section should have an array of features
      return (
        Array.isArray(data.features) &&
        data.features.every(
          (f) =>
            f.title &&
            typeof f.title === 'string' &&
            f.description &&
            typeof f.description === 'string'
        )
      );

    case 'tours':
      // Tours section can have filter options
      return (
        !data.limit || (typeof data.limit === 'number' && data.limit > 0 && data.limit <= 20)
      );

    case 'testimonials':
      // Testimonials section should have an array of testimonials
      return (
        Array.isArray(data.testimonials) &&
        data.testimonials.every(
          (t) =>
            t.name &&
            typeof t.name === 'string' &&
            t.text &&
            typeof t.text === 'string'
        )
      );

    case 'cta':
      // CTA section should have title and button
      return (
        data.title &&
        typeof data.title === 'string' &&
        data.buttonText &&
        typeof data.buttonText === 'string'
      );

    case 'stats':
      // Stats section should have an array of stat items
      return (
        Array.isArray(data.stats) &&
        data.stats.every(
          (s) =>
            s.label &&
            typeof s.label === 'string' &&
            (typeof s.value === 'string' || typeof s.value === 'number')
        )
      );

    case 'gallery':
      // Gallery section should have an array of images
      return Array.isArray(data.images) && data.images.every((img) => typeof img === 'string');

    case 'text':
      // Text section should have content
      return data.content && typeof data.content === 'string' && data.content.length > 0;

    case 'faq':
      // FAQ section should have an array of questions/answers
      return (
        Array.isArray(data.faqs) &&
        data.faqs.every(
          (faq) =>
            faq.question &&
            typeof faq.question === 'string' &&
            faq.answer &&
            typeof faq.answer === 'string'
        )
      );

    default:
      return true; // Unknown types pass validation by default
  }
};

const HomeLayout = mongoose.models.HomeLayout || mongoose.model('HomeLayout', homeLayoutSchema);
export default HomeLayout;
