import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Star, MessageSquare, Bell } from 'lucide-react';
import { SkeletonOrderCard, SkeletonReservation } from '../components/SkeletonLoaders';

const Orders = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    rating: 0,
    feedbackType: 'general',
    message: ''
  });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchOrdersAndReservations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('appToken');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Fetch orders
      const ordersResponse = await axios.get('http://localhost:4000/api/orders/my-orders', config);
      setOrders(ordersResponse.data.data || []);
      
      // Fetch reservations
      const reservationsResponse = await axios.get('http://localhost:4000/api/reservations/my-reservations', config);
      const fetchedReservations = reservationsResponse.data.data || [];
      setReservations(fetchedReservations);
      
      // Fetch notifications from backend
      try {
        const notificationsResponse = await axios.get('http://localhost:4000/api/notifications/my-notifications', config);
        const backendNotifications = notificationsResponse.data.data || [];
        setNotifications(backendNotifications);
        const unread = backendNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch (notifError) {
        console.error('Error fetching notifications:', notifError);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };



  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('appToken');
      await axios.patch(
        `http://localhost:4000/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedNotifications = notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('appToken');
      await axios.patch(
        'http://localhost:4000/api/notifications/mark-all-read',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearNotifications = async () => {
    try {
      const token = localStorage.getItem('appToken');
      await axios.delete(
        'http://localhost:4000/api/notifications/clear-all',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'cancelled': return 'text-red-600';
      case 'completed': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'preparing': return 'text-blue-600';
      case 'ready': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return '🛒';
      case 'reservation':
        return '📅';
      default:
        return '🔔';
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOrdersAndReservations();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(() => {
        fetchOrdersAndReservations();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const handleCancelReservation = async (reservationId) => {
    const result = await Swal.fire({
      title: 'Cancel Reservation?',
      text: 'Are you sure you want to cancel this reservation?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No, keep it'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('appToken');
        await axios.delete(`http://localhost:4000/api/reservations/${reservationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        await Swal.fire({
          title: 'Cancelled!',
          text: 'Reservation cancelled successfully',
          icon: 'success',
          confirmButtonColor: '#78350f',
          timer: 2000
        });
        // Refresh reservations
        fetchOrdersAndReservations();
      } catch (error) {
        console.error('Error cancelling reservation:', error);
        await Swal.fire({
          title: 'Cancel Failed',
          text: error.response?.data?.message || 'Failed to cancel reservation',
          icon: 'error',
          confirmButtonColor: '#78350f'
        });
      }
    }
  };

  const handleRequestCancelOrder = async (orderId) => {
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
        await axios.post(`http://localhost:4000/api/orders/${orderId}/cancel-request`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        await Swal.fire({
          title: 'Request Sent!',
          text: 'Cancellation request sent successfully. An admin will review your request.',
          icon: 'success',
          confirmButtonColor: '#78350f',
          timer: 3000
        });
        fetchOrdersAndReservations();
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

  const handleOpenFeedbackModal = (order) => {
    setSelectedOrderForFeedback(order);
    setShowFeedbackModal(true);
    setFeedbackData({
      rating: 0,
      feedbackType: 'general',
      message: ''
    });
  };

  const handleSubmitFeedback = async () => {
    if (feedbackData.rating === 0) {
      await Swal.fire({
        title: 'Rating Required',
        text: 'Please select a rating',
        icon: 'warning',
        confirmButtonColor: '#78350f'
      });
      return;
    }

    if (!feedbackData.message.trim()) {
      await Swal.fire({
        title: 'Message Required',
        text: 'Please enter your feedback message',
        icon: 'warning',
        confirmButtonColor: '#78350f'
      });
      return;
    }

    try {
      const token = localStorage.getItem('appToken');
      await axios.post('http://localhost:4000/api/feedback/submit', {
        orderId: selectedOrderForFeedback.orderId,
        rating: feedbackData.rating,
        feedbackType: feedbackData.feedbackType,
        message: feedbackData.message
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      await Swal.fire({
        title: 'Thank You!',
        text: 'Thank you for your feedback!',
        icon: 'success',
        confirmButtonColor: '#78350f',
        timer: 2000
      });
      setShowFeedbackModal(false);
      setSelectedOrderForFeedback(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      await Swal.fire({
        title: 'Submission Failed',
        text: error.response?.data?.message || 'Failed to submit feedback',
        icon: 'error',
        confirmButtonColor: '#78350f'
      });
    }
  };

  const handleOrderClick = (order) => {
    navigate('/status', {
      state: {
        orderId: order.orderId,
        status: order.status,
        orderData: order
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#EDEDE6]">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-3xl font-playfair mb-4">Please Sign In</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to view your orders and reservations</p>
            <Link to="/" className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-block">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getBadgeStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#EDEDE6]">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-playfair">My Account</h1>
          
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all border border-gray-200"
              >
                <Bell size={24} className="text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-amber-500 to-orange-600">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-xs bg-white text-amber-600 px-2 py-1 rounded-full font-semibold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Bell size={48} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No notifications yet</p>
                          <p className="text-xs mt-1">You'll be notified when your order or reservation status changes</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() => markNotificationAsRead(notification._id)}
                            className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl flex-shrink-0">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className={`text-sm font-semibold ${getStatusColor(notification.status)}`}>
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 mb-1">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span className={`px-2 py-0.5 rounded-full ${
                                    notification.type === 'order' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {notification.type === 'order' ? 'Order' : 'Reservation'} #{notification.referenceNumber}
                                  </span>
                                  <span>•</span>
                                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer Actions */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAllAsRead();
                          }}
                          className="flex-1 text-xs text-blue-600 hover:text-blue-700 font-semibold py-2"
                        >
                          Mark all as read
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            Swal.fire({
                              title: 'Clear All?',
                              text: 'Clear all notifications?',
                              icon: 'question',
                              showCancelButton: true,
                              confirmButtonColor: '#78350f',
                              cancelButtonColor: '#6B7280',
                              confirmButtonText: 'Yes, clear all',
                              cancelButtonText: 'Cancel'
                            }).then((result) => {
                              if (result.isConfirmed) {
                                clearNotifications();
                              }
                            });
                          }}
                          className="flex-1 text-xs text-red-600 hover:text-red-700 font-semibold py-2"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => navigate('/account')}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Account
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            My Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'reservations'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            My Reservations ({reservations.filter(r => r.status !== 'cancelled').length})
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {activeTab === 'orders' ? (
              [...Array(3)].map((_, i) => <SkeletonOrderCard key={i} />)
            ) : (
              [...Array(3)].map((_, i) => <SkeletonReservation key={i} />)
            )}
          </div>
        ) : (
          <>
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="bg-white rounded-lg p-12 text-center shadow-md">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-6">Start browsing our menu to place your first order</p>
                    <Link to="/" className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-block">
                      Browse Menu
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order._id} className="bg-white/60 border border-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Clickable order details */}
                      <div 
                        onClick={() => handleOrderClick(order)}
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold">Order #{order.orderId}</h3>
                            <p className="text-gray-600 text-sm">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getBadgeStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-2">Items:</h4>
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between py-2">
                              <span>{item.name} x {item.quantity}</span>
                              <span className="font-semibold">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          <div className="border-t mt-2 pt-2 flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-amber-600">${(order.totalPrice || order.totalAmount || 0).toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Click to view order status
                        </div>
                      </div>

                      {/* Cancel request button - only show for pending/confirmed orders */}
                      {(order.status === 'pending' || order.status === 'confirmed') && !order.cancelRequested && (
                        <div className="border-t px-6 py-4 bg-gray-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the order click
                              handleRequestCancelOrder(order._id);
                            }}
                            className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Request Cancellation
                          </button>
                        </div>
                      )}

                      {/* Show if cancellation already requested */}
                      {order.cancelRequested && (
                        <div className="border-t px-6 py-4 bg-yellow-50">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold">Cancellation Requested</span>
                          </div>
                          <p className="text-sm text-yellow-700 mt-1">Your cancellation request is being reviewed by an admin.</p>
                        </div>
                      )}

                      {/* Feedback button for completed orders */}
                      {order.status === 'completed' && (
                        <div className="border-t px-6 py-4 bg-green-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFeedbackModal(order);
                            }}
                            className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <MessageSquare size={20} />
                            Share Your Feedback
                          </button>
                          <p className="text-sm text-green-700 mt-2 text-center">
                            Help us improve by sharing your experience
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Reservations Tab */}
            {activeTab === 'reservations' && (
              <div className="space-y-4">
                {reservations.length === 0 ? (
                  <div className="bg-white/60 rounded-lg p-12 text-center shadow-md">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold mb-2">No reservations yet</h3>
                    <p className="text-gray-600 mb-6">Book a table to enjoy our cozy atmosphere</p>
                    <Link to="/reservation" className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-block">
                      Reserve a Table
                    </Link>
                  </div>
                ) : (
                  reservations.map((reservation) => (
                    <div key={reservation._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">Reservation #{reservation.reservationId}</h3>
                          <p className="text-gray-600 text-sm">
                            {new Date(reservation.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getBadgeStatusColor(reservation.status)}`}>
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Time</p>
                          <p className="font-semibold">{reservation.time}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Guests</p>
                          <p className="font-semibold">{reservation.guests} {reservation.guests === 1 ? 'Guest' : 'Guests'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-semibold">{reservation.customerInfo.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-semibold">{reservation.customerInfo.phone}</p>
                        </div>
                      </div>

                      {reservation.specialRequests && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">Special Requests:</p>
                          <p className="text-sm italic">{reservation.specialRequests}</p>
                        </div>
                      )}

                      {reservation.status === 'confirmed' && (
                        <div className="border-t pt-4">
                          <button
                            onClick={() => handleCancelReservation(reservation._id)}
                            className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Cancel Reservation
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedOrderForFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Share Your Feedback</h2>
                  <p className="text-sm opacity-90">Order #{selectedOrderForFeedback.orderId}</p>
                </div>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Rating Section */}
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  How would you rate your experience?
                </label>
                <div className="flex items-center justify-center gap-2 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={40}
                        className={star <= feedbackData.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
                {feedbackData.rating > 0 && (
                  <p className="text-center text-amber-600 font-semibold">
                    {feedbackData.rating === 5 ? 'Excellent!' :
                     feedbackData.rating === 4 ? 'Very Good!' :
                     feedbackData.rating === 3 ? 'Good' :
                     feedbackData.rating === 2 ? 'Fair' : 'Needs Improvement'}
                  </p>
                )}
              </div>

              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  What would you like to give feedback on?
                </label>
                <select
                  value={feedbackData.feedbackType}
                  onChange={(e) => setFeedbackData({ ...feedbackData, feedbackType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="general">General Experience</option>
                  <option value="food">Food Quality</option>
                  <option value="service">Service</option>
                  <option value="ambiance">Ambiance</option>
                  <option value="delivery">Delivery/Pickup</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Tell us more about your experience
                </label>
                <textarea
                  value={feedbackData.message}
                  onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
                  placeholder="Share your thoughts, suggestions, or concerns..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Your feedback helps us improve our service
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={feedbackData.rating === 0 || !feedbackData.message.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
