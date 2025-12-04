import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
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
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`,
});

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);
  const { authUser } = useAuth();

  // Load cart from MongoDB when user logs in (only once)
  useEffect(() => {
    if (authUser && !hasLoadedCart) {
      loadCartFromDB();
      setHasLoadedCart(true);
    } else if (!authUser) {
      // Load from localStorage when not logged in
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (error) {
          console.error('Error parsing saved cart:', error);
          localStorage.removeItem('cart');
        }
      }
      setHasLoadedCart(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  // Save to localStorage when not logged in
  useEffect(() => {
    if (!authUser && cartItems.length >= 0) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, authUser]);

  const loadCartFromDB = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('appToken');
      
      if (!token) return;

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // First sync any local cart items (only if they exist)
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        try {
          const localItems = JSON.parse(localCart);
          if (localItems.length > 0) {
            console.log('Syncing local cart items:', localItems.length);
            await api.post('/cart/sync', { cartItems: localItems });
            localStorage.removeItem('cart');
          }
        } catch (error) {
          console.error('Error syncing local cart:', error);
          localStorage.removeItem('cart');
        }
      }

      // Then load cart from DB
      const { data } = await api.get('/cart');
      if (data.success) {
        const mappedItems = data.data.map(item => {
          // Handle both populated (productId is object) and non-populated (productId is string) cases
          const productId = typeof item.productId === 'object' && item.productId?._id 
            ? item.productId._id 
            : item.productId;
          
          console.log('Cart item from DB:', { 
            cartItemId: item._id, 
            productId: productId,
            name: item.name,
            rawProductId: item.productId 
          });
          
          return {
            id: item._id, // Use cart item's _id for frontend operations (delete, update)
            _id: item._id, // Cart item's MongoDB _id
            productId: productId, // Product's MongoDB _id for checkout
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            temperature: item.temperature,
            image: item.image,
            isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
            stock: item.stock || 0,
            swipeOffset: 0
          };
        });
        console.log('Loaded cart from DB:', mappedItems.length, 'items');
        setCartItems(mappedItems);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    // Ensure product has a valid ID - prioritize _id for MongoDB compatibility
    const productId = product._id || product.id;
    if (!productId) {
      console.error('Product missing ID:', product);
      Swal.fire({
        title: 'Error',
        text: 'Product ID is missing. Please try again.',
        icon: 'error',
        confirmButtonColor: '#78350f'
      });
      return;
    }

    // Check if product is available
    if (product.isAvailable === false) {
      Swal.fire({
        title: 'Product Unavailable',
        text: `${product.name} is currently unavailable.`,
        icon: 'warning',
        confirmButtonColor: '#78350f'
      });
      return;
    }

    // Check if product is in stock
    if (product.stock === 0) {
      Swal.fire({
        title: 'Out of Stock',
        text: `${product.name} is currently out of stock.`,
        icon: 'warning',
        confirmButtonColor: '#78350f'
      });
      return;
    }

    console.log('Adding to cart:', { productId, name: product.name, _id: product._id, id: product.id });

    const newItem = {
      id: productId, // For guest users, use productId as id
      _id: productId,
      productId: productId, // Product's MongoDB _id
      name: product.name,
      price: product.price,
      quantity,
      size: product.selectedSize || product.size,
      temperature: product.temperature,
      image: product.image,
      isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
      stock: product.stock || 0,
      swipeOffset: 0
    };

    // Sync with MongoDB first if user is logged in
    if (authUser) {
      try {
        const token = localStorage.getItem('appToken');
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const response = await api.post('/cart/add', {
          productId: productId,
          name: product.name,
          price: product.price,
          quantity,
          size: product.selectedSize || product.size,
          temperature: product.temperature,
          image: product.image
        });

        // Update local state with server response
        if (response.data.success) {
          const mappedItems = response.data.data.map(item => {
            // Extract productId from populated or non-populated data
            const productId = typeof item.productId === 'object' && item.productId?._id 
              ? item.productId._id 
              : item.productId;
            
            return {
              id: item._id, // Cart item's _id for deletion/updates
              _id: item._id,
              productId: productId, // Product's _id for checkout
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              size: item.size,
              temperature: item.temperature,
              image: item.image,
              swipeOffset: 0
            };
          });
          setCartItems(mappedItems);
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    } else {
      // Update local state for guest users
      setCartItems(prevItems => {
        const itemSize = newItem.size || product.size;
        const existingItem = prevItems.find(item => 
          item.productId === productId && item.size === itemSize
        );
        
        if (existingItem) {
          console.log(`Guest: Updating existing item - ${product.name} (${itemSize})`);
          return prevItems.map(item =>
            item.productId === productId && item.size === itemSize
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        
        console.log(`Guest: Adding new item - ${product.name} (${itemSize})`);
        return [...prevItems, newItem];
      });
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
        Swal.fire({
          title: 'Update Failed',
          text: 'Failed to update cart. Please try again.',
          icon: 'error',
          confirmButtonColor: '#78350f',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
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
        Swal.fire({
          title: 'Remove Failed',
          text: 'Failed to remove item from cart. Please try again.',
          icon: 'error',
          confirmButtonColor: '#78350f',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
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
