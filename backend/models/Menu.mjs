import mongoose from 'mongoose';

/**
 * Menu Model
 *
 * @module models/Menu
 * @description Mongoose model for dynamic menu/navigation management
 *
 * Features:
 * - Support for header and footer menus
 * - Menu items with flexible linking (page slugs or external URLs)
 * - Order-based sorting for menu items
 * - Active/inactive status for menus
 * - Timestamps for tracking
 */

const menuItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Menu item label is required'],
      trim: true,
      maxlength: [100, 'Label cannot exceed 100 characters'],
    },
    pageSlug: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          // Either pageSlug or externalUrl must be present, but not both
          if (!value && !this.externalUrl) {
            return false;
          }
          if (value && this.externalUrl) {
            return false;
          }
          return true;
        },
        message: 'Menu item must have either pageSlug or externalUrl, but not both',
      },
    },
    externalUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (value) {
          // Either pageSlug or externalUrl must be present, but not both
          if (!value && !this.pageSlug) {
            return false;
          }
          if (value && this.pageSlug) {
            return false;
          }
          // Basic URL validation if provided
          if (value) {
            try {
              new URL(value);
              return true;
            } catch {
              return false;
            }
          }
          return true;
        },
        message: 'External URL must be a valid URL',
      },
    },
    order: {
      type: Number,
      required: [true, 'Menu item order is required'],
      min: [0, 'Order must be a positive number'],
      default: 0,
    },
  },
  { _id: false }
);

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Menu name is required'],
      trim: true,
      maxlength: [100, 'Menu name cannot exceed 100 characters'],
    },
    location: {
      type: String,
      required: [true, 'Menu location is required'],
      enum: {
        values: ['header', 'footer'],
        message: 'Location must be either header or footer',
      },
      index: true,
    },
    items: {
      type: [menuItemSchema],
      default: [],
      validate: {
        validator: function (items) {
          return Array.isArray(items);
        },
        message: 'Items must be an array',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries by location and active status
menuSchema.index({ location: 1, isActive: 1 });

// Pre-save hook to sort items by order
menuSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    this.items.sort((a, b) => a.order - b.order);
  }
  next();
});

/**
 * Instance method: Check if menu is active
 */
menuSchema.methods.isMenuActive = function () {
  return this.isActive === true;
};

/**
 * Static method: Find active menus by location
 */
menuSchema.statics.findActiveByLocation = function (location) {
  return this.find({ location, isActive: true }).sort({ createdAt: -1 });
};

/**
 * Static method: Get sorted menu items
 */
menuSchema.methods.getSortedItems = function () {
  return this.items.sort((a, b) => a.order - b.order);
};

const Menu = mongoose.models.Menu || mongoose.model('Menu', menuSchema);
export default Menu;
