import mongoose from 'mongoose';

const tourSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  description: { type: String },
  price: { type: Number, required: true },
  availableSeats: { type: Number, default: 0 },
}, { timestamps: true });

tourSchema.index({ title: 'text' });

export default mongoose.models.Tour || mongoose.model('Tour', tourSchema);
