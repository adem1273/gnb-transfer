# GitHub Copilot Instructions for GNB Transfer

## Project Overview

GNB Transfer is a full-stack MERN (MongoDB, Express.js, React, Node.js) application for tourism and transfer services. The project includes a customer-facing website and an admin panel for managing tours, bookings, users, and content.

## Technology Stack

### Frontend
- **Framework**: React 19+ with Vite 7
- **Styling**: Tailwind CSS 4 with custom configuration
- **UI Library**: Custom components with responsive design
- **Internationalization**: i18next for multi-language support (9 languages: TR, EN, AR, RU, DE, FR, ES, ZH, FA)
- **Routing**: React Router v7
- **State Management**: React Context API + TanStack Query for server state
- **Payment Integration**: Stripe React components
- **Maps**: React Leaflet for location and tracking
- **Animations**: Framer Motion
- **Error Tracking**: Sentry React SDK
- **Testing**: Vitest + React Testing Library, Playwright for E2E

### Backend
- **Runtime**: Node.js 18+ with ES Modules
- **Framework**: Express.js 5
- **Database**: MongoDB 7 with Mongoose 9 ODM
- **Authentication**: JWT with bcryptjs for password hashing, refresh tokens
- **Caching**: Redis with tag-based invalidation
- **Background Jobs**: BullMQ with Redis for async processing (exports, emails, AI tasks)
- **Real-time**: Socket.IO for live updates and monitoring
- **Security**: Helmet, CORS, distributed rate limiting with express-rate-limit
- **API Style**: RESTful API with standardized response middleware
- **Error Tracking**: Sentry Node SDK
- **Logging**: Winston with daily rotation
- **Monitoring**: Prometheus metrics, health checks
- **Testing**: Jest with ES Modules support, Supertest for API tests
- **Payment Processing**: Stripe with webhooks
- **Email**: Nodemailer
- **AI Integration**: OpenAI API
- **File Storage**: Cloudinary for media management
- **API Documentation**: Swagger/OpenAPI

## Project Structure

```
gnb-transfer/
├── backend/              # Backend Express.js application
│   ├── ai/              # AI-related features
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── scripts/         # Utility scripts
│   └── server.mjs       # Main server file (ES Module)
├── src/                 # Frontend React application
│   ├── components/      # Reusable React components
│   ├── context/         # React Context providers
│   ├── layouts/         # Layout components
│   ├── locales/         # i18n translation files
│   ├── pages/           # Page components
│   ├── styles/          # CSS and styling files
│   └── utils/           # Utility functions
├── public/              # Static assets
└── database/            # Database-related files
```

## Coding Standards

### General
- Use **ES Modules** (import/export) syntax throughout the project
- Use **camelCase** for variable and function names
- Use **PascalCase** for React components and class names
- File extensions: `.mjs` for backend ES modules, `.jsx` for React components, `.js` for utilities
- Include JSDoc comments for complex functions and API endpoints
- Keep functions focused and small (prefer single responsibility)

### React/Frontend
- Use **functional components** with hooks (no class components)
- Prefer **arrow functions** for component definitions
- Use React hooks (useState, useEffect, useContext, etc.) appropriately
- Implement **error boundaries** for critical sections
- Follow the component structure: imports → component definition → export
- Use **destructuring** for props
- Keep component files under 300 lines when possible
- Use Tailwind CSS utility classes for styling
- Maintain responsive design (mobile-first approach)
- Use i18next `t()` function for all user-facing text
- Implement loading states and error handling for async operations

### Backend/API
- Follow MVC pattern: Models → Controllers → Routes
- Use **async/await** for asynchronous operations
- Implement proper error handling with try-catch blocks
- Use middleware for authentication, validation, and rate limiting
- Return standardized JSON responses using response middleware
- Validate all user inputs before processing
- Use proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Keep routes RESTful and semantic
- Protect sensitive routes with authentication middleware
- Hash passwords using bcryptjs before storing
- Use environment variables for sensitive configuration

