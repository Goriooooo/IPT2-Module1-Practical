import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevItems, { 
        ...product, 
        quantity,
        swipeOffset: 0 
      }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const deleteItem = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
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

  const clearCart = () => {
    setCartItems([]);
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
