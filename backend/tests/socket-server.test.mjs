/**
 * Socket.IO Server Tests
 * 
 * Tests for real-time driver location updates and socket connection handling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let httpServer;
let ioServer;
let serverUrl;
const JWT_SECRET = 'test-socket-secret';

// Mock DriverLocation model
const DriverLocation = {
  findOneAndUpdate: jest.fn(),
};

beforeAll(async () => {
  // Start in-memory MongoDB
  try {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  } catch (error) {
    console.warn('MongoDB Memory Server not available, using mock DB');
  }

  // Create HTTP server for Socket.IO
  httpServer = createServer();
  ioServer = new Server(httpServer, {
    cors: {
      origin: '*',
      credentials: true,
    },
  });

  // Socket authentication middleware
  ioServer.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      // Only allow drivers and admins
      if (!['driver', 'admin'].includes(decoded.role)) {
        return next(new Error('Insufficient permissions'));
      }

      socket.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      return next(new Error('Invalid token'));
    }
  });

  // Socket event handlers
  ioServer.on('connection', (socket) => {
    socket.on('driver:location', async (payload) => {
      if (!payload || !payload.driverId || typeof payload.lat !== 'number' || typeof payload.lng !== 'number') {
        socket.emit('error', { message: 'Invalid payload format' });
        return;
      }

      if (payload.lat < -90 || payload.lat > 90 || payload.lng < -180 || payload.lng > 180) {
        socket.emit('error', { message: 'Invalid coordinates' });
        return;
      }

      try {
        await DriverLocation.findOneAndUpdate(
          { driverId: payload.driverId },
          { lat: payload.lat, lng: payload.lng, updatedAt: new Date() },
          { upsert: true }
        );
        socket.broadcast.emit('driver:update', payload);
        socket.emit('location:success', { message: 'Location updated' });
      } catch (error) {
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    socket.on('booking:update', (payload) => {
      if (!payload || !payload.bookingId) {
        socket.emit('error', { message: 'Invalid booking payload' });
        return;
      }
      socket.broadcast.emit('booking:updated', payload);
    });

    socket.on('disconnect', () => {
      // Cleanup on disconnect
    });
  });

  // Start server
  await new Promise((resolve) => {
    httpServer.listen(0, () => {
      const port = httpServer.address().port;
      serverUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (ioServer) {
    ioServer.close();
  }
  if (httpServer) {
    httpServer.close();
  }
  if (mongoServer) {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Socket.IO Server - Connection', () => {
  it('should reject connection without token', (done) => {
    const client = ioClient(serverUrl);

    client.on('connect_error', (error) => {
      expect(error.message).toBe('Authentication token required');
      client.close();
      done();
    });
  });

  it('should reject connection with invalid token', (done) => {
    const client = ioClient(serverUrl, {
      auth: { token: 'invalid-token' },
    });

    client.on('connect_error', (error) => {
      expect(error.message).toBe('Invalid token');
      client.close();
      done();
    });
  });

  it('should reject connection with expired token', (done) => {
    const expiredToken = jwt.sign(
      { userId: '123', email: 'driver@test.com', role: 'driver' },
      JWT_SECRET,
      { expiresIn: '-1h' } // Already expired
    );

    const client = ioClient(serverUrl, {
      auth: { token: expiredToken },
    });

    client.on('connect_error', (error) => {
      expect(error.message).toBe('Token expired');
      client.close();
      done();
    });
  });

  it('should reject connection for non-driver/admin roles', (done) => {
    const userToken = jwt.sign(
      { userId: '123', email: 'user@test.com', role: 'user' },
      JWT_SECRET
    );

    const client = ioClient(serverUrl, {
      auth: { token: userToken },
    });

    client.on('connect_error', (error) => {
      expect(error.message).toBe('Insufficient permissions');
      client.close();
      done();
    });
  });

  it('should accept connection with valid driver token', (done) => {
    const driverToken = jwt.sign(
      { userId: '123', email: 'driver@test.com', role: 'driver' },
      JWT_SECRET
    );

    const client = ioClient(serverUrl, {
      auth: { token: driverToken },
    });

    client.on('connect', () => {
      expect(client.connected).toBe(true);
      client.close();
      done();
    });

    client.on('connect_error', (error) => {
      client.close();
      done(error);
    });
  });

  it('should accept connection with valid admin token', (done) => {
    const adminToken = jwt.sign(
      { userId: '456', email: 'admin@test.com', role: 'admin' },
      JWT_SECRET
    );

    const client = ioClient(serverUrl, {
      auth: { token: adminToken },
    });

    client.on('connect', () => {
      expect(client.connected).toBe(true);
      client.close();
      done();
    });

    client.on('connect_error', (error) => {
      client.close();
      done(error);
    });
  });
});

describe('Socket.IO Server - Driver Location Updates', () => {
  let driverClient;
  let adminClient;

  beforeEach((done) => {
    const driverToken = jwt.sign(
      { userId: '123', email: 'driver@test.com', role: 'driver' },
      JWT_SECRET
    );

    const adminToken = jwt.sign(
      { userId: '456', email: 'admin@test.com', role: 'admin' },
      JWT_SECRET
    );

    driverClient = ioClient(serverUrl, { auth: { token: driverToken } });
    adminClient = ioClient(serverUrl, { auth: { token: adminToken } });

    let connectedCount = 0;
    const checkConnected = () => {
      connectedCount++;
      if (connectedCount === 2) done();
    };

    driverClient.on('connect', checkConnected);
    adminClient.on('connect', checkConnected);
  });

  afterEach(() => {
    if (driverClient) driverClient.close();
    if (adminClient) adminClient.close();
  });

  it('should update driver location successfully', (done) => {
    DriverLocation.findOneAndUpdate.mockResolvedValue({});

    const locationData = {
      driverId: 'driver123',
      lat: 41.0082,
      lng: 28.9784,
    };

    driverClient.on('location:success', (response) => {
      expect(response.message).toBe('Location updated');
      expect(DriverLocation.findOneAndUpdate).toHaveBeenCalledWith(
        { driverId: 'driver123' },
        expect.objectContaining({
          lat: 41.0082,
          lng: 28.9784,
        }),
        { upsert: true }
      );
      done();
    });

    driverClient.emit('driver:location', locationData);
  });

  it('should broadcast driver location to other clients', (done) => {
    DriverLocation.findOneAndUpdate.mockResolvedValue({});

    const locationData = {
      driverId: 'driver123',
      lat: 41.0082,
      lng: 28.9784,
    };

    adminClient.on('driver:update', (payload) => {
      expect(payload).toEqual(locationData);
      done();
    });

    driverClient.emit('driver:location', locationData);
  });

  it('should reject invalid location payload (missing fields)', (done) => {
    const invalidPayload = {
      driverId: 'driver123',
      // Missing lat and lng
    };

    driverClient.on('error', (error) => {
      expect(error.message).toBe('Invalid payload format');
      done();
    });

    driverClient.emit('driver:location', invalidPayload);
  });

  it('should reject invalid coordinates (out of range)', (done) => {
    const invalidCoordinates = {
      driverId: 'driver123',
      lat: 100, // Invalid: > 90
      lng: 28.9784,
    };

    driverClient.on('error', (error) => {
      expect(error.message).toBe('Invalid coordinates');
      done();
    });

    driverClient.emit('driver:location', invalidCoordinates);
  });

  it('should handle database errors gracefully', (done) => {
    DriverLocation.findOneAndUpdate.mockRejectedValue(new Error('DB Error'));

    const locationData = {
      driverId: 'driver123',
      lat: 41.0082,
      lng: 28.9784,
    };

    driverClient.on('error', (error) => {
      expect(error.message).toBe('Failed to update location');
      done();
    });

    driverClient.emit('driver:location', locationData);
  });
});

describe('Socket.IO Server - Booking Updates', () => {
  let client1;
  let client2;

  beforeEach((done) => {
    const token = jwt.sign(
      { userId: '123', email: 'driver@test.com', role: 'driver' },
      JWT_SECRET
    );

    client1 = ioClient(serverUrl, { auth: { token } });
    client2 = ioClient(serverUrl, { auth: { token } });

    let connectedCount = 0;
    const checkConnected = () => {
      connectedCount++;
      if (connectedCount === 2) done();
    };

    client1.on('connect', checkConnected);
    client2.on('connect', checkConnected);
  });

  afterEach(() => {
    if (client1) client1.close();
    if (client2) client2.close();
  });

  it('should broadcast booking updates to other clients', (done) => {
    const bookingData = {
      bookingId: 'booking123',
      status: 'confirmed',
      driverId: 'driver456',
    };

    client2.on('booking:updated', (payload) => {
      expect(payload).toEqual(bookingData);
      done();
    });

    client1.emit('booking:update', bookingData);
  });

  it('should reject invalid booking payload', (done) => {
    const invalidPayload = {
      // Missing bookingId
      status: 'confirmed',
    };

    client1.on('error', (error) => {
      expect(error.message).toBe('Invalid booking payload');
      done();
    });

    client1.emit('booking:update', invalidPayload);
  });
});

describe('Socket.IO Server - Reconnection', () => {
  it('should handle reconnection successfully', (done) => {
    const token = jwt.sign(
      { userId: '123', email: 'driver@test.com', role: 'driver' },
      JWT_SECRET
    );

    const client = ioClient(serverUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 100,
    });

    let connectCount = 0;

    client.on('connect', () => {
      connectCount++;

      if (connectCount === 1) {
        // First connection, disconnect to test reconnection
        client.io.engine.close();
      } else if (connectCount === 2) {
        // Reconnected successfully
        expect(connectCount).toBe(2);
        client.close();
        done();
      }
    });
  });
});
