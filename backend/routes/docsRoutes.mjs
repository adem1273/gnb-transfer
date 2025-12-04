/**
 * API Documentation Routes
 *
 * @module routes/docsRoutes
 * @description Provides API documentation endpoint with OpenAPI-like structure
 */

import express from 'express';

const router = express.Router();

const apiDocs = {
  openapi: '3.0.0',
  info: {
    title: 'GNB Transfer API',
    version: '1.1.0',
    description: 'GNB Transfer - Tourism and Transfer Services API',
    contact: {
      name: 'GNB Transfer Support',
      email: 'support@gnbtransfer.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API Version 1 (Current)',
    },
    {
      url: '/api',
      description: 'Legacy API (Deprecated)',
    },
  ],
  paths: {
    '/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        description: 'Refresh access token using refresh token',
        tags: ['Authentication'],
      },
    },
    '/users/register': {
      post: {
        summary: 'Register new user',
        description: 'Create a new user account',
        tags: ['Users'],
      },
    },
    '/users/login': {
      post: {
        summary: 'User login',
        description: 'Authenticate user and get tokens',
        tags: ['Users'],
      },
    },
    '/users/logout': {
      post: {
        summary: 'User logout',
        description: 'Logout and revoke refresh token',
        tags: ['Users'],
      },
    },
    '/users/profile': {
      get: {
        summary: 'Get user profile',
        description: 'Get authenticated user profile',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
      },
    },
    '/tours': {
      get: {
        summary: 'List all tours',
        description: 'Get list of available tours',
        tags: ['Tours'],
      },
    },
    '/tours/{id}': {
      get: {
        summary: 'Get tour details',
        description: 'Get details of a specific tour',
        tags: ['Tours'],
      },
    },
    '/bookings': {
      post: {
        summary: 'Create booking',
        description: 'Create a new booking',
        tags: ['Bookings'],
        security: [{ bearerAuth: [] }],
      },
      get: {
        summary: 'List user bookings',
        description: 'Get list of authenticated user bookings',
        tags: ['Bookings'],
        security: [{ bearerAuth: [] }],
      },
    },
    '/coupons/validate': {
      post: {
        summary: 'Validate coupon',
        description: 'Validate a coupon code',
        tags: ['Coupons'],
      },
    },
    '/faq': {
      get: {
        summary: 'Get FAQ',
        description: 'Get frequently asked questions',
        tags: ['Support'],
      },
    },
    '/support/tickets': {
      post: {
        summary: 'Create support ticket',
        description: 'Create a new support ticket',
        tags: ['Support'],
        security: [{ bearerAuth: [] }],
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'Token management endpoints' },
    { name: 'Users', description: 'User management and authentication' },
    { name: 'Tours', description: 'Tour listing and details' },
    { name: 'Bookings', description: 'Booking management' },
    { name: 'Coupons', description: 'Coupon and discount management' },
    { name: 'Support', description: 'Customer support endpoints' },
  ],
};

// Simple endpoint list for quick reference
const endpointList = {
  info: {
    title: 'GNB Transfer API',
    version: '1.1.0',
    apiVersion: 'v1',
    baseUrl: '/api/v1',
  },
  endpoints: [
    { method: 'POST', path: '/api/v1/auth/refresh', description: 'Refresh access token' },
    { method: 'POST', path: '/api/v1/users/register', description: 'Register new user' },
    { method: 'POST', path: '/api/v1/users/login', description: 'User login' },
    { method: 'POST', path: '/api/v1/users/logout', description: 'User logout' },
    { method: 'GET', path: '/api/v1/users/profile', description: 'Get user profile' },
    { method: 'GET', path: '/api/v1/tours', description: 'List all tours' },
    { method: 'GET', path: '/api/v1/tours/:id', description: 'Get tour details' },
    { method: 'POST', path: '/api/v1/bookings', description: 'Create booking' },
    { method: 'GET', path: '/api/v1/bookings', description: 'List user bookings' },
    { method: 'POST', path: '/api/v1/coupons/validate', description: 'Validate coupon' },
    { method: 'GET', path: '/api/v1/faq', description: 'Get FAQ' },
    { method: 'POST', path: '/api/v1/support/tickets', description: 'Create support ticket' },
    { method: 'GET', path: '/api/health', description: 'Health check' },
    { method: 'GET', path: '/api/ready', description: 'Readiness check' },
    { method: 'GET', path: '/metrics', description: 'Prometheus metrics' },
  ],
};

// Full OpenAPI documentation
router.get('/', (req, res) => res.json(apiDocs));

// Simple endpoint list
router.get('/endpoints', (req, res) => res.json(endpointList));

export default router;
