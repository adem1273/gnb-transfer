#!/usr/bin/env node

/**
 * Manual Test Script for Image Upload Endpoint
 * 
 * This script demonstrates how to test the image upload endpoint
 * 
 * Prerequisites:
 * 1. Set CLOUDINARY_* env vars in backend/.env
 * 2. Start the server: npm run dev
 * 3. Have a valid admin JWT token
 * 
 * Usage:
 * node scripts/test-upload.mjs <path-to-image> <admin-jwt-token>
 */

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

const API_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const UPLOAD_ENDPOINT = `${API_URL}/api/v1/upload/image`;

async function testImageUpload(imagePath, token) {
  try {
    // Validate file exists
    if (!fs.existsSync(imagePath)) {
      console.error('❌ Error: File not found:', imagePath);
      return;
    }

    // Check file extension
    const ext = path.extname(imagePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      console.error('❌ Error: Invalid file type. Must be JPEG, PNG, or WebP');
      return;
    }

    // Check file size (2MB max)
    const stats = fs.statSync(imagePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    if (fileSizeInMB > 2) {
      console.error(`❌ Error: File size (${fileSizeInMB.toFixed(2)}MB) exceeds 2MB limit`);
      return;
    }

    console.log('📤 Uploading image...');
    console.log('   File:', imagePath);
    console.log('   Size:', `${fileSizeInMB.toFixed(2)}MB`);
    console.log('   Type:', ext);
    console.log('');

    // Create form data
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));

    // Make request
    const response = await axios.post(UPLOAD_ENDPOINT, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Upload successful!');
    console.log('   URL:', response.data.data.url);
    console.log('');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Upload failed!');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data.message);
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node test-upload.mjs <path-to-image> <admin-jwt-token>');
  console.log('');
  console.log('Example:');
  console.log('  node test-upload.mjs ./test-image.jpg eyJhbGciOiJIUzI1NiIsInR5cCI6...');
  process.exit(1);
}

const [imagePath, token] = args;
testImageUpload(imagePath, token);
