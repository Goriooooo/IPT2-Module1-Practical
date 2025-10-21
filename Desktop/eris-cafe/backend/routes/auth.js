import express from 'express';
const router = express.Router();

// Temporary in-memory storage (replace with MongoDB in production)
let users = [];
let orders = [];
let reservations = [];

// Google OAuth authentication endpoint
router.post('/google', async (req, res) => {
  try {
    const { credential, user } = req.body;
    
    // Find or create user
    let existingUser = users.find(u => u.id === user.sub);
    
    if (!existingUser) {
      existingUser = {
        id: user.sub,
        email: user.email,
        name: user.name,
        picture: user.picture,
        createdAt: new Date(),
        orders: [],
        reservations: []
      };
      users.push(existingUser);
      console.log('New user created:', existingUser.email);
    } else {
      console.log('Existing user logged in:', existingUser.email);
    }
    
    res.json({
      success: true,
      user: existingUser
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
});

// Create order
router.post('/orders', async (req, res) => {
  try {
    const { userId, items, totalPrice, customerInfo } = req.body;
    
    const order = {
      id: `ORD-${Date.now()}`,
      userId,
      items,
      totalPrice,
      customerInfo,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    orders.push(order);
    
    // Update user's orders
    const user = users.find(u => u.id === userId);
    if (user) {
      user.orders.push(order.id);
    }
    
    console.log('Order created:', order.id);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user orders
router.get('/orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userOrders = orders.filter(order => order.userId === userId);
    
    res.json({ success: true, orders: userOrders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create reservation
router.post('/reservations', async (req, res) => {
  try {
    const { userId, tableId, customerInfo, date, time, guests } = req.body;
    
    const reservation = {
      id: `RES-${Date.now()}`,
      userId,
      tableId,
      customerInfo,
      date,
      time,
      guests,
      status: 'confirmed',
      createdAt: new Date()
    };
    
    reservations.push(reservation);
    
    // Update user's reservations
    const user = users.find(u => u.id === userId);
    if (user) {
      user.reservations.push(reservation.id);
    }
    
    console.log('Reservation created:', reservation.id);
    res.json({ success: true, reservation });
  } catch (error) {
    console.error('Reservation creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user reservations
router.get('/reservations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userReservations = reservations.filter(res => res.userId === userId);
    
    res.json({ success: true, reservations: userReservations });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel reservation
router.delete('/reservations/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    const reservation = reservations.find(r => r.id === reservationId);
    
    if (reservation) {
      reservation.status = 'cancelled';
      reservation.cancelledAt = new Date();
      
      console.log('Reservation cancelled:', reservationId);
      res.json({ success: true, message: 'Reservation cancelled successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Reservation not found' });
    }
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Get current user endpoint
router.get('/me', (req, res) => {
  res.json({
    success: true,
    user: null
  });
});

export default router;
