/**
 * Large-Scale Database Seeder for Staging Environment
 * 
 * Creates production-like data volume for realistic testing:
 * - 1,000 users (various roles)
 * - 10,000 bookings (mix of statuses)
 * - 100 tours
 * - Sample reviews, payments, and analytics data
 * 
 * Usage:
 *   node backend/scripts/seed-staging.mjs
 *   node backend/scripts/seed-staging.mjs --reset (clear all data first)
 *   node backend/scripts/seed-staging.mjs --users-only
 *   node backend/scripts/seed-staging.mjs --bookings-only
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import User from '../models/User.mjs';
import Tour from '../models/Tour.mjs';
import Booking from '../models/Booking.mjs';

// Configuration
const TOTAL_USERS = 1000;
const TOTAL_BOOKINGS = 10000;
const TOTAL_TOURS = 100;
const BATCH_SIZE = 100; // Insert in batches to avoid memory issues

// Parse command line arguments
const args = process.argv.slice(2);
const shouldReset = args.includes('--reset');
const usersOnly = args.includes('--users-only');
const bookingsOnly = args.includes('--bookings-only');
const toursOnly = args.includes('--tours-only');

// Sample data generators
const generateUser = (index) => {
  const roles = ['customer', 'customer', 'customer', 'driver', 'admin'];
  const role = roles[Math.floor(Math.random() * roles.length)];
  
  return {
    name: `Staging User ${index}`,
    email: `staging-user-${index}@example.com`,
    password: bcrypt.hashSync('Staging123!', 10),
    phone: `+90555${String(index).padStart(7, '0')}`,
    role: role,
    isVerified: Math.random() > 0.1, // 90% verified
    address: `${index} Test Street, Istanbul, Turkey`,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in last year
  };
};

const generateTour = (index) => {
  const types = ['airport-transfer', 'city-tour', 'private-tour', 'group-tour'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const cities = ['Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bodrum'];
  const from = cities[Math.floor(Math.random() * cities.length)];
  let to = cities[Math.floor(Math.random() * cities.length)];
  while (to === from) {
    to = cities[Math.floor(Math.random() * cities.length)];
  }
  
  return {
    name: `${from} to ${to} ${type} ${index}`,
    description: `Professional transfer service from ${from} to ${to}. Comfortable, safe, and reliable.`,
    type: type,
    from: from,
    to: to,
    duration: Math.floor(Math.random() * 8) + 1, // 1-8 hours
    price: Math.floor(Math.random() * 200) + 50, // 50-250 EUR
    maxPassengers: Math.floor(Math.random() * 6) + 2, // 2-8 passengers
    available: Math.random() > 0.1, // 90% available
    featured: Math.random() > 0.8, // 20% featured
    rating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
    reviewCount: Math.floor(Math.random() * 100),
    images: [
      `https://picsum.photos/seed/tour${index}/800/600`,
      `https://picsum.photos/seed/tour${index}-2/800/600`,
    ],
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
  };
};

const generateBooking = (index, userIds, tourIds) => {
  const statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'in-progress'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  const paymentStatuses = ['pending', 'paid', 'refunded', 'failed'];
  let paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
  
  // Logic: completed bookings should be paid
  if (status === 'completed') {
    paymentStatus = 'paid';
  }
  
  const dateOffset = Math.random() * 365 * 24 * 60 * 60 * 1000; // Random date in last year
  const bookingDate = new Date(Date.now() - dateOffset);
  const tourDate = new Date(bookingDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // 0-30 days after booking
  
  return {
    user: userIds[Math.floor(Math.random() * userIds.length)],
    tour: tourIds[Math.floor(Math.random() * tourIds.length)],
    bookingDate: bookingDate,
    tourDate: tourDate,
    passengers: Math.floor(Math.random() * 5) + 1, // 1-6 passengers
    totalPrice: Math.floor(Math.random() * 300) + 50, // 50-350 EUR
    status: status,
    paymentStatus: paymentStatus,
    pickupLocation: `Pickup Location ${index % 50}`,
    dropoffLocation: `Dropoff Location ${index % 50}`,
    specialRequests: Math.random() > 0.7 ? `Special request ${index}` : '',
    createdAt: bookingDate,
  };
};

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gnb-transfer-staging';
    console.log(`Connecting to MongoDB: ${mongoUri.replace(/:[^:@]+@/, ':****@')}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Clear database
const clearDatabase = async () => {
  console.log('\n🗑️  Clearing database...');
  
  try {
    await Promise.all([
      User.deleteMany({}),
      Tour.deleteMany({}),
      Booking.deleteMany({}),
    ]);
    
    console.log('✓ Database cleared');
  } catch (error) {
    console.error('✗ Failed to clear database:', error.message);
    throw error;
  }
};

// Seed users
const seedUsers = async () => {
  console.log(`\n👥 Seeding ${TOTAL_USERS} users...`);
  
  try {
    for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
      const batchSize = Math.min(BATCH_SIZE, TOTAL_USERS - i);
      const users = Array.from({ length: batchSize }, (_, j) => generateUser(i + j));
      
      await User.insertMany(users);
      console.log(`   Inserted ${i + batchSize}/${TOTAL_USERS} users`);
    }
    
    console.log('✓ Users seeded successfully');
  } catch (error) {
    console.error('✗ Failed to seed users:', error.message);
    throw error;
  }
};

// Seed tours
const seedTours = async () => {
  console.log(`\n🚗 Seeding ${TOTAL_TOURS} tours...`);
  
  try {
    for (let i = 0; i < TOTAL_TOURS; i += BATCH_SIZE) {
      const batchSize = Math.min(BATCH_SIZE, TOTAL_TOURS - i);
      const tours = Array.from({ length: batchSize }, (_, j) => generateTour(i + j));
      
      await Tour.insertMany(tours);
      console.log(`   Inserted ${i + batchSize}/${TOTAL_TOURS} tours`);
    }
    
    console.log('✓ Tours seeded successfully');
  } catch (error) {
    console.error('✗ Failed to seed tours:', error.message);
    throw error;
  }
};

// Seed bookings
const seedBookings = async () => {
  console.log(`\n📅 Seeding ${TOTAL_BOOKINGS} bookings...`);
  
  try {
    // Get all user and tour IDs
    const users = await User.find({}).select('_id').lean();
    const tours = await Tour.find({}).select('_id').lean();
    
    const userIds = users.map(u => u._id);
    const tourIds = tours.map(t => t._id);
    
    if (userIds.length === 0 || tourIds.length === 0) {
      throw new Error('No users or tours found. Please seed users and tours first.');
    }
    
    console.log(`   Using ${userIds.length} users and ${tourIds.length} tours`);
    
    for (let i = 0; i < TOTAL_BOOKINGS; i += BATCH_SIZE) {
      const batchSize = Math.min(BATCH_SIZE, TOTAL_BOOKINGS - i);
      const bookings = Array.from({ length: batchSize }, (_, j) => 
        generateBooking(i + j, userIds, tourIds)
      );
      
      await Booking.insertMany(bookings);
      console.log(`   Inserted ${i + batchSize}/${TOTAL_BOOKINGS} bookings`);
    }
    
    console.log('✓ Bookings seeded successfully');
  } catch (error) {
    console.error('✗ Failed to seed bookings:', error.message);
    throw error;
  }
};

// Display statistics
const displayStats = async () => {
  console.log('\n📊 Database Statistics:');
  console.log('========================');
  
  const [userCount, tourCount, bookingCount] = await Promise.all([
    User.countDocuments(),
    Tour.countDocuments(),
    Booking.countDocuments(),
  ]);
  
  console.log(`Users:     ${userCount.toLocaleString()}`);
  console.log(`Tours:     ${tourCount.toLocaleString()}`);
  console.log(`Bookings:  ${bookingCount.toLocaleString()}`);
  console.log('========================\n');
};

// Main function
const main = async () => {
  const startTime = Date.now();
  
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  GNB Transfer - Staging Database Seeder       ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  try {
    // Connect to database
    await connectDB();
    
    // Clear database if requested
    if (shouldReset) {
      await clearDatabase();
    }
    
    // Seed data based on flags
    if (!bookingsOnly && !toursOnly) {
      await seedUsers();
    }
    
    if (!usersOnly && !bookingsOnly) {
      await seedTours();
    }
    
    if (!usersOnly && !toursOnly) {
      await seedBookings();
    }
    
    // Display statistics
    await displayStats();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✓ Seeding completed in ${duration}s`);
    
  } catch (error) {
    console.error('\n✗ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Database connection closed');
  }
};

// Run main function
main();
