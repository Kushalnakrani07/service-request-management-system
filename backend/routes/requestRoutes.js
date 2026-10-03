/**
 * ==============================================================================
 * SERVICE REQUEST ROUTES (Chained Middleware Pipeline)
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * Notice how Express allows us to CHAIN multiple middleware functions together!
 * Requests pass through an assembly line of checks before reaching the controller:
 * 
 * [Incoming HTTP Request]
 *          │
 *          ▼
 *    1. protect                 -> Validates JWT Bearer Token (Authentication)
 *          │
 *          ▼
 *    2. authorizeRoles(...)     -> Validates User Role (RBAC: Customer vs Provider)
 *          │
 *          ▼
 *    3. checkRequestOwnership   -> Validates Resource Relationship (OBAC)
 *          │
 *          ▼
 *    4. validateStatusTransition-> Validates FSM Workflow (Data Integrity)
 *          │
 *          ▼
 *    5. controllerFunction      -> Executes database update and returns JSON
 * 
 * If ANY middleware check fails, the request stops immediately and returns
 * an error status (401, 403, 400), protecting the database!
 */

const express = require('express');
const router = express.Router();

const {
  createRequest,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
  assignProvider,
  getAllRequests,
  getProvidersList
} = require('../controllers/requestController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { checkRequestOwnership } = require('../middleware/ownershipMiddleware');
const {
  validateCreateRequest,
  validateStatusTransition
} = require('../middleware/validationMiddleware');

// -----------------------------------------------------------------------------
// Metadata route to fetch available providers (for assignment dropdown)
// -----------------------------------------------------------------------------
router.get('/meta/providers', protect, getProvidersList);

// -----------------------------------------------------------------------------
// POST /api/requests
// Customer raises a new service request
// Required: JWT token, 'customer' or 'admin' role, validated request fields
// -----------------------------------------------------------------------------
router.post(
  '/',
  protect,
  authorizeRoles('customer', 'admin'),
  validateCreateRequest,
  createRequest
);

// -----------------------------------------------------------------------------
// GET /api/requests/my
// Returns requests belonging to the logged-in user:
// - Customer sees only requests they raised
// - Provider sees only requests assigned to them
// -----------------------------------------------------------------------------
router.get(
  '/my',
  protect,
  getMyRequests
);

// -----------------------------------------------------------------------------
// GET /api/requests
// View all service requests (Admin oversight or available requests)
// -----------------------------------------------------------------------------
router.get(
  '/',
  protect,
  getAllRequests
);

// -----------------------------------------------------------------------------
// GET /api/requests/:id
// View details of a specific request
// Ownership protected: Customers can only view their own; Providers only assigned
// -----------------------------------------------------------------------------
router.get(
  '/:id',
  protect,
  checkRequestOwnership,
  getRequestById
);

// -----------------------------------------------------------------------------
// PATCH /api/requests/:id/status
// Update request status (Workflow: assigned -> in-progress -> completed)
// Required:
// 1. Logged in (protect)
// 2. Provider role (authorizeRoles)
// 3. Must be assigned to THIS provider (checkRequestOwnership)
// 4. Must follow valid state transition (validateStatusTransition)
// -----------------------------------------------------------------------------
router.patch(
  '/:id/status',
  protect,
  authorizeRoles('provider', 'admin'),
  checkRequestOwnership,
  validateStatusTransition,
  updateRequestStatus
);

// -----------------------------------------------------------------------------
// PATCH /api/requests/:id/assign
// Assign a service provider to a pending request (transitions to 'assigned')
// -----------------------------------------------------------------------------
router.patch(
  '/:id/assign',
  protect,
  assignProvider
);

module.exports = router;
