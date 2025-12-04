/**
 * Database Seed Script
 * Populates the database with sample data for development and testing
 *
 * Usage:
 *   npm run seed              - Run all seeders
 *   npm run seed:users        - Seed users only
 *   npm run seed:tours        - Seed tours only
 *   npm run seed:reset        - Clear and re-seed all data
 *
 * @module scripts/seed
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.mjs';
import Tour from '../models/Tour.mjs';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Error: MONGO_URI environment variable is required');
  process.exit(1);
}

/**
 * Sample users data
 */
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@gnbtransfer.com',
    password: 'Admin123!',
    role: 'admin',
  },
  {
    name: 'Manager User',
    email: 'manager@gnbtransfer.com',
    password: 'Manager123!',
    role: 'manager',
  },
  {
    name: 'Driver One',
    email: 'driver1@gnbtransfer.com',
    password: 'Driver123!',
    role: 'driver',
  },
  {
    name: 'Test User',
    email: 'user@gnbtransfer.com',
    password: 'User1234!',
    role: 'user',
  },
];

/**
 * Sample tours data
 */
const sampleTours = [
  {
    title: 'Airport Transfer - Istanbul',
    title_de: 'Flughafentransfer - Istanbul',
    title_es: 'Traslado al aeropuerto - Estambul',
    description:
      'Comfortable and reliable airport transfer service to/from Istanbul Airport. Our professional drivers will ensure a smooth journey.',
    description_de:
      'Komfortabler und zuverlässiger Flughafentransfer zum/vom Flughafen Istanbul. Unsere professionellen Fahrer sorgen für eine reibungslose Fahrt.',
    description_es:
      'Servicio de traslado cómodo y confiable desde/hacia el aeropuerto de Estambul. Nuestros conductores profesionales garantizan un viaje sin problemas.',
    price: 50,
    duration: 60,
    discount: 0,
    isCampaign: false,
    availableSeats: 50,
  },
  {
    title: 'City Tour - Istanbul Highlights',
    title_de: 'Stadtrundfahrt - Istanbul Highlights',
    title_es: 'Tour de la ciudad - Lo mejor de Estambul',
    description:
      'Explore the best of Istanbul with our comprehensive city tour. Visit iconic landmarks including Hagia Sophia, Blue Mosque, and Grand Bazaar.',
    description_de:
      'Entdecken Sie das Beste von Istanbul mit unserer umfassenden Stadtrundfahrt. Besuchen Sie berühmte Sehenswürdigkeiten wie die Hagia Sophia, die Blaue Moschee und den Großen Basar.',
    description_es:
      'Explore lo mejor de Estambul con nuestro tour completo de la ciudad. Visite lugares emblemáticos como Santa Sofía, la Mezquita Azul y el Gran Bazar.',
    price: 120,
    duration: 480,
    discount: 10,
    isCampaign: true,
    availableSeats: 20,
  },
  {
    title: 'Bosphorus Cruise',
    title_de: 'Bosporus-Kreuzfahrt',
    title_es: 'Crucero por el Bósforo',
    description:
      'Enjoy a scenic cruise along the Bosphorus strait. Experience the stunning views of Istanbul from the water.',
    description_de:
      'Genießen Sie eine malerische Kreuzfahrt entlang der Meerenge des Bosporus. Erleben Sie die atemberaubende Aussicht auf Istanbul vom Wasser aus.',
    description_es:
      'Disfrute de un crucero panorámico por el estrecho del Bósforo. Experimente las impresionantes vistas de Estambul desde el agua.',
    price: 80,
    duration: 180,
    discount: 15,
    isCampaign: true,
    availableSeats: 30,
  },
  {
    title: 'Private VIP Transfer',
    title_de: 'Privater VIP-Transfer',
    title_es: 'Traslado VIP privado',
    description:
      'Premium VIP transfer service with luxury vehicles. Includes meet & greet, complimentary refreshments, and Wi-Fi.',
    description_de:
      'Premium-VIP-Transferservice mit Luxusfahrzeugen. Inklusive Begrüßung, kostenlosen Erfrischungen und WLAN.',
    description_es:
      'Servicio de traslado VIP premium con vehículos de lujo. Incluye bienvenida, refrescos de cortesía y Wi-Fi.',
    price: 150,
    duration: 90,
    discount: 0,
    isCampaign: false,
    availableSeats: 10,
  },
  {
    title: 'Cappadocia Day Trip',
    title_de: 'Kappadokien Tagesausflug',
    title_es: 'Excursión de un día a Capadocia',
    description:
      'Full-day trip to Cappadocia with flights included. Visit fairy chimneys, underground cities, and enjoy optional hot air balloon ride.',
    description_de:
      'Ganztägiger Ausflug nach Kappadokien mit Flügen. Besuchen Sie Feenkamine, unterirdische Städte und genießen Sie eine optionale Heißluftballonfahrt.',
    description_es:
      'Excursión de un día completo a Capadocia con vuelos incluidos. Visite chimeneas de hadas, ciudades subterráneas y disfrute de un paseo opcional en globo aerostático.',
    price: 350,
    duration: 960,
    discount: 20,
    isCampaign: true,
    availableSeats: 15,
  },
];

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

/**
 * Seed users
 */
async function seedUsers() {
  console.log('\n📝 Seeding users...');

  for (const userData of sampleUsers) {
    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
      console.log(`  ⏭️  User ${userData.email} already exists, skipping`);
      continue;
    }

    // Hash password before saving (if User model doesn't do it automatically)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user = new User({
      ...userData,
      password: hashedPassword,
    });

    await user.save();
    console.log(`  ✅ Created user: ${userData.email} (${userData.role})`);
  }

  console.log('✅ Users seeded successfully');
}

/**
 * Seed tours
 */
async function seedTours() {
  console.log('\n📝 Seeding tours...');

  for (const tourData of sampleTours) {
    const existingTour = await Tour.findOne({ title: tourData.title });

    if (existingTour) {
      console.log(`  ⏭️  Tour "${tourData.title}" already exists, skipping`);
      continue;
    }

    const tour = new Tour(tourData);
    await tour.save();
    console.log(`  ✅ Created tour: ${tourData.title}`);
  }

  console.log('✅ Tours seeded successfully');
}

/**
 * Clear all data (use with caution!)
 */
async function clearData() {
  console.log('\n⚠️  Clearing all data...');

  await User.deleteMany({});
  console.log('  🗑️  Users cleared');

  await Tour.deleteMany({});
  console.log('  🗑️  Tours cleared');

  console.log('✅ All data cleared');
}

/**
 * Main seed function
 */
async function seed() {
  const args = process.argv.slice(2);
  const reset = args.includes('--reset');
  const usersOnly = args.includes('--users');
  const toursOnly = args.includes('--tours');

  try {
    await connectDB();

    if (reset) {
      await clearData();
    }

    if (usersOnly) {
      await seedUsers();
    } else if (toursOnly) {
      await seedTours();
    } else {
      await seedUsers();
      await seedTours();
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📋 Sample login credentials:');
    console.log('   Admin:   admin@gnbtransfer.com / Admin123!');
    console.log('   Manager: manager@gnbtransfer.com / Manager123!');
    console.log('   Driver:  driver1@gnbtransfer.com / Driver123!');
    console.log('   User:    user@gnbtransfer.com / User1234!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
seed();
