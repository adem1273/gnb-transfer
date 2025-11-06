import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin', 'driver'] },
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model('User', userSchema);
