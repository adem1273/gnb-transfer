import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true, index: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
}, { timestamps: true });

bookingSchema.index({ user: 1 });

export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
