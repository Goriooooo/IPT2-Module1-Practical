import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import axios from 'axios';
import Swal from 'sweetalert2';

const Reservation = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState([
    { id: 1, occupied: false },
    { id: 2, occupied: false },
    { id: 3, occupied: false },
    { id: 4, occupied: false },
    { id: 5, occupied: false },
  ]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [formData, setFormData] = useState({
    guests: '1',
    date: '',
    time: ''
  });

  // Fetch reservations and update table occupancy
  useEffect(() => {
    fetchTableOccupancy();
  }, []);

  const fetchTableOccupancy = async () => {
    try {
      const token = localStorage.getItem('appToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:4000/api/reservations/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const reservations = response.data.data || [];
        
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter today's confirmed reservations
        const todaysReservations = reservations.filter(res => {
          const resDate = new Date(res.date);
          resDate.setHours(0, 0, 0, 0);
          return resDate.getTime() === today.getTime() && res.status === 'confirmed';
        });

        // Log ALL reservations first to see what we have
        console.log('📊 All reservations:', reservations.length);
        console.log('📋 ALL RESERVATION DATA:', reservations.map(r => ({
          id: r._id,
          tableId: r.tableId,
          status: r.status,
          date: r.date,
          rawDate: new Date(r.date).toISOString(),
          customer: r.customerInfo?.name
        })));
        console.log('📅 Today\'s date (normalized):', today.toISOString());
        console.log('📅 Today\'s confirmed reservations:', todaysReservations.length);
        console.log('🪑 Today\'s reservations details:', todaysReservations.map(r => ({
          id: r._id,
          tableId: r.tableId,
          status: r.status,
          date: r.date,
          customer: r.customerInfo?.name
        })));

        // Get occupied table IDs from actual tableId field in reservations
        const occupiedTableIds = new Set();
        todaysReservations.forEach((res) => {
          if (res.tableId) {
            // Parse tableId (could be "1", "table-1", or number)
            const tableNum = typeof res.tableId === 'number' 
              ? res.tableId 
              : parseInt(res.tableId.toString().replace(/\D/g, ''));
            
            if (!isNaN(tableNum) && tableNum >= 1 && tableNum <= 5) {
              occupiedTableIds.add(tableNum);
              console.log(`✅ Table ${tableNum} is occupied`);
            }
          } else {
            console.log('⚠️ Reservation missing tableId:', res);
          }
        });

        console.log('🔒 Occupied table IDs:', Array.from(occupiedTableIds));

        // Update table occupancy
        setTables(prevTables => 
          prevTables.map(table => ({
            ...table,
            occupied: occupiedTableIds.has(table.id)
          }))
        );
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching table occupancy:', error);
      setLoading(false);
    }
  };

  const handleTableClick = (table) => {
    if (table.occupied) {
      Swal.fire({
        title: 'Table Occupied',
        text: `Table ${table.id} is currently occupied. Please select another table.`,
        icon: 'warning',
        confirmButtonColor: '#78350f'
      });
      return;
    }
    setSelectedTable(table);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      await Swal.fire({
        title: 'Sign In Required',
        text: 'Please sign in to make a reservation',
        icon: 'info',
        confirmButtonColor: '#78350f'
      });
      navigate('/');
      return;
    }

    if (!formData.date || !formData.time || !selectedTable?.id) {
      await Swal.fire({
        title: 'Missing Information',
        text: 'Please fill in all required fields and select a table',
        icon: 'warning',
        confirmButtonColor: '#78350f'
      });
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      await Swal.fire({
        title: 'Invalid Date',
        text: 'Cannot make reservations for past dates. Please select today or a future date.',
        icon: 'error',
        confirmButtonColor: '#78350f'
      });
      return;
    }

    // If reservation is for today, validate time is not in the past
    if (selectedDate.getTime() === today.getTime()) {
      const selectedTime = formData.time.split(':');
      const selectedDateTime = new Date();
      selectedDateTime.setHours(parseInt(selectedTime[0]), parseInt(selectedTime[1]), 0, 0);
      
      const currentTime = new Date();
      
      if (selectedDateTime < currentTime) {
        await Swal.fire({
          title: 'Invalid Time',
          text: 'Cannot make reservations for past times. Please select a future time.',
          icon: 'error',
          confirmButtonColor: '#78350f'
        });
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('appToken');
      
      if (!token) {
        await Swal.fire({
          title: 'Sign In Required',
          text: 'Please sign in to make a reservation',
          icon: 'info',
          confirmButtonColor: '#78350f'
        });
        navigate('/');
        return;
      }

      const reservationData = {
        customerInfo: {
          name: user?.name || 'Guest',
          email: user?.email || '',
          phone: user?.phone || 'N/A'
        },
        date: formData.date,
        time: formData.time,
        guests: parseInt(formData.guests),
        tableId: selectedTable.id // Store which table was selected
      };

      const response = await axios.post('http://localhost:4000/api/reservations/create', 
        reservationData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setFormData({
          guests: '1',
          date: '',
          time: ''
        });
        setShowModal(false);
        setSelectedTable(null);
        
        // Refresh table occupancy after successful reservation
        fetchTableOccupancy();
        
        const reservationDate = new Date(formData.date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        await Swal.fire({
          title: 'Reservation Submitted!',
          html: `
            <p>Reservation for <strong>${reservationDate}</strong> at <strong>${formData.time}</strong></p>
            <p class="mt-2">Reservation ID: <strong>${response.data.data.reservationId}</strong></p>
            <p class="mt-2">Your reservation is pending admin confirmation. You will be notified once it's confirmed.</p>
            <p class="mt-2 text-sm text-gray-600">Check your bookings page for status updates.</p>
          `,
          icon: 'success',
          confirmButtonColor: '#78350f',
          confirmButtonText: 'View Bookings'
        });
        navigate('/booking');
      }
    } catch (error) {
      console.error('Reservation error:', error);
      
      if (error.response?.status === 401) {
        await Swal.fire({
          title: 'Session Expired',
          text: 'Your session has expired. Please sign in again.',
          icon: 'warning',
          confirmButtonColor: '#78350f'
        });
        navigate('/');
      } else if (error.response?.data?.message) {
        await Swal.fire({
          title: 'Reservation Failed',
          text: error.response.data.message,
          icon: 'error',
          confirmButtonColor: '#78350f'
        });
      } else {
        await Swal.fire({
          title: 'Error',
          text: 'Failed to create reservation. Please try again.',
          icon: 'error',
          confirmButtonColor: '#78350f'
        });
      }
    }
  };

  const Table = ({ table, position }) => {
    const isOccupied = table.occupied;
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <div 
        className={`${isOccupied ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'} transition-all duration-300 group`}
        onClick={() => handleTableClick(table)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={position}
      >
        <div className="font-playfair relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center">
          {/* Top chair */}
          <div className={`absolute -top-4 sm:-top-5 md:-top-6 left-1/2 -translate-x-1/2 w-6 h-8 sm:w-8 sm:h-10 md:w-10 md:h-12 rounded-t-lg transition-colors duration-300 ${
            isOccupied ? 'bg-amber-900' : (isHovered && !isOccupied) ? 'bg-[#B0CE88]' : 'bg-gray-400'
          }`}></div>
          
          {/* Right chair */}
          <div className={`absolute -right-4 sm:-right-5 md:-right-6 top-1/2 -translate-y-1/2 w-8 h-6 sm:w-10 sm:h-8 md:w-12 md:h-10 rounded-r-lg transition-colors duration-300 ${
            isOccupied ? 'bg-amber-900' : (isHovered && !isOccupied) ? 'bg-[#B0CE88]' : 'bg-gray-400'
          }`}></div>
          
          {/* Bottom chair */}
          <div className={`absolute -bottom-4 sm:-bottom-5 md:-bottom-6 left-1/2 -translate-x-1/2 w-6 h-8 sm:w-8 sm:h-10 md:w-10 md:h-12 rounded-b-lg transition-colors duration-300 ${
            isOccupied ? 'bg-amber-900' : (isHovered && !isOccupied) ? 'bg-[#B0CE88]' : 'bg-gray-400'
          }`}></div>
          
          {/* Left chair */}
          <div className={`absolute -left-4 sm:-left-5 md:-left-6 top-1/2 -translate-y-1/2 w-8 h-6 sm:w-10 sm:h-8 md:w-12 md:h-10 rounded-l-lg transition-colors duration-300 ${
            isOccupied ? 'bg-amber-900' : (isHovered && !isOccupied) ? 'bg-[#B0CE88]' : 'bg-gray-400'
          }`}></div>
          
          {/* Center table */}
          <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-lg sm:text-xl md:text-2xl font-bold shadow-lg transition-all duration-300 ${
            isOccupied 
              ? 'bg-amber-900 text-white border-4 border-amber-800' 
              : (isHovered && !isOccupied)
                ? 'bg-[#B0CE88] text-white' 
                : 'bg-gray-200 text-gray-700'
          }`}>
            {table.id}
          </div>
        </div>
        
        {/* Occupied indicator */}
        {isOccupied && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap">
              Occupied
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#EDEDE6]">
      {/* Header */}
        <Navigation />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-light text-center flex-1">
            Seat Reservation
          </h1>
          <button
            onClick={fetchTableOccupancy}
            className="ml-4 p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Refresh table status"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900 mb-4"></div>
            <p className="text-gray-600">Loading table availability...</p>
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex items-center justify-center space-x-4 sm:space-x-8 mb-8 sm:mb-16">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-900"></div>
                <span className="text-sm sm:text-base md:text-lg font-medium">Occupied</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-400"></div>
                <span className="text-sm sm:text-base md:text-lg font-medium">Available</span>
              </div>
            </div>

            {/* Available Tables Count */}
            <div className="text-center mb-6">
              <p className="text-base sm:text-lg text-gray-700">
                <span className="font-semibold text-green-600">
                  {tables.filter(t => !t.occupied).length}
                </span>
                {' '}of{' '}
                <span className="font-semibold">{tables.length}</span>
                {' '}tables available today
              </p>
              
              {/* Reserve Any Table Button */}
              <div className="mt-4">
                <button
                  onClick={() => {
                    // Open modal without pre-selecting a table
                    setSelectedTable({ id: null });
                    setShowModal(true);
                  }}
                  className="px-6 py-3 bg-[#B0CE88] text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  Reserve a Table (Choose Date & Time First)
                </button>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  Click here to reserve for a different date or time
                </p>
              </div>
            </div>

            {/* Tables Layout - Mobile Grid */}
            <div className="block sm:hidden">
          <div className="grid grid-cols-2 gap-12 max-w-sm mx-auto mb-12">
            <div className="flex justify-center">
              <Table table={tables[0]} position={{ position: 'relative' }} />
            </div>
            <div className="flex justify-center">
              <Table table={tables[4]} position={{ position: 'relative' }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
            <div className="flex justify-center">
              <Table table={tables[1]} position={{ position: 'relative' }} />
            </div>
            <div className="flex justify-center">
              <Table table={tables[2]} position={{ position: 'relative' }} />
            </div>
            <div className="flex justify-center">
              <Table table={tables[3]} position={{ position: 'relative' }} />
            </div>
          </div>
        </div>

        {/* Tables Layout - Tablet and Desktop */}
        <div className="hidden sm:block relative h-[400px] sm:h-[500px] md:h-[600px] max-w-4xl mx-auto">
          <Table 
            table={tables[0]} 
            position={{ position: 'absolute', top: '30px', left: '60px' }}
          />
          <Table 
            table={tables[4]} 
            position={{ position: 'absolute', top: '30px', right: '60px' }}
          />
          
          <Table 
            table={tables[1]} 
            position={{ position: 'absolute', top: '220px', left: '30px' }}
          />
          <Table 
            table={tables[2]} 
            position={{ position: 'absolute', top: '220px', left: '50%', transform: 'translateX(-50%)' }}
          />
          <Table 
            table={tables[3]} 
            position={{ position: 'absolute', top: '220px', right: '30px' }}
          />
        </div>
        </>
        )}
      </div>

      {/* Reservation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {selectedTable?.id ? `Reserve Table ${selectedTable.id}` : 'Make a Reservation'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {/* User Info Display */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-2">Reserving as:</p>
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-semibold text-gray-900">{user?.name || 'Guest'}</p>
                  <p className="text-xs sm:text-sm text-gray-700">{user?.email || 'No email'}</p>
                  {user?.phone && (
                    <p className="text-xs sm:text-sm text-gray-700">{user.phone}</p>
                  )}
                </div>
              </div>

              {/* Table Selection - Only show if no table pre-selected */}
              {!selectedTable?.id && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Select Table *
                  </label>
                  <select
                    value={selectedTable?.id || ''}
                    onChange={(e) => setSelectedTable({ id: parseInt(e.target.value) })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Choose a table...</option>
                    {tables.map(table => (
                      <option key={table.id} value={table.id}>
                        Table {table.id} {table.occupied ? '(Occupied today)' : '(Available today)'}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Tables marked as occupied today may be available for other dates
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Number of Guests *
                </label>
                <select
                  name="guests"
                  value={formData.guests}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select today or a future date
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.date === new Date().toISOString().split('T')[0] 
                    ? 'Select a future time for today' 
                    : 'Select your preferred time'}
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2 sm:pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors text-sm sm:text-base"
                >
                  Confirm Reservation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservation;