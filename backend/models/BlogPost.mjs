/**
 * BlogPost model with full multilingual support (9 languages)
 *
 * @module models/BlogPost
 * @description Multilingual blog post model with SEO optimization
 */

import mongoose from 'mongoose';

// Supported languages: TR, EN, AR, RU, DE, FR, ES, ZH, FA
const SUPPORTED_LANGUAGES = ['tr', 'en', 'ar', 'ru', 'de', 'fr', 'es', 'zh', 'fa'];

// Translation schema for multilingual content
const translationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    metaTitle: { type: String, trim: true, maxlength: 70 },
    metaDescription: { type: String, trim: true, maxlength: 160 },
    excerpt: { type: String, trim: true, maxlength: 500 },
    content: { type: String, required: true },
    readingTime: { type: Number, default: 0 }, // in minutes
  },
  { _id: false }
);

// Image schema for blog images
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    caption: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
  },
  { _id: false }
);

// CTA (Call-to-Action) schema
const ctaSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    url: { type: String, required: true },
    style: { type: String, enum: ['primary', 'secondary', 'whatsapp'], default: 'primary' },
  },
  { _id: false }
);

const blogPostSchema = new mongoose.Schema(
  {
    // Translations for all 9 languages
    translations: {
      tr: translationSchema,
      en: translationSchema,
      ar: translationSchema,
      ru: translationSchema,
      de: translationSchema,
      fr: translationSchema,
      es: translationSchema,
      zh: translationSchema,
      fa: translationSchema,
    },

    // Common fields (not language-specific)
    author: {
      type: String,
      default: 'GNB Transfer',
      trim: true,
    },
    authorAvatar: {
      type: String,
      default: '/images/gnb-logo.png',
    },

    // Featured image
    featuredImage: {
      type: String,
      required: true,
    },

    // Additional images (6-10 per post)
    images: [imageSchema],

    // Category (for filtering)
    category: {
      type: String,
      required: true,
      enum: [
        'transfer-prices', // Fiyat içerikleri
        'destinations', // Destinasyon rehberleri
        'services', // Hizmet tanıtımları
        'tips', // Seyahat ipuçları
        'news', // Haberler
        'promotions', // Kampanyalar
        'seasonal', // Sezonluk içerikler
      ],
      default: 'services',
    },

    // Tags for each language (stored as object)
    tags: {
      tr: [{ type: String }],
      en: [{ type: String }],
      ar: [{ type: String }],
      ru: [{ type: String }],
      de: [{ type: String }],
      fr: [{ type: String }],
      es: [{ type: String }],
      zh: [{ type: String }],
      fa: [{ type: String }],
    },

    // CTAs for conversion
    ctas: [ctaSchema],

    // Internal links for SEO
    internalLinks: [
      {
        text: { type: String },
        url: { type: String },
      },
    ],

    // Pricing info (for display in posts)
    pricingInfo: {
      startingPrice: { type: Number, default: 75 },
      currency: { type: String, default: '$' },
      discountCode: { type: String, default: 'VIP2026' },
    },

    // WhatsApp number for contact
    whatsappNumber: {
      type: String,
      default: '+905551234567',
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },

    // Publishing dates
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // SEO & Analytics
    views: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },

    // Related posts
    relatedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BlogPost',
      },
    ],

    // Priority for ordering (higher = more important)
    priority: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
blogPostSchema.index({ 'translations.tr.slug': 1 }, { sparse: true });
blogPostSchema.index({ 'translations.en.slug': 1 }, { sparse: true });
blogPostSchema.index({ 'translations.ar.slug': 1 }, { sparse: true });
blogPostSchema.index({ 'translations.ru.slug': 1 }, { sparse: true });
blogPostSchema.index({ 'translations.de.slug': 1 }, { sparse: true });
blogPostSchema.index({ 'translations.fr.slug': 1 }, { sparse: true });
blogPostSchema.index({ 'translations.es.slug': 1 }, { sparse: true });
blogPostSchema.index({ 'translations.zh.slug': 1 }, { sparse: true });
blogPostSchema.index({ 'translations.fa.slug': 1 }, { sparse: true });

// Text index for search
blogPostSchema.index({
  'translations.tr.title': 'text',
  'translations.en.title': 'text',
  'translations.tr.content': 'text',
  'translations.en.content': 'text',
});

// Compound indexes
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1, status: 1 });

/**
 * Calculate reading time based on content length
 * Average reading speed: 200 words per minute
 */
blogPostSchema.methods.calculateReadingTime = function (lang = 'tr') {
  const content = this.translations?.[lang]?.content || '';
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / 200);
};

/**
 * Get translation by language with fallback to Turkish
 */
blogPostSchema.methods.getTranslation = function (lang = 'tr') {
  if (this.translations?.[lang]?.title) {
    return this.translations[lang];
  }
  // Fallback to Turkish
  return this.translations?.tr || null;
};

/**
 * Static method to find by slug and language
 */
blogPostSchema.statics.findBySlug = async function (slug, lang = 'tr') {
  const query = {};
  query[`translations.${lang}.slug`] = slug;
  query.status = 'published';

  const post = await this.findOne(query);
  if (post) return post;

  // Try to find in any language
  for (const supportedLang of SUPPORTED_LANGUAGES) {
    const fallbackQuery = {};
    fallbackQuery[`translations.${supportedLang}.slug`] = slug;
    fallbackQuery.status = 'published';
    const fallbackPost = await this.findOne(fallbackQuery);
    if (fallbackPost) return fallbackPost;
  }

  return null;
};

/**
 * Static method to get published posts with pagination
 */
blogPostSchema.statics.getPublished = function (options = {}) {
  const { page = 1, limit = 10, category, lang = 'tr' } = options;
  const skip = (page - 1) * limit;

  const query = { status: 'published' };
  if (category) query.category = category;

  return this.find(query)
    .sort({ priority: -1, publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-__v')
    .lean();
};

/**
 * Pre-save hook to calculate reading time for all languages
 */
blogPostSchema.pre('save', function (next) {
  for (const lang of SUPPORTED_LANGUAGES) {
    if (this.translations?.[lang]?.content) {
      const content = this.translations[lang].content;
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      this.translations[lang].readingTime = Math.ceil(wordCount / 200);
    }
  }
  next();
});

const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', blogPostSchema);

export default BlogPost;
export { SUPPORTED_LANGUAGES };
