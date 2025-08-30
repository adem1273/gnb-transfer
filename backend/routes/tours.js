const express = require('express');
const router = express.Router();
const Tour = require('../models/Tour');

// Get all tours
router.get('/', async (req, res) => {
  try {
    const tours = await Tour.find();
    res.json(tours);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get tour by ID
router.get('/:id', async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: 'Tour not found' });
    res.json(tour);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create new tour
router.post('/', async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json(newTour);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update tour
router.put('/:id', async (req, res) => {
  try {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTour);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete tour
router.delete('/:id', async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tour deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
