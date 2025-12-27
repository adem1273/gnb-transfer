/**
 * Upload Middleware - Multer + Cloudinary integration
 *
 * @module middlewares/upload
 * @description Handles secure file uploads to Cloudinary with validation
 *
 * Security features:
 * - File type validation (only image/jpeg, image/png, image/webp)
 * - File size limit (2MB max)
 * - Cloudinary folder organization (gnb-transfer)
 * - Error handling for invalid files
 *
 * Usage:
 * - Use uploadImage.single('image') for single image upload
 * - Multer will attach file to req.file
 */

import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import logger from '../config/logger.mjs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    logger.warn('⚠️  Cloudinary configuration is incomplete. Image uploads will fail.');
    return false;
  }
  return true;
};

// Allowed image MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

// File filter function - validates file type
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only JPEG, PNG, and WebP images are allowed. Received: ${file.mimetype}`
      ),
      false
    );
  }
};

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gnb-transfer', // Cloudinary folder
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ quality: 'auto' }], // Auto quality optimization
  },
});

// Create multer upload instance with validation
export const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: imageFileFilter,
});

// Middleware to handle multer errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.apiError('File size exceeds 2MB limit', 400);
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.apiError('Unexpected field in upload', 400);
    }
    return res.apiError(`Upload error: ${err.message}`, 400);
  } else if (err) {
    // Other errors (including file filter errors)
    return res.apiError(err.message, 400);
  }
  next();
};

// Validate Cloudinary config on module load
validateCloudinaryConfig();

export default uploadImage;
