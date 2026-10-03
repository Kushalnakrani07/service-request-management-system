/**
 * ==============================================================================
 * OWNERSHIP-BASED ACCESS CONTROL (OBAC) MIDDLEWARE
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * What is Ownership-Based Authorization?
 * Role-Based Access Control (RBAC) only checks *what group* a user belongs to
 * (e.g. "Is the user a Customer?").
 * 
 * However, that is not enough for privacy:
 * Customer Alice should NOT see or edit Customer Bob's plumbing request!
 * Provider John should NOT update status on a request assigned to Provider Dave!
 * 
 * Ownership-Based Access Control checks *relationship to the specific resource*:
 * 1. Does this service request belong to the logged-in customer?
 * 2. Is this service request assigned to the logged-in provider?
 * 
 * WHY IS THIS CRITICAL?
 * This prevents IDOR (Insecure Direct Object Reference) vulnerabilities,
 * which is one of the OWASP Top 10 Web Application Security risks!
 */

const mongoose = require('mongoose');
const ServiceRequest = require('../models/ServiceRequest');

/**
 * Middleware that verifies whether the logged-in user owns or is assigned
 * to the requested ServiceRequest document (identified by req.params.id).
 */
const checkRequestOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Validate that the ID parameter is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      });
    }

    // 2. Fetch the service request from MongoDB
    const request = await ServiceRequest.findById(id)
      .populate('customer', 'name email phone address')
      .populate('serviceProvider', 'name email phone specialization isAvailable');

    // 3. If request does not exist, return 404
    if (!request) {
      return res.status(404).json({
        success: false,
        message: `Service request with ID ${id} was not found`
      });
    }

    const currentUserId = req.user._id.toString();
    const currentUserRole = req.user.role;

    // 4. Admin bypass: Administrators have full oversight
    if (currentUserRole === 'admin') {
      req.serviceRequest = request;
      return next();
    }

    // 5. Customer Ownership Check:
    // Customers can ONLY view or modify requests they themselves raised
    if (currentUserRole === 'customer') {
      const requestCustomerId = request.customer._id
        ? request.customer._id.toString()
        : request.customer.toString();

      if (requestCustomerId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to view or modify requests raised by other customers.'
        });
      }
    }

    // 6. Service Provider Ownership Check:
    // Providers can ONLY view or update requests explicitly assigned to them
    if (currentUserRole === 'provider') {
      if (!request.serviceProvider) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: This service request has not been assigned to any provider yet.'
        });
      }

      const requestProviderId = request.serviceProvider._id
        ? request.serviceProvider._id.toString()
        : request.serviceProvider.toString();

      if (requestProviderId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only view or update service requests that are assigned directly to you.'
        });
      }
    }

    // Attach request object to express req for easy access in controllers (avoids duplicate DB query)
    req.serviceRequest = request;
    next();
  } catch (error) {
    console.error('Ownership Middleware Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while checking request ownership'
    });
  }
};

module.exports = { checkRequestOwnership };
