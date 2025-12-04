import express from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import Order from '../models/order.model.js';
import Reservation from '../models/reservation.model.js';
import User from '../models/User.js';
import Product from '../models/product.model.js';
import LoginLog from '../models/loginLog.model.js';
import RolePermissions from '../models/rolePermissions.model.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(authMiddleware);
router.use(requireAdmin);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalOrders = await Order.countDocuments();
    const totalReservations = await Reservation.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const confirmedReservations = await Reservation.countDocuments({ status: 'confirmed' });

    // Calculate total revenue from completed orders
    const completedOrders = await Order.find({ status: 'completed' });
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        totalReservations,
        pendingOrders,
        confirmedReservations,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// Get all orders (with pagination)
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments();

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Update order status
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
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
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Get all reservations
router.get('/reservations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const reservations = await Reservation.find()
      .populate('user', 'name email')
      .sort({ date: -1, time: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Reservation.countDocuments();

    res.json({
      success: true,
      data: reservations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservations'
    });
  }
});

// Update reservation status
router.patch('/reservations/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'completed', 'cancelled', 'no-show'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reservation status'
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'customer' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get all products (for admin management)
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// ===== LOGIN MONITORING ROUTES =====

// Get all login logs with filters
router.get('/login-logs', async (req, res) => {
  try {
    const { role, status, startDate, endDate, limit = 100 } = req.query;

    let query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await LoginLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Calculate stats
    const totalLogins = await LoginLog.countDocuments();
    const successfulLogins = await LoginLog.countDocuments({ status: 'success' });
    const failedLogins = await LoginLog.countDocuments({ status: 'failed' });
    
    // Get unique active users (successful logins in last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUserLogs = await LoginLog.find({
      status: 'success',
      createdAt: { $gte: twentyFourHoursAgo }
    }).distinct('userId');

    res.json({
      success: true,
      data: {
        logs,
        stats: {
          totalLogins,
          successfulLogins,
          failedLogins,
          activeUsers: activeUserLogs.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching login logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch login logs' });
  }
});

// ===== USER MANAGEMENT ROUTES =====

// Get all users (including admins)
router.get('/all-users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -resetPasswordToken -resetPasswordExpires -cart')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Add new user (admin only, requires password verification)
router.post('/users/add', async (req, res) => {
  try {
    const { name, email, password, role, adminPassword } = req.body;

    // Validate input
    if (!name || !email || !password || !role || !adminPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required including admin password' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Verify admin password
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.password) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin verification failed' 
      });
    }

    const isAdminPasswordValid = await bcrypt.compare(adminPassword, admin.password);
    if (!isAdminPasswordValid) {
      return res.status(403).json({ 
        success: false, 
        message: 'Incorrect admin password' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add user' 
    });
  }
});

// Remove user (admin only, requires password verification)
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminPassword } = req.body;

    if (!adminPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin password is required' 
      });
    }

    // Verify admin password
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.password) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin verification failed' 
      });
    }

    const isAdminPasswordValid = await bcrypt.compare(adminPassword, admin.password);
    if (!isAdminPasswordValid) {
      return res.status(403).json({ 
        success: false, 
        message: 'Incorrect admin password' 
      });
    }

    // Check if user exists
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete user' 
    });
  }
});

// Update user role (admin only, requires password verification)
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, adminPassword } = req.body;

    if (!role || !adminPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role and admin password are required' 
      });
    }

    // Verify admin password
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.password) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin verification failed' 
      });
    }

    const isAdminPasswordValid = await bcrypt.compare(adminPassword, admin.password);
    if (!isAdminPasswordValid) {
      return res.status(403).json({ 
        success: false, 
        message: 'Incorrect admin password' 
      });
    }

    // Update user role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user role' 
    });
  }
});

// ===== ROLE PERMISSIONS ROUTES =====

