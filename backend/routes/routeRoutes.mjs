/**
 * Route Routes
 *
 * @module routes/routeRoutes
 * @description Endpoints for route calculation and distance/duration using OpenRouteService
 */

import express from 'express';
import { getRouteSummary } from '../services/orsService.mjs';

export const routeRouter = express.Router();

/**
 * @route   POST /api/routes/summary
 * @desc    Get route summary (distance and duration) between two points
 * @access  Public
 */
routeRouter.post('/summary', async (req, res, next) => {
  try {
    const { from, to } = req.body;

    if (!from || !to || typeof from.lat !== 'number' || typeof from.lng !== 'number' ||
        typeof to.lat !== 'number' || typeof to.lng !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates. Both from and to must have lat and lng numbers.',
      });
    }

    const summary = await getRouteSummary(from, to);
    return res.json({ success: true, summary });
  } catch (e) {
    next(e);
  }
});
