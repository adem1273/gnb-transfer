import express from 'express';
import { requireAuth } from '../middlewares/auth.mjs';
import { requirePermission } from '../config/permissions.mjs';
import { requireFeatureEnabled } from '../middlewares/featureToggle.mjs';
import User from '../models/User.mjs';
import Booking from '../models/Booking.mjs';
import bcrypt from 'bcrypt';

const router = express.Router();

/**
 * @route   GET /api/admin/corporate
 * @desc    Get all corporate clients
 * @access  Private (requires manage_corporate permission)
 */
router.get(
  '/',
  requireAuth(),
  requirePermission('manage_corporate'),
  requireFeatureEnabled('corporate_clients'),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search } = req.query;

      const filter = { isCorporate: true };

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'corporateDetails.companyName': { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      const corporateClients = await User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean();

      const total = await User.countDocuments(filter);

      // Enrich with booking stats
      const enrichedClients = await Promise.all(
        corporateClients.map(async (client) => {
          const bookingCount = await Booking.countDocuments({ user: client._id });
          const totalSpent = await Booking.aggregate([
            { $match: { user: client._id, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]);

          return {
            ...client,
            stats: {
              totalBookings: bookingCount,
              totalSpent: totalSpent[0]?.total || 0,
            },
          };
        })
      );

      return res.apiSuccess(
        {
          clients: enrichedClients,
          pagination: {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total,
            pages: Math.ceil(total / parseInt(limit, 10)),
          },
        },
        'Corporate clients retrieved successfully'
      );
    } catch (error) {
      console.error('Error fetching corporate clients:', error);
      return res.apiError('Failed to fetch corporate clients', 500);
    }
  }
);

/**
 * @route   POST /api/admin/corporate
 * @desc    Create a new corporate client
 * @access  Private (requires manage_corporate permission)
 */
router.post(
  '/',
  requireAuth(),
  requirePermission('manage_corporate'),
  requireFeatureEnabled('corporate_clients'),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        phone,
        companyName,
        taxNumber,
        address,
        contactPerson,
        billingEmail,
        paymentTerms,
        discount,
      } = req.body;

      // Validate required fields
      if (!name || !email || !password || !companyName) {
        return res.apiError('Name, email, password, and company name are required', 400);
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.apiError('User with this email already exists', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create corporate user
      const corporateUser = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'user',
        isCorporate: true,
        corporateDetails: {
          companyName,
          taxNumber,
          address,
          contactPerson,
          billingEmail: billingEmail || email,
          paymentTerms: paymentTerms || 'net30',
          discount: discount || 0,
          contractStartDate: new Date(),
        },
      });

      // Remove password from response
      const userResponse = corporateUser.toObject();
      delete userResponse.password;

      return res.apiSuccess(userResponse, 'Corporate client created successfully');
    } catch (error) {
      console.error('Error creating corporate client:', error);
      return res.apiError(error.message || 'Failed to create corporate client', 500);
    }
  }
);

/**
 * @route   GET /api/admin/corporate/:id
 * @desc    Get a specific corporate client with details
 * @access  Private (requires manage_corporate permission)
 */
router.get(
  '/:id',
  requireAuth(),
  requirePermission('manage_corporate'),
  requireFeatureEnabled('corporate_clients'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const client = await User.findOne({ _id: id, isCorporate: true })
        .select('-password')
        .lean();

      if (!client) {
        return res.apiError('Corporate client not found', 404);
      }

      // Get bookings for this client
      const bookings = await Booking.find({ user: id })
        .populate('tour', 'title')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Calculate stats
      const totalBookings = await Booking.countDocuments({ user: id });
      const completedBookings = await Booking.countDocuments({
        user: id,
        status: 'completed',
      });
      
      const revenueData = await Booking.aggregate([
        { $match: { user: id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const totalRevenue = revenueData[0]?.total || 0;

      return res.apiSuccess(
        {
          client,
          stats: {
            totalBookings,
            completedBookings,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
          },
          recentBookings: bookings,
        },
        'Corporate client details retrieved successfully'
      );
    } catch (error) {
      console.error('Error fetching corporate client:', error);
      return res.apiError('Failed to fetch corporate client details', 500);
    }
  }
);

/**
 * @route   PATCH /api/admin/corporate/:id
 * @desc    Update a corporate client
 * @access  Private (requires manage_corporate permission)
 */
router.patch(
  '/:id',
  requireAuth(),
  requirePermission('manage_corporate'),
  requireFeatureEnabled('corporate_clients'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Remove sensitive fields that shouldn't be updated this way
      delete updates.password;
      delete updates.role;
      delete updates.isCorporate;

      const client = await User.findOneAndUpdate(
        { _id: id, isCorporate: true },
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      if (!client) {
        return res.apiError('Corporate client not found', 404);
      }

      return res.apiSuccess(client, 'Corporate client updated successfully');
    } catch (error) {
      console.error('Error updating corporate client:', error);
      return res.apiError(error.message || 'Failed to update corporate client', 500);
    }
  }
);

/**
 * @route   GET /api/admin/corporate/stats/summary
 * @desc    Get corporate clients summary statistics
 * @access  Private (requires manage_corporate permission)
 */
router.get(
  '/stats/summary',
  requireAuth(),
  requirePermission('manage_corporate'),
  requireFeatureEnabled('corporate_clients'),
  async (req, res) => {
    try {
      const totalCorporate = await User.countDocuments({ isCorporate: true });
      
      // Get all corporate users
      const corporateUsers = await User.find({ isCorporate: true }).select('_id').lean();
      const corporateUserIds = corporateUsers.map((u) => u._id);

      // Get booking stats
      const totalBookings = await Booking.countDocuments({ user: { $in: corporateUserIds } });
      
      const revenueData = await Booking.aggregate([
        { $match: { user: { $in: corporateUserIds }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const totalRevenue = revenueData[0]?.total || 0;

      return res.apiSuccess(
        {
          totalClients: totalCorporate,
          totalBookings,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          averageRevenuePerClient:
            totalCorporate > 0
              ? Math.round((totalRevenue / totalCorporate) * 100) / 100
              : 0,
        },
        'Corporate summary statistics retrieved successfully'
      );
    } catch (error) {
      console.error('Error fetching corporate stats:', error);
      return res.apiError('Failed to fetch corporate statistics', 500);
    }
  }
);

export default router;