### Database/Models
- Use Mongoose schemas with proper validation
- Define indexes for frequently queried fields
- Use schema methods for business logic when appropriate
- Keep model files focused on schema definition
- Use proper data types and constraints
- Implement timestamps (createdAt, updatedAt) where needed

### Security
- **Always** validate and sanitize user input (use express-validator, mongo-sanitize)
- Use helmet for security headers (CSP, HSTS, etc.)
- Implement distributed rate limiting on all public endpoints (token bucket algorithm)
- Store passwords as bcrypt hashes only (never plain text)
- Use JWT tokens for authentication with refresh token rotation
- Never commit sensitive data (.env files, secrets) to version control
- Implement CORS properly to restrict origins
- Validate JWT tokens on protected routes using authMiddleware
- Use environment variables for all secrets (JWT_SECRET, STRIPE_SECRET_KEY, MONGO_URI, etc.)
- Protect against NoSQL injection using mongo-sanitize
- Implement CSRF protection for state-changing operations
- Use fast-redact for safe logging (remove sensitive data)
- Enable Sentry for error tracking (sanitize errors before sending)
- Use Helmet security headers in production
- Implement gradual penalties for rate limit abuse
- Validate file uploads (type, size, content)
- Use parameterized queries/ORM to prevent SQL/NoSQL injection
- Implement proper session management with secure cookies
- Regular security audits with `npm audit`

## Development Workflow

### Running the Project

**Backend:**
```bash
cd backend
npm install
npm run dev  # Runs with nodemon on port 5000
```

**Frontend:**
```bash
npm install  # Run from project root
npm run dev  # Runs Vite dev server on port 5173
```

**Full Stack (Concurrently):**
```bash
npm run dev  # Runs both backend and frontend simultaneously
```

**Note:** The project uses npm workspaces. Frontend code is in the root directory (`/src`, `/public`), backend is in `/backend`, and mobile app is in `/mobile`.

### Environment Variables

**Backend (.env):**
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
OPENAI_API_KEY=your_openai_key
SENTRY_DSN=your_sentry_dsn
PORT=5000
NODE_ENV=development
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
VITE_SENTRY_DSN=your_sentry_dsn
```

**Test Environment (backend/.env.test):**
```
NODE_ENV=test
PORT=5001
MONGO_URI=mongodb://localhost:27017/gnb-transfer-test
JWT_SECRET=test-jwt-secret-key
```

### Building for Production

```bash
# Frontend build
npm run build  # Builds to /dist with Vite

