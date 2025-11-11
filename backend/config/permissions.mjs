/**
 * Role-Based Access Control (RBAC) Configuration
 *
 * @module config/permissions
 * @description Defines granular permissions for each role in the system
 *
 * Roles:
 * - superadmin: Full system access (all permissions)
 * - admin: Standard admin access (most operations except sensitive system config)
 * - manager: Business operations (bookings, tours, analytics viewing)
 * - support: Customer support (view/update bookings, respond to tickets)
 * - driver: Driver operations (view assigned bookings, update status)
 * - user: Standard user (own bookings only)
 */

export const PERMISSIONS = {
  // User Management
  'users.view': ['superadmin', 'admin', 'manager'],
  'users.create': ['superadmin', 'admin'],
  'users.update': ['superadmin', 'admin'],
  'users.delete': ['superadmin', 'admin'],
  'users.changeRole': ['superadmin'],

  // Tour Management
  'tours.view': ['superadmin', 'admin', 'manager', 'support', 'driver'],
  'tours.create': ['superadmin', 'admin', 'manager'],
  'tours.update': ['superadmin', 'admin', 'manager'],
  'tours.delete': ['superadmin', 'admin'],
  'tours.pricing': ['superadmin', 'admin', 'manager'],

  // Booking Management
  'bookings.view': ['superadmin', 'admin', 'manager', 'support', 'driver'],
  'bookings.viewAll': ['superadmin', 'admin', 'manager', 'support'],
  'bookings.create': ['superadmin', 'admin', 'manager', 'support'],
  'bookings.update': ['superadmin', 'admin', 'manager', 'support'],
  'bookings.updateStatus': ['superadmin', 'admin', 'manager', 'support', 'driver'],
  'bookings.delete': ['superadmin', 'admin'],
  'bookings.cancel': ['superadmin', 'admin', 'manager', 'support'],

  // Analytics & Reports
  'analytics.view': ['superadmin', 'admin', 'manager'],
  'analytics.export': ['superadmin', 'admin', 'manager'],
  'analytics.financial': ['superadmin', 'admin'],

  // Settings & Configuration
  'settings.view': ['superadmin', 'admin', 'manager'],
  'settings.update': ['superadmin', 'admin'],
  'settings.modules': ['superadmin'],
  'settings.security': ['superadmin'],

  // Campaign Management
  'campaigns.view': ['superadmin', 'admin', 'manager'],
  'campaigns.create': ['superadmin', 'admin', 'manager'],
  'campaigns.update': ['superadmin', 'admin', 'manager'],
  'campaigns.delete': ['superadmin', 'admin'],

  // Coupon Management
  'coupons.view': ['superadmin', 'admin', 'manager'],
  'coupons.create': ['superadmin', 'admin', 'manager'],
  'coupons.update': ['superadmin', 'admin', 'manager'],
  'coupons.delete': ['superadmin', 'admin'],

  // Referral Management
  'referrals.view': ['superadmin', 'admin', 'manager'],
  'referrals.manage': ['superadmin', 'admin', 'manager'],

  // Support Tickets
  'support.view': ['superadmin', 'admin', 'manager', 'support'],
  'support.respond': ['superadmin', 'admin', 'manager', 'support'],
  'support.close': ['superadmin', 'admin', 'manager', 'support'],

  // Vehicle & Driver Management
  'vehicles.view': ['superadmin', 'admin', 'manager'],
  'vehicles.create': ['superadmin', 'admin', 'manager'],
  'vehicles.update': ['superadmin', 'admin', 'manager'],
  'vehicles.delete': ['superadmin', 'admin'],

  'drivers.view': ['superadmin', 'admin', 'manager'],
  'drivers.create': ['superadmin', 'admin', 'manager'],
  'drivers.update': ['superadmin', 'admin', 'manager'],
  'drivers.delete': ['superadmin', 'admin'],

  // AI Features
  'ai.insights': ['superadmin', 'admin', 'manager'],
  'ai.recommendations': ['superadmin', 'admin', 'manager'],
  'ai.chat': ['superadmin', 'admin', 'manager', 'support'],

  // Logs & Audit
  'logs.view': ['superadmin', 'admin'],
  'logs.export': ['superadmin', 'admin'],

  // New Feature Toggle Permissions
  'view_fleet': ['superadmin', 'admin', 'manager'],
  'view_driver_stats': ['superadmin', 'admin', 'manager'],
  'manage_compensation': ['superadmin', 'admin'],
  'view_analytics': ['superadmin', 'admin', 'manager'],
  'manage_corporate': ['superadmin', 'admin', 'manager'],
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if role has permission
 */
export function hasPermission(role, permission) {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    console.warn(`Permission '${permission}' not defined in RBAC configuration`);
    return false;
  }
  return allowedRoles.includes(role);
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]} - Array of permission names
 */
export function getRolePermissions(role) {
  return Object.keys(PERMISSIONS).filter((permission) => PERMISSIONS[permission].includes(role));
}

/**
 * Middleware to check specific permission
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.apiError('Authentication required', 401);
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.apiError(`Insufficient permissions. Required: ${permission}`, 403);
    }

    next();
  };
}

/**
 * Middleware to check multiple permissions (OR logic)
 * User needs at least one of the specified permissions
 * @param {...string} permissions - Required permissions
 * @returns {Function} Express middleware
 */
export function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.apiError('Authentication required', 401);
    }

    const hasAny = permissions.some((permission) => hasPermission(req.user.role, permission));

    if (!hasAny) {
      return res.apiError(
        `Insufficient permissions. Required one of: ${permissions.join(', ')}`,
        403
      );
    }

    next();
  };
}

/**
 * Middleware to check multiple permissions (AND logic)
 * User needs all of the specified permissions
 * @param {...string} permissions - Required permissions
 * @returns {Function} Express middleware
 */
export function requireAllPermissions(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.apiError('Authentication required', 401);
    }

    const hasAll = permissions.every((permission) => hasPermission(req.user.role, permission));

    if (!hasAll) {
      return res.apiError(
        `Insufficient permissions. Required all of: ${permissions.join(', ')}`,
        403
      );
    }

    next();
  };
}

export default {
  PERMISSIONS,
  hasPermission,
  getRolePermissions,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
};
