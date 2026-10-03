/**
 * ==============================================================================
 * DATABASE CONFIGURATION: MongoDB Connection via Mongoose
 * ==============================================================================
 * 
 * WHAT IS MONGOOSE?
 * Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js.
 * It provides a straight-forward, schema-based solution to model your application data.
 * It includes built-in type casting, validation, query building, and business logic hooks.
 * 
 * HOW DOES THIS WORK?
 * 1. Reads the connection URI from environment variables (process.env.MONGODB_URI).
 * 2. Uses mongoose.connect() to establish an asynchronous connection.
 * 3. Handles success and failure gracefully, providing clear debugging output.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/service_request_db';
    
    // Connect to MongoDB
    const conn = await mongoose.connect(connUri);

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log(`📦 Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`💡 Tip: Make sure your local MongoDB daemon is running (e.g., 'brew services start mongodb-community')`);
    console.error(`💡 Or update MONGODB_URI in your .env file with your MongoDB Atlas connection string.`);
    
    // Exit process with failure code (1) if database cannot be reached
    process.exit(1);
  }
};

module.exports = connectDB;
