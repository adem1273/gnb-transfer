/**
 * Socket.IO Server for Real-Time Driver Location
 *
 * @module socket-server
 * @description Standalone Socket.IO server for real-time driver location updates
 * 
 * Security features:
 * - JWT token authentication for all connections
 * - Role-based access control (driver, admin)
 * - Validates payload data before database operations
 */

import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { DriverLocation } from './models/DriverLocation.mjs';
import { getJwtSecret } from './config/env.mjs';

dotenv.config();

const app = express();
const http = createServer(app);

// Configure CORS based on environment
const corsOrigin = process.env.NODE_ENV === 'production' 
  ? process.env.CORS_ORIGIN || false 
  : '*';

const io = new Server(http, { 
  cors: { 
    origin: corsOrigin,
    credentials: true 
  } 
});

/**
 * Socket.IO authentication middleware
 * Verifies JWT token and attaches user info to socket
 */
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    
    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret);
    
    // Only allow drivers and admins
    if (!['driver', 'admin'].includes(decoded.role)) {
      return next(new Error('Insufficient permissions'));
    }
    
    // Attach user info to socket
    socket.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Token expired'));
    }
    return next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.email} (${socket.user.role})`);
  
  socket.on('driver:location', async (payload) => {
    // payload: { driverId, lat, lng }
    if (!payload || !payload.driverId || typeof payload.lat !== 'number' || typeof payload.lng !== 'number') {
      socket.emit('error', { message: 'Invalid payload format' });
      return;
    }
    
    // Validate coordinates
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
    } catch (error) {
      console.error('Error updating driver location:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.email}`);
  });
});

(async () => {
  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Socket server connected to MongoDB');
  } else {
    console.warn('MONGO_URI not set. Socket server running without database.');
  }
  const port = process.env.SOCKET_PORT || 3001;
  http.listen(port, () => console.log(`Socket server running on port ${port}`));
})();
