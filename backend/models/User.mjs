import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User Model
 *
 * @module models/User
 * @description Mongoose model for user authentication and management
 *
 * Security features:
 * - Passwords are automatically hashed before saving using bcrypt
 * - Email uniqueness is enforced at database level
 * - Email is stored in lowercase for case-insensitive matching
 * - Password validation requires minimum 6 characters
 * - Supports role-based access control (user, admin, driver)
 *
 * Pre-save hook:
 * - Hashes password only when it's new or modified
 * - Uses configurable salt rounds (default: 10)
 *
 * Instance methods:
 * - comparePassword: Verifies plain text password against stored hash
 */

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

/**
 * User schema definition
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: { type: String, enum: ['user', 'admin', 'driver'], default: 'user' },
    preferences: {
      language: { type: String, default: 'en' },
      tourCategories: [{ type: String }],
      priceRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 10000 },
      },
    },
    interactionLogs: [
      {
        action: { type: String, required: true },
        tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour' },
        timestamp: { type: Date, default: Date.now },
        metadata: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  { timestamps: true }
);

/**
 * Pre-save middleware to hash password
 *
 * @description Automatically hashes password before saving to database
 * Only runs when password is new or modified to avoid unnecessary hashing
 *
 * Security:
 * - Uses bcrypt with configurable salt rounds (BCRYPT_ROUNDS env variable)
 * - Salt rounds default to 10 if not specified
 * - Higher salt rounds increase security but slow down hashing
 */
userSchema.pre('save', async function (next) {
  try {
    // Only hash if password is new or modified
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

/**
 * Instance method to compare password with stored hash
 *
 * @param {string} candidatePassword - Plain text password to verify
 * @returns {Promise<boolean>} - True if password matches, false otherwise
 *
 * @example
 * const user = await User.findOne({ email });
 * const isValid = await user.comparePassword('plainTextPassword');
 * if (isValid) {
 *   // Password is correct
 * }
 *
 * Security:
 * - Uses bcrypt.compare which is timing-attack safe
 * - Never exposes the stored hash
 */
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
