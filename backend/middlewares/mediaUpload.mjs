/**
 * Media Upload Middleware - Multer + Local Storage
 *
 * @module middlewares/mediaUpload
 * @description Handles secure file uploads to local storage with validation
 *
 * Security features:
 * - Single file upload only (multiple files rejected)
 * - File type validation (images and PDFs)
 * - File size limit (10MB max)
 * - Unique filename generation with UUID
 * - Organized folder structure by upload date
 * - Clear error messages for all validation failures
 *
 * Storage structure:
 * - uploads/media/YYYY/MM/UUID-originalname.ext
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import logger from '../config/logger.mjs';

// Allowed file MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Ensure uploads directory exists
const ensureUploadDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created upload directory: ${dirPath}`);
  }
};

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organize files by year/month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uploadDir = path.join(process.cwd(), 'uploads', 'media', String(year), month);
    
    ensureUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: UUID-sanitized-originalname.ext
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Sanitize filename
      .substring(0, 50); // Limit length
    const uniqueName = `${randomUUID()}-${baseName}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter function - validates file type
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types: images (JPEG, PNG, WebP, GIF) and documents (PDF, DOC, DOCX). Received: ${file.mimetype}`
      ),
      false
    );
  }
};

// Create multer upload instance with validation
export const uploadMedia = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only allow 1 file per request
  },
});

/**
 * Middleware to validate single file upload
 * Ensures only one file is uploaded in the request
 */
export const validateSingleMediaUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  
  if (!contentType.includes('multipart/form-data')) {
    return res.apiError('Content-Type must be multipart/form-data for file uploads', 400);
  }
  
  next();
};

/**
 * Error handler middleware for multer errors
 */
export const handleMediaUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.apiError('File size exceeds the maximum limit of 10MB', 400);
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.apiError('Only one file can be uploaded at a time', 400);
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.apiError('Unexpected file field. Use "file" as the field name', 400);
    }
    return res.apiError(`Upload error: ${err.message}`, 400);
  }
  
  if (err) {
    logger.error('Media upload error:', { error: err.message, stack: err.stack });
    return res.apiError(err.message || 'Failed to upload file', 400);
  }
  
  next();
};

/**
 * Get relative storage path for database storage
 */
export const getStoragePath = (file) => {
  // Return path relative to uploads directory
  // e.g., media/2024/01/uuid-filename.jpg
  const uploadPath = path.join(process.cwd(), 'uploads');
  return path.relative(uploadPath, file.path);
};

/**
 * Delete file from storage
 */
export const deleteMediaFile = async (storagePath) => {
  try {
    const fullPath = path.join(process.cwd(), 'uploads', storagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info(`Deleted media file: ${storagePath}`);
      return true;
    }
    logger.warn(`Media file not found for deletion: ${storagePath}`);
    return false;
  } catch (error) {
    logger.error('Failed to delete media file:', { error: error.message, path: storagePath });
    throw error;
  }
};
