/**
 * Socket.IO Server for Real-Time Driver Location
 *
 * @module socket-server
 * @description Standalone Socket.IO server for real-time driver location updates
 */

import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { DriverLocation } from './models/DriverLocation.mjs';

dotenv.config();

const app = express();
const http = createServer(app);
const io = new Server(http, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('driver:location', async (payload) => {
    // payload: { driverId, lat, lng }
    if (!payload || !payload.driverId || typeof payload.lat !== 'number' || typeof payload.lng !== 'number') {
      return;
    }
    await DriverLocation.findOneAndUpdate(
      { driverId: payload.driverId },
      { lat: payload.lat, lng: payload.lng, updatedAt: new Date() },
      { upsert: true }
    );
    socket.broadcast.emit('driver:update', payload);
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
