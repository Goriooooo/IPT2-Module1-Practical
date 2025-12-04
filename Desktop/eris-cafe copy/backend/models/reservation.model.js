import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  reservationId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  guests: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  tableId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  specialRequests: {
    type: String
  },
  cancelledAt: {
    type: Date
  },
  googleCalendarEventId: {
    type: String
  }
}, {
  timestamps: true,
  optimisticConcurrency: true // Enable version key for concurrency control
});

// Indexes for performance
reservationSchema.index({ userId: 1, date: -1 });
reservationSchema.index({ reservationId: 1 });
reservationSchema.index({ date: 1, status: 1 });

// Compound index for conflict detection
reservationSchema.index({ tableId: 1, date: 1, time: 1, status: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;
