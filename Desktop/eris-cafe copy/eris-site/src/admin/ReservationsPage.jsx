import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar as CalendarIcon, X, LayoutList, CalendarDays, Cloud, CloudOff } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  initGoogleCalendar,
  initGoogleIdentity,
  isSignedIn,
  signIn,
  signOut,
  syncReservationToCalendar,
  deleteCalendarEvent
} from '../utils/googleCalendarModern';
import { SkeletonTable, SkeletonReservation } from '../components/SkeletonLoaders';

// Setup the localizer for react-big-calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const ReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [googleSignedIn, setGoogleSignedIn] = useState(false);
  const [googleCalendarInitialized, setGoogleCalendarInitialized] = useState(false);
  
  // Calendar state
  const [calendarView, setCalendarView] = useState('month');
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    fetchReservations();
    initializeGoogleCalendar();
    
    // Check for stored token every 5 seconds to update UI
    const intervalId = setInterval(() => {
      if (googleCalendarInitialized) {
        const signedIn = isSignedIn();
        if (signedIn !== googleSignedIn) {
          setGoogleSignedIn(signedIn);
          console.log('🔄 Sign-in status updated:', signedIn);
        }
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [googleCalendarInitialized, googleSignedIn]);

  // Initialize Google Calendar API
  const initializeGoogleCalendar = async () => {
    try {
      console.log('🚀 Starting Google Calendar initialization...');
      
      // Initialize both GAPI and GIS
      await Promise.all([
        initGoogleCalendar(),
        initGoogleIdentity()
      ]);
      
      setGoogleCalendarInitialized(true);
      setGoogleSignedIn(isSignedIn());
      console.log('✅ Google Calendar initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Calendar:', error);
      setGoogleCalendarInitialized(false);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('API Key')) {
        console.error('💡 Fix: Add your Google Calendar API Key to .env file');
      } else if (errorMessage.includes('Client ID')) {
        console.error('💡 Fix: Add your Google Client ID to .env file');
      } else {
        console.error('💡 Fix: Check browser console for details');
      }
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    console.log('🔐 User clicked Connect Google Calendar');
    
    if (!googleCalendarInitialized) {
      await Swal.fire({
        title: 'API Not Initialized',
        html: `
          <p class="text-red-600 font-semibold mb-2">Google Calendar API not initialized.</p>
          <p class="text-left mt-3 mb-2"><strong>Please check:</strong></p>
          <ol class="text-left list-decimal list-inside space-y-1">
            <li>API Key is set in .env</li>
            <li>Client ID is set in .env</li>
            <li>Calendar API is enabled in Google Cloud Console</li>
          </ol>
          <p class="text-sm text-gray-500 mt-3">Check browser console for details.</p>
        `,
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
      return;
    }
    
    const success = await signIn();
    if (success) {
      setGoogleSignedIn(true);
      await Swal.fire({
        title: 'Successfully Connected!',
        text: 'You can now sync reservations to your calendar.',
        icon: 'success',
        confirmButtonColor: '#8B5CF6',
        timer: 3000
      });
      console.log('✅ Google Calendar connected');
    } else {
      await Swal.fire({
        title: 'Connection Failed',
        html: `
          <p class="mb-3">Failed to connect to Google Calendar.</p>
          <p class="text-left mb-2"><strong>Possible issues:</strong></p>
          <ol class="text-left list-decimal list-inside space-y-1">
            <li>Popup was blocked (allow popups)</li>
            <li>User denied permissions</li>
            <li>OAuth not configured properly</li>
          </ol>
          <p class="text-sm text-gray-500 mt-3">Check browser console for details.</p>
        `,
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
      console.error('❌ Sign-in failed - check console for details');
    }
  };

  // Handle Google Sign Out
  const handleGoogleSignOut = async () => {
    const success = await signOut();
    if (success) {
      setGoogleSignedIn(false);
      await Swal.fire({
        title: 'Disconnected',
        text: 'Disconnected from Google Calendar',
        icon: 'info',
        confirmButtonColor: '#8B5CF6',
        timer: 2000
      });
    }
  };

  // Sync reservation to Google Calendar
  const syncToGoogleCalendar = async (reservation) => {
    if (!googleSignedIn) {
      await Swal.fire({
        title: 'Sign In Required',
        text: 'Please sign in to Google Calendar first',
        icon: 'warning',
        confirmButtonColor: '#8B5CF6'
      });
      return;
    }

    const result = await syncReservationToCalendar(reservation);
    if (result.success) {
      // Save the event ID to the database
      try {
        const token = localStorage.getItem('appToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        await axios.patch(
          `http://localhost:4000/api/reservations/${reservation._id}/calendar-event`,
          { googleCalendarEventId: result.eventId },
          config
        );

        // Update local state
        setReservations(reservations.map(res =>
          res._id === reservation._id 
            ? { ...res, googleCalendarEventId: result.eventId } 
            : res
        ));

        // Update selected reservation if it's the one being synced
        if (selectedReservation?._id === reservation._id) {
          setSelectedReservation({ ...selectedReservation, googleCalendarEventId: result.eventId });
        }

        console.log('✅ Event ID saved to database:', result.eventId);
        console.log('🔗 View in Calendar:', result.htmlLink);
      } catch (error) {
        console.error('⚠️ Failed to save event ID to database:', error);
      }

      await Swal.fire({
        title: 'Synced!',
        html: `
          <p class="mb-2">Reservation synced to Google Calendar!</p>
          <a href="${result.htmlLink}" target="_blank" class="text-blue-600 hover:underline text-sm">
            View in Google Calendar →
          </a>
        `,
        icon: 'success',
        confirmButtonColor: '#8B5CF6',
        timer: 3000
      });
    } else {
      await Swal.fire({
        title: 'Sync Failed',
        text: result.error,
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    }
  };

  // Delete reservation from Google Calendar
  const removeFromGoogleCalendar = async (eventId) => {
    if (!googleSignedIn) {
      return;
    }

    if (eventId) {
      const result = await deleteCalendarEvent(eventId);
      if (result.success) {
        await Swal.fire({
          title: 'Removed',
          text: 'Removed from Google Calendar',
          icon: 'success',
          confirmButtonColor: '#8B5CF6',
          timer: 2000
        });
      }
    }
  };

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('appToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const response = await axios.get('http://localhost:4000/api/reservations/admin/all', config);
      setReservations(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setLoading(false);
    }
  };

  // Transform reservations into calendar events
  const calendarEvents = useMemo(() => {
    return reservations.map(reservation => {
      // Parse the date correctly to avoid timezone issues
      // Create a Date object from the stored date
      const storedDate = new Date(reservation.date);
      
      // Extract date components in LOCAL timezone (not UTC)
      const year = storedDate.getFullYear();
      const month = storedDate.getMonth(); // Already 0-indexed
      const day = storedDate.getDate(); // Day of month in local time
      
      const [hours, minutes] = reservation.time.split(':').map(Number);
      
      // Create date in local timezone using extracted components
      const reservationDate = new Date(year, month, day, hours, minutes, 0);
      const endDate = new Date(year, month, day, hours + 2, minutes, 0);

      return {
        id: reservation._id,
        title: `${reservation.customerInfo?.name} - ${reservation.guests} guests`,
        start: reservationDate,
        end: endDate,
        resource: reservation,
        status: reservation.status
      };
    });
  }, [reservations]);

  // Style events based on status
  const eventStyleGetter = (event) => {
    let backgroundColor = '#d1d5db'; // gray
    let borderColor = '#9ca3af';

    switch (event.status) {
      case 'confirmed':
        backgroundColor = '#10b981'; // green
        borderColor = '#059669';
        break;
      case 'pending':
        backgroundColor = '#f59e0b'; // yellow
        borderColor = '#d97706';
        break;
      case 'completed':
        backgroundColor = '#3b82f6'; // blue
        borderColor = '#2563eb';
        break;
      case 'cancelled':
        backgroundColor = '#ef4444'; // red
        borderColor = '#dc2626';
        break;
      case 'no-show':
        backgroundColor = '#6b7280'; // gray
        borderColor = '#4b5563';
        break;
      default:
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        color: 'white',
        borderRadius: '5px',
        opacity: 0.9,
        display: 'block'
      }
    };
  };

  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      const token = localStorage.getItem('appToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      await axios.patch(
        `http://localhost:4000/api/reservations/${reservationId}/status`,
        { status: newStatus },
        config
      );

      // Update local state
      setReservations(reservations.map(res =>
        res._id === reservationId ? { ...res, status: newStatus } : res
      ));

      await Swal.fire({
        title: 'Status Updated',
        text: `Reservation status updated to ${newStatus}`,
        icon: 'success',
        confirmButtonColor: '#8B5CF6',
        timer: 2000
      });
    } catch (error) {
      console.error('Error updating reservation:', error);
      await Swal.fire({
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update reservation status',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.reservationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customerInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || reservation.status === filterStatus.toLowerCase();
    
    let matchesDate = true;
    if (filterDate) {
      const resDate = new Date(reservation.date).toLocaleDateString();
      const filterDateObj = new Date(filterDate).toLocaleDateString();
      matchesDate = resDate === filterDateObj;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const viewDetails = (reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div>
        <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8'>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 animate-pulse">
            <div className="h-12 bg-white/20 rounded w-96"></div>
            <div className="flex items-center gap-4">
              <div className="h-12 bg-white/20 rounded w-48"></div>
              <div className="flex gap-2">
                <div className="h-10 bg-white/10 rounded w-28"></div>
                <div className="h-10 bg-white/10 rounded w-32"></div>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-10 bg-white/20 rounded flex-1"></div>
            <div className="h-10 bg-white/20 rounded w-32"></div>
            <div className="h-10 bg-white/20 rounded w-40"></div>
            <div className="h-10 bg-white/20 rounded w-24"></div>
          </div>
        </div>
        <div className="px-4 md:px-8 py-6">
          {viewMode === 'calendar' ? (
            <div className="bg-white rounded-lg shadow-md p-6 animate-pulse" style={{ height: '600px' }}>
              <div className="h-full bg-gray-200 rounded"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => <SkeletonReservation key={i} />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Gradient Header */}
      <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8'>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-4xl md:text-5xl font-bold text-[#EDEDE6]">Reservations Management</h1>
          
          <div className="flex items-center gap-4">
            {/* Google Calendar Connection */}
            {googleCalendarInitialized && (
              googleSignedIn ? (
                <button
                  onClick={handleGoogleSignOut}
                  className="px-4 py-3 bg-white/70 text-green-600 rounded-lg hover:bg-gray-100 transition flex items-center gap-2 font-semibold shadow-lg"
                >
                  <Cloud size={18} />
                  Google Calendar Connected
                </button>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  className="px-4 py-3 bg-white/70 text-violet-600 rounded-lg hover:bg-gray-100 transition flex items-center gap-2 font-semibold shadow-lg"
                >
                  <CloudOff size={18} />
                  Connect Google Calendar
                </button>
              )
            )}
            
            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-violet-600 shadow-lg' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
              <LayoutList size={18} />
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-white text-violet-600 shadow-lg' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <CalendarDays size={18} />
              Calendar View
            </button>
          </div>
          
            <button
              onClick={fetchReservations}
              className="px-4 py-3 bg-white/70 border border-white text-[#78350f] rounded-lg hover:bg-gray-100 transition font-semibold shadow-lg"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="mt-5">
             {/* Filters */}
              <div className="bg-white/70 border border-white rounded-lg shadow-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search reservations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    <option value="All">All Status</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No-show">No-show</option>
                  </select>

                  {/* Date Filter */}
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                </div>
              </div>
        </div>
        <div className="mt-5">
              {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/70 border border-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Total Reservations</p>
              <p className="text-2xl font-bold text-gray-800">{reservations.length}</p>
            </div>
            <div className="bg-white/70 border border-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">
                {reservations.filter(r => r.status === 'confirmed').length}
              </p>
            </div>
            <div className="bg-white/70 border border-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {reservations.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white/70 border border-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-blue-600">
                {reservations.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 space-y-6">
      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <div className="bg-white/70 border border-white rounded-lg shadow-md p-6">
            <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Reservation Calendar</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Cancelled</span>
              </div>
            </div>
          </div>          <style>{`
            /* Calendar Toolbar Styling */
            .rbc-toolbar {
              padding: 1rem 0;
              margin-bottom: 1rem;
            }
            
            .rbc-toolbar button {
              padding: 0.5rem 1rem;
              border: 1px solid #d1d5db;
              background-color: white;
              color: #374151;
              border-radius: 0.5rem;
              font-weight: 500;
              transition: all 0.2s;
              cursor: pointer;
              font-size: 0.875rem;
            }
            
            .rbc-toolbar button:hover {
              background-color: #f3f4f6;
              border-color: #d97706;
              color: #d97706;
            }
            
            .rbc-toolbar button:active,
            .rbc-toolbar button.rbc-active {
              background-color: #d97706;
              border-color: #d97706;
              color: white;
            }
            
            .rbc-toolbar-label {
              font-size: 1.125rem;
              font-weight: 600;
              color: #1f2937;
              padding: 0 1rem;
            }
            
            /* Button Groups Spacing */
            .rbc-btn-group {
              display: flex;
              gap: 0.5rem;
            }
          `}</style>
          
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={(event) => viewDetails(event.resource)}
              views={['month', 'week', 'day', 'agenda']}
              view={calendarView}
              onView={setCalendarView}
              date={calendarDate}
              onNavigate={setCalendarDate}
              defaultView="month"
              popup
              selectable
              tooltipAccessor={(event) => `${event.title}\nStatus: ${event.status}`}
            />
          </div>
        </div>
      ) : (
        <>
         
      {/* Reservations Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Reservation ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Contact</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date & Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Table</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Guests</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No reservations found
                  </td>
                </tr>
              ) : (
                filteredReservations.map((reservation) => (
                  <tr key={reservation._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">
                      {reservation.reservationId}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {reservation.customerInfo?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div>{reservation.customerInfo?.email || 'N/A'}</div>
                      <div className="text-xs">{reservation.customerInfo?.phone || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="text-gray-800">
                          {new Date(reservation.date).toLocaleDateString('en-US')}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {(() => {
                            const [hours, minutes] = reservation.time.split(':');
                            const hour = parseInt(hours);
                            const period = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                            return `${displayHour}:${minutes} ${period}`;
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-amber-800">
                            {reservation.tableId || 'N/A'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">Table</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {reservation.guests} {reservation.guests === 1 ? 'guest' : 'guests'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                        {reservation.status?.charAt(0).toUpperCase() + reservation.status?.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => viewDetails(reservation)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Details Modal */}
      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Reservation Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Reservation ID</p>
                    <p className="font-medium">{selectedReservation.reservationId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedReservation.status)}`}>
                      {selectedReservation.status?.charAt(0).toUpperCase() + selectedReservation.status?.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{selectedReservation.customerInfo?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedReservation.customerInfo?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{selectedReservation.customerInfo?.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Number of Guests</p>
                      <p className="font-medium">{selectedReservation.guests}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Reservation Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium">
                        {new Date(selectedReservation.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-medium">
                        {(() => {
                          const [hours, minutes] = selectedReservation.time.split(':');
                          const hour = parseInt(hours);
                          const period = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                          return `${displayHour}:${minutes} ${period}`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Table Number</p>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {selectedReservation.tableId || 'N/A'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {selectedReservation.tableId ? 'Assigned' : 'Not assigned'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Number of Guests</p>
                      <p className="font-medium">{selectedReservation.guests}</p>
                    </div>
                  </div>
                </div>

                {selectedReservation.specialRequests && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Special Requests</h3>
                    <p className="text-gray-700">{selectedReservation.specialRequests}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Manage Reservation</h3>
                  
                  {selectedReservation.status === 'pending' && (
                    <div className="space-y-3">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          ⏳ This reservation is pending your confirmation. Approve or reject it below.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            // Check for conflicting reservations
                            const conflicts = reservations.filter(res => {
                              if (res._id === selectedReservation._id) return false; // Skip self
                              if (res.status !== 'confirmed') return false; // Only check confirmed reservations
                              
                              // Check if same date
                              const resDate = new Date(res.date).toLocaleDateString();
                              const selectedDate = new Date(selectedReservation.date).toLocaleDateString();
                              if (resDate !== selectedDate) return false;
                              
                              // Check if same table
                              if (res.tableId !== selectedReservation.tableId) return false;
                              
                              // Check if same time
                              if (res.time === selectedReservation.time) return true;
                              
                              return false;
                            });

                            if (conflicts.length > 0) {
                              const conflictDetails = conflicts.map(c => 
                                `<li>${c.customerInfo?.name} at ${c.time} (Reservation ID: ${c.reservationId})</li>`
                              ).join('');
                              
                              await Swal.fire({
                                title: 'Cannot Confirm!',
                                html: `
                                  <p class="mb-2">Table ${selectedReservation.tableId} is already booked at this time:</p>
                                  <ul class="text-left list-disc list-inside mb-3">${conflictDetails}</ul>
                                  <p class="text-left mb-1"><strong>Please:</strong></p>
                                  <ol class="text-left list-decimal list-inside space-y-1">
                                    <li>Assign a different table, OR</li>
                                    <li>Choose a different time slot</li>
                                    <li>Or cancel the conflicting reservation first</li>
                                  </ol>
                                `,
                                icon: 'error',
                                confirmButtonColor: '#8B5CF6'
                              });
                              return;
                            }

                            const confirmResult = await Swal.fire({
                              title: 'Confirm Reservation?',
                              text: 'The customer will be notified and the table will be marked as occupied.',
                              icon: 'question',
                              showCancelButton: true,
                              confirmButtonColor: '#10B981',
                              cancelButtonColor: '#6B7280',
                              confirmButtonText: 'Yes, confirm it',
                              cancelButtonText: 'Cancel'
                            });

                            if (confirmResult.isConfirmed) {
                              await updateReservationStatus(selectedReservation._id, 'confirmed');
                              setSelectedReservation({...selectedReservation, status: 'confirmed'});
                              await Swal.fire({
                                title: 'Confirmed!',
                                text: 'Reservation confirmed! The table is now marked as occupied.',
                                icon: 'success',
                                confirmButtonColor: '#8B5CF6',
                                timer: 2000
                              });
                            }
                          }}
                          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve Reservation
                        </button>
                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: 'Reject Reservation?',
                              text: 'The customer will be notified.',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#EF4444',
                              cancelButtonColor: '#6B7280',
                              confirmButtonText: 'Yes, reject it',
                              cancelButtonText: 'Cancel'
                            });

                            if (result.isConfirmed) {
                              await updateReservationStatus(selectedReservation._id, 'cancelled');
                              setSelectedReservation({...selectedReservation, status: 'cancelled'});
                              await Swal.fire({
                                title: 'Rejected',
                                text: 'Reservation rejected.',
                                icon: 'info',
                                confirmButtonColor: '#8B5CF6',
                                timer: 2000
                              });
                            }
                          }}
                          className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject Reservation
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedReservation.status === 'confirmed' && (
                    <div className="space-y-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          ✅ This reservation is confirmed. Table {selectedReservation.tableId} is marked as occupied on the reservation page.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: `Mark Table ${selectedReservation.tableId} as Vacant?`,
                              html: `
                                <p class="mb-2">This will:</p>
                                <ul class="text-left list-disc list-inside space-y-1">
                                  <li>Complete the reservation</li>
                                  <li>Free up the table for new reservations</li>
                                </ul>
                                <p class="text-sm text-gray-500 mt-3">Use this when the customer has finished their dining session.</p>
                              `,
                              icon: 'question',
                              showCancelButton: true,
                              confirmButtonColor: '#3B82F6',
                              cancelButtonColor: '#6B7280',
                              confirmButtonText: 'Yes, mark as completed',
                              cancelButtonText: 'Cancel'
                            });

                            if (result.isConfirmed) {
                              updateReservationStatus(selectedReservation._id, 'completed');
                              setShowModal(false);
                              await Swal.fire({
                                title: 'Table Vacant!',
                                text: `Table ${selectedReservation.tableId} is now vacant and available for new reservations!`,
                                icon: 'success',
                                confirmButtonColor: '#8B5CF6',
                                timer: 2000
                              });
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Mark as Completed
                        </button>
                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: 'Cancel Reservation?',
                              text: 'Cancel this confirmed reservation? The table will become available again.',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#EF4444',
                              cancelButtonColor: '#6B7280',
                              confirmButtonText: 'Yes, cancel it',
                              cancelButtonText: 'No'
                            });

                            if (result.isConfirmed) {
                              updateReservationStatus(selectedReservation._id, 'cancelled');
                              setShowModal(false);
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedReservation.status === 'cancelled' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">
                        ❌ This reservation has been cancelled. Table {selectedReservation.tableId} is available.
                      </p>
                    </div>
                  )}

                  {selectedReservation.status === 'completed' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        ✅ This reservation has been completed. Table {selectedReservation.tableId} is now vacant and available for new reservations.
                      </p>
                    </div>
                  )}

                  {selectedReservation.status === 'no-show' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-800">
                        ⚠️ Customer did not show up. Table {selectedReservation.tableId} is available.
                      </p>
                    </div>
                  )}
                </div>

                {/* Google Calendar Sync */}
                {googleSignedIn && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Google Calendar</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => syncToGoogleCalendar(selectedReservation)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
                      >
                        <Cloud size={16} />
                        {selectedReservation.googleCalendarEventId ? 'Update in Calendar' : 'Sync to Calendar'}
                      </button>
                      {selectedReservation.googleCalendarEventId && (
                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: 'Remove from Calendar?',
                              text: 'Remove this reservation from Google Calendar?',
                              icon: 'question',
                              showCancelButton: true,
                              confirmButtonColor: '#6B7280',
                              cancelButtonColor: '#9CA3AF',
                              confirmButtonText: 'Yes, remove it',
                              cancelButtonText: 'Cancel'
                            });

                            if (result.isConfirmed) {
                              removeFromGoogleCalendar(selectedReservation.googleCalendarEventId);
                            }
                          }}
                          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                        >
                          Remove from Calendar
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Sync this reservation to your Google Calendar for easy tracking and reminders.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ReservationsPage;
