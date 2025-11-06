import express from 'express';
import Tour from '../models/Tour.mjs';
import { authMiddleware } from '../middlewares/auth.mjs';

const router = express.Router();

// GET /api/tours - Get all tours
router.get('/', async (req, res) => {
  try {
    const tours = await Tour.find({ available: true });
    res.apiSuccess(tours, 'Tours retrieved successfully');
  } catch (error) {
    res.apiError('Failed to retrieve tours', 500);
  }
});

// GET /api/tours/:id - Get tour by ID
router.get('/:id', async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.apiError('Tour not found', 404);
    }
    res.apiSuccess(tour, 'Tour retrieved successfully');
  } catch (error) {
    res.apiError('Failed to retrieve tour', 500);
  }
});

// POST /api/tours - Create new tour (protected, admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const tour = await Tour.create(req.body);
    res.apiSuccess(tour, 'Tour created successfully');
  } catch (error) {
    res.apiError('Failed to create tour', 500);
  }
});

export default router;
