/**
 * Blog Routes
 *
 * @module routes/blogRoutes
 * @description API endpoints for blog post management
 */

import express from 'express';
import BlogPost, { SUPPORTED_LANGUAGES } from '../models/BlogPost.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * @route GET /api/blogs
 * @description Get all published blog posts with pagination
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, lang = 'tr' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = { status: 'published' };
    if (category) query.category = category;

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .sort({ priority: -1, publishedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-__v')
        .lean(),
      BlogPost.countDocuments(query),
    ]);

    // Transform posts to return only requested language translation
    const transformedPosts = posts.map((post) => ({
      _id: post._id,
      title: post.translations?.[lang]?.title || post.translations?.tr?.title,
      slug: post.translations?.[lang]?.slug || post.translations?.tr?.slug,
      excerpt: post.translations?.[lang]?.excerpt || post.translations?.tr?.excerpt,
      metaTitle: post.translations?.[lang]?.metaTitle || post.translations?.tr?.metaTitle,
      metaDescription:
        post.translations?.[lang]?.metaDescription || post.translations?.tr?.metaDescription,
      readingTime: post.translations?.[lang]?.readingTime || post.translations?.tr?.readingTime,
      featuredImage: post.featuredImage,
      category: post.category,
      tags: post.tags?.[lang] || post.tags?.tr || [],
      author: post.author,
      authorAvatar: post.authorAvatar,
      publishedAt: post.publishedAt,
      views: post.views,
      createdAt: post.createdAt,
    }));

    return res.apiSuccess({
      posts: transformedPosts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total,
      },
    });
  } catch (error) {
    logger.error('Error fetching blog posts:', { error: error.message });
    return res.apiError('Failed to fetch blog posts', 500);
  }
});

/**
 * @route GET /api/blogs/categories
 * @description Get all blog categories
 * @access Public
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'transfer-prices', name: { tr: 'Transfer Fiyatları', en: 'Transfer Prices' } },
      { id: 'destinations', name: { tr: 'Destinasyonlar', en: 'Destinations' } },
      { id: 'services', name: { tr: 'Hizmetler', en: 'Services' } },
      { id: 'tips', name: { tr: 'Seyahat İpuçları', en: 'Travel Tips' } },
      { id: 'news', name: { tr: 'Haberler', en: 'News' } },
      { id: 'promotions', name: { tr: 'Kampanyalar', en: 'Promotions' } },
      { id: 'seasonal', name: { tr: 'Sezonluk', en: 'Seasonal' } },
    ];

    const categoryCounts = await BlogPost.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = categoryCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const result = categories.map((cat) => ({
      ...cat,
      count: countMap[cat.id] || 0,
    }));

    return res.apiSuccess({ categories: result });
  } catch (error) {
    logger.error('Error fetching categories:', { error: error.message });
    return res.apiError('Failed to fetch categories', 500);
  }
});

/**
 * @route GET /api/blogs/slug/:slug
 * @description Get a single blog post by slug
 * @access Public
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { lang = 'tr' } = req.query;

    const post = await BlogPost.findBySlug(slug, lang);

    if (!post) {
      return res.apiError('Blog post not found', 404);
    }

    // Increment view count
    await BlogPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } });

    // Get related posts
    const relatedPosts = await BlogPost.find({
      _id: { $ne: post._id },
      category: post.category,
      status: 'published',
    })
      .limit(3)
      .select('translations featuredImage publishedAt')
      .lean();

    const translation = post.translations?.[lang] || post.translations?.tr;

    return res.apiSuccess({
      post: {
        _id: post._id,
        title: translation?.title,
        slug: translation?.slug,
        content: translation?.content,
        excerpt: translation?.excerpt,
        metaTitle: translation?.metaTitle,
        metaDescription: translation?.metaDescription,
        readingTime: translation?.readingTime,
        featuredImage: post.featuredImage,
        images: post.images,
        category: post.category,
        tags: post.tags?.[lang] || post.tags?.tr || [],
        author: post.author,
        authorAvatar: post.authorAvatar,
        ctas: post.ctas,
        internalLinks: post.internalLinks,
        pricingInfo: post.pricingInfo,
        whatsappNumber: post.whatsappNumber,
        publishedAt: post.publishedAt,
        views: post.views + 1,
        shares: post.shares,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        // All translations for language switcher
        availableLanguages: SUPPORTED_LANGUAGES.filter(
          (l) => post.translations?.[l]?.title
        ),
        translations: post.translations,
      },
      relatedPosts: relatedPosts.map((p) => ({
        _id: p._id,
        title: p.translations?.[lang]?.title || p.translations?.tr?.title,
        slug: p.translations?.[lang]?.slug || p.translations?.tr?.slug,
        featuredImage: p.featuredImage,
        publishedAt: p.publishedAt,
      })),
    });
  } catch (error) {
    logger.error('Error fetching blog post:', { error: error.message });
    return res.apiError('Failed to fetch blog post', 500);
  }
});

/**
 * @route GET /api/blogs/:id
 * @description Get a single blog post by ID (admin use)
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await BlogPost.findById(id).lean();

    if (!post) {
      return res.apiError('Blog post not found', 404);
    }

    return res.apiSuccess({ post });
  } catch (error) {
    logger.error('Error fetching blog post by ID:', { error: error.message });
    return res.apiError('Failed to fetch blog post', 500);
  }
});

/**
 * @route POST /api/blogs
 * @description Create a new blog post
 * @access Admin only
 */
