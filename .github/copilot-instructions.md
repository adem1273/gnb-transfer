# GitHub Copilot Instructions for GNB Transfer

## Project Overview

GNB Transfer is a full-stack MERN (MongoDB, Express.js, React, Node.js) application for tourism and transfer services. The project includes a customer-facing website and an admin panel for managing tours, bookings, users, and content.

## Technology Stack

### Frontend
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS with custom configuration
- **UI Library**: Custom components with responsive design
- **Internationalization**: i18next for multi-language support
- **Routing**: React Router v6
- **State Management**: React Context API
- **Payment Integration**: Stripe

### Backend
- **Runtime**: Node.js 18+ with ES Modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs for password hashing
- **Security**: Helmet, CORS, rate limiting with express-rate-limit
- **API Style**: RESTful API with standardized response middleware

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
- **Always** validate and sanitize user input
- Use helmet for security headers
- Implement rate limiting on all public endpoints
- Store passwords as bcrypt hashes only
- Use JWT tokens for authentication
- Never commit sensitive data (.env files) to version control
- Implement CORS properly to restrict origins
- Validate JWT tokens on protected routes
- Use environment variables for secrets (JWT_SECRET, STRIPE_SECRET_KEY, MONGO_URI)

## Development Workflow

### Running the Project

**Backend:**
```bash
cd backend
npm install
npm run dev  # Runs with nodemon
```

**Frontend:**
```bash
npm install  # Run from project root
npm run dev  # Runs Vite dev server on port 5173
```

**Note:** The root package.json contains scripts that reference `--prefix frontend` and `--prefix backend`, but the actual structure has frontend code in the root directory. Use the commands above for proper setup.

### Environment Variables

**Backend (.env):**
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
PORT=5000
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### Building for Production

```bash
npm run build  # Builds frontend to /dist (runs from project root)
```

## Testing Guidelines

- Currently no test infrastructure exists in this repository
- Manually test all changes in development environment before committing
- When adding tests is appropriate for new features or critical functionality, prefer industry-standard frameworks (Jest for backend, Vitest or React Testing Library for frontend)
- Always test both authenticated and unauthenticated flows
- Verify responsive design on multiple screen sizes
- Test error scenarios and edge cases
- Document test setup if you introduce testing infrastructure

## API Conventions

### Endpoints Structure
- `/api/users` - User management
- `/api/tours` - Tour listings and details
- `/api/bookings` - Booking operations
- `/api/admin` - Admin-only endpoints
- `/api/ai` - AI-related features

### Authentication
- Use Bearer token in Authorization header: `Authorization: Bearer <token>`
- JWT tokens are issued on successful login
- Tokens should be verified using the `authMiddleware`

### Response Format
Use the standardized response middleware format:
```javascript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: "Error message" }
```

## Admin Panel

- Admin routes are protected with authentication middleware
- Admin users have special permissions in the User model
- Admin panel accessible at `/admin/dashboard`
- Features: User management, Tour management, Booking management, AI tools

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

## Important Notes

- **Node.js Version**: Requires Node.js 18 or higher
- **Module System**: Backend uses ES Modules (.mjs files)
- **Database**: MongoDB connection required for backend to start
- **Mixed File Extensions**: Some legacy files use .js while newer files use .mjs
  - **Prefer .mjs** for all new backend code
  - When modifying existing .js files, consider migrating them to .mjs if it doesn't break dependencies
  - Maintain consistency within each directory
- **Duplicate Definitions**: Some models/routes have both .js and .mjs versions
  - **Always use .mjs versions** for new code
  - When safe to do so, consolidate duplicates by migrating to .mjs and removing legacy .js files
- **Comments**: Use English for code comments and documentation
- **UI Text**: Support multiple languages through i18n (available: Arabic, German, English, Spanish, Hindi, Italian, Russian, Chinese)

## When Making Changes

1. **Preserve existing functionality** - make minimal, surgical changes
2. **Follow existing patterns** in the codebase
3. **Test authentication flows** if modifying auth-related code
4. **Check responsive design** if modifying UI components
5. **Verify environment variables** are properly documented
6. **Update this file** if introducing new patterns or conventions
7. **Use ES Modules syntax** for all new backend code
8. **Add proper error handling** for all async operations
9. **Validate inputs** before processing data
10. **Document API changes** if modifying endpoints
