/**
 * ==============================================================================
 * DATABASE SEED SCRIPT (utils/seed.js)
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * What is Database Seeding?
 * Seeding is the process of populating a database with initial demo data.
 * It is extremely useful for development, testing, and presenting to professors
 * because you don't have to manually register users and create requests each time!
 * 
 * TO RUN THIS SCRIPT:
 * In backend folder: `npm run seed` or `node utils/seed.js`
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');

const seedData = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/service_request_db';
    console.log(`🔌 Connecting to MongoDB: ${connUri}`);
    await mongoose.connect(connUri);

    console.log('🧹 Clearing existing database collections...');
    await User.deleteMany({});
    await ServiceRequest.deleteMany({});

    console.log('👤 Creating demo users (Customers, Service Providers, Admin)...');

    // 1. Create Customers
    const customer1 = await User.create({
      name: 'Kavya Sharma (Customer)',
      email: 'customer@example.com',
      password: 'password123',
      role: 'customer',
      phone: '+91 98765 43210',
      address: 'Flat 402, Lotus Residency, Mumbai'
    });

    const customer2 = await User.create({
      name: 'Rohit Verma (Customer 2)',
      email: 'rohit@example.com',
      password: 'password123',
      role: 'customer',
      phone: '+91 98765 12345',
      address: 'House 18, Green Meadows, Pune'
    });

    // 2. Create Service Providers
    const providerPlumber = await User.create({
      name: 'Rajesh Kumar (Plumber)',
      email: 'plumber@example.com',
      password: 'password123',
      role: 'provider',
      phone: '+91 91234 56789',
      specialization: 'plumbing',
      isAvailable: true
    });

    const providerElectrician = await User.create({
      name: 'Amit Patel (Electrician)',
      email: 'electrician@example.com',
      password: 'password123',
      role: 'provider',
      phone: '+91 91234 98765',
      specialization: 'electrical',
      isAvailable: true
    });

    // 3. Create Admin
    const admin = await User.create({
      name: 'Admin Supervisor',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      phone: '+91 90000 00000',
      address: 'HQ Central Office'
    });

    console.log('📋 Creating demo service requests with workflow status...');

    // Request 1: Pending (Created by Kavya, unassigned)
    const req1 = await ServiceRequest.create({
      title: 'Water Purifier RO Filter Leakage',
      description: 'Water is dripping rapidly from the RO purifier unit under the cabinet.',
      category: 'plumbing',
      priority: 'high',
      serviceAddress: 'Flat 402, Lotus Residency, Mumbai',
      customerPhone: '+91 98765 43210',
      customer: customer1._id,
      serviceProvider: null,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          updatedAt: new Date(Date.now() - 3 * 3600000), // 3 hours ago
          updatedBy: customer1._id,
          note: 'Request created by customer'
        }
      ]
    });

    // Request 2: Assigned (Created by Kavya, assigned to Rajesh Plumber)
    const req2 = await ServiceRequest.create({
      title: 'Bathroom Flush Tank Not Filling',
      description: 'The master bathroom flush tank inlet valve appears stuck or blocked.',
      category: 'plumbing',
      priority: 'medium',
      serviceAddress: 'Flat 402, Lotus Residency, Mumbai',
      customerPhone: '+91 98765 43210',
      customer: customer1._id,
      serviceProvider: providerPlumber._id,
      status: 'assigned',
      statusHistory: [
        {
          status: 'pending',
          updatedAt: new Date(Date.now() - 5 * 3600000),
          updatedBy: customer1._id,
          note: 'Request created by customer'
        },
        {
          status: 'assigned',
          updatedAt: new Date(Date.now() - 2 * 3600000),
          updatedBy: admin._id,
          note: `Assigned to Rajesh Kumar (Plumbing)`
        }
      ]
    });

    // Request 3: In-Progress (Created by Rohit, assigned to Amit Electrician)
    const req3 = await ServiceRequest.create({
      title: 'Main Circuit Breaker Tripping Repeatedly',
      description: 'MCB trips whenever microwave or geyser is switched on.',
      category: 'electrical',
      priority: 'urgent',
      serviceAddress: 'House 18, Green Meadows, Pune',
      customerPhone: '+91 98765 12345',
      customer: customer2._id,
      serviceProvider: providerElectrician._id,
      status: 'in-progress',
      statusHistory: [
        {
          status: 'pending',
          updatedAt: new Date(Date.now() - 6 * 3600000),
          updatedBy: customer2._id,
          note: 'Request created by customer'
        },
        {
          status: 'assigned',
          updatedAt: new Date(Date.now() - 4 * 3600000),
          updatedBy: admin._id,
          note: `Assigned to Amit Patel (Electrical)`
        },
        {
          status: 'in-progress',
          updatedAt: new Date(Date.now() - 1 * 3600000),
          updatedBy: providerElectrician._id,
          note: 'Electrician arrived at premises and started electrical load diagnostics.'
        }
      ]
    });

    // Request 4: Completed (Created by Kavya, fixed by Rajesh Plumber)
    const req4 = await ServiceRequest.create({
      title: 'Kitchen Sink Drain Clogged',
      description: 'Grease and food residue blocking the drain pipe completely.',
      category: 'plumbing',
      priority: 'medium',
      serviceAddress: 'Flat 402, Lotus Residency, Mumbai',
      customerPhone: '+91 98765 43210',
      customer: customer1._id,
      serviceProvider: providerPlumber._id,
      status: 'completed',
      resolutionNotes: 'Disassembled the P-trap, cleared blockage, replaced worn washer, and tested with hot water flow. Zero leakage observed.',
      statusHistory: [
        {
          status: 'pending',
          updatedAt: new Date(Date.now() - 24 * 3600000),
          updatedBy: customer1._id,
          note: 'Request created by customer'
        },
        {
          status: 'assigned',
          updatedAt: new Date(Date.now() - 20 * 3600000),
          updatedBy: admin._id,
          note: 'Assigned to Rajesh Kumar'
        },
        {
          status: 'in-progress',
          updatedAt: new Date(Date.now() - 18 * 3600000),
          updatedBy: providerPlumber._id,
          note: 'Plumber began sink pipe cleaning'
        },
        {
          status: 'completed',
          updatedAt: new Date(Date.now() - 17 * 3600000),
          updatedBy: providerPlumber._id,
          note: 'Completed repairs successfully'
        }
      ]
    });

    console.log('✅ Demo Data Seeded Successfully!');
    console.log('----------------------------------------------------');
    console.log('📋 DEMO CREDENTIALS FOR TESTING & EVALUATION:');
    console.log('1. Customer: customer@example.com / password123');
    console.log('2. Customer 2: rohit@example.com / password123');
    console.log('3. Plumber (Provider): plumber@example.com / password123');
    console.log('4. Electrician (Provider): electrician@example.com / password123');
    console.log('5. Admin: admin@example.com / password123');
    console.log('----------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
