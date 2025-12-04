import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, ChefHat, Package, CheckCircle } from 'lucide-react';
import Navigation from '../components/Navigation';
import axios from 'axios';
import Swal from 'sweetalert2';
import { SkeletonOrderCard } from '../components/SkeletonLoaders';

export default function Status() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, status: initialStatus, orderData: initialOrderData } = location.state || {};
  
  const [currentStatus, setCurrentStatus] = useState(initialStatus?.toUpperCase() || 'PENDING');
  const [orderData, setOrderData] = useState(initialOrderData);
  const [cancelRequested, setCancelRequested] = useState(initialOrderData?.cancelRequested || false);
  const [loading, setLoading] = useState(false);
  
  // Fetch order status from backend
  const fetchOrderStatus = async () => {
    if (!orderData?._id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('appToken');
      const response = await axios.get(
        `http://localhost:4000/api/orders/my-orders`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Find the current order from the list
      const updatedOrder = response.data.data.find(order => order._id === orderData._id);
      
      if (updatedOrder) {
        setCurrentStatus(updatedOrder.status.toUpperCase());
        setCancelRequested(updatedOrder.cancelRequested || false);
        setOrderData(updatedOrder);
      }
    } catch (error) {
      console.error('Error fetching order status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Redirect if no order data
  useEffect(() => {
    if (!orderId) {
      console.log('No order ID found, redirecting to home');
      navigate('/');
    }
  }, [orderId, navigate]);

  // Poll for status updates every 10 seconds
  useEffect(() => {
    if (!orderData?._id) return;
    
    // Fetch immediately on mount
    fetchOrderStatus();
    
    // Set up polling interval
    const interval = setInterval(() => {
      fetchOrderStatus();
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderData?._id]);

  const handleRequestCancellation = async () => {
    const result = await Swal.fire({
      title: 'Request Cancellation?',
      text: 'Are you sure you want to request cancellation for this order? An admin will review your request.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, request cancellation',
      cancelButtonText: 'No, keep order'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('appToken');
        const response = await axios.post(
          `http://localhost:4000/api/orders/${orderData._id}/cancel-request`, 
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success) {
          await Swal.fire({
            title: 'Request Sent!',
            text: 'Cancellation request sent successfully. An admin will review your request.',
            icon: 'success',
            confirmButtonColor: '#78350f',
            timer: 3000
          });
          setCancelRequested(true);
        }
      } catch (error) {
        console.error('Error requesting cancellation:', error);
        await Swal.fire({
          title: 'Request Failed',
          text: error.response?.data?.message || 'Failed to send cancellation request',
          icon: 'error',
          confirmButtonColor: '#78350f'
        });
      }
    }
  };
  
  const statuses = [
    { 
      id: 'PENDING', 
      label: 'PENDING',
      icon: Clock,
      color: 'text-amber-700'
    },
    { 
      id: 'PREPARING', 
      label: 'PREPARING',
      icon: ChefHat,
      color: 'text-amber-700'
    },
    { 
      id: 'READY', 
      label: 'READY',
      icon: Package,
      color: 'text-amber-700'
    },
    { 
      id: 'COMPLETED', 
      label: 'COMPLETED',
      icon: CheckCircle,
      color: 'text-gray-400'
    }
  ];
  
  const getCurrentStatusIndex = () => {
    return statuses.findIndex(s => s.id === currentStatus);
  };
  
  const isStatusActive = (index) => {
    return index <= getCurrentStatusIndex();
  };
  
  const StatusIcon = ({ status, index }) => {
    const Icon = status.icon;
    const isActive = isStatusActive(index);
    const isCurrent = status.id === currentStatus;
    
    return (
      <div className="flex flex-col items-center">
        <div className={`mb-6 ${isCurrent ? 'animate-bounce' : ''}`}>
          <Icon 
            className={`w-12 h-12 ${isActive ? status.color : 'text-gray-300'} ${isCurrent ? 'animate-pulse' : ''}`}
            strokeWidth={2}
          />
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-[#EDEDE6]">
      <Navigation />
      
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          {/* Order Info Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-serif font-bold mb-4">Order Status</h1>
            {orderId && (
              <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-3xl mx-auto">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                  {/* Order ID Section */}
                  <div className="text-center md:text-left">
                    <p className="text-sm text-gray-600 mb-1">Order ID</p>
                    <p className="text-2xl font-bold text-amber-900">{orderId}</p>
                  </div>

                  {/* Order Details */}
                  {orderData && (
                    <>
                      {/* Customer Information */}
                      <div className="text-center md:text-left">
                        <p className="text-sm text-gray-600 mb-1">Customer Name</p>
                        <p className="text-lg font-semibold">{orderData.customerInfo?.name || 'N/A'}</p>
                      </div>

                      {/* Payment Method */}
                      <div className="text-center md:text-left">
                        <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                        <p className="text-lg font-semibold">Cash on Pickup</p>
                      </div>

                      {/* Total Amount */}
                      <div className="text-center md:text-left">
                        <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                        <p className="text-xl font-bold text-amber-900">₱{orderData.totalPrice?.toFixed(2)}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Order Items */}
                {orderData?.items && orderData.items.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Order Items:</p>
                    <div className="space-y-2">
                      {orderData.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded">
                          <div className="flex items-center gap-3">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.size && <p className="text-gray-500 text-xs">Size: {item.size}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-600">Qty: {item.quantity}</p>
                            <p className="font-semibold">₱{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Date */}
                {orderData?.createdAt && (
                  <div className="mt-4 pt-4 border-t border-gray-200 text-center md:text-left">
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="text-sm font-medium">{new Date(orderData.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        
          {/* Status Icons */}
          <div className="flex justify-between items-center mb-8 px-4">
            {statuses.map((status, index) => (
              <StatusIcon key={status.id} status={status} index={index} />
            ))}
          </div>
        
        {/* Progress Bar */}
        <div className="relative mb-16">
          <div className="flex justify-between items-center relative">
            {/* Background line */}
            <div className="absolute left-0 right-0 h-1 bg-gray-300 top-1/2 transform -translate-y-1/2" style={{ marginLeft: '2rem', marginRight: '2rem' }}></div>
            
            {/* Active progress line */}
            <div 
              className="absolute left-0 h-1 bg-amber-700 top-1/2 transform -translate-y-1/2 transition-all duration-500"
              style={{ 
                marginLeft: '2rem',
                width: `calc(${(getCurrentStatusIndex() / (statuses.length - 1)) * 100}% - 4rem + ${(getCurrentStatusIndex() / (statuses.length - 1)) * 4}rem)`
              }}
            ></div>
            
            {/* Status circles */}
            {statuses.map((status, index) => (
              <div 
                key={status.id}
                className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  isStatusActive(index) 
                    ? 'bg-amber-700 border-amber-700' 
                    : 'bg-gray-300 border-gray-300'
                }`}
              >
                <div className={`w-6 h-6 rounded-full ${isStatusActive(index) ? 'bg-white' : 'bg-gray-400'}`}></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Status labels */}
        <div className="flex justify-between px-4">
          {statuses.map((status, index) => (
            <div key={status.id} className="flex flex-col items-center" style={{ width: '6rem' }}>
              <span className={`font-bold text-sm ${isStatusActive(index) ? 'text-black' : 'text-gray-400'}`}>
                {status.label}
              </span>
            </div>
          ))}
        </div>
        
        {/* Current Status Message */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              {currentStatus === 'PENDING' && '⏳ Order Received'}
              {currentStatus === 'PREPARING' && '👨‍🍳 Preparing Your Order'}
              {currentStatus === 'READY' && '📦 Ready for Pickup'}
              {currentStatus === 'COMPLETED' && '✅ Order Completed'}
            </h2>
            <p className="text-gray-600 text-lg">
              {currentStatus === 'PENDING' && 'Your order has been received and is waiting to be prepared.'}
              {currentStatus === 'PREPARING' && 'Our team is carefully preparing your order.'}
              {currentStatus === 'READY' && 'Your order is ready! Please come pick it up at Buksu Eris Coffee.'}
              {currentStatus === 'COMPLETED' && 'Thank you for your order! We hope you enjoyed it.'}
            </p>
            
            {currentStatus !== 'COMPLETED' && (
              <div className="mt-6">
                <button
                  onClick={fetchOrderStatus}
                  disabled={loading}
                  className="px-6 py-3 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Status
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-2">Auto-refreshes every 10 seconds</p>
              </div>
            )}

            {/* Cancel Request Button - Only show for pending/confirmed orders */}
            {(currentStatus === 'PENDING' || currentStatus === 'CONFIRMED') && !cancelRequested && (
              <div className="mt-4">
                <button
                  onClick={handleRequestCancellation}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 mx-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Request Cancellation
                </button>
              </div>
            )}

            {/* Show if cancellation requested */}
            {cancelRequested && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Cancellation Requested</span>
                </div>
                <p className="text-sm text-yellow-700 mt-2">Your cancellation request is being reviewed by an admin.</p>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t">
              <button
                onClick={() => navigate('/orders')}
                className="text-amber-900 hover:text-amber-700 font-semibold"
              >
                View All Orders →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}