/**
 * Driver Routes
 * 
 * @module routes/driverRoutes
 * @description Driver management endpoints
 */

import express from 'express';
import Driver from '../models/Driver.mjs';
import Vehicle from '../models/Vehicle.mjs';
import User from '../models/User.mjs';
import { requireAuth } from '../middlewares/auth.mjs';

const router = express.Router();

/**
 * @route   GET /api/drivers
 * @desc    Get all drivers
 * @access  Private (admin, manager)
 */
router.get('/', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    // Validate and whitelist status values
    const validStatuses = ['active', 'inactive', 'on-duty', 'off-duty'];
    if (status && validStatuses.includes(status)) {
      filter.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const drivers = await Driver.find(filter)
      .populate('user', 'name email')
      .populate('vehicleAssigned', 'model brand plateNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Driver.countDocuments(filter);

    return res.apiSuccess({
      drivers,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return res.apiError('Failed to fetch drivers', 500);
  }
});

/**
 * @route   GET /api/drivers/:id
 * @desc    Get driver by ID
 * @access  Private (admin, manager)
 */
router.get('/:id', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('user', 'name email')
      .populate('vehicleAssigned');

    if (!driver) {
      return res.apiError('Driver not found', 404);
    }

    return res.apiSuccess(driver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    return res.apiError('Failed to fetch driver', 500);
  }
});

/**
 * @route   POST /api/drivers
 * @desc    Create new driver
 * @access  Private (admin only)
 */
router.post('/', requireAuth(['admin']), async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      licenseNumber,
      licenseExpiry,
      languages,
      status,
      vehicleAssigned,
      userId,
      availability,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !licenseNumber || !licenseExpiry || !userId) {
      return res.apiError('Missing required fields', 400);
    }

    // Check if user exists and has driver role
    // Validate userId format before querying
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.apiError('Invalid user ID format', 400);
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.apiError('User not found', 404);
    }

    // Check if driver with email or license already exists
    const existing = await Driver.findOne({
      $or: [{ email }, { licenseNumber }]
    });

    if (existing) {
      return res.apiError('Driver with this email or license number already exists', 400);
    }

    const driver = await Driver.create({
      name,
      email,
      phone,
      licenseNumber,
      licenseExpiry: new Date(licenseExpiry),
      languages: languages || ['en'],
      status: status || 'active',
      vehicleAssigned: vehicleAssigned || null,
      user: userId,
      availability: availability || {},
      notes: notes || ''
    });

    // Update user role to driver if not already
    if (user.role !== 'driver') {
      user.role = 'driver';
      await user.save();
    }

    return res.apiSuccess(driver, 'Driver created successfully');
  } catch (error) {
    console.error('Error creating driver:', error);
    return res.apiError(error.message || 'Failed to create driver', 500);
  }
});

/**
 * @route   PATCH /api/drivers/:id
 * @desc    Update driver
 * @access  Private (admin only)
 */
router.patch('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const allowedFields = [
      'name',
      'email',
      'phone',
      'licenseNumber',
      'licenseExpiry',
      'languages',
      'status',
      'vehicleAssigned',
      'availability',
      'notes',
      'rating'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('user', 'name email').populate('vehicleAssigned');

    if (!driver) {
      return res.apiError('Driver not found', 404);
    }

    return res.apiSuccess(driver, 'Driver updated successfully');
  } catch (error) {
    console.error('Error updating driver:', error);
    return res.apiError(error.message || 'Failed to update driver', 500);
  }
});

/**
 * @route   DELETE /api/drivers/:id
 * @desc    Delete driver
 * @access  Private (admin only)
 */
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);

    if (!driver) {
      return res.apiError('Driver not found', 404);
    }

    return res.apiSuccess(null, 'Driver deleted successfully');
  } catch (error) {
    console.error('Error deleting driver:', error);
    return res.apiError('Failed to delete driver', 500);
  }
});

/**
 * @route   POST /api/drivers/:id/assign-vehicle
 * @desc    Assign vehicle to driver
 * @access  Private (admin only)
 */
router.post('/:id/assign-vehicle', requireAuth(['admin']), async (req, res) => {
  try {
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.apiError('Vehicle ID is required', 400);
    }

    // Validate ObjectId format
    if (!vehicleId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.apiError('Invalid vehicle ID format', 400);
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.apiError('Vehicle not found', 404);
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.apiError('Driver not found', 404);
    }

    // Update driver's vehicle assignment
    driver.vehicleAssigned = vehicleId;
    await driver.save();

    // Update vehicle's current driver
    vehicle.currentDriver = driver._id;
    vehicle.status = 'in-use';
    await vehicle.save();

    return res.apiSuccess(
      { driver, vehicle },
      'Vehicle assigned to driver successfully'
    );
  } catch (error) {
    console.error('Error assigning vehicle:', error);
    return res.apiError('Failed to assign vehicle', 500);
  }
});

export default router;
