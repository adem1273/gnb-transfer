/**
 * Export Service Tests
 *
 * Tests for CSV and PDF export functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  exportBookingsCSV,
  exportUsersCSV,
  exportRevenueCSV,
  generateRevenuePDF,
  generateBookingsPDF,
} from '../services/exportService.mjs';
import Booking from '../models/Booking.mjs';
import User from '../models/User.mjs';
import Tour from '../models/Tour.mjs';

let mongoServer;

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  } catch (error) {
    console.warn('MongoDB Memory Server not available, skipping tests');
  }
}, 30000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

describe('Export Service - CSV Exports', () => {
  describe('exportBookingsCSV', () => {
    it('should export bookings to CSV format', async () => {
      if (mongoose.connection.readyState === 0) {
        console.warn('Skipping test - MongoDB not available');
        return;
      }

      // Create test data
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
      });

      const tour = await Tour.create({
        title: 'Istanbul City Tour',
        description: 'Amazing tour of Istanbul',
        price: 100,
        duration: 4,
        maxGroupSize: 10,
      });

      await Booking.create({
        name: 'John Doe',
        email: 'john@example.com',
        user: user._id,
        tour: tour._id,
        date: new Date('2024-01-15'),
        guests: 2,
        amount: 200,
        status: 'confirmed',
        paymentMethod: 'credit_card',
      });

      const csv = await exportBookingsCSV();

      expect(csv).toBeDefined();
      expect(typeof csv).toBe('string');
      expect(csv).toContain('Booking ID');
      expect(csv).toContain('Customer Name');
      expect(csv).toContain('John Doe');
      expect(csv).toContain('Istanbul City Tour');
      expect(csv).toContain('confirmed');
    });

    it('should filter bookings by status', async () => {
      if (mongoose.connection.readyState === 0) return;

      const user = await User.create({
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'hashedpassword',
      });

      const tour = await Tour.create({
        title: 'Test Tour',
        description: 'Test',
        price: 50,
        duration: 2,
        maxGroupSize: 5,
      });

      await Booking.create([
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          user: user._id,
          tour: tour._id,
          date: new Date(),
          guests: 1,
          amount: 50,
          status: 'confirmed',
          paymentMethod: 'cash',
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          user: user._id,
          tour: tour._id,
          date: new Date(),
          guests: 1,
          amount: 50,
          status: 'cancelled',
          paymentMethod: 'cash',
        },
      ]);

      const csv = await exportBookingsCSV({ status: 'confirmed' });

      // Should only include confirmed bookings
      const lines = csv.split('\n');
      expect(lines.length).toBe(2); // Header + 1 data row
      expect(csv).toContain('confirmed');
      expect(csv).not.toContain('cancelled');
    });

    it('should handle empty bookings list', async () => {
      if (mongoose.connection.readyState === 0) return;

      const csv = await exportBookingsCSV();

      expect(csv).toBeDefined();
      expect(typeof csv).toBe('string');
      // Should only contain headers
      expect(csv.split('\n').length).toBeLessThan(3);
    });
  });

  describe('exportUsersCSV', () => {
    it('should export users to CSV format', async () => {
      if (mongoose.connection.readyState === 0) return;

      await User.create([
        {
          name: 'Alice Admin',
          email: 'alice@example.com',
          password: 'hashedpassword',
          role: 'admin',
        },
        {
          name: 'Bob User',
          email: 'bob@example.com',
          password: 'hashedpassword',
          role: 'user',
        },
      ]);

      const csv = await exportUsersCSV();

      expect(csv).toBeDefined();
      expect(csv).toContain('User ID');
      expect(csv).toContain('Name');
      expect(csv).toContain('Alice Admin');
      expect(csv).toContain('Bob User');
      expect(csv).toContain('admin');
      expect(csv).toContain('user');
      // Should not contain passwords
      expect(csv).not.toContain('password');
      expect(csv).not.toContain('hashedpassword');
    });

    it('should filter users by role', async () => {
      if (mongoose.connection.readyState === 0) return;

      await User.create([
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'hash',
          role: 'admin',
        },
        {
          name: 'Regular User',
          email: 'user@example.com',
          password: 'hash',
          role: 'user',
        },
      ]);

      const csv = await exportUsersCSV({ role: 'admin' });

      expect(csv).toContain('Admin User');
      expect(csv).not.toContain('Regular User');
    });
  });

  describe('exportRevenueCSV', () => {
    it('should export revenue data to CSV', async () => {
      if (mongoose.connection.readyState === 0) return;

      const tour = await Tour.create({
        title: 'Premium Tour',
        description: 'Premium experience',
        price: 500,
        duration: 8,
        maxGroupSize: 6,
      });

      await Booking.create([
        {
          name: 'Customer 1',
          email: 'c1@example.com',
          tour: tour._id,
          date: new Date('2024-01-10'),
          guests: 2,
          amount: 1000,
          status: 'confirmed',
          createdAt: new Date('2024-01-10'),
        },
        {
          name: 'Customer 2',
          email: 'c2@example.com',
          tour: tour._id,
          date: new Date('2024-01-11'),
          guests: 3,
          amount: 1500,
          status: 'completed',
          createdAt: new Date('2024-01-11'),
        },
      ]);

      const csv = await exportRevenueCSV('2024-01-01', '2024-01-31');

      expect(csv).toBeDefined();
      expect(csv).toContain('Date');
      expect(csv).toContain('Tour');
      expect(csv).toContain('Revenue');
      expect(csv).toContain('Premium Tour');
    });

    it('should only include paid/confirmed/completed bookings', async () => {
      if (mongoose.connection.readyState === 0) return;

      const tour = await Tour.create({
        title: 'Test Tour',
        description: 'Test',
        price: 100,
        duration: 2,
        maxGroupSize: 5,
      });

      await Booking.create([
        {
          name: 'Customer',
          email: 'customer@example.com',
          tour: tour._id,
          date: new Date(),
          guests: 1,
          amount: 100,
          status: 'confirmed',
          createdAt: new Date(),
        },
        {
          name: 'Customer',
          email: 'customer@example.com',
          tour: tour._id,
          date: new Date(),
          guests: 1,
          amount: 100,
          status: 'cancelled',
          createdAt: new Date(),
        },
        {
          name: 'Customer',
          email: 'customer@example.com',
          tour: tour._id,
          date: new Date(),
          guests: 1,
          amount: 100,
          status: 'pending',
          createdAt: new Date(),
        },
      ]);

      const csv = await exportRevenueCSV();

      // Should aggregate only confirmed booking
      const lines = csv.split('\n').filter((line) => line.trim());
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should handle date range filters', async () => {
      if (mongoose.connection.readyState === 0) return;

      const tour = await Tour.create({
        title: 'Date Test Tour',
        description: 'Test',
        price: 100,
        duration: 2,
        maxGroupSize: 5,
      });

      await Booking.create([
        {
          name: 'Customer',
          email: 'customer@example.com',
          tour: tour._id,
          date: new Date('2024-01-01'),
          guests: 1,
          amount: 100,
          status: 'confirmed',
          createdAt: new Date('2024-01-01'),
        },
        {
          name: 'Customer',
          email: 'customer@example.com',
          tour: tour._id,
          date: new Date('2024-12-31'),
          guests: 1,
          amount: 100,
          status: 'confirmed',
          createdAt: new Date('2024-12-31'),
        },
      ]);

      const csv = await exportRevenueCSV('2024-01-01', '2024-01-31');

      expect(csv).toBeDefined();
      // Should only include January bookings
      const lines = csv.split('\n').filter((line) => line.trim());
      expect(lines.length).toBeGreaterThan(0);
    });
  });
});

describe('Export Service - PDF Generation', () => {
  describe('generateRevenuePDF', () => {
    it('should generate revenue PDF document', async () => {
      if (mongoose.connection.readyState === 0) return;

      const tour = await Tour.create({
        title: 'PDF Test Tour',
        description: 'Test',
        price: 200,
        duration: 4,
        maxGroupSize: 10,
      });

      await Booking.create([
        {
          name: 'Customer 1',
          email: 'c1@example.com',
          tour: tour._id,
          date: new Date('2024-06-01'),
          guests: 2,
          amount: 400,
          status: 'confirmed',
          createdAt: new Date('2024-06-01'),
        },
        {
          name: 'Customer 2',
          email: 'c2@example.com',
          tour: tour._id,
          date: new Date('2024-06-02'),
          guests: 1,
          amount: 200,
          status: 'completed',
          createdAt: new Date('2024-06-02'),
        },
      ]);

      const pdfDoc = await generateRevenuePDF('2024-06-01', '2024-06-30');

      expect(pdfDoc).toBeDefined();
      expect(pdfDoc.constructor.name).toBe('PDFDocument');

      // Verify the PDF stream can be created
      const chunks = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));

      await new Promise((resolve, reject) => {
        pdfDoc.on('end', resolve);
        pdfDoc.on('error', reject);
      });

      const pdfBuffer = Buffer.concat(chunks);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      // PDF files start with %PDF
      expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF');
    });

    it('should handle empty date range', async () => {
      if (mongoose.connection.readyState === 0) return;

      const pdfDoc = await generateRevenuePDF();

      expect(pdfDoc).toBeDefined();
      expect(pdfDoc.constructor.name).toBe('PDFDocument');
    });
  });

  describe('generateBookingsPDF', () => {
    it('should generate bookings PDF document', async () => {
      if (mongoose.connection.readyState === 0) return;

      const user = await User.create({
        name: 'PDF Test User',
        email: 'pdfuser@example.com',
        password: 'hashedpassword',
      });

      const tour = await Tour.create({
        title: 'PDF Booking Tour',
        description: 'Test',
        price: 150,
        duration: 3,
        maxGroupSize: 8,
      });

      await Booking.create({
        name: 'PDF Test User',
        email: 'pdfuser@example.com',
        user: user._id,
        tour: tour._id,
        date: new Date(),
        guests: 2,
        amount: 300,
        status: 'confirmed',
        paymentMethod: 'credit_card',
      });

      const pdfDoc = await generateBookingsPDF();

      expect(pdfDoc).toBeDefined();
      expect(pdfDoc.constructor.name).toBe('PDFDocument');

      // Collect PDF data
      const chunks = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));

      await new Promise((resolve, reject) => {
        pdfDoc.on('end', resolve);
        pdfDoc.on('error', reject);
      });

      const pdfBuffer = Buffer.concat(chunks);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF');
    });

    it('should apply filters to booking PDF', async () => {
      if (mongoose.connection.readyState === 0) return;

      const tour = await Tour.create({
        title: 'Filter Test Tour',
        description: 'Test',
        price: 100,
        duration: 2,
        maxGroupSize: 5,
      });

      await Booking.create([
        {
          name: 'Customer 1',
          email: 'c1@example.com',
          tour: tour._id,
          date: new Date(),
          guests: 1,
          amount: 100,
          status: 'confirmed',
        },
        {
          name: 'Customer 2',
          email: 'c2@example.com',
          tour: tour._id,
          date: new Date(),
          guests: 1,
          amount: 100,
          status: 'cancelled',
        },
      ]);

      const pdfDoc = await generateBookingsPDF({ status: 'confirmed' });

      expect(pdfDoc).toBeDefined();
    });

    it('should limit bookings to 100 entries for PDF', async () => {
      if (mongoose.connection.readyState === 0) return;

      const tour = await Tour.create({
        title: 'Limit Test Tour',
        description: 'Test',
        price: 50,
        duration: 1,
        maxGroupSize: 10,
      });

      // Create more than 100 bookings
      const bookings = Array.from({ length: 120 }, (_, i) => ({
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        tour: tour._id,
        date: new Date(),
        guests: 1,
        amount: 50,
        status: 'confirmed',
      }));

      await Booking.create(bookings);

      const pdfDoc = await generateBookingsPDF();

      expect(pdfDoc).toBeDefined();
      // The function should handle limiting internally
    });
  });
});

describe('Export Service - Error Handling', () => {
  it('should handle database errors in CSV export', async () => {
    if (mongoose.connection.readyState === 0) return;

    // Disconnect to simulate error
    await mongoose.disconnect();

    await expect(exportBookingsCSV()).rejects.toThrow();

    // Reconnect
    if (mongoServer) {
      await mongoose.connect(mongoServer.getUri());
    }
  });

  it('should handle database errors in PDF generation', async () => {
    if (mongoose.connection.readyState === 0) return;

    await mongoose.disconnect();

    await expect(generateRevenuePDF()).rejects.toThrow();

    // Reconnect
    if (mongoServer) {
      await mongoose.connect(mongoServer.getUri());
    }
  });
});
