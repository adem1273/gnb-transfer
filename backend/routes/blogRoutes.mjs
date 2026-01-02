/**
 * Blog Routes
 *
 * @module routes/blogRoutes
 * @description Endpoints for managing blog posts and SEO content
 */

import express from 'express';
import BlogPost from '../models/BlogPost.mjs';
import { requireAuth, optionalAuth } from '../middlewares/auth.mjs';
import logger from '../config/logger.mjs';
import { cacheResponse, clearCacheByTags } from '../middlewares/cacheMiddleware.mjs';

const router = express.Router();

/**
 * @route   GET /api/blog
 * @desc    Get all blog posts (published for public, all for admin) - Cached 1 hour
 * @access  Public / Private
 */
router.get('/', optionalAuth, cacheResponse(3600, { tags: ['blog', 'blog:list'] }), async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, language = 'en', tag } = req.query;
    const isAdmin = req.user && ['admin', 'manager'].includes(req.user.role);

    const filter = {};

    // Non-admin users only see published posts
    if (!isAdmin) {
      filter.status = 'published';
    } else if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (language) {
      filter.language = language;
    }

    if (tag) {
      filter.tags = tag.toLowerCase();
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const posts = await BlogPost.find(filter)
      .populate('author', 'name')
      .select('-content -translations.content')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await BlogPost.countDocuments(filter);

    return res.apiSuccess({
      posts,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    logger.error('Error fetching blog posts:', { error: error.message });
    return res.apiError('Failed to fetch posts', 500);
  }
});

/**
 * @route   GET /api/blog/categories
 * @desc    Get all blog categories with post counts - Cached 1 hour
 * @access  Public
 */
router.get('/categories', cacheResponse(3600, { tags: ['blog', 'blog:categories'] }), async (req, res) => {
  try {
    const categories = await BlogPost.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.apiSuccess({ categories });
  } catch (error) {
    logger.error('Error fetching categories:', { error: error.message });
    return res.apiError('Failed to fetch categories', 500);
  }
});

/**
 * @route   GET /api/blog/tags
 * @desc    Get all tags with post counts
 * @access  Public
 */
router.get('/tags', async (req, res) => {
  try {
    const tags = await BlogPost.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]);

    return res.apiSuccess({ tags });
  } catch (error) {
    logger.error('Error fetching tags:', { error: error.message });
    return res.apiError('Failed to fetch tags', 500);
  }
});

/**
 * @route   GET /api/blog/slug/:slug
 * @desc    Get blog post by slug
 * @access  Public
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const post = await BlogPost.getBySlug(req.params.slug);

    if (!post) {
      return res.apiError('Post not found', 404);
    }

    // Increment view count
    await BlogPost.incrementViews(post._id);

    return res.apiSuccess(post);
  } catch (error) {
    logger.error('Error fetching post by slug:', { error: error.message });
    return res.apiError('Failed to fetch post', 500);
  }
});

/**
 * @route   GET /api/blog/:id
 * @desc    Get blog post by ID
 * @access  Private (admin)
 */
router.get('/:id', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('author', 'name');

    if (!post) {
      return res.apiError('Post not found', 404);
    }

    return res.apiSuccess(post);
  } catch (error) {
    logger.error('Error fetching post:', { error: error.message });
    return res.apiError('Failed to fetch post', 500);
  }
});

/**
 * @route   POST /api/blog
 * @desc    Create new blog post
 * @access  Private (admin only)
 */
router.post('/', requireAuth(['admin']), async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      images,
      category,
      tags,
      status,
      seo,
      language,
      relatedPosts,
    } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.apiError('Title and content are required', 400);
    }

    // Generate slug if not provided
    const postSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 100);

    // Check if slug already exists
    const existing = await BlogPost.findOne({ slug: postSlug });
    if (existing) {
      return res.apiError('A post with this slug already exists', 400);
    }

    const post = await BlogPost.create({
      title,
      slug: postSlug,
      excerpt,
      content,
      featuredImage,
      images,
      category: category || 'general',
      tags: tags?.map((t) => t.toLowerCase()) || [],
      status: status || 'draft',
      seo,
      language: language || 'en',
      author: req.user.id,
      relatedPosts,
      publishedAt: status === 'published' ? new Date() : null,
    });

    return res.apiSuccess(post, 'Blog post created successfully');
  } catch (error) {
    logger.error('Error creating blog post:', { error: error.message });
    return res.apiError(error.message || 'Failed to create post', 500);
  }
});

