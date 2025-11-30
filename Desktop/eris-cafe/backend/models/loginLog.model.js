import mongoose from 'mongoose';

const loginLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow null for failed login attempts
  },
  email: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'owner', 'staff', 'unknown'],
    default: 'unknown'
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: 'Unknown'
  },
  device: {
    type: String,
    default: 'Unknown'
  },
  userAgent: {
    type: String
  },
  failureReason: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
loginLogSchema.index({ createdAt: -1 });
loginLogSchema.index({ userId: 1, createdAt: -1 });
loginLogSchema.index({ status: 1 });
loginLogSchema.index({ role: 1 });

const LoginLog = mongoose.model('LoginLog', loginLogSchema);
export default LoginLog;
