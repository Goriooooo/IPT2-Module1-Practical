import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const Checkkout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cartItems, updateQuantity: updateCartQuantity, deleteItem, clearCart } = useCart();
  
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const delivery = cartItems.length > 0 ? 5.99 : 0;
  const discount = appliedPromo ? subtotal * 0.15 : 0; // 15% discount for valid promo
  const total = subtotal + tax + delivery - discount;

  const updateQuantity = (id, delta) => {
    updateCartQuantity(id, delta);
  };

  const removeItem = (id) => {
    deleteItem(id);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to complete your order');
      navigate('/');
      return;
    }

    setIsProcessing(true);
    
    try {
      const orderData = {
        userId: user.sub,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: typeof item.price === 'string' ? item.price : `$${item.price.toFixed(2)}`,
          quantity: item.quantity
        })),
        totalPrice: `$${total.toFixed(2)}`,
        customerInfo: {
          name: user.name,
          email: user.email
        }
      };

      const response = await axios.post('http://localhost:3000/api/auth/orders', orderData);
      
      if (response.data.success) {
        clearCart();
        alert('Order placed successfully!');
        navigate('/orders');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === 'welcome15' || promoCode.toLowerCase() === 'save15') {
      setAppliedPromo({
        code: promoCode,
        discount: 0.15,
        description: '15% off your order'
      });
    } else {
      alert('Invalid promo code');
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15.5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-gray-600 mb-6 text-sm">Looks like you haven't added any items to your cart yet.</p>
            <button className="bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors w-full sm:w-auto">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8 space-y-6 lg:space-y-0">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                      {/* Product Image and Basic Info */}
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-2">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900">{item.name}</h3>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                              <span className="inline-block mt-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                                {item.category}
                              </span>
                            </div>
                            
                            {/* Remove Button */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-700 p-1 sm:p-2 flex-shrink-0"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Quantity and Price - Mobile Layout */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:space-y-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 sm:px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-l-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="px-3 sm:px-4 py-2 text-gray-900 font-medium min-w-[2.5rem] sm:min-w-[3rem] text-center text-sm sm:text-base">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 sm:px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-r-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs sm:text-sm text-gray-600">
                              ${item.price.toFixed(2)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Continue Shopping */}
            <div className="mt-4 sm:mt-6">
              <button onClick={() => navigate(-1)} className="text-amber-600 hover:text-amber-700 font-medium flex items-center text-sm sm:text-base">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Continue Shopping
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-lg lg:sticky lg:top-8">
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Order Summary</h2>

                {/* Promo Code */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promo Code
                  </label>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-green-800">{appliedPromo.code}</span>
                        <p className="text-xs text-green-600">{appliedPromo.description}</p>
                      </div>
                      <button
                        onClick={removePromoCode}
                        className="text-green-600 hover:text-green-800 ml-2 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg sm:rounded-l-lg sm:rounded-r-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      />
                      <button
                        onClick={applyPromoCode}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg sm:rounded-l-none sm:rounded-r-lg hover:bg-amber-700 transition-colors font-medium text-sm"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                {/* Order Breakdown */}
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                    <span>Delivery</span>
                    <span>${delivery.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 text-sm sm:text-base">
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <hr className="my-3 sm:my-4" />
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}

                <button 
                  onClick={handleCheckout}
                  disabled={isProcessing || cartItems.length === 0}
                  className="w-full bg-amber-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-700 transform hover:scale-105 transition-all duration-200 shadow-lg mb-4 sm:mb-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                </button>

                {/* Payment Methods */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">We accept</p>
                  <div className="flex justify-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                    <div className="w-8 h-5 sm:w-10 sm:h-6 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">VISA</span>
                    </div>
                    <div className="w-8 h-5 sm:w-10 sm:h-6 bg-red-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">MC</span>
                    </div>
                    <div className="w-8 h-5 sm:w-10 sm:h-6 bg-blue-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AMEX</span>
                    </div>
                    <div className="w-8 h-5 sm:w-10 sm:h-6 bg-yellow-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">PP</span>
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center text-xs sm:text-sm text-gray-600">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Secure 256-bit SSL encryption
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkkout;