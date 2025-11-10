import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
});

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { authUser } = useAuth();

  // Load cart from MongoDB when user logs in
  useEffect(() => {
    if (authUser) {
      loadCartFromDB();
    } else {
      // Load from localStorage when not logged in
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    }
  }, [authUser]);

  // Save to localStorage when not logged in
  useEffect(() => {
    if (!authUser && cartItems.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, authUser]);

  const loadCartFromDB = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('appToken');
      
      if (!token) return;

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // First sync any local cart items
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        const localItems = JSON.parse(localCart);
        if (localItems.length > 0) {
          await api.post('/cart/sync', { cartItems: localItems });
          localStorage.removeItem('cart');
        }
      }

      // Then load cart from DB
      const { data } = await api.get('/cart');
      if (data.success) {
        setCartItems(data.data.map(item => ({
          id: item.productId || item._id,
          _id: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          temperature: item.temperature,
          image: item.image,
          swipeOffset: 0
        })));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    const newItem = {
      ...product,
      quantity,
      swipeOffset: 0
    };

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevItems, newItem];
    });

    // Sync with MongoDB if user is logged in
    if (authUser) {
      try {
        const token = localStorage.getItem('appToken');
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        await api.post('/cart/add', {
          productId: product.id || product._id,
          name: product.name,
          price: product.price,
          quantity,
          size: product.size,
          temperature: product.temperature,
          image: product.image
        });
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    }
  };

  const updateQuantity = async (id, delta) => {
    let mongoId = null;
    let newQuantity = 1;

    // Find the item and get its MongoDB _id
    const item = cartItems.find(item => item.id === id || item._id === id);
    if (item) {
      mongoId = item._id;
      newQuantity = Math.max(1, item.quantity + delta);
      console.log('Updating quantity:', { 
        itemId: item.id, 
        mongoId, 
        oldQuantity: item.quantity, 
        newQuantity 
      });
    }

    // Update local state
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id || item._id === id) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );

    // Sync with MongoDB if user is logged in
    if (authUser && mongoId) {
      setSyncing(true);
      try {
        const token = localStorage.getItem('appToken');
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const response = await api.put(`/cart/update/${mongoId}`, { quantity: newQuantity });
        console.log('✅ Cart updated in MongoDB:', response.data);
      } catch (error) {
        console.error('❌ Error updating cart in MongoDB:', error.response?.data || error.message);
        // Optionally: revert the local state change if API call fails
        alert('Failed to update cart. Please try again.');
      } finally {
        setSyncing(false);
      }
    }
  };

  const deleteItem = async (id) => {
    // Find the item and get its MongoDB _id before removing from state
    const item = cartItems.find(item => item.id === id || item._id === id);
    const mongoId = item ? item._id : null;

    console.log('Deleting item:', { 
      itemId: id, 
      mongoId, 
      itemName: item?.name,
      isAuthenticated: !!authUser 
    });

    // Remove from local state
    setCartItems(prevItems => {
      return prevItems.filter(item => item.id !== id && item._id !== id);
    });

    // Sync with MongoDB if user is logged in
    if (authUser && mongoId) {
      setSyncing(true);
      try {
        const token = localStorage.getItem('appToken');
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const response = await api.delete(`/cart/remove/${mongoId}`);
        console.log('✅ Item removed from MongoDB:', response.data);
      } catch (error) {
        console.error('❌ Error removing from cart in MongoDB:', error.response?.data || error.message);
        // Optionally: restore the item in local state if API call fails
        alert('Failed to remove item from cart. Please try again.');
      } finally {
        setSyncing(false);
      }
    }
  };

  const updateSwipeOffset = (id, offset) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, swipeOffset: offset } : item
      )
    );
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = typeof item.price === 'string' 
        ? parseFloat(item.price.replace(/[^0-9.-]+/g, '')) 
        : item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const clearCart = async () => {
    setCartItems([]);

    // Sync with MongoDB if user is logged in
    if (authUser) {
      try {
        const token = localStorage.getItem('appToken');
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        await api.delete('/cart/clear');
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    } else {
      localStorage.removeItem('cart');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        deleteItem,
        updateSwipeOffset,
        getTotalItems,
        getTotalPrice,
        clearCart,
        loading,
        syncing,
        refreshCart: loadCartFromDB,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