# Backend (no build needed - uses ES modules directly)
cd backend && npm start  # Runs server.mjs with Node.js
```

### Linting and Formatting

**Frontend:**
```bash
npm run lint       # Run ESLint on src/
npm run lint:fix   # Auto-fix ESLint issues
npm run format     # Format code with Prettier
```

**Backend:**
```bash
cd backend
npm run lint       # Run ESLint on backend files
npm run lint:fix   # Auto-fix ESLint issues
```

**Linting Configuration:**
- ESLint with Airbnb base config
- Prettier for code formatting
- Supports ES Modules (.mjs) and JSX
- Frontend: `.eslintrc.json` in root
- Backend: `backend/.eslintrc.json`
- Both use Prettier integration

### Database Management

**Seeding Data:**
```bash
cd backend
npm run seed              # Seed all data
npm run seed:users        # Seed only users
npm run seed:tours        # Seed only tours
npm run seed:reset        # Reset database and reseed
```

**Index Management:**
```bash
cd backend
npm run db:indexes              # Create/update indexes
npm run db:indexes:dry-run      # Preview index changes
npm run db:indexes:drop-unused  # Remove unused indexes
npm run db:optimize             # Optimize existing indexes
```

### Background Jobs (BullMQ)

The application uses BullMQ with Redis for background processing:
- **Export Queue**: CSV/PDF exports
- **Email Queue**: Transactional emails
- **AI Queue**: OpenAI API calls
- **Notification Queue**: Push notifications

Jobs are processed asynchronously with automatic retry logic.

### Redis Cache

- **Tag-based invalidation**: Clear related caches together
- **Automatic fallback**: If Redis is down, queries go directly to MongoDB
- **Cache warming**: Critical data cached on startup
- **Hit rate monitoring**: Track cache effectiveness

### Real-time Monitoring

Access the admin monitoring dashboard:
- **URL**: `/admin/monitoring` (requires admin authentication)
- **Features**: 
  - Live system metrics (CPU, memory, uptime)
  - Queue statistics (jobs processed, failed, pending)
  - Cache hit rates
  - Active connections
  - Real-time updates via Socket.IO

## Testing Guidelines

### Test Infrastructure

The repository has comprehensive test infrastructure in place:

**Frontend Testing (Vitest + React Testing Library):**
- **Framework**: Vitest with jsdom environment
- **Test Location**: `src/**/*.{test,spec}.{js,jsx}` and `src/**/__tests__/*`
- **Run Tests**: 
  - `npm test` - Run all tests once
  - `npm run test:watch` - Run tests in watch mode
  - `npm run test:coverage` - Generate coverage report
  - `npm run test:ui` - Run tests with UI
- **Coverage Thresholds**: 
  - Statements: 70%
  - Branches: 65%
  - Functions: 65%
  - Lines: 70%
- **Setup**: Test setup in `src/test/setup.js`
- **Examples**: Component tests in `src/components/**/__tests__/`, page tests in `src/pages/__tests__/`

**Backend Testing (Jest + Supertest):**
- **Framework**: Jest with ES Modules support
- **Test Location**: `backend/tests/**/*.test.mjs`
- **Run Tests**:
  - `cd backend && npm test` - Run all backend tests
  - `cd backend && npm run test:watch` - Watch mode
  - `cd backend && npm run test:coverage` - Coverage report
- **Test Database**: Uses separate test database `gnb-transfer-test` (automatically cleaned)
- **Environment**: Tests use `.env.test` configuration
- **Key Test Suites**:
  - `api.test.mjs` - API endpoint tests
  - `auth-service.test.mjs` - Authentication tests
  - `rate-limiter.test.mjs` - Rate limiting tests
  - `nosql-injection.test.mjs` - Security tests
  - `cache.test.mjs` - Cache functionality tests
  - `admin-*.test.mjs` - Admin-specific tests
  - `models/` - Database model tests
  - `integration/` - Integration tests

**E2E Testing (Playwright):**
- **Framework**: Playwright
- **Test Location**: `e2e/**/*.spec.js`
- **Run Tests**:
  - `npm run test:e2e` - Run E2E tests
  - `npm run test:e2e:headed` - Run with browser visible
  - `npm run test:e2e:ui` - Run with Playwright UI
  - `npm run test:e2e:report` - Show test report
- **Base URL**: `http://localhost:5173` (configurable via `E2E_BASE_URL`)
- **Browser**: Chromium (Firefox and WebKit configs available)
- **Features**: Screenshots on failure, video on failure, trace on retry

### Testing Best Practices

- **Always run existing tests** before making changes to understand baseline
- **Write tests for new features**: Follow existing test patterns in the repository
- **Test both authenticated and unauthenticated flows** for auth-related changes
- **Test error scenarios and edge cases** in addition to happy paths
- **Use appropriate test types**:
  - Unit tests for utilities and individual components
  - Integration tests for API endpoints and database operations
  - E2E tests for critical user flows (booking, authentication, etc.)
- **Keep tests isolated**: Each test should be independent
- **Use realistic test data**: Match production scenarios
- **Mock external services**: Stripe, email, OpenAI when appropriate
- **Verify responsive design** on multiple screen sizes for UI changes
- **Run tests in CI/CD**: All tests run automatically on push/PR

### Test Maintenance

- Update tests when changing API response structures
- Add new test cases when adding validation rules
- Keep test coverage above thresholds (70% for statements)
- Clean up test data properly to avoid test pollution
- Use descriptive test names that explain what is being tested

## API Conventions

