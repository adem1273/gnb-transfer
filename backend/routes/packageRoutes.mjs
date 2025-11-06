/**
 * Package Routes
 * Routes for smart package creation and recommendations
 */

import express from 'express';
import {
  generateSmartPackage,
  generateGenericPackage,
  getPackageRecommendation
} from '../controllers/packageController.mjs';
import { requireAuth } from '../middlewares/auth.mjs';

const router = express.Router();

// Authenticated routes - personalized packages
router.post('/create', requireAuth(), generateSmartPackage);
router.get('/recommend/:tourId', requireAuth(), getPackageRecommendation);

// Public routes - generic packages for non-authenticated users
router.post('/generic', generateGenericPackage);

export default router;
