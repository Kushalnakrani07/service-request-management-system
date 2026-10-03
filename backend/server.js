/**
 * ==============================================================================
 * EXPRESS APPLICATION ENTRY POINT (server.js)
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * What is Express.js?
 * Express is a minimalist web framework for Node.js. It simplifies routing,
 * middleware execution, handling HTTP requests (GET, POST, PATCH, DELETE),
 * and returning JSON responses for REST APIs.
 * 
 * WHAT ARE MIDDLEWARES?
 * Functions that run in order between receiving the request and sending the response.
 * - cors(): Enables Cross-Origin Resource Sharing so our React frontend can talk to backend.
 * - express.json(): Automatically parses incoming JSON request bodies into `req.body`.
 * - morgan(): Logs HTTP requests (method, status code, response time) in the terminal.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// 1. Load environment variables from .env file
dotenv.config();

// 2. Import database connection function
const connectDB = require('./config/db');

// 3. Import route files
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');

// 4. Connect to MongoDB
connectDB();

// 5. Initialize the Express application
const app = express();

// -----------------------------------------------------------------------------
// CORE APPLICATION MIDDLEWARES
// -----------------------------------------------------------------------------

// Enable CORS so the React frontend (running on a different port like 5173) can access the API
app.use(cors());

// Parse incoming JSON payloads in the request body
app.use(express.json());

// Log incoming HTTP requests in console during development
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// -----------------------------------------------------------------------------
// API ROUTES MOUNTING
// -----------------------------------------------------------------------------

// Health check endpoint (used by hosting platforms like Render/Railway)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Service Request Management API',
    uptime: process.uptime()
  });
});

// Mount modular sub-routers
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);

// Root route welcome message
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h2>🚀 Service Request Management System API is Running!</h2>
      <p>B.Tech Computer Science Engineering - Backend Development</p>
      <p>Use the React frontend or Postman / Thunder Client to test API endpoints.</p>
      <a href="/api/health" style="color: #4F46E5; font-weight: bold;">Check API Health</a>
    </div>
  `);
});

// -----------------------------------------------------------------------------
// 404 NOT FOUND HANDLER
// -----------------------------------------------------------------------------
// If a request hits this point, no route matched the URL
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`
  });
});

// -----------------------------------------------------------------------------
// GLOBAL ERROR HANDLING MIDDLEWARE
// -----------------------------------------------------------------------------
// Express identifies error handlers by having 4 arguments: (err, req, res, next)
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// -----------------------------------------------------------------------------
// START HTTP SERVER
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🌐 Server Port: http://localhost:${PORT}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  console.log('====================================================');
});

module.exports = app;
