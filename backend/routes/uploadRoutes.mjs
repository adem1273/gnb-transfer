/**
 * Upload Routes - Image upload endpoints
 *
 * @module routes/uploadRoutes
 * @description Secure admin-only image upload to Cloudinary
 *
 * Endpoints:
 * - POST /api/v1/upload/image - Upload single image (admin only)
 *
 * Security:
 * - Admin authentication required
 * - File type validation (JPEG, PNG, WebP only)
 * - File size limit (2MB max)
 * - Cloudinary secure upload
 */

import express from 'express';
import { requireAuth } from '../middlewares/auth.mjs';
import { requireAdmin } from '../middlewares/adminGuard.mjs';
import { uploadImage, handleUploadError } from '../middlewares/upload.mjs';
import { logAdminAction } from '../middlewares/adminLogger.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * @route   POST /api/v1/upload/image
 * @desc    Upload single image to Cloudinary
 * @access  Private (Admin only)
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - Field: image (file)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Image uploaded successfully",
 *   data: { url: "https://res.cloudinary.com/..." }
 * }
 *
 * Validation:
 * - File type: image/jpeg, image/png, image/webp
 * - File size: max 2MB
 * - Authentication: admin role required
 */
router.post(
  '/image',
  requireAuth(),
  requireAdmin,
  logAdminAction('Image Upload'),
  uploadImage.single('image'),
  handleUploadError,
  async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.apiError('No image file provided', 400);
      }

      // Cloudinary URL is available in req.file.path
      const imageUrl = req.file.path;

      logger.info('✅ Image uploaded successfully', {
        userId: req.user.id,
        url: imageUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      return res.apiSuccess({ url: imageUrl }, 'Image uploaded successfully', 201);
    } catch (error) {
      logger.error('❌ Image upload failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });
      return res.apiError('Failed to upload image', 500);
    }
  }
);

export default router;