### Endpoints Structure
- `/api/users` - User management (register, login, profile)
- `/api/tours` - Tour listings and details
- `/api/bookings` - Booking operations (create, read, update, status)
- `/api/vehicles` - Fleet management (admin/manager only)
- `/api/admin` - Admin-only endpoints (dashboard, stats, management)
- `/api/ai` - AI-related features (recommendations, content generation)
- `/api/reviews` - Customer reviews and ratings
- `/api/cms` - Content management (pages, posts, menus, media)
- `/api/settings` - Global settings (admin only)
- `/api/health` - Health check endpoint
- `/api/metrics` - Prometheus metrics (admin only)
- `/api/jobs` - Background job monitoring (admin only)

### Authentication
- Use Bearer token in Authorization header: `Authorization: Bearer <token>`
- JWT tokens are issued on successful login (access token + refresh token)
- Access tokens expire after 1 hour (configurable)
- Refresh tokens for obtaining new access tokens
- Tokens should be verified using the `authMiddleware`
- Role-based access control (Super Admin, Admin, Manager, Driver, Customer)

### Response Format
Use the standardized response middleware format:
```javascript
// Success (200, 201)
{ 
  success: true, 
  data: {...} 
}

// Error (400, 401, 403, 404, 500)
{ 
  success: false, 
  error: "Error message" 
}

// Paginated response
{
  success: true,
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    pages: 5
  }
}
```

### Rate Limiting
- **Public endpoints**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP (login/register)
- **API endpoints**: 1000 requests per 15 minutes per user
- **Admin endpoints**: Higher limits (5000 requests per 15 minutes)
- Distributed rate limiting with Redis
- Gradual penalties for abuse (temporary bans)
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Validation
- Use express-validator for request validation
- Validate all inputs (body, query, params)
- Sanitize inputs with mongo-sanitize
- Return 400 with validation errors
```javascript
import { body, validationResult } from 'express-validator';

// Validation middleware
const validateBooking = [
  body('pickupLocation').notEmpty().trim().escape(),
  body('dropoffLocation').notEmpty().trim().escape(),
  body('passengerCount').isInt({ min: 1, max: 8 }),
];

// In controller
const errors = validationResult(req);
if (!errors.isEmpty()) {
  return res.status(400).json({ success: false, error: errors.array() });
}
```

### Error Handling
- Use try-catch blocks for async operations
- Use centralized error handling middleware
- Log errors with Winston (sanitize sensitive data)
- Send errors to Sentry (production)
- Return appropriate HTTP status codes
```javascript
try {
  const data = await Model.findById(id);
  if (!data) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  res.json({ success: true, data });
} catch (error) {
  logger.error('Error fetching data:', error);
  res.status(500).json({ success: false, error: 'Server error' });
}
```

### Caching Headers
- Use ETags for public content
- Set appropriate Cache-Control headers
- Public routes: `Cache-Control: public, max-age=3600`
- Private routes: `Cache-Control: private, no-cache`
- API responses with Redis cache: 5-10ms response time

## Admin Panel

The admin panel is a comprehensive dashboard for managing all aspects of the platform:

### Access Control
- Admin routes are protected with `authMiddleware` and `adminGuard` middleware
- Role hierarchy: Super Admin > Admin > Manager > Driver > Customer
- Super Admin: Full system access, user management, global settings, feature toggles
- Admin: Booking management, tour management, fleet management, CMS
- Manager: Limited access to bookings and tours
- Driver: View assigned bookings only

### Admin Routes
- `/admin/dashboard` - Main dashboard with analytics
- `/admin/bookings` - Booking management (status updates, bulk actions)
- `/admin/tours` - Tour and route management
- `/admin/users` - User management (roles, permissions)
- `/admin/fleet` - Vehicle and driver management
- `/admin/cms` - Content management system
- `/admin/settings` - Global settings and configuration
- `/admin/monitoring` - Real-time system monitoring
- `/admin/analytics` - Business intelligence and reports

