import express from 'express';
import { requireAuth } from '../middlewares/auth.mjs';
import { requirePermission } from '../config/permissions.mjs';
import { requireFeatureEnabled } from '../middlewares/featureToggle.mjs';
import Driver from '../models/Driver.mjs';
import Booking from '../models/Booking.mjs';

const router = express.Router();

/**
 * @route   GET /api/admin/fleet/live
 * @desc    Get live fleet location tracking data
 * @access  Private (requires view_fleet permission)
 */
router.get(
  '/live',
  requireAuth(),
  requirePermission('view_fleet'),
  requireFeatureEnabled('fleet_tracking'),
  async (req, res) => {
    try {
      // Get all active drivers with their current assignments
      const activeBookings = await Booking.find({
        status: { $in: ['confirmed', 'in_progress'] },
        pickupDate: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          $lte: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next 24 hours
        },
      })
        .populate('driver', 'name phone location status')
        .populate('tour', 'title')
        .lean();

      // Transform data for fleet tracking display
      const fleetLocations = activeBookings
        .filter((booking) => booking.driver)
        .map((booking) => ({
          bookingId: booking._id,
          driver: {
            id: booking.driver._id,
            name: booking.driver.name,
            phone: booking.driver.phone,
            status: booking.driver.status || 'available',
          },
          location: booking.driver.location || {
            type: 'Point',
            coordinates: [0, 0], // Default if no location
          },
          tour: {
            id: booking.tour?._id,
            title: booking.tour?.title,
          },
          pickup: {
            location: booking.pickupLocation,
            date: booking.pickupDate,
          },
          dropoff: {
            location: booking.dropoffLocation,
          },
          status: booking.status,
          lastUpdated: booking.updatedAt,
        }));

      // Get summary statistics
      const summary = {
        totalActive: fleetLocations.length,
        inProgress: fleetLocations.filter((f) => f.status === 'in_progress').length,
        confirmed: fleetLocations.filter((f) => f.status === 'confirmed').length,
      };

      return res.apiSuccess(
        {
          fleetLocation: fleetLocations,
          summary,
          timestamp: new Date().toISOString(),
        },
        'Fleet locations retrieved successfully'
      );
    } catch (error) {
      console.error('Error fetching fleet locations:', error);
      return res.apiError('Failed to fetch fleet locations', 500);
    }
  }
);

/**
 * @route   GET /api/admin/fleet/driver/:driverId
 * @desc    Get specific driver location and details
 * @access  Private (requires view_fleet permission)
 */
router.get(
  '/driver/:driverId',
  requireAuth(),
  requirePermission('view_fleet'),
  requireFeatureEnabled('fleet_tracking'),
  async (req, res) => {
    try {
      const { driverId } = req.params;

      const driver = await Driver.findById(driverId).lean();
      if (!driver) {
        return res.apiError('Driver not found', 404);
      }

      // Get driver's current bookings
      const currentBookings = await Booking.find({
        driver: driverId,
        status: { $in: ['confirmed', 'in_progress'] },
      })
        .populate('tour', 'title')
        .lean();

      return res.apiSuccess(
        {
          driver: {
            id: driver._id,
            name: driver.name,
            phone: driver.phone,
            status: driver.status,
            location: driver.location,
          },
          currentBookings: currentBookings.map((b) => ({
            id: b._id,
            tour: b.tour?.title,
            pickup: b.pickupLocation,
            dropoff: b.dropoffLocation,
            pickupDate: b.pickupDate,
            status: b.status,
          })),
        },
        'Driver details retrieved successfully'
      );
    } catch (error) {
      console.error('Error fetching driver details:', error);
      return res.apiError('Failed to fetch driver details', 500);
    }
  }
);

export default router;
