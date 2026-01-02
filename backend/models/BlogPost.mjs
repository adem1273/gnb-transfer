/**
 * BlogPost Model
 *
 * @module models/BlogPost
 * @description Blog posts for SEO and content marketing
 */

import mongoose from 'mongoose';
import { invalidateTag } from '../utils/cache.mjs';
import logger from '../config/logger.mjs';

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    featuredImage: {
      type: String,
      trim: true,
    },
    images: [
      {
        url: String,
        alt: String,
        caption: String,
      },
    ],
    category: {
      type: String,
      enum: ['travel', 'tips', 'news', 'destinations', 'services', 'general'],
      default: 'general',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // SEO fields
    seo: {
      metaTitle: {
        type: String,
        maxlength: [70, 'Meta title cannot exceed 70 characters'],
      },
      metaDescription: {
        type: String,
        maxlength: [160, 'Meta description cannot exceed 160 characters'],
      },
      focusKeyword: {
        type: String,
        trim: true,
      },
      canonicalUrl: {
        type: String,
        trim: true,
      },
      noIndex: {
        type: Boolean,
        default: false,
      },
    },
    // Engagement metrics
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    shares: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Related content
    relatedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BlogPost',
      },
    ],
    // Multi-language support
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'tr', 'ar', 'ru', 'de', 'fr', 'es', 'zh', 'fa'],
    },
    translations: [
      {
        language: String,
        title: String,
        slug: String,
        excerpt: String,
        content: String,
      },
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
blogPostSchema.index({ slug: 1 }, { unique: true });
blogPostSchema.index({ status: 1, publishedAt: -1 }); // Published posts chronologically
blogPostSchema.index({ category: 1, status: 1, publishedAt: -1 }); // Category browsing
blogPostSchema.index({ language: 1, status: 1, publishedAt: -1 }); // Multi-language support
blogPostSchema.index({ tags: 1, status: 1 }); // Tag filtering
blogPostSchema.index({ author: 1, status: 1 }); // Author posts
blogPostSchema.index({ 'seo.focusKeyword': 1 }); // SEO queries
blogPostSchema.index({ createdAt: -1 }); // Recent posts (all statuses)

// Text index for search functionality
blogPostSchema.index({ title: 'text', excerpt: 'text', 'seo.metaTitle': 'text' });

// Pre-save hook to generate slug
blogPostSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }

  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

// Virtual for reading time
blogPostSchema.virtual('readingTime').get(function () {
  if (!this.content) return 0;
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Static method to get published posts
blogPostSchema.statics.getPublishedPosts = function (options = {}) {
  const { page = 1, limit = 10, category, language = 'en' } = options;
  const skip = (page - 1) * limit;

  const query = { status: 'published', language };
  if (category) {
    query.category = category;
  }

  return this.find(query)
    .populate('author', 'name')
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get post by slug
blogPostSchema.statics.getBySlug = function (slug) {
  return this.findOne({ slug, status: 'published' }).populate('author', 'name').populate('relatedPosts', 'title slug featuredImage');
};

// Static method to increment views
blogPostSchema.statics.incrementViews = function (postId) {
  return this.findByIdAndUpdate(postId, { $inc: { views: 1 } });
};

// Include virtuals
blogPostSchema.set('toJSON', { virtuals: true });
blogPostSchema.set('toObject', { virtuals: true });

// Cache invalidation hooks
blogPostSchema.post('save', async function(doc) {
  try {
    await invalidateTag('blog');
    logger.debug('Blog cache invalidated after save', { blogId: doc._id });
  } catch (error) {
    logger.error('Failed to invalidate blog cache', { error: error.message });
  }
});

blogPostSchema.post('findOneAndUpdate', async function(doc) {
  try {
    await invalidateTag('blog');
    logger.debug('Blog cache invalidated after update');
  } catch (error) {
    logger.error('Failed to invalidate blog cache', { error: error.message });
  }
});

blogPostSchema.post('findOneAndDelete', async function(doc) {
  try {
    await invalidateTag('blog');
    logger.debug('Blog cache invalidated after delete');
  } catch (error) {
    logger.error('Failed to invalidate blog cache', { error: error.message });
  }
});

blogPostSchema.post('deleteOne', async function() {
  try {
    await invalidateTag('blog');
    logger.debug('Blog cache invalidated after deleteOne');
  } catch (error) {
    logger.error('Failed to invalidate blog cache', { error: error.message });
  }
});

blogPostSchema.post('deleteMany', async function() {
  try {
    await invalidateTag('blog');
    logger.debug('Blog cache invalidated after deleteMany');
  } catch (error) {
    logger.error('Failed to invalidate blog cache', { error: error.message });
  }
});

const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', blogPostSchema);

export default BlogPost;
