/**
 * ==============================================================================
 * AUTHENTICATION MIDDLEWARE (JWT Verification)
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * What is JWT (JSON Web Token)?
 * JWT is an open standard (RFC 7519) that defines a compact and self-contained
 * way for securely transmitting information between parties as a JSON object.
 * 
 * A JWT consists of three parts separated by dots (xxxxx.yyyyy.zzzzz):
 * 1. Header    -> Specifies algorithm (e.g. HS256) and token type.
 * 2. Payload   -> Contains "claims" such as user ID, role, and expiration timestamp.
 * 3. Signature -> Cryptographic signature verified using the secret key (JWT_SECRET).
 * 
 * HOW THE CLIENT AUTHENTICATES:
 * 1. User logs in with email & password.
 * 2. Server creates a signed JWT containing { id: user._id } and returns it.
 * 3. In subsequent requests, the client sends this token in the HTTP Header:
 *    `Authorization: Bearer <token>`
 * 4. This middleware intercepts the request, decodes the token, and attaches the
 *    user to `req.user`. If token is missing, expired, or tampered, it rejects (401).
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check if Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Format of header is: "Bearer eyJhbGciOi..."
      // Splitting by space gives: ['Bearer', '<token>']
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify token signature against JWT_SECRET
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'btech_service_request_jwt_secret_key_2026_super_secure'
      );

      // 3. Find the user in the database by ID encoded in the token payload
      // Exclude password field from the query with `.select('-password')`
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'The user belonging to this token no longer exists.'
        });
      }

      // Proceed to the next middleware or controller in the Express chain
      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized! Token is invalid or has expired.'
      });
    }
  }

  // If no token was found in the header
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized! Please log in and provide a Bearer token in headers.'
    });
  }
};

module.exports = { protect };
