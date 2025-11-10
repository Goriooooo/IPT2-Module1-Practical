import express from 'express';
import Reservation from '../models/reservation.model.js';
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

// Create new reservation
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { customerInfo, date, time, guests, specialRequests } = req.body;

    // Validate required fields
    if (!customerInfo || !date || !time || !guests) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Generate unique reservation ID
    const reservationId = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const reservation = new Reservation({
      reservationId,
      userId: req.user.id,
      customerInfo: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone
      },
      date: new Date(date),
      time,
      guests,
      specialRequests,
      status: 'confirmed'
    });

    await reservation.save();

    res.status(201).json({ 
      success: true, 
      message: 'Reservation created successfully',
      data: reservation 
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ success: false, error: error.message });
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

// Admin: Update reservation status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['confirmed', 'pending', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }

    reservation.status = status;
    if (status === 'cancelled') {
      reservation.cancelledAt = new Date();
    }
    await reservation.save();

    res.json({ 
      success: true, 
      message: 'Reservation status updated',
      data: reservation 
    });
  } catch (error) {
    console.error('Update reservation status error:', error);
    res.status(500).json({ success: false, error: error.message });
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
