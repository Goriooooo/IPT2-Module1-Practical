import express from 'express';
import Reservation from '../models/reservation.model.js';
import Notification from '../models/notification.model.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all reservations for a user
router.get('/my-reservations', authMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user.id })
      .sort({ date: -1, createdAt: -1 });
    
    res.json({ success: true, data: reservations });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single reservation
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }
    
    res.json({ success: true, data: reservation });
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new reservation with concurrency control
router.post('/create', authMiddleware, async (req, res) => {
  const session = await Reservation.startSession();
  session.startTransaction();
  
  try {
    const { customerInfo, date, time, guests, specialRequests, tableId } = req.body;

    // Validate required fields
    if (!customerInfo || !date || !time || !guests) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Normalize date and time for comparison
    // Parse date string directly to avoid timezone issues
    const dateParts = date.split('-');
    const reservationDate = new Date(
      parseInt(dateParts[0]), 
      parseInt(dateParts[1]) - 1, 
      parseInt(dateParts[2])
    );
    reservationDate.setHours(0, 0, 0, 0);

    // Check for existing confirmed reservation at the same table, date, and time
    if (tableId) {
      const existingReservation = await Reservation.findOne({
        tableId: tableId,
        date: {
          $gte: reservationDate,
          $lt: new Date(reservationDate.getTime() + 24 * 60 * 60 * 1000)
        },
        time: time,
        status: { $in: ['pending', 'confirmed'] } // Check both pending and confirmed
      }).session(session);

      if (existingReservation) {
        await session.abortTransaction();
        return res.status(409).json({ 
          success: false, 
          message: `Table ${tableId} is already reserved for ${time} on ${reservationDate.toLocaleDateString()}. Please select a different table or time.`,
          conflictingReservation: {
            reservationId: existingReservation.reservationId,
            status: existingReservation.status,
            time: existingReservation.time
          }
        });
      }
    }

    // Generate unique reservation ID
    const reservationId = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create reservation within transaction
    const reservation = new Reservation({
      reservationId,
      userId: req.user.id,
      customerInfo: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone
      },
      date: reservationDate,
      time,
      guests,
      tableId: tableId || null,
      specialRequests,
      status: 'pending'
    });

    await reservation.save({ session });

    // Commit transaction
    await session.commitTransaction();

    res.status(201).json({ 
      success: true, 
      message: 'Reservation created successfully. Awaiting admin confirmation.',
      data: reservation 
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create reservation error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'A conflicting reservation already exists. Please try again.' 
      });
    }
    
    res.status(500).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
});

// Update reservation
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { date, time, guests, specialRequests } = req.body;

    const reservation = await Reservation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }

    // Update fields if provided
    if (date) reservation.date = new Date(date);
    if (time) reservation.time = time;
    if (guests) reservation.guests = guests;
    if (specialRequests !== undefined) reservation.specialRequests = specialRequests;

    await reservation.save();

    res.json({ 
      success: true, 
      message: 'Reservation updated successfully',
      data: reservation 
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel reservation
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }

    reservation.status = 'cancelled';
    reservation.cancelledAt = new Date();
    await reservation.save();

    res.json({ 
      success: true, 
      message: 'Reservation cancelled successfully',
      data: reservation 
    });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Update reservation status with conflict detection
// Update Google Calendar Event ID
router.patch('/:id/calendar-event', authMiddleware, async (req, res) => {
  try {
    const { googleCalendarEventId } = req.body;

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }

    // Update the Google Calendar Event ID
    reservation.googleCalendarEventId = googleCalendarEventId;
    await reservation.save();

    res.json({ 
      success: true, 
      message: 'Calendar event ID updated',
      data: reservation
    });
  } catch (error) {
    console.error('Update calendar event ID error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.patch('/:id/status', authMiddleware, async (req, res) => {
  const session = await Reservation.startSession();
  session.startTransaction();
  
  try {
    const { status } = req.body;

    if (!['confirmed', 'pending', 'cancelled', 'completed', 'no-show'].includes(status)) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const reservation = await Reservation.findById(req.params.id).session(session);

    if (!reservation) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }

    // If confirming, check for conflicts with other confirmed reservations
    if (status === 'confirmed' && reservation.tableId) {
      // Use the stored date directly (already normalized when created)
      const reservationDate = new Date(reservation.date);
      // Don't setHours here - the date is already stored at midnight UTC

      const conflictingReservation = await Reservation.findOne({
        _id: { $ne: req.params.id }, // Exclude current reservation
        tableId: reservation.tableId,
        date: {
          $gte: reservationDate,
          $lt: new Date(reservationDate.getTime() + 24 * 60 * 60 * 1000)
        },
        time: reservation.time,
        status: 'confirmed'
      }).session(session);

      if (conflictingReservation) {
        await session.abortTransaction();
        return res.status(409).json({ 
          success: false, 
          message: `Cannot confirm: Table ${reservation.tableId} is already confirmed for another reservation at ${reservation.time}.`,
          conflictingReservation: {
            reservationId: conflictingReservation.reservationId,
            customerName: conflictingReservation.customerInfo?.name
          }
        });
      }
    }

    // Update status
    const oldStatus = reservation.status;
    reservation.status = status;
    if (status === 'cancelled') {
      reservation.cancelledAt = new Date();
    }
    
    await reservation.save({ session });

    // Create notification for user if status changed
    if (oldStatus !== status) {
      const statusMessages = {
        pending: 'is pending confirmation',
        confirmed: 'has been confirmed! ✅',
        cancelled: 'has been cancelled ❌',
        completed: 'has been completed! 🎉',
        'no-show': 'was marked as no-show'
      };

      await Notification.create([{
        userId: reservation.userId,
        type: 'reservation',
        referenceId: reservation._id,
        referenceNumber: reservation.reservationId,
        title: `Reservation #${reservation.reservationId} Status Update`,
        message: `Your reservation ${statusMessages[status] || 'status has been updated'}`,
        status: status
      }], { session });
    }

    await session.commitTransaction();

    res.json({ 
      success: true, 
      message: 'Reservation status updated successfully',
      data: reservation 
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Update reservation status error:', error);
    
    if (error.name === 'VersionError') {
      return res.status(409).json({ 
        success: false, 
        message: 'This reservation was modified by another admin. Please refresh and try again.' 
      });
    }
    
    res.status(500).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
});

// Admin: Get all reservations
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const reservations = await Reservation.find(query)
      .populate('userId', 'name email')
      .sort({ date: 1, time: 1 });
    
    res.json({ success: true, data: reservations });
  } catch (error) {
    console.error('Get all reservations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
