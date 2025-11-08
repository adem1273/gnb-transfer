/**
 * Vehicle Routes
 * 
 * @module routes/vehicleRoutes
 * @description Vehicle management endpoints
 */

import express from 'express';
import Vehicle from '../models/Vehicle.mjs';
import Driver from '../models/Driver.mjs';
import { requireAuth } from '../middlewares/auth.mjs';

const router = express.Router();

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles
 * @access  Private (admin, manager)
 */
router.get('/', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const vehicles = await Vehicle.find(filter)
      .populate('currentDriver', 'name email licenseNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Vehicle.countDocuments(filter);

    return res.apiSuccess({
      vehicles,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return res.apiError('Failed to fetch vehicles', 500);
  }
});

/**
 * @route   GET /api/vehicles/:id
 * @desc    Get vehicle by ID
 * @access  Private (admin, manager)
 */
router.get('/:id', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('currentDriver', 'name email phone licenseNumber');

    if (!vehicle) {
      return res.apiError('Vehicle not found', 404);
    }

    return res.apiSuccess(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return res.apiError('Failed to fetch vehicle', 500);
  }
});

/**
 * @route   POST /api/vehicles
 * @desc    Create new vehicle
 * @access  Private (admin only)
 */
router.post('/', requireAuth(['admin']), async (req, res) => {
  try {
    const {
      model,
      brand,
      year,
      plateNumber,
      color,
      type,
      capacity,
      status,
      features,
      mileage,
      insuranceExpiry,
      registrationExpiry,
      lastMaintenanceDate,
      nextMaintenanceDate,
      notes
    } = req.body;

    // Validate required fields
    if (!model || !brand || !year || !plateNumber || !color || !type || !capacity || !insuranceExpiry || !registrationExpiry) {
      return res.apiError('Missing required fields', 400);
    }

    // Check if vehicle with plate number already exists
    const existing = await Vehicle.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (existing) {
      return res.apiError('Vehicle with this plate number already exists', 400);
    }

    const vehicle = await Vehicle.create({
      model,
      brand,
      year,
      plateNumber: plateNumber.toUpperCase(),
      color,
      type,
      capacity,
      status: status || 'available',
      features: features || [],
      mileage: mileage || 0,
      insuranceExpiry: new Date(insuranceExpiry),
      registrationExpiry: new Date(registrationExpiry),
      lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : null,
      nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
      notes: notes || ''
    });

    return res.apiSuccess(vehicle, 'Vehicle created successfully');
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return res.apiError(error.message || 'Failed to create vehicle', 500);
  }
});

/**
 * @route   PATCH /api/vehicles/:id
 * @desc    Update vehicle
 * @access  Private (admin only)
 */
router.patch('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const allowedFields = [
      'model',
      'brand',
      'year',
      'plateNumber',
      'color',
      'type',
      'capacity',
      'status',
      'features',
      'mileage',
      'insuranceExpiry',
      'registrationExpiry',
      'lastMaintenanceDate',
      'nextMaintenanceDate',
      'notes',
      'images'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('currentDriver', 'name email');

    if (!vehicle) {
      return res.apiError('Vehicle not found', 404);
    }

    return res.apiSuccess(vehicle, 'Vehicle updated successfully');
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return res.apiError(error.message || 'Failed to update vehicle', 500);
  }
});

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Delete vehicle
 * @access  Private (admin only)
 */
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.apiError('Vehicle not found', 404);
    }

    // If vehicle is assigned to a driver, unassign it first
    if (vehicle.currentDriver) {
      await Driver.findByIdAndUpdate(vehicle.currentDriver, {
        $set: { vehicleAssigned: null }
      });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    return res.apiSuccess(null, 'Vehicle deleted successfully');
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return res.apiError('Failed to delete vehicle', 500);
  }
});

/**
 * @route   GET /api/vehicles/stats/overview
 * @desc    Get vehicle fleet statistics
 * @access  Private (admin, manager)
 */
router.get('/stats/overview', requireAuth(['admin', 'manager']), async (req, res) => {
  try {
    const total = await Vehicle.countDocuments();
    const available = await Vehicle.countDocuments({ status: 'available' });
    const inUse = await Vehicle.countDocuments({ status: 'in-use' });
    const maintenance = await Vehicle.countDocuments({ status: 'maintenance' });

    // Vehicles by type
    const byType = await Vehicle.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Vehicles needing maintenance soon
    const maintenanceDue = await Vehicle.countDocuments({
      nextMaintenanceDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    });

    // Insurance expiring soon
    const insuranceExpiring = await Vehicle.countDocuments({
      insuranceExpiry: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    });

    return res.apiSuccess({
      total,
      available,
      inUse,
      maintenance,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      alerts: {
        maintenanceDue,
        insuranceExpiring
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    return res.apiError('Failed to fetch vehicle statistics', 500);
  }
});

export default router;