### Key Features
**Dashboard Analytics:**
- Revenue tracking (daily, weekly, monthly)
- Booking statistics and trends
- KPI cards (bookings, revenue, customers)
- Performance metrics and charts (Recharts)
- Real-time updates via Socket.IO

**Booking Management:**
- Status workflow (pending → confirmed → completed → cancelled)
- Bulk actions (WhatsApp, email, status update)
- PDF invoice generation (PDFKit)
- Flight delay compensation
- Customer communication history

**Dynamic Pricing:**
- Route-based pricing with distance calculation
- Seasonal multipliers (high/low season)
- Currency switching (TRY, EUR, USD, GBP)
- Corporate client discounts
- Special pricing rules

**Fleet Management:**
- Driver assignments and tracking
- Vehicle inventory and maintenance
- Live GPS tracking (React Leaflet)
- Driver performance metrics

**CMS Suite:**
- **Blog**: Multi-language posts with SEO optimization
- **Pages**: Dynamic page builder with drag-drop
- **Menus**: Hierarchical menu management
- **Media Manager**: Cloudinary integration for images/videos
- **Homepage Builder**: Customizable homepage sections

**Corporate Clients:**
- Company profiles and contacts
- Volume discounts and special rates
- Monthly invoicing
- Booking history and analytics

**Global Settings:**
- Site-wide configuration (site name, logo, contact info)
- Feature toggles (enable/disable features)
- SEO settings (meta tags, structured data)
- Email templates
- Payment gateway configuration

**User Management:**
- Create/edit users with role assignment
- Password reset functionality
- User activity logs
- Bulk user actions

**Monitoring & Jobs:**
- Real-time system metrics dashboard
- Background job queue monitoring (BullMQ)
- Cache statistics and hit rates
- Error tracking and logs (Sentry)
- Database performance metrics

### Security Features
- All admin routes require authentication
- CSRF protection on state-changing operations
- Audit logs for sensitive actions (Super Admin)
- Rate limiting (higher limits than public routes)
- IP-based access restrictions (optional)
- Session management with automatic logout

## Common Patterns

### Authentication Middleware
```javascript
import { verifyToken } from './middlewares/auth.mjs';
router.get('/protected', verifyToken, controller);
```

### React Context Usage
```javascript
import { useAuth } from './context/AuthContext';
const { user, login, logout } = useAuth();
```

### API Calls
```javascript
const response = await fetch(`${import.meta.env.VITE_API_URL}/endpoint`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Internationalization
```javascript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
return <h1>{t('key.path')}</h1>;
```

### Background Jobs (BullMQ)
```javascript
// Add job to queue
import { queueService } from './services/queueService.mjs';
await queueService.addJob('export', { type: 'bookings', format: 'csv' });

// Process job in worker
exportQueue.process(async (job) => {
  const { type, format } = job.data;
  // Process export...
});
```

### Redis Caching
```javascript
// Using cache middleware
import { cacheMiddleware } from './middlewares/cache.mjs';
router.get('/tours', cacheMiddleware({ ttl: 3600, tags: ['tours'] }), getTours);

// Manual cache operations
import { cacheService } from './services/cacheService.mjs';
await cacheService.set('key', data, 3600, ['tag1', 'tag2']);
const data = await cacheService.get('key');
await cacheService.invalidateByTags(['tours']);
```

### Real-time Updates (Socket.IO)
```javascript
// Backend - emit event
import { io } from './socket-server.mjs';
io.to('admin').emit('booking:created', bookingData);

// Frontend - listen to event
import { useSocket } from './hooks/useSocket';
const socket = useSocket();
useEffect(() => {
  socket.on('booking:created', handleNewBooking);
  return () => socket.off('booking:created', handleNewBooking);
}, []);
```

## Quick Reference Commands

### Development
```bash
# Start full stack
npm run dev

# Start frontend only
npm run dev  # (from root, port 5173)

# Start backend only
cd backend && npm run dev  # (port 5000)

# Install all dependencies (including workspaces)
npm install
```

### Testing
```bash
# Frontend tests
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Backend tests
cd backend && npm test      # Run once
cd backend && npm run test:watch

