/**
 * Media Routes - Admin media management endpoints
 *
 * @module routes/mediaRoutes
 * @description Secure admin media upload, list, and delete endpoints
 *
 * Endpoints:
 * - POST /api/admin/media/upload - Upload media file (admin only)
 * - GET /api/admin/media - List all media files (admin, manager)
 * - DELETE /api/admin/media/:id - Delete media file (admin only, usage count check)
 *
 * Security:
 * - Admin/manager authentication required
 * - Role-based access control
 * - File type and size validation
 * - Usage count enforcement for deletion
 * - Admin action logging
 */

import express from 'express';
import Media from '../models/Media.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { requirePermission } from '../config/permissions.mjs';
import { createAdminLog } from '../middlewares/adminLogger.mjs';
import {
  uploadMedia,
  validateSingleMediaUpload,
  handleMediaUploadError,
  getStoragePath,
  deleteMediaFile,
} from '../middlewares/mediaUpload.mjs';
import logger from '../config/logger.mjs';
import { PAGINATION } from '../constants/limits.mjs';

const router = express.Router();

/**
 * @route   POST /api/admin/media/upload
 * @desc    Upload media file
 * @access  Private (Admin only)
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - Field: file (file)
 *
 * Response:
 * {
 *   success: true,
 *   message: "File uploaded successfully",
 *   data: { id, filename, url, ... }
 * }
 *
 * Validation:
 * - File type: images (JPEG, PNG, WebP, GIF) or documents (PDF, DOC, DOCX)
 * - File size: max 10MB
 * - Authentication: admin role required
 */
router.post(
  '/upload',
  requireAuth(),
  requirePermission('media.upload'),
  validateSingleMediaUpload,
  uploadMedia.single('file'),
  handleMediaUploadError,
  async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.apiError('No file provided', 400);
      }

      // Get relative storage path
      const storagePath = getStoragePath(req.file);

      // Create media record in database
      const media = await Media.create({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        storagePath: storagePath,
        uploadedBy: req.user.id,
      });

      // Log admin action
      await createAdminLog({
        action: 'CREATE',
        user: req.user,
        target: {
          type: 'Media',
          id: media._id,
          name: media.originalName,
        },
        metadata: {
          filename: media.filename,
          mimeType: media.mimeType,
          size: media.size,
          storagePath: media.storagePath,
        },
        req,
      });

      logger.info('✅ Media file uploaded successfully', {
        userId: req.user.id,
        mediaId: media._id,
        filename: media.filename,
        size: media.size,
      });

      return res.apiSuccess(
        {
          id: media._id,
          filename: media.filename,
          originalName: media.originalName,
          mimeType: media.mimeType,
          size: media.size,
          url: media.url,
          usageCount: media.usageCount,
          createdAt: media.createdAt,
        },
        'File uploaded successfully',
        201
      );
    } catch (error) {
      logger.error('❌ Media upload failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });
      return res.apiError('Failed to upload file', 500);
    }
  }
);

/**
 * @route   GET /api/admin/media
 * @desc    Get list of all media files
 * @access  Private (Admin, Manager)
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - mimeType: Filter by MIME type
 * - search: Search in original filename
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     media: [...],
 *     pagination: { currentPage, totalPages, totalItems, hasMore }
 *   }
 * }
 */
router.get('/', requireAuth(), requirePermission('media.view'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(
      parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    // Build query filters
    const query = {};
    
    if (req.query.mimeType) {
      query.mimeType = req.query.mimeType;
    }
    
    if (req.query.search) {
      query.originalName = { $regex: req.query.search, $options: 'i' };
    }

    // Get total count for pagination
    const totalItems = await Media.countDocuments(query);

    // Get media files with pagination and populate uploader info
    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name email')
      .lean();

    const totalPages = Math.ceil(totalItems / limit);

    return res.apiSuccess(
      {
        media: media.map((m) => ({
          id: m._id,
          filename: m.filename,
          originalName: m.originalName,
          mimeType: m.mimeType,
          size: m.size,
          url: `/uploads/${m.storagePath}`,
          usageCount: m.usageCount,
          uploadedBy: m.uploadedBy,
          createdAt: m.createdAt,
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          hasMore: page < totalPages,
          limit,
        },
      },
      'Media files retrieved successfully'
    );
  } catch (error) {
    logger.error('❌ Failed to retrieve media files', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    return res.apiError('Failed to retrieve media files', 500);
  }
});

/**
 * @route   DELETE /api/admin/media/:id
 * @desc    Delete media file
 * @access  Private (Admin only)
 *
 * Validation:
 * - Media must exist
 * - Usage count must be 0
 * - Admin permission required
 *
 * Response:
 * {
 *   success: true,
 *   message: "Media deleted successfully"
 * }
 */
router.delete('/:id', requireAuth(), requirePermission('media.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // Find media file
    const media = await Media.findById(id);
    if (!media) {
      return res.apiError('Media file not found', 404);
    }

    // Check if media can be deleted (usage count must be 0)
    if (!media.canDelete()) {
      return res.apiError(
        `Cannot delete media file. It is currently in use (usage count: ${media.usageCount})`,
        400
      );
    }

    // Delete file from storage
    try {
      await deleteMediaFile(media.storagePath);
    } catch (fileError) {
      logger.error('Failed to delete file from storage, but continuing with DB deletion', {
        error: fileError.message,
        mediaId: media._id,
      });
      // Continue with DB deletion even if file deletion fails
    }

    // Delete from database
    await Media.findByIdAndDelete(id);

    // Log admin action
    await createAdminLog({
      action: 'DELETE',
      user: req.user,
      target: {
        type: 'Media',
        id: media._id,
        name: media.originalName,
      },
      metadata: {
        filename: media.filename,
        storagePath: media.storagePath,
        usageCount: media.usageCount,
      },
      req,
    });

    logger.info('✅ Media file deleted successfully', {
      userId: req.user.id,
      mediaId: media._id,
      filename: media.filename,
    });

    return res.apiSuccess(null, 'Media deleted successfully');
  } catch (error) {
    logger.error('❌ Failed to delete media file', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      mediaId: req.params.id,
    });
    return res.apiError('Failed to delete media file', 500);
  }
});

export default router;
