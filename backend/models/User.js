/**
 * ==============================================================================
 * USER MODEL (Customer & ServiceProvider Schemas)
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * In MongoDB, data is stored in flexible JSON-like documents.
 * Mongoose Schemas allow us to define the "blueprint" of how each document
 * must look (data types, validation rules, required fields, default values).
 * 
 * In this application:
 * - Both 'customer' and 'provider' (and optional 'admin') accounts share
 *   fundamental credentials (name, email, password, phone).
 * - The 'role' field determines their permissions throughout the system.
 * - 'specialization' applies specifically to service providers (e.g., plumbing, electrical).
 * 
 * SECURITY NOTE (PASSWORD HASHING):
 * Plaintext passwords should NEVER be saved directly into a database.
 * We use `bcryptjs` to hash the password with a cryptographic "salt" before saving.
 * Salting prevents rainbow-table dictionary attacks.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false // Do not return password by default in queries (security best practice)
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'provider', 'admin'],
        message: '{VALUE} is not a valid role. Allowed: customer, provider, admin'
      },
      default: 'customer'
    },
    phone: {
      type: String,
      required: [true, 'Please provide a contact phone number'],
      trim: true
    },
    address: {
      type: String,
      trim: true,
      default: '' // Primarily used by customers for default service location
    },
    specialization: {
      type: String,
      enum: [
        'plumbing',
        'electrical',
        'carpentry',
        'ac-repair',
        'appliance',
        'painting',
        'cleaning',
        'general'
      ],
      default: 'general',
      // Required if role is provider
      validate: {
        validator: function (val) {
          if (this.role === 'provider' && !val) {
            return false;
          }
          return true;
        },
        message: 'Service providers must have a valid specialization'
      }
    },
    isAvailable: {
      type: Boolean,
      default: true // Used for providers to indicate if they can take new jobs
    }
  },
  {
    timestamps: true // Automatically creates `createdAt` and `updatedAt` timestamps
  }
);

/**
 * MONGOOSE PRE-SAVE HOOK:
 * This function automatically triggers right before a user document is saved to MongoDB.
 * If the user's password was modified (or newly created), we hash it with bcrypt.
 */
userSchema.pre('save', async function () {
  // If the password field wasn't touched/modified, skip hashing
  if (!this.isModified('password')) {
    return;
  }

  // Generate salt with cost factor 10 (higher is more secure, but takes longer CPU time)
  const salt = await bcrypt.genSalt(10);
  // Hash the password with the salt
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * INSTANCE METHOD: matchPassword
 * Compares the entered plain-text password with the stored bcrypt hash.
 * Returns true if passwords match, false otherwise.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the compiled model
module.exports = mongoose.model('User', userSchema);
