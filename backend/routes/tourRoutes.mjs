import express from 'express';
import Tour from '../models/Tour.mjs';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const tours = await Tour.find().limit(100);
    return res.apiSuccess(tours, 'Tours retrieved');
  } catch (err) {
    return res.apiError(err.message);
  }
});

export default router;
