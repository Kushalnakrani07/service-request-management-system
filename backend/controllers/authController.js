/**
 * ==============================================================================
 * AUTHENTICATION CONTROLLER (Register, Login, Get Current User)
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * What is a Controller?
 * In MVC (Model-View-Controller) architecture, a Controller holds the business
 * logic for incoming HTTP requests. It receives requests from routes, queries or
 * mutates data via Models, and sends back appropriate HTTP responses (JSON).
 * 
 * HTTP STATUS CODES USED:
 * - 200 OK: Request succeeded (e.g. login successful, profile retrieved).
 * - 201 Created: New resource successfully created (e.g. registration).
 * - 400 Bad Request: Client sent invalid or missing data.
 * - 401 Unauthorized: Invalid credentials or token.
 * - 500 Internal Server Error: Unexpected server error.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * HELPER: Generates signed JWT token containing user ID
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'btech_service_request_jwt_secret_key_2026_super_secure',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

/**
 * @desc    Register a new user (Customer or Service Provider)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, specialization } = req.body;

    // 1. Check if all required fields are present
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, phone'
      });
    }

    // 2. Check if a user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in instead.'
      });
    }

    // 3. Create user in MongoDB
    const userRole = role && ['customer', 'provider', 'admin'].includes(role) ? role : 'customer';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password, // Password hashing happens automatically in User model pre-save hook
      role: userRole,
      phone,
      address: address || '',
      specialization: userRole === 'provider' ? specialization || 'general' : undefined
    });

    // 4. Generate JWT token
    const token = generateToken(user._id);

    // 5. Send response with user profile and token
    res.status(201).json({
      success: true,
      message: `${userRole.toUpperCase()} registered successfully!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        specialization: user.specialization,
        isAvailable: user.isAvailable
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate email and password presence
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // 2. Look up user by email and explicitly select password (since select: false in schema)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 3. Verify entered password with hashed password using bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 4. Generate JWT token
    const token = generateToken(user._id);

    // 5. Respond with user info and token
    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        specialization: user.specialization,
        isAvailable: user.isAvailable
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private (Requires valid JWT)
 */
const getMe = async (req, res) => {
  try {
    // req.user was already set by the `protect` middleware
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  generateToken
};
