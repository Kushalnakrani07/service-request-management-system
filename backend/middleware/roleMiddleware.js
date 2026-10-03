/**
 * ==============================================================================
 * ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * What is Role-Based Authorization (RBAC)?
 * RBAC restricts system access to authorized users based on their assigned role
 * (e.g. 'customer', 'provider', 'admin').
 * 
 * Difference between Authentication vs Authorization:
 * - Authentication (Who are you?): Handled by `authMiddleware.js` (checks valid JWT).
 * - Authorization (What are you allowed to do?): Handled here (checks if role has permission).
 * 
 * EXAMPLE USAGE IN ROUTES:
 * router.post('/requests', protect, authorizeRoles('customer'), createRequest);
 * router.patch('/requests/:id/status', protect, authorizeRoles('provider'), updateRequestStatus);
 */

/**
 * Higher-order function that accepts permitted roles and returns an Express middleware.
 * @param  {...string} roles - Permitted roles (e.g., 'customer', 'provider', 'admin')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Check if the user is authenticated (req.user must be attached by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required before role verification.'
      });
    }

    // Check if the authenticated user's role is in the list of allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource. Required role(s): [${roles.join(', ')}]`
      });
    }

    // Role is valid, proceed
    next();
  };
};

module.exports = { authorizeRoles };
