import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navigation from '../components/Navigation';
import { SkeletonForm, SkeletonOrderCard } from '../components/SkeletonLoaders';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, getTotalPrice } = useCart();
  const { isAuthenticated, userData, authUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    phoneNumber: '',
    deliveryAddress: 'Pickup at Eris Cafe',
    paymentMethod: 'cash'
  });

  // Calculate total amount from cartItems
  const totalAmount = getTotalPrice();

  // Check eligibility on mount
  useEffect(() => {
    checkEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, isAuthenticated]);

  const checkEligibility = () => {
    console.log('=== ELIGIBILITY CHECK ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('userData:', userData);
    console.log('userData.role:', userData?.role);
    console.log('cartItems:', cartItems);
    console.log('cartItems.length:', cartItems?.length);
    
    // Check 1: User must be authenticated
    if (!isAuthenticated) {
      console.log('FAILED: Not authenticated');
      setError('Please login to proceed with checkout');
      setTimeout(() => navigate('/'), 2000);
      return false;
    }

    // Check 2: User must be a customer (not admin, staff, or owner)
    if (userData?.role !== 'customer') {
      console.log('FAILED: User is not a customer');
      setError('Only customers can place orders. Please login with a customer account.');
      return false;
    }

    // Check 3: Cart must not be empty
    if (!cartItems || cartItems.length === 0) {
      console.log('FAILED: Cart is empty');
      setError('Your cart is empty. Please add items before placing an order.');
      setTimeout(() => navigate('/'), 2000);
      return false;
    }

    // Check 4: All items must be available
    console.log('Checking item availability...');
    const unavailableItems = cartItems.filter(item => {
      console.log(`Item: ${item.name}, isAvailable: ${item.isAvailable}, stock: ${item.stock}`);
      // If isAvailable is undefined, assume it's available
      // If stock is undefined, assume it's in stock
      return item.isAvailable === false || item.stock === 0;
    });
    
    console.log('Unavailable items:', unavailableItems);
    
    if (unavailableItems.length > 0) {
      console.log('FAILED: Some items unavailable');
      setError(`Some items in your cart are out of stock: ${unavailableItems.map(i => i.name).join(', ')}`);
      return false;
    }

    console.log('=== ELIGIBILITY CHECK PASSED ===');
    return true;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== CHECKOUT DEBUG ===');
    console.log('Form submitted');
    console.log('Is authenticated:', isAuthenticated);
    console.log('User data:', userData);
    console.log('Auth token:', authUser ? 'Token exists' : 'No token');
    console.log('Cart items:', cartItems);
    console.log('Total amount:', totalAmount);
    
    // Final eligibility check
    if (!checkEligibility()) {
      console.log('Eligibility check failed');
      return;
    }

    // Validate form
    if (!formData.phoneNumber) {
      setError('Please provide your phone number');
      console.log('Form validation failed:', formData);
      return;
    }

    console.log('Starting order creation...');
    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: cartItems.map(item => {
          // Ensure we use the MongoDB _id as productId
          const productId = item.productId || item._id || item.id;
          console.log('Item mapping:', { 
            name: item.name, 
            productId, 
            _id: item._id, 
            id: item.id,
            fullItem: item 
          });
          
          return {
            productId: productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            size: item.size || 'Regular',
            temperature: item.temperature || 'Hot',
            image: item.image || item.imageUrl || ''
          };
        }),
        totalPrice: totalAmount,
        deliveryAddress: formData.deliveryAddress,
        paymentMethod: formData.paymentMethod,
        customerInfo: {
          name: userData?.name || '',
          email: userData?.email || '',
          phone: formData.phoneNumber
        }
      };

      console.log('Sending order data:', JSON.stringify(orderData, null, 2));

      const response = await axios.post(
        'http://localhost:4000/api/orders/create',
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${authUser}`
          }
        }
      );

      console.log('Order response:', response.data);

      clearCart();
      
      console.log('Order created successfully! Redirecting to status page...');
      
      // Redirect to status page immediately with order data
      navigate('/status', { 
        state: { 
          orderId: response.data.data.orderId,
          status: 'pending',
          orderData: response.data.data
        }
      });

    } catch (err) {
      console.error('=== CHECKOUT ERROR ===');
      console.error('Error object:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      console.error('Error data:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to place order. Please try again.';
      setError(errorMessage);
      await Swal.fire({
        title: 'Order Failed',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#78350f'
      });
    } finally {
      setLoading(false);
      console.log('=== CHECKOUT COMPLETE ===');
    }
  };

  // Show error screen if not eligible
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#EDEDE6]">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-playfair mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-amber-950 text-white rounded-lg hover:bg-amber-900"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while cart is being initialized
  if (!cartItems) {
    return (
      <div className="min-h-screen bg-[#EDEDE6]">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="h-8 bg-gray-300 rounded w-48 mx-auto mb-8 animate-pulse"></div>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <SkeletonOrderCard />
              <SkeletonOrderCard />
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="h-6 bg-gray-300 rounded w-48 mb-4 animate-pulse"></div>
              <SkeletonForm fields={3} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEDE6]">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-playfair text-center mb-8">Checkout</h1>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-playfair mb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cartItems && cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <div key={item._id || item.id} className="flex gap-4 items-start border-b pb-3">
                    {/* Product Image */}
                    {(item.image || item.imageUrl) && (
                      <img 
                        src={item.image || item.imageUrl} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    
                    {/* Product Details */}
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        {item.size && <p>Size: {item.size}</p>}
                        {item.temperature && <p>Temp: {item.temperature}</p>}
                        <p>Qty: {item.quantity} × ₱{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {/* Price */}
                    <p className="font-semibold text-amber-950">₱{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span>₱{(totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-playfair mb-4">Customer Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userData?.name || ''}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={userData?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="+63 XXX XXX XXXX"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-950"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !cartItems || cartItems.length === 0}
                className="w-full py-3 bg-amber-950 text-white rounded-lg font-semibold hover:bg-amber-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : 'Place Order'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;