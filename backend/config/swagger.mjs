import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GNB Transfer API Documentation',
      version: '1.1.0',
      description: `
# GNB Transfer - Tourism and Transfer Services API

This is the complete API documentation for GNB Transfer platform.

## Features
- User authentication and authorization
- Tour and package management
- Booking and reservation system
- Driver and vehicle management
- Payment processing (Stripe)
- Review and rating system
- Admin panel with analytics
- Real-time chat support
- AI-powered recommendations

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer YOUR_JWT_TOKEN
\`\`\`

## Base URLs
- **Production**: \`https://api.gnbtransfer.com\`
- **Development**: \`http://localhost:5000\`

## Rate Limiting
- Standard endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes

## Support
For API support, contact: support@gnbtransfer.com
      `,
      contact: {
        name: 'GNB Transfer Support',
        email: 'support@gnbtransfer.com',
        url: 'https://gnbtransfer.com/support'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server (v1)'
      },
      {
        url: 'http://localhost:5000/api',
        description: 'Development server (Legacy)'
      },
      {
        url: 'https://api.gnbtransfer.com/api/v1',
        description: 'Production server (v1)'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            phone: { type: 'string', example: '+905551234567' },
            role: { type: 'string', enum: ['user', 'driver', 'admin'], example: 'user' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Tour: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Istanbul City Tour' },
            description: { type: 'string' },
            price: { type: 'number', example: 150 },
            duration: { type: 'string', example: '8 hours' },
            capacity: { type: 'number', example: 10 },
            available: { type: 'boolean', example: true },
            images: { type: 'array', items: { type: 'string' } },
            rating: { type: 'number', example: 4.5 }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            tourId: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            guests: { type: 'number', example: 2 },
            totalPrice: { type: 'number', example: 300 },
            status: { 
              type: 'string', 
              enum: ['pending', 'confirmed', 'cancelled', 'completed'],
              example: 'confirmed'
            },
            paymentMethod: { type: 'string', enum: ['cash', 'card'], example: 'card' },
            paymentStatus: { type: 'string', enum: ['pending', 'paid', 'refunded'], example: 'paid' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
            code: { type: 'string', example: 'ERROR_CODE' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string', example: 'Operation successful' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and token management'
      },
      {
        name: 'Users',
        description: 'User account management'
      },
      {
        name: 'Tours',
        description: 'Tour listings and details'
      },
      {
        name: 'Bookings',
        description: 'Booking creation and management'
      },
      {
        name: 'Drivers',
        description: 'Driver management and assignments'
      },
      {
        name: 'Vehicles',
        description: 'Vehicle fleet management'
      },
      {
        name: 'Payments',
        description: 'Payment processing and invoices'
      },
      {
        name: 'Reviews',
        description: 'Customer reviews and ratings'
      },
      {
        name: 'Support',
        description: 'Customer support and tickets'
      },
      {
        name: 'Admin',
        description: 'Admin panel operations (admin only)'
      },
      {
        name: 'Analytics',
        description: 'Business analytics and reports (admin only)'
      }
    ]
  },
  apis: ['./routes/*.mjs', './models/*.mjs'], // Path to files with JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
