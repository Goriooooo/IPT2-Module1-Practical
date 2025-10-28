import jwt from 'jsonwebtoken';

// Middleware to check if user has admin role
export const requireAdmin = (req, res, next) => {
  try {
    // Auth middleware should have already verified the token and set req.user
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Role check error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Authorization error' 
    });
  }
};

// Middleware to check if user has customer role
export const requireCustomer = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Customer account required.' 
      });
    }

    next();
  } catch (error) {
    console.error('Role check error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Authorization error' 
    });
  }
};
