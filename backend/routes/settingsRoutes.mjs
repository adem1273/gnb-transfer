/**
 * Settings Routes
 *
 * @module routes/settingsRoutes
 * @description Global application settings endpoints
 */

import express from 'express';
import Settings from '../models/Settings.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import logger from '../config/logger.mjs';
import { cacheResponse, clearCacheByTags } from '../middlewares/cacheMiddleware.mjs';

const router = express.Router();

/**
 * @route   GET /api/admin/settings
 * @desc    Get global settings
 * @access  Private (admin only)
 */
router.get('/', requireAuth(['admin', 'superadmin']), async (req, res) => {
  try {
    const settings = await Settings.getGlobalSettings();
    return res.apiSuccess(settings, 'Settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching settings:', { error: error.message });
    return res.apiError('Failed to fetch settings', 500);
  }
});

/**
 * @route   GET /api/admin/settings/public
 * @desc    Get public settings (currency, pricing info for frontend) - Cached 1 hour
 * @access  Public
 */
router.get('/public', cacheResponse(3600, { tags: ['settings', 'settings:public'] }), async (req, res) => {
  try {
    const settings = await Settings.getGlobalSettings();

    // Return only public-safe settings
    const publicSettings = {
      company: {
        name: settings.company.name,
        logo: settings.company.logo,
      },
      currency: {
        default: settings.currency.default,
        supported: settings.currency.supported,
        exchangeRates: settings.currency.exchangeRates,
      },
      pricing: {
        taxRate: settings.pricing.taxRate,
        taxIncluded: settings.pricing.taxIncluded,
        minimumFare: settings.pricing.minimumFare,
      },
      loyalty: {
        enabled: settings.loyalty.enabled,
        pointsPerDollar: settings.loyalty.pointsPerDollar,
      },
    };

    return res.apiSuccess(publicSettings, 'Public settings retrieved');
  } catch (error) {
    logger.error('Error fetching public settings:', { error: error.message });
    return res.apiError('Failed to fetch settings', 500);
  }
});

/**
 * @route   PATCH /api/admin/settings
 * @desc    Update global settings
 * @access  Private (superadmin only)
 */
router.patch('/', requireAuth(['admin', 'superadmin']), clearCacheByTags(['settings']), async (req, res) => {
  try {
    const allowedSections = [
      'company',
      'currency',
      'pricing',
      'seasonalMultipliers',
      'loyalty',
      'notifications',
      'booking',
      'adPixels',
    ];

    const updates = {};
    for (const section of allowedSections) {
      if (req.body[section] !== undefined) {
        updates[section] = req.body[section];
      }
    }

    updates.updatedBy = req.user.id;

    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    logger.info('Settings updated', { updatedBy: req.user.id, sections: Object.keys(updates) });
    return res.apiSuccess(settings, 'Settings updated successfully');
  } catch (error) {
    logger.error('Error updating settings:', { error: error.message });
    return res.apiError(error.message || 'Failed to update settings', 500);
  }
});

/**
 * @route   POST /api/admin/settings/seasonal-multiplier
 * @desc    Add seasonal multiplier
 * @access  Private (admin only)
 */
router.post('/seasonal-multiplier', requireAuth(['admin', 'superadmin']), async (req, res) => {
  try {
    const { name, startDate, endDate, multiplier, active } = req.body;

    if (!name || !startDate || !endDate || !multiplier) {
      return res.apiError('Name, startDate, endDate, and multiplier are required', 400);
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      {
        $push: {
          seasonalMultipliers: {
            name,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            multiplier,
            active: active !== false,
          },
        },
        $set: { updatedBy: req.user.id },
      },
      { new: true, upsert: true }
    );

    return res.apiSuccess(settings.seasonalMultipliers, 'Seasonal multiplier added');
  } catch (error) {
    logger.error('Error adding seasonal multiplier:', { error: error.message });
    return res.apiError('Failed to add seasonal multiplier', 500);
  }
});

/**
 * @route   DELETE /api/admin/settings/seasonal-multiplier/:id
 * @desc    Remove seasonal multiplier
 * @access  Private (admin only)
 */
router.delete('/seasonal-multiplier/:id', requireAuth(['admin', 'superadmin']), async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      {
        $pull: { seasonalMultipliers: { _id: req.params.id } },
        $set: { updatedBy: req.user.id },
      },
      { new: true }
    );

    return res.apiSuccess(settings.seasonalMultipliers, 'Seasonal multiplier removed');
  } catch (error) {
    logger.error('Error removing seasonal multiplier:', { error: error.message });
    return res.apiError('Failed to remove seasonal multiplier', 500);
  }
});

/**
 * @route   PATCH /api/admin/settings/exchange-rates
 * @desc    Update exchange rates
 * @access  Private (admin only)
 */
router.patch('/exchange-rates', requireAuth(['admin', 'superadmin']), async (req, res) => {
  try {
    const { exchangeRates } = req.body;

    if (!Array.isArray(exchangeRates)) {
      return res.apiError('exchangeRates must be an array', 400);
    }

    // Validate each rate
    for (const rate of exchangeRates) {
      if (!rate.currency || typeof rate.rate !== 'number' || rate.rate <= 0) {
        return res.apiError('Each rate must have currency and positive rate', 400);
      }
    }

    // Update rates with current timestamp
    const updatedRates = exchangeRates.map((r) => ({
      currency: r.currency.toUpperCase(),
      rate: r.rate,
      updatedAt: new Date(),
    }));

    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      {
        $set: {
          'currency.exchangeRates': updatedRates,
          updatedBy: req.user.id,
        },
      },
      { new: true }
    );

    return res.apiSuccess(settings.currency.exchangeRates, 'Exchange rates updated');
  } catch (error) {
    logger.error('Error updating exchange rates:', { error: error.message });
    return res.apiError('Failed to update exchange rates', 500);
  }
});

/**
 * @route   GET /api/admin/settings/current-multiplier
 * @desc    Get current applicable seasonal multiplier
 * @access  Public
 */
router.get('/current-multiplier', async (req, res) => {
  try {
    const multiplier = await Settings.getCurrentSeasonalMultiplier();
    return res.apiSuccess({ multiplier }, 'Current multiplier retrieved');
  } catch (error) {
    logger.error('Error getting current multiplier:', { error: error.message });
    return res.apiError('Failed to get multiplier', 500);
  }
});

/**
 * @route   POST /api/admin/settings/convert-currency
 * @desc    Convert amount between currencies
 * @access  Public
 */
router.post('/convert-currency', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.apiError('amount, fromCurrency, and toCurrency are required', 400);
    }

    const convertedAmount = await Settings.convertCurrency(amount, fromCurrency, toCurrency);

    return res.apiSuccess(
      {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount,
        targetCurrency: toCurrency,
      },
      'Currency converted'
    );
  } catch (error) {
    logger.error('Error converting currency:', { error: error.message });
    return res.apiError('Failed to convert currency', 500);
  }
});

export default router;
