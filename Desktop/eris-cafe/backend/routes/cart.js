import express from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get user's cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('cart.productId');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user.cart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add item to cart
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { productId, name, price, quantity, size, temperature, image } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if item already exists in cart
    const existingItemIndex = user.cart.findIndex(
      item => item.productId && item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      user.cart[existingItemIndex].quantity += quantity || 1;
    } else {
      // Add new item to cart
      user.cart.push({
        productId,
        name,
        price,
        quantity: quantity || 1,
        size,
        temperature,
        image,
        addedAt: new Date()
      });
    }

    await user.save();

    res.json({ 
      success: true, 
      message: 'Item added to cart',
      data: user.cart 
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update cart item quantity
router.put('/update/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const cartItem = user.cart.id(itemId);
    
    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    cartItem.quantity = quantity;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Cart updated',
      data: user.cart 
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.cart = user.cart.filter(item => item._id.toString() !== itemId);
    await user.save();

    res.json({ 
      success: true, 
      message: 'Item removed from cart',
      data: user.cart 
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear entire cart
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.cart = [];
    await user.save();

    res.json({ 
      success: true, 
      message: 'Cart cleared',
      data: [] 
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync cart from frontend (merge with existing cart)
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { cartItems } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Merge cart items
    if (cartItems && Array.isArray(cartItems)) {
      cartItems.forEach(newItem => {
        const existingItemIndex = user.cart.findIndex(
          item => item.productId && item.productId.toString() === newItem.productId
        );

        if (existingItemIndex > -1) {
          // Update quantity if item exists
          user.cart[existingItemIndex].quantity += newItem.quantity || 1;
        } else {
          // Add new item
          user.cart.push({
            productId: newItem.productId || newItem.id,
            name: newItem.name,
            price: newItem.price,
            quantity: newItem.quantity || 1,
            size: newItem.size,
            temperature: newItem.temperature,
            image: newItem.image,
            addedAt: new Date()
          });
        }
      });
    }

    await user.save();

    res.json({ 
      success: true, 
      message: 'Cart synced',
      data: user.cart 
    });
  } catch (error) {
    console.error('Sync cart error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
