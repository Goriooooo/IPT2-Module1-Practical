import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import { motion } from 'framer-motion';
import axios from 'axios';
import Swal from 'sweetalert2';
import { SkeletonReservation } from '../components/SkeletonLoaders';

const Booking = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchReservations();
  }, [isAuthenticated, navigate]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('appToken');
      
      if (!token) {
        navigate('/');
        return;
      }

      const response = await axios.get('http://localhost:4000/api/reservations/my-reservations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setReservations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      if (error.response?.status === 401) {
        navigate('/');
      } else {
        setError('Failed to load reservations');
      }
    } finally {
      setLoading(false);
    }
  };

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

    if (!result.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('appToken');
      
      const response = await axios.delete(
        `http://localhost:4000/api/reservations/${reservationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        await Swal.fire({
          title: 'Cancelled!',
          text: 'Reservation cancelled successfully',
          icon: 'success',
          confirmButtonColor: '#78350f',
          timer: 2000
        });
        fetchReservations();
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      await Swal.fire({
        title: 'Cancel Failed',
        text: error.response?.data?.message || 'Failed to cancel reservation',
        icon: 'error',
        confirmButtonColor: '#78350f'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'no-show':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEDE6]">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-300 rounded w-64 mb-4 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-full mb-6 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            <SkeletonReservation />
            <SkeletonReservation />
            <SkeletonReservation />
            <SkeletonReservation />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="min-h-screen bg-[#EDEDE6]"
      initial={{ width: 0}}
      animate={{ width: "100%" }}
      exit={{ x: window.innerWidth, transition: { duration: 0.3 } }}
    >
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900">
                My Reservations
              </h1>
              <p className="text-gray-600 mt-2">
                View and manage your table reservations
              </p>
            </div>
            <Link
              to="/reservation"
              className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors shadow-md"
            >
              + New Reservation
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {reservations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <svg
              className="mx-auto h-24 w-24 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">No reservations yet</h3>
            <p className="mt-2 text-gray-600">
              Start by making your first table reservation
            </p>
            <Link
              to="/reservation"
              className="mt-6 inline-block px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
            >
              Make a Reservation
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reservations.map((reservation) => (
              <div
                key={reservation._id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white text-sm font-medium">Reservation ID</p>
                      <p className="text-white text-xs opacity-90 font-mono">
                        {reservation.reservationId}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        reservation.status
                      )}`}
                    >
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(reservation.date)}
                      </p>
                      <p className="text-sm text-gray-600">{reservation.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="text-sm text-gray-700">
                      {reservation.guests} {reservation.guests === 1 ? 'Guest' : 'Guests'}
                    </p>
                  </div>

                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {reservation.customerInfo.name}
                      </p>
                      <p className="text-xs text-gray-600">{reservation.customerInfo.email}</p>
                      <p className="text-xs text-gray-600">{reservation.customerInfo.phone}</p>
                    </div>
                  </div>

                  {reservation.specialRequests && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Special Requests:</p>
                      <p className="text-xs text-gray-600 italic">{reservation.specialRequests}</p>
                    </div>
                  )}
                </div>

                {reservation.status === 'confirmed' && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() => handleCancelReservation(reservation._id)}
                      className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Cancel Reservation
                    </button>
                  </div>
                )}

                {reservation.status === 'cancelled' && reservation.cancelledAt && (
                  <div className="px-6 py-3 bg-red-50 border-t border-red-100">
                    <p className="text-xs text-red-600">
                      Cancelled on{' '}
                      {new Date(reservation.cancelledAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Booking;
