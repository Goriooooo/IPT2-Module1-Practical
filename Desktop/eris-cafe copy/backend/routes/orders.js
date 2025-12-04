import express from 'express';
import Order from '../models/order.model.js';
import User from '../models/User.js';
import Product from '../models/product.model.js';
import Notification from '../models/notification.model.js';
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

// Create new order with atomic stock management
router.post('/create', authMiddleware, async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();
  
  try {
    const { items, deliveryAddress, paymentMethod, totalPrice, customerInfo } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Order must contain at least one item' 
      });
    }

    if (!deliveryAddress || !paymentMethod) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Validate and atomically decrement stock for each item
    const stockCheckResults = [];
    for (const item of items) {
      console.log(`Checking stock for product: ${item.productId} (${item.name})`);
      
      // Attempt atomic stock decrement (only if enough stock available)
      const product = await Product.findOneAndUpdate(
        { 
          _id: item.productId,
          stock: { $gte: item.quantity } // Only update if stock >= quantity
        },
        { 
          $inc: { stock: -item.quantity } // Atomic decrement
        },
        { 
          session, 
          new: true // Return updated document
        }
      );

      if (!product) {
        // Either product doesn't exist or insufficient stock
        console.log(`Product not found or insufficient stock for: ${item.productId}`);
        const existingProduct = await Product.findById(item.productId).session(session);
        
        if (!existingProduct) {
          console.error(`Product not found in database: ${item.productId} (${item.name})`);
          await session.abortTransaction();
          return res.status(404).json({ 
            success: false, 
            message: `Product "${item.name}" (ID: ${item.productId}) not found in database. Please remove this item from your cart and try again.` 
          });
        }
        
        console.log(`Insufficient stock for product: ${item.name}. Available: ${existingProduct.stock}, Requested: ${item.quantity}`);
        await session.abortTransaction();
        return res.status(409).json({ 
          success: false, 
          message: `Insufficient stock for "${item.name}". Available: ${existingProduct.stock}, Requested: ${item.quantity}` 
        });
      }

      stockCheckResults.push({
        productId: product._id,
        name: item.name,
        previousStock: product.stock + item.quantity,
        newStock: product.stock
      });
    }

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order within transaction
    const order = new Order({
      orderId,
      userId: req.user.id,
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        temperature: item.temperature,
        image: item.image
      })),
      totalPrice,
      customerInfo: {
        name: customerInfo?.name || '',
        email: customerInfo?.email || '',
        phone: customerInfo?.phone || '',
        address: customerInfo?.address || deliveryAddress
      },
      deliveryAddress: typeof deliveryAddress === 'string' 
        ? deliveryAddress 
        : `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zipCode}`,
      paymentMethod,
      status: 'pending'
    });

    await order.save({ session });

    // Clear user's cart within transaction
    await User.findByIdAndUpdate(
      req.user.id, 
      { cart: [] },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();

    res.status(201).json({ 
      success: true, 
      message: 'Order placed successfully. Stock updated.',
      data: order,
      stockUpdates: stockCheckResults // Include for debugging
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create order error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Duplicate order detected. Please try again.' 
      });
    }
    
    res.status(500).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
});

// Update order status with optimistic locking
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();
  
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    // Use save() instead of findByIdAndUpdate to enable optimistic concurrency
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    const oldStatus = order.status;
    order.status = status;
    
    // If order is being cancelled, restore stock for all items
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      console.log(`Restoring stock for cancelled order: ${order.orderId}`);
      
      for (const item of order.items) {
        const product = await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } }, // Restore stock
          { session, new: true }
        );
        
        if (product) {
          console.log(`Restored ${item.quantity} units to ${item.name}. New stock: ${product.stock}`);
        } else {
          console.warn(`Product not found for stock restoration: ${item.productId}`);
        }
      }
    }
    
    await order.save({ session }); // This will throw VersionError if document was modified

    // Commit transaction first
    await session.commitTransaction();

    // Create notification for user if status changed (after transaction)
    if (oldStatus !== status) {
      const statusMessages = {
        pending: 'is pending confirmation',
        confirmed: 'has been confirmed! ✅',
        preparing: 'is being prepared 👨‍🍳',
        ready: 'is ready for pickup! 📦',
        completed: 'has been completed! 🎉',
        cancelled: 'has been cancelled ❌'
      };

      try {
        await Notification.create({
          userId: order.userId,
          type: 'order',
          referenceId: order._id,
          referenceNumber: order.orderId,
          title: `Order #${order.orderId} Status Update`,
          message: `Your order ${statusMessages[status] || 'status has been updated'}`,
          status: status
        });
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    res.json({ 
      success: true, 
      message: status === 'cancelled' ? 'Order cancelled and stock restored' : 'Order status updated successfully',
      data: order 
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Update order status error:', error);
    
    // Handle version conflict
    if (error.name === 'VersionError') {
      return res.status(409).json({ 
        success: false, 
        message: 'This order was modified by another admin. Please refresh and try again.' 
      });
    }
    
    res.status(500).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
});

// Cancel order
router.delete('/:id', authMiddleware, async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();
  
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Only allow cancellation if order is pending or confirmed
    if (!['pending', 'confirmed'].includes(order.status)) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel order in current status' 
      });
    }

    // Restore stock for all items
    console.log(`Restoring stock for cancelled order: ${order.orderId}`);
    for (const item of order.items) {
      const product = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } }, // Restore stock
        { session, new: true }
      );
      
      if (product) {
        console.log(`Restored ${item.quantity} units to ${item.name}. New stock: ${product.stock}`);
      }
    }

    order.status = 'cancelled';
    await order.save({ session });

    // Commit transaction
    await session.commitTransaction();

    res.json({ 
      success: true, 
      message: 'Order cancelled successfully and stock restored',
      data: order 
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    session.endSession();
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

    // Notify customer that cancellation was rejected
    try {
      await Notification.create({
        userId: order.userId,
        type: 'order',
        referenceId: order._id,
        referenceNumber: order.orderId,
        title: `Order #${order.orderId} Cancellation Rejected`,
        message: 'Your cancellation request has been rejected. Your order is still being processed.',
        status: order.status
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({ 
      success: true, 
      message: 'Cancellation request rejected and customer notified',
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
