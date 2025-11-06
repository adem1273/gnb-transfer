/**
 * Package Routes
 * Routes for smart package recommendation feature
 */

import express from 'express';
import { requireAuth } from '../middlewares/auth.mjs';
import {
  recommendPackage,
  getMyRecommendation
} from '../controllers/packageController.mjs';

const router = express.Router();

/**
 * POST /api/packages/recommend
 * Generate smart package recommendation for a user
 */
router.post('/recommend', recommendPackage);

/**
 * GET /api/packages/my-recommendation
 * Get package recommendation for authenticated user
 * Requires authentication
 */
router.get('/my-recommendation', requireAuth, getMyRecommendation);

export default router;
