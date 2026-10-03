/**
 * ==============================================================================
 * VALIDATION MIDDLEWARE (Data Integrity & Status Workflow FSM)
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * Why do we need server-side validation?
 * Even if a frontend form validates inputs, anyone can bypass the frontend
 * using Postman, Thunder Client, or cURL. Therefore, ALL business logic and
 * data integrity checks MUST be enforced on the backend server.
 * 
 * FINITE STATE MACHINE (FSM) WORKFLOW:
 * We model the service request status as a strict state machine:
 * 
 *       [pending]
 *           │
 *           ▼ (Assigned to Provider)
 *       [assigned]
 *           │
 *           ▼ (Provider begins work)
 *     [in-progress]
 *           │
 *           ▼ (Provider fixes issue)
 *      [completed] (Terminal state)
 * 
 * An invalid jump (e.g. pending -> completed, or modifying completed)
 * will be cleanly rejected with HTTP 400 Bad Request.
 */

// Define allowed status transitions
const VALID_STATUS_TRANSITIONS = {
  pending: ['assigned', 'cancelled'],
  assigned: ['in-progress', 'cancelled'],
  'in-progress': ['completed', 'cancelled'],
  completed: [], // Terminal state: once completed, no further transitions allowed
  cancelled: []  // Terminal state: once cancelled, no further transitions allowed
};

/**
 * Validates request body fields when creating a new service request.
 */
const validateCreateRequest = (req, res, next) => {
  const { title, description, category, serviceAddress, customerPhone } = req.body;
  const errors = [];

  if (!title || !title.trim()) {
    errors.push('Title is required');
  }

  if (!description || !description.trim()) {
    errors.push('Description is required');
  }

  const validCategories = [
    'plumbing',
    'electrical',
    'carpentry',
    'ac-repair',
    'appliance',
    'painting',
    'cleaning',
    'general'
  ];
  if (!category || !validCategories.includes(category.toLowerCase())) {
    errors.push(`Category must be one of: [${validCategories.join(', ')}]`);
  }

  if (!serviceAddress || !serviceAddress.trim()) {
    errors.push('Service address is required');
  }

  if (!customerPhone || !customerPhone.trim()) {
    errors.push('Customer phone number is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for service request creation',
      errors
    });
  }

  next();
};

/**
 * Validates status transitions to strictly enforce the workflow:
 * pending -> assigned -> in-progress -> completed
 */
const validateStatusTransition = (req, res, next) => {
  const { status, resolutionNotes } = req.body;
  const currentStatus = req.serviceRequest.status;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'New status is required'
    });
  }

  const normalizedStatus = status.toLowerCase();
  const allowedNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  // Check if current status is terminal
  if (currentStatus === 'completed' || currentStatus === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: `Invalid action: This request is already '${currentStatus}' and cannot be altered.`
    });
  }

  // Check if the requested transition is permitted
  if (!allowedNextStatuses.includes(normalizedStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status workflow transition: Cannot move from '${currentStatus}' to '${normalizedStatus}'. Allowed next steps: [${allowedNextStatuses.join(', ')}]`
    });
  }

  // If completing, require resolution notes
  if (normalizedStatus === 'completed' && (!resolutionNotes || !resolutionNotes.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide resolution notes explaining how the issue was fixed before marking it completed.'
    });
  }

  next();
};

module.exports = {
  validateCreateRequest,
  validateStatusTransition,
  VALID_STATUS_TRANSITIONS
};