/**
 * @route   PATCH /api/blog/:id
 * @desc    Update blog post
 * @access  Private (admin only)
 */
router.patch('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const allowedFields = [
      'title',
      'slug',
      'excerpt',
      'content',
      'featuredImage',
      'images',
      'category',
      'tags',
      'status',
      'seo',
      'language',
      'relatedPosts',
      'translations',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Lowercase tags
    if (updates.tags) {
      updates.tags = updates.tags.map((t) => t.toLowerCase());
    }

    // Set publishedAt if status changed to published
    if (updates.status === 'published') {
      const post = await BlogPost.findById(req.params.id);
      if (post && !post.publishedAt) {
        updates.publishedAt = new Date();
      }
    }

    updates.updatedBy = req.user.id;

    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('author', 'name');

    if (!post) {
      return res.apiError('Post not found', 404);
    }

    return res.apiSuccess(post, 'Post updated successfully');
  } catch (error) {
    logger.error('Error updating blog post:', { error: error.message });
    return res.apiError(error.message || 'Failed to update post', 500);
  }
});

/**
 * @route   DELETE /api/blog/:id
 * @desc    Delete blog post
 * @access  Private (admin only)
 */
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.apiError('Post not found', 404);
    }

    return res.apiSuccess(null, 'Post deleted successfully');
  } catch (error) {
    logger.error('Error deleting blog post:', { error: error.message });
    return res.apiError('Failed to delete post', 500);
  }
});

/**
 * @route   PATCH /api/blog/:id/publish
 * @desc    Publish or unpublish a blog post
 * @access  Private (admin only)
 */
router.patch('/:id/publish', requireAuth(['admin']), async (req, res) => {
  try {
    const { publish } = req.body;

    const updates = {
      status: publish ? 'published' : 'draft',
      updatedBy: req.user.id,
    };

    if (publish) {
      const post = await BlogPost.findById(req.params.id);
      if (!post.publishedAt) {
        updates.publishedAt = new Date();
      }
    }

    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    if (!post) {
      return res.apiError('Post not found', 404);
    }

    return res.apiSuccess(post, publish ? 'Post published' : 'Post unpublished');
  } catch (error) {
    logger.error('Error publishing post:', { error: error.message });
    return res.apiError('Failed to update post', 500);
  }
});

/**
 * @route   POST /api/blog/:id/translation
 * @desc    Add or update translation for a blog post
 * @access  Private (admin only)
 */
router.post('/:id/translation', requireAuth(['admin']), async (req, res) => {
  try {
    const { language, title, slug, excerpt, content } = req.body;

    if (!language || !title || !content) {
      return res.apiError('Language, title, and content are required', 400);
    }

    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.apiError('Post not found', 404);
    }

    // Check if translation exists
    const existingIndex = post.translations.findIndex((t) => t.language === language);

    if (existingIndex >= 0) {
      // Update existing translation
      post.translations[existingIndex] = { language, title, slug, excerpt, content };
    } else {
      // Add new translation
      post.translations.push({ language, title, slug, excerpt, content });
    }

    await post.save();

    return res.apiSuccess(post, 'Translation saved');
  } catch (error) {
    logger.error('Error saving translation:', { error: error.message });
    return res.apiError('Failed to save translation', 500);
  }
});

/**
 * @route   GET /api/blog/sitemap
 * @desc    Get all published posts for sitemap generation
 * @access  Public
 */
router.get('/sitemap/posts', async (req, res) => {
  try {
    const posts = await BlogPost.find({ status: 'published' })
      .select('slug updatedAt language')
      .sort({ publishedAt: -1 });

    return res.apiSuccess({ posts });
  } catch (error) {
    logger.error('Error fetching sitemap posts:', { error: error.message });
    return res.apiError('Failed to fetch posts', 500);
  }
});

export default router;
