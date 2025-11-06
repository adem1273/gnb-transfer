/**
 * Package Controller
 * Handles smart package creation and recommendations
 */

import { createSmartPackage, createGenericPackage } from '../services/aiService.mjs';

/**
 * POST /api/packages/create
 * Create a smart package for authenticated user
 */
export const generateSmartPackage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentTourId } = req.body;
    
    if (!userId) {
      return res.apiError('Authentication required', 401);
    }
    
    const result = await createSmartPackage(userId, currentTourId);
    return res.apiSuccess(result.package, 'Smart package created successfully');
  } catch (error) {
    console.error('Error generating smart package:', error);
    return res.apiError('Failed to generate smart package: ' + error.message, 500);
  }
};

/**
 * POST /api/packages/generic
 * Create a generic package (for unauthenticated users)
 */
export const generateGenericPackage = async (req, res) => {
  try {
    const { currentTourId } = req.body;
    
    const result = await createGenericPackage(currentTourId);
    return res.apiSuccess(result.package, 'Package created successfully');
  } catch (error) {
    console.error('Error generating generic package:', error);
    return res.apiError('Failed to generate package: ' + error.message, 500);
  }
};

/**
 * GET /api/packages/recommend/:tourId
 * Get package recommendation based on a specific tour
 */
export const getPackageRecommendation = async (req, res) => {
  try {
    const { tourId } = req.params;
    const userId = req.user?.id;
    
    let result;
    if (userId) {
      result = await createSmartPackage(userId, tourId);
    } else {
      result = await createGenericPackage(tourId);
    }
    
    return res.apiSuccess(result.package, 'Package recommendation generated successfully');
  } catch (error) {
    console.error('Error getting package recommendation:', error);
    return res.apiError('Failed to get package recommendation: ' + error.message, 500);
  }
};

export default {
  generateSmartPackage,
  generateGenericPackage,
  getPackageRecommendation
};
