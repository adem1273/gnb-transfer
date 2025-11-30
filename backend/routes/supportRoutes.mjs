/**
 * Support Routes
 *
 * @module routes/supportRoutes
 * @description Customer support ticket management endpoints
 */

import express from 'express';
import SupportTicket from '../models/SupportTicket.mjs';
import { requireAuth } from '../middlewares/auth.mjs';

const router = express.Router();

/**
 * @route   GET /api/support
 * @desc    Get all support tickets
 * @access  Private (admin, manager, support)
 */
router.get('/', requireAuth(['admin', 'manager', 'support']), async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 20 } = req.query;

    const filter = {};
    // Validate and whitelist values
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    if (status && validStatuses.includes(status)) {
      filter.status = status;
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && validPriorities.includes(priority)) {
      filter.priority = priority;
    }

    const validCategories = ['booking', 'payment', 'general', 'technical', 'other'];
    if (category && validCategories.includes(category)) {
      filter.category = category;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const tickets = await SupportTicket.find(filter)
      .populate('user', 'name email')
      .populate('booking')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await SupportTicket.countDocuments(filter);

    // Get statistics
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return res.apiSuccess({
      tickets,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
      stats: stats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return res.apiError('Failed to fetch support tickets', 500);
  }
});

/**
 * @route   GET /api/support/:id
 * @desc    Get support ticket by ID
 * @access  Private (admin, manager, support, or ticket owner)
 */
router.get('/:id', requireAuth(['admin', 'manager', 'support', 'user']), async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('user', 'name email')
      .populate('booking')
      .populate('resolvedBy', 'name email');

    if (!ticket) {
      return res.apiError('Ticket not found', 404);
    }

    // Check if user owns the ticket or has appropriate role
    const isOwner = ticket.user && ticket.user._id.toString() === req.user.id;
    const isStaff = ['admin', 'manager', 'support'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.apiError('Unauthorized to view this ticket', 403);
    }

    return res.apiSuccess(ticket);
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return res.apiError('Failed to fetch support ticket', 500);
  }
});

/**
 * @route   POST /api/support
 * @desc    Create new support ticket
 * @access  Public (anyone can submit)
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      subject,
      message,
      category,
      priority,
      language,
      bookingId,
      aiResponse,
      conversationHistory,
    } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.apiError('Missing required fields', 400);
    }

    const ticketData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
      category: category || 'general',
      priority: priority || 'medium',
      language: language || 'en',
      status: 'open',
    };

    // Add optional fields
    if (bookingId) ticketData.booking = bookingId;
    if (req.user?.id) ticketData.user = req.user.id;
    if (aiResponse) {
      ticketData.aiAttempted = true;
      ticketData.aiResponse = aiResponse;
    }
    if (conversationHistory) {
      ticketData.conversationHistory = conversationHistory;
    }

    const ticket = await SupportTicket.create(ticketData);

    return res.apiSuccess(ticket, 'Support ticket created successfully');
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return res.apiError(error.message || 'Failed to create support ticket', 500);
  }
});

/**
 * @route   PATCH /api/support/:id
 * @desc    Update support ticket
 * @access  Private (admin, manager, support)
 */
router.patch('/:id', requireAuth(['admin', 'manager', 'support']), async (req, res) => {
  try {
    const allowedFields = ['status', 'priority', 'resolution'];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // If resolving, add resolution details
    if (updates.status === 'resolved' || updates.status === 'closed') {
      updates.resolvedAt = new Date();
      updates.resolvedBy = req.user.id;
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('user', 'name email')
      .populate('resolvedBy', 'name email');

    if (!ticket) {
      return res.apiError('Ticket not found', 404);
    }

    return res.apiSuccess(ticket, 'Ticket updated successfully');
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return res.apiError(error.message || 'Failed to update ticket', 500);
  }
});

/**
 * @route   DELETE /api/support/:id
 * @desc    Delete support ticket
 * @access  Private (admin only)
 */
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.apiError('Ticket not found', 404);
    }

    return res.apiSuccess(null, 'Ticket deleted successfully');
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    return res.apiError('Failed to delete ticket', 500);
  }
});

/**
 * @route   GET /api/support/my/tickets
 * @desc    Get current user's support tickets
 * @access  Private
 */
router.get('/my/tickets', requireAuth(['admin', 'manager', 'user']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const tickets = await SupportTicket.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await SupportTicket.countDocuments({ user: req.user.id });

    return res.apiSuccess({
      tickets,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return res.apiError('Failed to fetch tickets', 500);
  }
});

/**
 * @route   GET /api/support/stats/overview
 * @desc    Get support statistics
 * @access  Private (admin, manager, support)
 */
router.get('/stats/overview', requireAuth(['admin', 'manager', 'support']), async (req, res) => {
  try {
    const total = await SupportTicket.countDocuments();
    const open = await SupportTicket.countDocuments({ status: 'open' });
    const inProgress = await SupportTicket.countDocuments({ status: 'in-progress' });
    const resolved = await SupportTicket.countDocuments({ status: 'resolved' });
    const closed = await SupportTicket.countDocuments({ status: 'closed' });

    // Average resolution time
    const resolvedTickets = await SupportTicket.find({
      status: { $in: ['resolved', 'closed'] },
      resolvedAt: { $exists: true },
    });

    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, ticket) => {
        const time = ticket.resolvedAt - ticket.createdAt;
        return sum + time;
      }, 0);
      avgResolutionTime = totalTime / resolvedTickets.length / (1000 * 60 * 60); // in hours
    }

    // By priority
    const byPriority = await SupportTicket.aggregate([
      { $match: { status: 'open' } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    return res.apiSuccess({
      total,
      open,
      inProgress,
      resolved,
      closed,
      avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
      byPriority: byPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Error fetching support stats:', error);
    return res.apiError('Failed to fetch support statistics', 500);
  }
});

export default router;
