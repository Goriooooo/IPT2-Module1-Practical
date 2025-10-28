import express from 'express';
import Order from '../models/order.model.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all orders for a user
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('items.productId')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single order
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('items.productId');
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new order (checkout)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { items, totalPrice, customerInfo, notes } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cart is empty' 
      });
    }

    if (!totalPrice || !customerInfo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = new Order({
      orderId,
      userId: req.user.id,
      items: items.map(item => ({
        productId: item.productId || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        temperature: item.temperature
      })),
      totalPrice,
      customerInfo: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address
      },
      notes,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await order.save();

    // Clear user's cart after successful order
    const user = await User.findById(req.user.id);
    if (user) {
      user.cart = [];
      await user.save();
    }

    res.status(201).json({ 
      success: true, 
      message: 'Order created successfully',
      data: order 
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update order status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Order status updated',
      data: order 
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel order
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Only allow cancellation if order is pending or confirmed
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel order in current status' 
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ 
      success: true, 
      message: 'Order cancelled successfully',
      data: order 
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Request order cancellation
router.post('/:id/cancel-request', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Only allow cancellation request if order is pending or confirmed
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot request cancellation for order in current status' 
      });
    }

    // Check if already requested
    if (order.cancelRequested) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cancellation already requested for this order' 
      });
    }

    order.cancelRequested = true;
    order.cancelRequestedAt = new Date();
    await order.save();

    res.json({ 
      success: true, 
      message: 'Cancellation request submitted successfully. An admin will review your request.',
      data: order 
    });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Reject cancel request
router.patch('/:id/reject-cancel', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    order.cancelRequested = false;
    order.cancelRequestedAt = null;
    await order.save();

    res.json({ 
      success: true, 
      message: 'Cancellation request rejected',
      data: order 
    });
  } catch (error) {
    console.error('Reject cancel request error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Get all orders
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const { status, paymentStatus } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .populate('items.productId')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