// Get all role permissions
router.get('/role-permissions', async (req, res) => {
  try {
    let permissions = await RolePermissions.find().lean();

    // If no permissions exist, create default ones
    // Admin is the highest authority with full control over RBAC
    if (permissions.length === 0) {
      const defaultPermissions = [
        {
          role: 'admin',
          permissions: {
            dashboard: true,
            products: { view: true, create: true, edit: true, delete: true },
            orders: { view: true, create: true, edit: true, delete: true },
            reservations: { view: true, create: true, edit: true, delete: true },
            customers: { view: true, create: true, edit: true, delete: true },
            feedbacks: { view: true, create: true, edit: true, delete: true },
            settings: { view: true, edit: true },
            roles: { view: true, edit: true },
            monitoring: { view: true, create: true, edit: true, delete: true }
          }
        },
        {
          role: 'owner',
          permissions: {
            dashboard: true,
            products: { view: true, create: true, edit: true, delete: true },
            orders: { view: true, create: true, edit: true, delete: true },
            reservations: { view: true, create: true, edit: true, delete: true },
            customers: { view: true, create: true, edit: true, delete: true },
            feedbacks: { view: true, create: true, edit: true, delete: true },
            settings: { view: false, edit: false },
            roles: { view: false, edit: false },
            monitoring: { view: false, create: false, edit: false, delete: false }
          }
        },
        {
          role: 'staff',
          permissions: {
            dashboard: true,
            products: { view: true, create: false, edit: true, delete: false },
            orders: { view: true, create: true, edit: true, delete: false },
            reservations: { view: true, create: true, edit: true, delete: false },
            customers: { view: false, create: false, edit: false, delete: false },
            feedbacks: { view: false, create: false, edit: false, delete: false },
            settings: { view: false, edit: false },
            roles: { view: false, edit: false },
            monitoring: { view: false, create: false, edit: false, delete: false }
          }
        }
      ];

      await RolePermissions.insertMany(defaultPermissions);
      permissions = await RolePermissions.find().lean();
    }

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch role permissions' 
    });
  }
});

// Update role permissions (admin only, requires password verification)
router.put('/role-permissions/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions, adminPassword } = req.body;

    if (!permissions || !adminPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Permissions and admin password are required' 
      });
    }

    // Only admins can modify role permissions
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (currentUser.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only Admins can modify role permissions. Owner and Staff access is controlled by Admin.' 
      });
    }

    // Verify admin password
    if (!currentUser.password) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin verification failed' 
      });
    }

    const isAdminPasswordValid = await bcrypt.compare(adminPassword, currentUser.password);
    if (!isAdminPasswordValid) {
      return res.status(403).json({ 
        success: false, 
        message: 'Incorrect admin password' 
      });
    }

    // Update or create role permissions
    const updatedPermissions = await RolePermissions.findOneAndUpdate(
      { role },
      { permissions },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Role permissions updated successfully',
      data: updatedPermissions
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update role permissions' 
    });
  }
});

// Get permissions for a specific user role
router.get('/permissions/:role', async (req, res) => {
  try {
    const { role } = req.params;
    
    let rolePermissions = await RolePermissions.findOne({ role }).lean();

    // If no permissions found, return default based on role
    // Admin is the highest authority
    if (!rolePermissions) {
      const defaultPermissions = {
        admin: {
          dashboard: true,
          products: { view: true, create: true, edit: true, delete: true },
          orders: { view: true, create: true, edit: true, delete: true },
          reservations: { view: true, create: true, edit: true, delete: true },
          customers: { view: true, create: true, edit: true, delete: true },
          feedbacks: { view: true, create: true, edit: true, delete: true },
          settings: { view: true, edit: true },
          roles: { view: true, edit: true },
          monitoring: { view: true, create: true, edit: true, delete: true }
        },
        owner: {
          dashboard: true,
          products: { view: true, create: true, edit: true, delete: true },
          orders: { view: true, create: true, edit: true, delete: true },
          reservations: { view: true, create: true, edit: true, delete: true },
          customers: { view: true, create: true, edit: true, delete: true },
          feedbacks: { view: true, create: true, edit: true, delete: true },
          settings: { view: false, edit: false },
          roles: { view: false, edit: false },
          monitoring: { view: false, create: false, edit: false, delete: false }
        },
        staff: {
          dashboard: true,
          products: { view: true, create: false, edit: true, delete: false },
          orders: { view: true, create: true, edit: true, delete: false },
          reservations: { view: true, create: true, edit: true, delete: false },
          customers: { view: false, create: false, edit: false, delete: false },
          feedbacks: { view: false, create: false, edit: false, delete: false },
          settings: { view: false, edit: false },
          roles: { view: false, edit: false },
          monitoring: { view: false, create: false, edit: false, delete: false }
        }
      };

      rolePermissions = {
        role,
        permissions: defaultPermissions[role] || {}
      };
    }

    res.json({
      success: true,
      data: rolePermissions
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch permissions' 
    });
  }
});

// Change user password (admin/owner only, requires admin password verification)
router.put('/users/:userId/password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword, adminPassword } = req.body;

    if (!newPassword || !adminPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password and admin password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters' 
      });
    }

    // Verify admin password
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.password) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin verification failed' 
      });
    }

    const isAdminPasswordValid = await bcrypt.compare(adminPassword, admin.password);
    if (!isAdminPasswordValid) {
      return res.status(403).json({ 
        success: false, 
        message: 'Incorrect admin password' 
      });
    }

    // Find target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    targetUser.password = hashedPassword;
    await targetUser.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update password' 
    });
  }
});

export default router;
