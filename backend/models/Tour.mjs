import mongoose from 'mongoose';

const tourSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tour title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title must be less than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Tour description is required'],
    minlength: [10, 'Description must be at least 10 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be a positive number']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 day']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'Maximum group size is required'],
    min: [1, 'Group size must be at least 1']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'difficult'],
    default: 'medium'
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  images: [String],
  available: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
tourSchema.index({ title: 1 });
tourSchema.index({ price: 1 });
tourSchema.index({ location: 1 });
tourSchema.index({ available: 1 });
tourSchema.index({ createdAt: -1 });

const Tour = mongoose.model('Tour', tourSchema);

export default Tour;
