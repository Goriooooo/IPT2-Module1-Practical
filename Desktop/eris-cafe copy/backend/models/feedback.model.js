import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  feedbackId: {
    type: String,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: String,
    required: true
  },
  customerInfo: {
    name: String,
    email: String
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedbackType: {
    type: String,
    enum: ['food', 'service', 'ambiance', 'delivery', 'general'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate feedbackId before saving
feedbackSchema.pre('save', async function(next) {
  if (!this.feedbackId) {
    try {
      const count = await this.constructor.countDocuments();
      this.feedbackId = `FB${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('Feedback', feedbackSchema);
