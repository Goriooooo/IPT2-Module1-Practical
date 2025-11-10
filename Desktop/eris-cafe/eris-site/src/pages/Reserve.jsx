import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import axios from 'axios';

const Reservation = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState([
    { id: 1, occupied: true },
    { id: 2, occupied: false },
    { id: 3, occupied: true },
    { id: 4, occupied: false },
    { id: 5, occupied: false },
  ]);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    guests: '1',
    date: '',
    time: ''
  });

  const handleTableClick = (table) => {
    if (!table.occupied) {
      setSelectedTable(table);
      setShowModal(true);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to make a reservation');
      navigate('/');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.date || !formData.time) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert('Cannot make reservations for past dates. Please select today or a future date.');
      return;
    }

    // If reservation is for today, validate time is not in the past
    if (selectedDate.getTime() === today.getTime()) {
      const selectedTime = formData.time.split(':');
      const selectedDateTime = new Date();
      selectedDateTime.setHours(parseInt(selectedTime[0]), parseInt(selectedTime[1]), 0, 0);
      
      const currentTime = new Date();
      
      if (selectedDateTime < currentTime) {
        alert('Cannot make reservations for past times. Please select a future time.');
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('appToken');
      
      if (!token) {
        alert('Please sign in to make a reservation');
        navigate('/');
        return;
      }

      const reservationData = {
        customerInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        },
        date: formData.date,
        time: formData.time,
        guests: parseInt(formData.guests)
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
        setTables(tables.map(t => 
          t.id === selectedTable.id ? { ...t, occupied: true } : t
        ));
        
        setFormData({
          name: '',
          email: '',
          phone: '',
          guests: '1',
          date: '',
          time: ''
        });
        setShowModal(false);
        setSelectedTable(null);
        
        const reservationDate = new Date(formData.date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        alert(`Reservation confirmed for ${reservationDate} at ${formData.time}!\n\nReservation ID: ${response.data.data.reservationId}\n\nCheck your bookings page for details.`);
        navigate('/booking');
      }
    } catch (error) {
      console.error('Reservation error:', error);
      
      if (error.response?.status === 401) {
        alert('Your session has expired. Please sign in again.');
        navigate('/');
      } else if (error.response?.data?.message) {
        alert(`Reservation failed: ${error.response.data.message}`);
      } else {
        alert('Failed to create reservation. Please try again.');
      }
    }
  };

  const Table = ({ table, position, mobilePosition }) => {
    const isOccupied = table.occupied;
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <div 
        className={`${isOccupied ? 'cursor-not-allowed' : 'cursor-pointer'} transition-all duration-300 group`}
        onClick={() => handleTableClick(table)}
        onMouseEnter={() => !isOccupied && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          ...position,
          ...mobilePosition
        }}
      >
        <div className=" font-playfair relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center">
          {/* Top chair */}
          <div className={`absolute -top-4 sm:-top-5 md:-top-6 left-1/2 -translate-x-1/2 w-6 h-8 sm:w-8 sm:h-10 md:w-10 md:h-12 rounded-t-lg transition-colors duration-300 ${
            isOccupied ? 'bg-amber-900' : isHovered ? 'bg-[#B0CE88]' : 'bg-gray-400'
          }`}></div>
          
          {/* Right chair */}
          <div className={`absolute -right-4 sm:-right-5 md:-right-6 top-1/2 -translate-y-1/2 w-8 h-6 sm:w-10 sm:h-8 md:w-12 md:h-10 rounded-r-lg transition-colors duration-300 ${
            isOccupied ? 'bg-amber-900' : isHovered ? 'bg-[#B0CE88]' : 'bg-gray-400'
          }`}></div>
          
          {/* Bottom chair */}
          <div className={`absolute -bottom-4 sm:-bottom-5 md:-bottom-6 left-1/2 -translate-x-1/2 w-6 h-8 sm:w-8 sm:h-10 md:w-10 md:h-12 rounded-b-lg transition-colors duration-300 ${
            isOccupied ? 'bg-amber-900' : isHovered ? 'bg-[#B0CE88]' : 'bg-gray-400'
          }`}></div>
          
          {/* Left chair */}
          <div className={`absolute -left-4 sm:-left-5 md:-left-6 top-1/2 -translate-y-1/2 w-8 h-6 sm:w-10 sm:h-8 md:w-12 md:h-10 rounded-l-lg transition-colors duration-300 ${
            isOccupied ? 'bg-amber-900' : isHovered ? 'bg-[#B0CE88]' : 'bg-gray-400'
          }`}></div>
          
          {/* Center table */}
          <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-lg sm:text-xl md:text-2xl font-bold shadow-lg transition-all duration-300 ${
            isOccupied 
              ? 'bg-amber-800 text-amber-900' 
              : isHovered 
                ? 'bg-[#B0CE88] text-white' 
                : 'bg-gray-200 text-gray-700'
          }`}>
            {table.id}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#EDEDE6]">
      {/* Header */}
        <Navigation />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-light text-center mb-6 sm:mb-12">
          Seat Reservation
        </h1>
        
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
            mobilePosition={{ '@media (min-width: 768px)': { top: '50px', left: '100px' }}}
          />
          <Table 
            table={tables[4]} 
            position={{ position: 'absolute', top: '30px', right: '60px' }}
            mobilePosition={{ '@media (min-width: 768px)': { top: '50px', right: '100px' }}}
          />
          
          <Table 
            table={tables[1]} 
            position={{ position: 'absolute', top: '220px', left: '30px' }}
            mobilePosition={{ '@media (min-width: 768px)': { top: '280px', left: '50px' }}}
          />
          <Table 
            table={tables[2]} 
            position={{ position: 'absolute', top: '220px', left: '50%', transform: 'translateX(-50%)' }}
            mobilePosition={{ '@media (min-width: 768px)': { top: '280px' }}}
          />
          <Table 
            table={tables[3]} 
            position={{ position: 'absolute', top: '220px', right: '30px' }}
            mobilePosition={{ '@media (min-width: 768px)': { top: '280px', right: '50px' }}}
          />
        </div>
      </div>

      {/* Reservation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Reserve Table {selectedTable?.id}
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
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Full Name"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="eris@example.com"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="09XX XXX XXXX"
                />
              </div>

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