router.post('/', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const postData = req.body;

    // Validate required fields
    if (!postData.translations?.tr?.title || !postData.translations?.tr?.content) {
      return res.apiError('Turkish title and content are required', 400);
    }

    if (!postData.featuredImage) {
      return res.apiError('Featured image is required', 400);
    }

    const newPost = new BlogPost(postData);
    await newPost.save();

    logger.info('Blog post created:', { postId: newPost._id, user: req.user?.email });
    return res.apiSuccess({ post: newPost }, 'Blog post created successfully', 201);
  } catch (error) {
    logger.error('Error creating blog post:', { error: error.message });
    return res.apiError('Failed to create blog post', 500);
  }
});

/**
 * @route PUT /api/blogs/:id
 * @description Update a blog post
 * @access Admin only
 */
router.put('/:id', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const post = await BlogPost.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!post) {
      return res.apiError('Blog post not found', 404);
    }

    logger.info('Blog post updated:', { postId: id, user: req.user?.email });
    return res.apiSuccess({ post }, 'Blog post updated successfully');
  } catch (error) {
    logger.error('Error updating blog post:', { error: error.message });
    return res.apiError('Failed to update blog post', 500);
  }
});

/**
 * @route DELETE /api/blogs/:id
 * @description Delete a blog post
 * @access Admin only
 */
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const post = await BlogPost.findByIdAndDelete(id);

    if (!post) {
      return res.apiError('Blog post not found', 404);
    }

    logger.info('Blog post deleted:', { postId: id, user: req.user?.email });
    return res.apiSuccess(null, 'Blog post deleted successfully');
  } catch (error) {
    logger.error('Error deleting blog post:', { error: error.message });
    return res.apiError('Failed to delete blog post', 500);
  }
});

/**
 * @route GET /api/blogs/admin/all
 * @description Get all blog posts for admin (including drafts)
 * @access Admin only
 */
router.get('/admin/all', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const [posts, total] = await Promise.all([
      BlogPost.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      BlogPost.countDocuments(query),
    ]);

    return res.apiSuccess({
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching admin blog posts:', { error: error.message });
    return res.apiError('Failed to fetch blog posts', 500);
  }
});

/**
 * @route POST /api/blogs/:id/share
 * @description Increment share count
 * @access Public
 */
router.post('/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;

    await BlogPost.findByIdAndUpdate(id, { $inc: { shares: 1 } });

    logger.info('Blog post shared:', { postId: id, platform });
    return res.apiSuccess(null, 'Share recorded');
  } catch (error) {
    return res.apiError('Failed to record share', 500);
  }
});

/**
 * @route GET /api/blogs/feed/rss
 * @description Get RSS feed for blog posts
 * @access Public
 */
router.get('/feed/rss', async (req, res) => {
  try {
    const { lang = 'tr' } = req.query;
    const siteUrl = process.env.SITE_URL || 'https://gnbtransfer.com';

    const posts = await BlogPost.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(50)
      .lean();

    const items = posts
      .map((post) => {
        const translation = post.translations?.[lang] || post.translations?.tr;
        if (!translation) return null;

        return `
    <item>
      <title><![CDATA[${translation.title}]]></title>
      <link>${siteUrl}/${lang}/blog/${translation.slug}</link>
      <description><![CDATA[${translation.excerpt || translation.metaDescription || ''}]]></description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <guid>${siteUrl}/${lang}/blog/${translation.slug}</guid>
      <category>${post.category}</category>
    </item>`;
      })
      .filter(Boolean)
      .join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>GNB Transfer Blog</title>
    <link>${siteUrl}/blog</link>
    <description>VIP Transfer ve Turizm Haberleri - GNB Transfer</description>
    <language>${lang}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/blogs/feed/rss?lang=${lang}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/rss+xml');
    return res.send(rss);
  } catch (error) {
    logger.error('Error generating RSS feed:', { error: error.message });
    return res.apiError('Failed to generate RSS feed', 500);
  }
});

export default router;
