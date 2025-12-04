/**
 * FAQ Bot Routes
 *
 * @module routes/faqRoutes
 * @description FAQ bot endpoints for customer support
 */

import express from 'express';
import { findAnswer, getFAQSuggestions, getCategories } from '../services/faqBotService.mjs';

const router = express.Router();

/**
 * @route   POST /api/faq/ask
 * @desc    Ask FAQ bot a question
 * @access  Public
 */
router.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      return res.apiError('Question is required', 400);
    }

    const result = findAnswer(question);

    return res.apiSuccess(result);
  } catch (error) {
    console.error('Error processing FAQ question:', error);
    return res.apiError('Failed to process question', 500);
  }
});

/**
 * @route   GET /api/faq/suggestions
 * @desc    Get FAQ suggestions
 * @access  Public
 */
router.get('/suggestions', (req, res) => {
  try {
    const { category } = req.query;

    const suggestions = getFAQSuggestions(category);

    return res.apiSuccess({ suggestions });
  } catch (error) {
    console.error('Error fetching FAQ suggestions:', error);
    return res.apiError('Failed to fetch suggestions', 500);
  }
});

/**
 * @route   GET /api/faq/categories
 * @desc    Get all FAQ categories
 * @access  Public
 */
router.get('/categories', (req, res) => {
  try {
    const categories = getCategories();

    return res.apiSuccess({ categories });
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    return res.apiError('Failed to fetch categories', 500);
  }
});

export default router;
