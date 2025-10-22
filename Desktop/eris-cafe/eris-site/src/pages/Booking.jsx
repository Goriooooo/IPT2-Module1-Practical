import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import hero from '../assets/hero/HERO2.jpg'
import logo from '../assets/cafe_logo.png'

const Booking = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: '1',
    specialRequests: ''
  });

  const destinations = [
    {
      id: 1,
      src: "https://images.unsplash.com/photo-1751199200315-ec34e0a79cf5?q=80&w=2162&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      alt: "Mountain landscape",
      name: "Group Workspace",
      location: "Book Left or Right side of the cafe",
      price: "299php/session"
    },
    {
      id: 2,
      src: "https://images.unsplash.com/photo-1751199199992-b32cefa81c72?q=80&w=2270&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      alt: "Ocean boat",
      name: "Premium Table",
      location: "Exclusive entire cafe during your stay",
      price: "599php/session"
    },
    {
      id: 3,
      src: "https://images.unsplash.com/photo-1664790776706-fd4b97297e5a?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      alt: "Forest stairs",
      name: "Open Workspace",
      location: "Book a specific table",
      price: "199php/session"
    }
  ];

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === destinations.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? destinations.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const selectDestination = () => {
    setSelectedDestination(destinations[currentIndex]);
    setShowBookingForm(true);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    alert(`Booking request submitted for ${selectedDestination.name}!`);
    console.log('Booking data:', { destination: selectedDestination, ...formData });
  };

  const resetForm = () => {
    setShowBookingForm(false);
    setSelectedDestination(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      checkIn: '',
      checkOut: '',
      guests: '1',
      specialRequests: ''
    });
  };

  const getImagePosition = (index) => {
    if (index === currentIndex) return 'translate-x-0 scale-100 z-30';
    if (index === (currentIndex - 1 + destinations.length) % destinations.length) {
      return 'sm:-translate-x-32 -translate-x-16 scale-90 z-20';
    }
    if (index === (currentIndex + 1) % destinations.length) {   
      return 'sm:translate-x-32 translate-x-16 scale-90 z-20';
    }
    return 'translate-x-0 scale-75 opacity-0 z-10';
  };

  if (showBookingForm) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 sm:p-8"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${hero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 m-4">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={selectedDestination.src} 
                alt={selectedDestination.alt}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Book Your Stay</h2>
            <p className="text-sm sm:text-base text-gray-600">
              {selectedDestination.name} • {selectedDestination.location}
            </p>
            <p className="text-lg sm:text-2xl font-semibold text-blue-600 mt-2">{selectedDestination.price}</p>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Number of Guests</label>
                <select
                  name="guests"
                  value={formData.guests}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Check-in Date</label>
                <input
                  type="date"
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Check-out Date</label>
                <input
                  type="date"
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Special Requests</label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Any special requests or dietary requirements..."
              ></textarea>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 pt-4 sm:pt-6">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base border-2 border-gray-300 text-gray-700 font-semibold rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                Back to Selection
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold rounded-lg sm:rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Confirm Booking
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-8"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${hero})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
      initial={{ width: 0, opacity: 0 }}
        animate={{ width: "100vw", opacity: 1 }}
        exit={{
            x: window.innerWidth,
            opacity: 0,
            transition: { duration: 0.1, ease: "easeInOut"},
        }}
        transition={{ duration: 0.1, ease: "easeInOut" }}
    >
      <div className="w-full max-w-4xl">
          {/* Header */}
      
      <header className="relative z-50 px-4 sm:px-6 lg:px-8 py-4 justify-center items-center">
        
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img className='w-12' src={logo} alt="" />
            <span className="text-xl font-bold text-amber-50">Eris Cafe.</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center space-x-8">
            <RouterLink to={"/home"} className="hover:text-amber-200 transition-colors font-medium text-amber-50">HOME</RouterLink>
            <RouterLink to={"/menu"} className="hover:text-amber-200 transition-colors font-medium text-amber-50">MENU</RouterLink>
            <a href="#" className="hover:text-amber-200 transition-colors font-medium text-amber-50">ABOUT US</a>
          </div>

          {/* Profile & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">JD</span>
              </div>
            </div>
            
            <button 
              className="md:hidden text-amber-50 hover:text-amber-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-amber-900/95 backdrop-blur-sm p-4 space-y-4">
            <a href="#" className="block hover:text-amber-200 transition-colors font-medium text-amber-50">HOME</a>
            <a href="#" className="block hover:text-amber-200 transition-colors font-medium text-amber-50">MENU</a>
            <a href="#" className="block hover:text-amber-200 transition-colors font-medium text-amber-50">ABOUT US</a>
          </div>
        )}
      </header>
        {/* Hero Title */}
        <div className="text-center mb-8 sm:mb-16 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 sm:mb-6 tracking-tight drop-shadow-lg">
            Co-work
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"> With us</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-100 max-w-2xl mx-auto drop-shadow-md">
            Select different types of seats.
          </p>
        </div>

        {/* Image Carousel */}
        <div className="relative flex items-center justify-center h-64 sm:h-80 md:h-96 mb-6 sm:mb-8">
          {/* Images */}
          <div className="relative w-48 sm:w-64 md:w-80 h-full">
            {destinations.map((destination, index) => (
              <div
                key={destination.id}
                className={`absolute inset-0 transition-all duration-700 ease-out transform ${getImagePosition(index)} cursor-pointer`}
                onClick={() => goToSlide(index)}
              >
                <div className="w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-white p-1 sm:p-2">
                  <img
                    src={destination.src}
                    alt={destination.alt}
                    className="w-full h-full object-cover rounded-xl sm:rounded-2xl transition-transform duration-300 hover:scale-105"
                  />
                </div>
                {/* Overlay for non-active images */}
                {index !== currentIndex && (
                  <div className="absolute inset-0 bg-stone-700/50 bg-opacity-80 rounded-2xl sm:rounded-3xl"></div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-stone-400 hover:bg-yellow-500 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-200 z-40 group"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-stone-400 hover:bg-yellow-500 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-200 z-40 group"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Destination Info */}
        <div className="text-center mb-6 sm:mb-8 px-4">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 drop-shadow-md">
            {destinations[currentIndex].name}
          </h3>
          <p className="text-sm sm:text-base text-gray-200 mb-2 drop-shadow-sm">{destinations[currentIndex].location}</p>
          <p className="text-lg sm:text-xl font-semibold text-yellow-400 drop-shadow-sm">{destinations[currentIndex].price}</p>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center space-x-2 sm:space-x-3 mb-8 sm:mb-12">
          {destinations.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white scale-125 shadow-lg' 
                  : 'bg-gray-400 hover:bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Select Destination Button */}
        <div className="text-center px-4">
          <button 
            onClick={selectDestination}
            className="group relative px-6 py-3 sm:px-12 sm:py-4 text-sm sm:text-base bg-gradient-to-r from-stone-500 to-amber-500 text-white font-semibold rounded-full transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 shadow-lg"
          >
            <span className="relative z-10">Book Seat.</span>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-stone-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Booking;