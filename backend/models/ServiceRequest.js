/**
 * ==============================================================================
 * SERVICE REQUEST MODEL (Referenced Collections)
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS (REFERENCED COLLECTIONS):
 * In Relational Databases (SQL), relationships are managed via Foreign Keys.
 * In MongoDB, we implement relationships via "Document Referencing" using `mongoose.Schema.Types.ObjectId`.
 * 
 * Here:
 * - `customer`: Stores the ObjectId of the User who raised this request (`ref: 'User'`).
 * - `serviceProvider`: Stores the ObjectId of the User assigned to fix the issue (`ref: 'User'`).
 * - Using Mongoose's `.populate('customer')` or `.populate('serviceProvider')`,
 *   we can automatically fetch the referenced user's details without manually querying.
 * 
 * STATUS WORKFLOW LIFECYCLE:
 * 1. 'pending'     -> Request created by Customer, awaiting assignment to a Provider.
 * 2. 'assigned'    -> Request assigned to a Service Provider.
 * 3. 'in-progress' -> Provider has arrived / started working on the issue.
 * 4. 'completed'   -> Issue has been resolved by the Provider.
 * 5. 'cancelled'   -> Cancelled if no longer needed.
 */

const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled']
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: {
      type: String,
      default: ''
    }
  },
  { _id: false } // Subdocuments in history don't require separate ObjectIds
);

const serviceRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the service request'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description of the issue'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
      type: String,
      required: [true, 'Please select a service category'],
      enum: {
        values: [
          'plumbing',
          'electrical',
          'carpentry',
          'ac-repair',
          'appliance',
          'painting',
          'cleaning',
          'general'
        ],
        message: '{VALUE} is not a supported service category'
      }
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid status'
      },
      default: 'pending'
    },
    serviceAddress: {
      type: String,
      required: [true, 'Please specify the address where the service is needed'],
      trim: true
    },
    customerPhone: {
      type: String,
      required: [true, 'Please provide a reachable contact number'],
      trim: true
    },
    // Reference to Customer (User document with role: 'customer')
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A service request must belong to a customer']
    },
    // Reference to Service Provider (User document with role: 'provider')
    serviceProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolutionNotes: {
      type: String,
      default: ''
    },
    // Audit trail / timeline tracking every status change
    statusHistory: [statusHistorySchema]
  },
  {
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);

// Helpful index for fast queries: searching by customer, provider, and status
serviceRequestSchema.index({ customer: 1, status: 1 });
serviceRequestSchema.index({ serviceProvider: 1, status: 1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
