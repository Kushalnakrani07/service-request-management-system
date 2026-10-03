/**
 * ==============================================================================
 * SERVICE REQUEST CONTROLLER
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * This controller implements all core business logic for the Service Request System:
 * 1. Creating requests (Customers only).
 * 2. Fetching personal requests (Ownership isolated: Customer sees their own, Provider sees theirs).
 * 3. Assigning a request to a provider (Transitions 'pending' -> 'assigned').
 * 4. Updating status (Assigned provider only: 'assigned' -> 'in-progress' -> 'completed').
 * 5. Maintaining an audit history (statusHistory array) for accountability.
 */

const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');

/**
 * @desc    Create a new service request
 * @route   POST /api/requests
 * @access  Private (Customer only)
 */
const createRequest = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      serviceAddress,
      customerPhone,
      assignedProviderId
    } = req.body;

    // Build the request data object
    const requestData = {
      title,
      description,
      category: category.toLowerCase(),
      priority: priority || 'medium',
      serviceAddress,
      customerPhone: customerPhone || req.user.phone,
      customer: req.user._id, // Set ownership to the logged-in customer
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          updatedAt: new Date(),
          updatedBy: req.user._id,
          note: 'Service request created by customer'
        }
      ]
    };

    // If an optional provider was selected during creation, assign and transition status
    if (assignedProviderId) {
      const provider = await User.findOne({ _id: assignedProviderId, role: 'provider' });
      if (provider) {
        requestData.serviceProvider = provider._id;
        requestData.status = 'assigned';
        requestData.statusHistory.push({
          status: 'assigned',
          updatedAt: new Date(),
          updatedBy: req.user._id,
          note: `Assigned to provider: ${provider.name} (${provider.specialization})`
        });
      }
    }

    const newRequest = await ServiceRequest.create(requestData);

    // Populate references before sending back to client
    const populatedRequest = await ServiceRequest.findById(newRequest._id)
      .populate('customer', 'name email phone address')
      .populate('serviceProvider', 'name email phone specialization isAvailable');

    res.status(201).json({
      success: true,
      message: 'Service request created successfully!',
      data: populatedRequest
    });
  } catch (error) {
    console.error('Create Request Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating service request'
    });
  }
};

/**
 * @desc    Get requests belonging to the logged-in user
 *          - Customer: gets requests raised by them ONLY
 *          - Provider: gets requests assigned to them ONLY
 * @route   GET /api/requests/my
 * @access  Private (Customer, Provider)
 */
const getMyRequests = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentUserRole = req.user.role;

    let filter = {};

    if (currentUserRole === 'customer') {
      // Customer can ONLY view their own requests
      filter.customer = currentUserId;
    } else if (currentUserRole === 'provider') {
      // Provider can ONLY view requests assigned to them
      filter.serviceProvider = currentUserId;
    } else if (currentUserRole === 'admin') {
      // Admin can see everything
      filter = {};
    }

    // Optional query filter by status (e.g. /api/requests/my?status=in-progress)
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await ServiceRequest.find(filter)
      .populate('customer', 'name email phone address')
      .populate('serviceProvider', 'name email phone specialization isAvailable')
      .populate('statusHistory.updatedBy', 'name role')
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Get My Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving your service requests'
    });
  }
};

/**
 * @desc    Get single request details by ID
 * @route   GET /api/requests/:id
 * @access  Private (Ownership-protected)
 */
const getRequestById = async (req, res) => {
  try {
    // req.serviceRequest is pre-loaded and ownership-verified by `checkRequestOwnership` middleware
    const request = await ServiceRequest.findById(req.serviceRequest._id)
      .populate('customer', 'name email phone address')
      .populate('serviceProvider', 'name email phone specialization isAvailable')
      .populate('statusHistory.updatedBy', 'name role');

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Get Request By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving request details'
    });
  }
};

/**
 * @desc    Update request status according to workflow
 *          (Assigned Provider ONLY, ownership & workflow validated by middleware)
 * @route   PATCH /api/requests/:id/status
 * @access  Private (Assigned Provider only)
 */
const updateRequestStatus = async (req, res) => {
  try {
    const { status, resolutionNotes, note } = req.body;
    const request = req.serviceRequest; // Populated by checkRequestOwnership middleware

    const normalizedStatus = status.toLowerCase();
    const oldStatus = request.status;

    // Update status
    request.status = normalizedStatus;

    if (resolutionNotes) {
      request.resolutionNotes = resolutionNotes;
    }

    // Append to status history audit trail
    request.statusHistory.push({
      status: normalizedStatus,
      updatedAt: new Date(),
      updatedBy: req.user._id,
      note: note || `Status transitioned from '${oldStatus}' to '${normalizedStatus}' by provider ${req.user.name}`
    });

    await request.save();

    // Re-fetch populated document
    const updated = await ServiceRequest.findById(request._id)
      .populate('customer', 'name email phone address')
      .populate('serviceProvider', 'name email phone specialization isAvailable')
      .populate('statusHistory.updatedBy', 'name role');

    res.status(200).json({
      success: true,
      message: `Status updated successfully to '${normalizedStatus}'`,
      data: updated
    });
  } catch (error) {
    console.error('Update Request Status Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating status'
    });
  }
};

/**
 * @desc    Assign service provider to a pending request
 * @route   PATCH /api/requests/:id/assign
 * @access  Private (Admin or Customer self-assign / Provider claim)
 */
const assignProvider = async (req, res) => {
  try {
    const { providerId } = req.body;
    const { id } = req.params;

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    // Verify provider exists and has role 'provider'
    const provider = await User.findOne({ _id: providerId, role: 'provider' });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Selected service provider was not found or is invalid'
      });
    }

    request.serviceProvider = provider._id;
    request.status = 'assigned';

    request.statusHistory.push({
      status: 'assigned',
      updatedAt: new Date(),
      updatedBy: req.user._id,
      note: `Assigned to ${provider.name} (${provider.specialization}) by ${req.user.name}`
    });

    await request.save();

    const populated = await ServiceRequest.findById(request._id)
      .populate('customer', 'name email phone address')
      .populate('serviceProvider', 'name email phone specialization isAvailable');

    res.status(200).json({
      success: true,
      message: `Request assigned to ${provider.name}`,
      data: populated
    });
  } catch (error) {
    console.error('Assign Provider Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error assigning provider'
    });
  }
};

/**
 * @desc    Get all service requests (Admin or Dispatch view)
 * @route   GET /api/requests
 * @access  Private
 */
const getAllRequests = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    const requests = await ServiceRequest.find(filter)
      .populate('customer', 'name email phone address')
      .populate('serviceProvider', 'name email phone specialization isAvailable')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Get All Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving requests'
    });
  }
};

/**
 * @desc    Get list of available service providers (for assignment)
 * @route   GET /api/requests/providers/list
 * @access  Private
 */
const getProvidersList = async (req, res) => {
  try {
    const { specialization } = req.query;
    const filter = { role: 'provider' };

    if (specialization) {
      filter.specialization = specialization.toLowerCase();
    }

    const providers = await User.find(filter).select('-password');

    res.status(200).json({
      success: true,
      count: providers.length,
      data: providers
    });
  } catch (error) {
    console.error('Get Providers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving service providers'
    });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
  assignProvider,
  getAllRequests,
  getProvidersList
};
