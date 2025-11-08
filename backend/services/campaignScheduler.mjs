import cron from 'node-cron';
import CampaignRule from '../models/CampaignRule.mjs';
import Tour from '../models/Tour.mjs';
import logger from '../config/logger.mjs';

/**
 * Campaign Scheduler Service
 *
 * @module services/campaignScheduler
 * @description Scheduled task to apply campaign rules to tours
 *
 * Features:
 * - Runs every hour to check and apply active campaigns
 * - Updates tour prices based on campaign rules
 * - Tracks application count for analytics
 */

/**
 * Apply campaign rules to tours
 */
const applyCampaignRules = async () => {
  try {
    const now = new Date();

    // Find active campaigns within date range
    const activeCampaigns = await CampaignRule.find({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (activeCampaigns.length === 0) {
      logger.info('No active campaigns to apply');
      return;
    }

    logger.info(`Processing ${activeCampaigns.length} active campaigns`);

    for (const campaign of activeCampaigns) {
      let query = {};

      // Build query based on condition type
      switch (campaign.conditionType) {
        case 'city':
          query = { location: new RegExp(campaign.target, 'i') };
          break;
        case 'tourType':
          query = { category: new RegExp(campaign.target, 'i') };
          break;
        case 'dayOfWeek':
          // This would require more complex logic with tour schedules
          // For now, skip this type
          continue;
        default:
          // Unknown condition type
          continue;
      }

      // Find matching tours
      const matchingTours = await Tour.find(query);

      if (matchingTours.length === 0) {
        continue;
      }

      // Apply discount to matching tours
      let updatedCount = 0;
      for (const tour of matchingTours) {
        const originalPrice = tour.price;
        const discountedPrice = originalPrice * (1 - campaign.discountRate / 100);

        // Store campaign info in tour metadata (if field exists)
        await Tour.updateOne(
          { _id: tour._id },
          {
            $set: {
              price: Math.round(discountedPrice * 100) / 100, // Round to 2 decimals
              discountInfo: {
                campaignId: campaign._id,
                campaignName: campaign.name,
                originalPrice,
                discountRate: campaign.discountRate,
                appliedAt: now,
              },
            },
          }
        );

        updatedCount++;
      }

      // Update applied count
      await CampaignRule.updateOne(
        { _id: campaign._id },
        { $inc: { appliedCount: updatedCount } }
      );

      logger.info(`Campaign "${campaign.name}" applied to ${updatedCount} tours`);
    }

    logger.info('Campaign rules applied successfully');
  } catch (error) {
    logger.error('Failed to apply campaign rules:', { error: error.message });
  }
};

/**
 * Initialize campaign scheduler
 * Runs every hour at minute 0
 */
export const initCampaignScheduler = () => {
  // Run immediately on startup
  applyCampaignRules();

  // Schedule to run every hour
  cron.schedule('0 * * * *', () => {
    logger.info('Running scheduled campaign rule check');
    applyCampaignRules();
  });

  logger.info('Campaign scheduler initialized');
};

export default { initCampaignScheduler, applyCampaignRules };
