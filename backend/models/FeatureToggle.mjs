import mongoose from 'mongoose';

/**
 * FeatureToggle Model
 * 
 * Stores feature toggle configurations for the admin panel
 * Allows dynamic enabling/disabling of features without code deployment
 */
const featureToggleSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    route: {
      type: String,
      trim: true,
    },
    component: {
      type: String,
      trim: true,
    },
    api: {
      type: String,
      trim: true,
    },
    permission: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
featureToggleSchema.index({ id: 1, enabled: 1 });

// Static method to check if a feature is enabled
featureToggleSchema.statics.isEnabled = async function (featureId) {
  const feature = await this.findOne({ id: featureId });
  return feature ? feature.enabled : false;
};

// Static method to get all enabled features
featureToggleSchema.statics.getEnabledFeatures = async function () {
  return this.find({ enabled: true }).lean();
};

// Static method to initialize default features
featureToggleSchema.statics.initializeFeatures = async function (features) {
  const operations = features.map((feature) => ({
    updateOne: {
      filter: { id: feature.id },
      update: { $setOnInsert: feature },
      upsert: true,
    },
  }));
  
  if (operations.length > 0) {
    await this.bulkWrite(operations);
  }
};

const FeatureToggle = mongoose.model('FeatureToggle', featureToggleSchema);

export default FeatureToggle;
