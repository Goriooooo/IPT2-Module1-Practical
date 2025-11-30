import express from 'express';
import User from '../models/User.js';
import Order from '../models/order.model.js';
import Reservation from '../models/reservation.model.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all customers (Admin only)
router.get('/customers', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });

    // Get counts for each customer
    const customersWithCounts = await Promise.all(
      customers.map(async (customer) => {
        const orderCount = await Order.countDocuments({ userId: customer._id });
        const reservationCount = await Reservation.countDocuments({ userId: customer._id });
        
        return {
          ...customer.toObject(),
          orderCount,
          reservationCount
        };
      })
    );

    res.json({
      success: true,
      data: customersWithCounts,
      count: customersWithCounts.length
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers'
    });
  }
});

// Get customer details by ID (Admin only)
router.get('/customers/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findById(id)
      .select('-password -resetPasswordToken -resetPasswordExpires');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer's orders with product details
    const orders = await Order.find({ userId: id })
      .sort({ createdAt: -1 })
      .lean();

    // Get customer's reservations
    const reservations = await Reservation.find({ userId: id })
      .sort({ date: -1 })
      .lean();

    // Calculate statistics
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const confirmedReservations = reservations.filter(r => r.status === 'confirmed').length;

    res.json({
      success: true,
      data: {
        customer: customer.toObject(),
        orders,
        reservations,
        statistics: {
          totalOrders: orders.length,
          completedOrders,
          pendingOrders,
          totalReservations: reservations.length,
          confirmedReservations,
          totalSpent,
          memberSince: customer.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details'
    });
  }
});

export default router;