# E2E tests
npm run test:e2e            # Headless
npm run test:e2e:headed     # With browser
npm run test:e2e:ui         # Interactive UI
npm run test:e2e:report     # View report
```

### Code Quality
```bash
# Linting
npm run lint                # Frontend
npm run lint:fix            # Frontend auto-fix
cd backend && npm run lint  # Backend
cd backend && npm run lint:fix

# Formatting
npm run format              # Format frontend with Prettier

# Security
npm audit                   # Check vulnerabilities
npm audit fix              # Auto-fix vulnerabilities
```

### Database
```bash
cd backend

# Seeding
npm run seed                # All data
npm run seed:users          # Users only
npm run seed:tours          # Tours only  
npm run seed:reset          # Reset and reseed

# Indexes
npm run db:indexes          # Create/update
npm run db:indexes:dry-run  # Preview
npm run db:optimize         # Optimize existing
```

### Build & Deploy
```bash
# Build frontend
npm run build               # Output to /dist

# Preview build
npm run preview             # Serve production build

# Production backend
cd backend && npm start     # Run with Node.js
```

## Troubleshooting

### Common Issues

**MongoDB Connection Error:**
- Ensure MongoDB is running: `sudo systemctl start mongod` (Linux) or `brew services start mongodb-community` (macOS)
- Check connection string in `.env`
- Verify network connectivity

**Redis Connection Error:**
- Start Redis: `redis-server` or `brew services start redis` (macOS)
- Application will fall back to direct DB queries if Redis is unavailable
- Check `REDIS_URL` in `.env`

**Port Already in Use:**
- Frontend (5173): `lsof -ti:5173 | xargs kill -9`
- Backend (5000): `lsof -ti:5000 | xargs kill -9`

**Test Failures:**
- Ensure MongoDB test database is accessible
- Check `.env.test` configuration
- Clean test database: `cd backend && npm run seed:reset`

**Build Failures:**
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Clear Vite cache: `rm -rf .vite dist`
- Check Node.js version: `node --version` (should be 18+)

**Linting Errors:**
- Auto-fix: `npm run lint:fix`
- Check ESLint config: `.eslintrc.json`
- Disable specific rules if needed (with justification)

**Module Resolution Errors:**
- Verify `"type": "module"` in package.json
- Use `.mjs` extension for ES modules
- Check import paths (use full file paths with extensions)

**Environment Variable Issues:**
- Copy `.env.example` to `.env` and fill in values
- Restart dev servers after changing `.env`
- For frontend, prefix variables with `VITE_`
- Never commit `.env` files (use `.env.example` for templates)

## Important Notes

- **Node.js Version**: Requires Node.js 18 or higher
- **Module System**: Backend uses ES Modules (.mjs files)
- **Database**: MongoDB 7+ connection required for backend to start
- **Redis**: Required for caching and background jobs (optional in development, falls back gracefully)
- **Mixed File Extensions**: Some legacy files use .js while newer files use .mjs
  - **Prefer .mjs** for all new backend code
  - When modifying existing .js files, consider migrating them to .mjs if it doesn't break dependencies
  - Maintain consistency within each directory
- **Duplicate Definitions**: Some models/routes have both .js and .mjs versions
  - **Always use .mjs versions** for new code
  - When safe to do so, consolidate duplicates by migrating to .mjs and removing legacy .js files
- **Comments**: Use English for code comments and documentation
- **UI Text**: Support multiple languages through i18n (available: TR, EN, AR, RU, DE, FR, ES, ZH, FA with RTL support)
- **Workspaces**: Project uses npm workspaces (backend, mobile, packages/*)

## CI/CD and Deployment

### GitHub Actions Workflows

The repository has comprehensive CI/CD pipelines:

**Testing & Quality:**
- `ci.yml` - Main CI pipeline (lint, test, build)
- `frontend.yml` - Frontend-specific checks
- `backend.yml` - Backend-specific tests
- `security.yml` - Security scanning (CodeQL, secret detection)
- `bundle-size.yml` - Monitor and enforce bundle size limits

**Deployment:**
- `production-deploy.yml` - Production deployment workflow
- `deploy-backend.yml` - Backend deployment
- Supports Google Cloud Run, App Engine, and Docker deployments

**Maintenance:**
- `health-check.yml` - Periodic health monitoring
- `backup.yml` - Automated database backups
- `backup-test.yml` - Test backup/restore procedures
- `optimize-indexes.yml` - Database index optimization

**Monitoring:**
- Automated health checks every 30 minutes
- Backup verification and testing
- Performance monitoring with Prometheus/Grafana

### Deployment Targets

**Production:**
- **Google Cloud Run**: Containerized deployment (preferred)
- **Google App Engine**: Managed platform deployment
- **Docker**: Self-hosted containerized deployment
- **Configuration**: `app.yaml`, `cloudbuild.yaml`, `Dockerfile`

**Staging:**
- Separate staging environment configuration
- Load testing with K6
- Configuration: `docker-compose.staging.yml`, `.env.staging.example`

### Performance and Monitoring

**Database Performance:**
- 61+ strategic indexes for query optimization
- 90%+ query performance improvement achieved
- Index coverage: 85%+ of queries use indexes
- Query response: Sub-50ms average
- Automated index optimization scripts

**Caching Strategy:**
- Redis cache with 60-95% hit rate
- Tag-based invalidation for related data
- 5-10ms cached responses
- Automatic fallback to database if Redis unavailable

**API Performance Targets:**
- p95 latency: <200ms
- p99 latency: <500ms
- Error rate: <1%
- Uptime: 99.9%

**Monitoring Stack:**
- **Error Tracking**: Sentry (frontend + backend)
- **Logging**: Winston with daily rotation
- **Metrics**: Prometheus + Grafana dashboards
- **Real-time**: Socket.IO monitoring dashboard
- **Health Checks**: `/api/health` endpoint

**Background Jobs:**
- BullMQ with Redis
- 4 queues: exports, emails, AI tasks, notifications
- Automatic retry with exponential backoff
- Job monitoring and failure tracking

**Bundle Size Budget:**
- Enforced via CI/CD
- Vendor chunks optimized (React, i18n, Stripe separately)
- Gzip and Brotli compression
- Code splitting for optimal loading

## When Making Changes

1. **Preserve existing functionality** - make minimal, surgical changes
2. **Follow existing patterns** in the codebase (check similar implementations first)
3. **Run tests before and after changes**:
   - Frontend: `npm test`
   - Backend: `cd backend && npm test`
   - E2E: `npm run test:e2e` (for critical flows)
4. **Run linters** before committing:
   - `npm run lint:fix` (frontend)
   - `cd backend && npm run lint:fix` (backend)
5. **Test authentication flows** if modifying auth-related code (login, register, protected routes)
6. **Check responsive design** if modifying UI components (mobile, tablet, desktop)
7. **Verify environment variables** are properly documented in .env.example files
8. **Update this file** if introducing new patterns, conventions, or major features
9. **Use ES Modules syntax** for all new backend code (.mjs files)
10. **Add proper error handling** for all async operations (try-catch blocks)
11. **Validate inputs** before processing data (use express-validator on backend)
12. **Document API changes** if modifying endpoints (update Swagger docs if applicable)
13. **Consider performance impact**:
    - Use database indexes for new queries
    - Implement caching for expensive operations
    - Avoid N+1 queries
14. **Test with real data** when possible (use seed scripts)
15. **Check security implications**:
    - NoSQL injection prevention
    - XSS/CSRF protection
    - Rate limiting on new endpoints
    - Input sanitization
16. **Update i18n translations** if adding user-facing text (all 9 languages)
17. **Monitor bundle size** if adding new frontend dependencies
18. **Test error scenarios** not just happy paths
19. **Verify Sentry integration** for new error-prone code
20. **Consider background jobs** for long-running operations (use BullMQ)
