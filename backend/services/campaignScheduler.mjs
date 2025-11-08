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
export const applyCampaignRules = async () => {
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

    // Process campaigns with Promise.all to avoid sequential await
    await Promise.all(
      activeCampaigns.map(async (campaign) => {
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
          default:
            // Skip unsupported or unknown condition types
            return;
        }

        // Find matching tours
        const matchingTours = await Tour.find(query);

        if (matchingTours.length === 0) {
          return;
        }

        // Apply discount to matching tours using bulk update
        const updatePromises = matchingTours.map((tour) => {
          const originalPrice = tour.price;
          const discountedPrice = originalPrice * (1 - campaign.discountRate / 100);

          return Tour.updateOne(
            { _id: tour._id },
            {
              $set: {
                price: Math.round(discountedPrice * 100) / 100,
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
        });

        await Promise.all(updatePromises);

        // Update applied count
        await CampaignRule.updateOne(
          { _id: campaign._id },
          { $inc: { appliedCount: matchingTours.length } }
        );

        logger.info(`Campaign "${campaign.name}" applied to ${matchingTours.length} tours`);
      })
    );

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
