# fix: secure auth, add bcrypt hashing, clean server

This PR applies security and stability fixes:
1) `backend/middlewares/auth.mjs` - remove JWT secret fallback, centralize `requireAuth`/`requireRole`/`requireAdmin`, use `res.apiError` and handle token expiry;
2) `backend/models/User.mjs` - deduplicate model, add bcrypt pre-save hashing and `comparePassword` helper, configurable `SALT_ROUNDS`;
3) `backend/server.mjs` - clean duplicate imports/middleware, single connectDB implementation, production `JWT_SECRET` enforcement, graceful shutdown.

Notes:
- Install bcrypt in backend (npm install bcrypt)
- Ensure response middleware exports `res.apiError`/`res.apiSuccess`
- Set `JWT_SECRET` and `MONGO_URI` in environment for production.