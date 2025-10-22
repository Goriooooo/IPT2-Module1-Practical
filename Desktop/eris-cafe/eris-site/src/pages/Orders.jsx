import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import axios from 'axios';

const Orders = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  const fetchOrdersAndReservations = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersResponse = await axios.get(`http://localhost:3000/api/auth/orders/${user.sub}`);
      setOrders(ordersResponse.data.orders || []);
      
      // Fetch reservations
      const reservationsResponse = await axios.get(`http://localhost:3000/api/auth/reservations/${user.sub}`);
      setReservations(reservationsResponse.data.reservations || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOrdersAndReservations();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const handleCancelReservation = async (reservationId) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      try {
        await axios.delete(`http://localhost:3000/api/auth/reservations/${reservationId}`);
        // Refresh reservations
        fetchOrdersAndReservations();
      } catch (error) {
        console.error('Error cancelling reservation:', error);
        alert('Failed to cancel reservation');
      }
    }
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

  const getStatusColor = (status) => {
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
        <h1 className="text-4xl font-playfair text-center mb-8">My Account</h1>
        
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
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
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
                    <div key={order.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">Order #{order.id}</h3>
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
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Items:</h4>
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between py-2">
                            <span>{item.name} x {item.quantity}</span>
                            <span className="font-semibold">
                              ${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className="border-t mt-2 pt-2 flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span className="text-amber-600">{order.totalPrice}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Reservations Tab */}
            {activeTab === 'reservations' && (
              <div className="space-y-4">
                {reservations.length === 0 ? (
                  <div className="bg-white rounded-lg p-12 text-center shadow-md">
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
                    <div key={reservation.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">Reservation #{reservation.id}</h3>
                          <p className="text-gray-600 text-sm">Table {reservation.tableId}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(reservation.status)}`}>
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Date</p>
                          <p className="font-semibold">{reservation.date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Time</p>
                          <p className="font-semibold">{reservation.time}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Guests</p>
                          <p className="font-semibold">{reservation.guests} {reservation.guests === '1' ? 'Guest' : 'Guests'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-semibold">{reservation.customerInfo.name}</p>
                        </div>
                      </div>

                      {reservation.status !== 'cancelled' && (
                        <div className="border-t pt-4">
                          <button
                            onClick={() => handleCancelReservation(reservation.id)}
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
    </div>
  );
};

export default Orders;
