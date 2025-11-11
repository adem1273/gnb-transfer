/**
 * Admin Role Guard Middleware
 *
 * @module middlewares/adminGuard
 * @description Enhanced role-based access control for admin operations
 *
 * Security features:
 * - Granular role checking (admin, superadmin, manager)
 * - Protects sensitive operations (delete, modify critical data)
 * - Logs admin actions for auditing
 * - Prevents privilege escalation
 */

/**
 * Require admin or superadmin role
 *
 * @returns {function} - Express middleware
 *
 * Use for general admin operations that don't modify critical data
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.apiError('Authentication required', 401);
  }

  const allowedRoles = ['admin', 'superadmin'];
  if (!allowedRoles.includes(req.user.role)) {
    console.warn(`⚠️  Admin access denied for user ${req.user.id} with role: ${req.user.role}`);
    return res.apiError('Admin access required', 403);
  }

  next();
};

/**
 * Require superadmin role
 *
 * @returns {function} - Express middleware
 *
 * Use for critical operations:
 * - User role changes
 * - Deleting users
 * - System settings changes
 * - Security configuration
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.apiError('Authentication required', 401);
  }

  if (req.user.role !== 'superadmin') {
    console.warn(`⚠️  Superadmin access denied for user ${req.user.id} with role: ${req.user.role}`);
    return res.apiError('Superadmin access required', 403);
  }

  next();
};

/**
 * Prevent privilege escalation
 * Users cannot modify roles to higher than their own
 *
 * @returns {function} - Express middleware
 *
 * Use on user update/create routes that accept role parameter
 */
export const preventPrivilegeEscalation = (req, res, next) => {
  if (!req.user) {
    return res.apiError('Authentication required', 401);
  }

  // Define role hierarchy (higher number = more privileged)
  const roleHierarchy = {
    user: 1,
    support: 2,
    driver: 2,
    manager: 3,
    admin: 4,
    superadmin: 5,
  };

  const requestedRole = req.body.role;

  // If no role change requested, allow
  if (!requestedRole) {
    return next();
  }

  const currentUserLevel = roleHierarchy[req.user.role] || 0;
  const requestedLevel = roleHierarchy[requestedRole] || 0;

  // Users cannot assign roles higher than or equal to their own
  // Only superadmins can create other superadmins
  if (requestedLevel >= currentUserLevel) {
    console.warn(
      `⚠️  Privilege escalation attempt by user ${req.user.id} (${req.user.role}) trying to assign role: ${requestedRole}`
    );
    return res.apiError('Cannot assign role higher than or equal to your own', 403);
  }

  next();
};

/**
 * Prevent self-modification for sensitive operations
 * Users cannot delete themselves or change their own role
 *
 * @returns {function} - Express middleware
 */
export const preventSelfModification = (req, res, next) => {
  if (!req.user) {
    return res.apiError('Authentication required', 401);
  }

  const targetUserId = req.params.id || req.params.userId || req.body.userId;

  if (targetUserId && targetUserId === req.user.id) {
    console.warn(`⚠️  Self-modification attempt by user ${req.user.id}`);
    return res.apiError('Cannot modify your own account through this endpoint', 403);
  }

  next();
};

/**
 * Require specific permissions
 * More granular than role-based access
 *
 * @param {string} permission - Required permission (e.g., 'users.delete', 'settings.update')
 * @returns {function} - Express middleware
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.apiError('Authentication required', 401);
    }

    // Get user permissions from role (this would come from permissions.mjs)
    // For now, implement basic role-to-permissions mapping
    const rolePermissions = {
      superadmin: ['*'], // All permissions
      admin: [
        'users.view',
        'users.update',
        'bookings.*',
        'tours.*',
        'settings.view',
        'settings.update',
        'reports.*',
      ],
      manager: ['bookings.view', 'tours.view', 'reports.view'],
      driver: ['bookings.view', 'tours.view'],
      support: ['bookings.view', 'users.view'],
      user: [],
    };

    const userPermissions = rolePermissions[req.user.role] || [];

    // Check if user has permission
    const hasPermission =
      userPermissions.includes('*') || // Superadmin has all
      userPermissions.includes(permission) ||
      userPermissions.some((p) => p.endsWith('.*') && permission.startsWith(p.replace('.*', '')));

    if (!hasPermission) {
      console.warn(
        `⚠️  Permission denied: ${req.user.role} user ${req.user.id} lacks permission: ${permission}`
      );
      return res.apiError('Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Log admin action for auditing
 *
 * @param {string} action - Action description
 * @returns {function} - Express middleware
 *
 * Use on sensitive admin operations for audit trail
 */
export const logAdminAction = (action) => {
  return (req, res, next) => {
    if (req.user) {
      console.log(
        `📝 Admin Action: ${action} by user ${req.user.id} (${req.user.role}) - ${req.method} ${req.originalUrl}`
      );
      // In production, this should go to a separate audit log
      // You could use the AdminLog model here
    }
    next();
  };
};

export default {
  requireAdmin,
  requireSuperAdmin,
  preventPrivilegeEscalation,
  preventSelfModification,
  requirePermission,
  logAdminAction,
};
