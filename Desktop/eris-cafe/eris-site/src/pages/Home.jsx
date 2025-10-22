import React, { useState, useEffect } from 'react';
import { Link as RouterLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import UserProfile from '../components/UserProfile';
import eris from '../assets/ERIS CAFE.png';
import erislogo from '../assets/ERISPNG.png';
import hot from '../assets/ESPRESSOHOT.png';
import ice from '../assets/ESPRESSOICE.png';
import bread from '../assets/PASTRIES.png';
import noncoffee from '../assets/NONCOFFEE.png';
import HERO from '../assets/hero/HERO.jpg';
import HERO2 from '../assets/hero/HERO2.jpg';
import BEAN2 from '../assets/BEAN2.png';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    {
      id: 1,
      name: "Truffle Mushroom Risotto",
      price: "$24.99",
      category: "Iced Espresso",
      image: ice,
    },
    {
      id: 2,
      name: "Grilled Salmon Teriyaki",
      price: "$28.99",
      category: "Hot Espresso",
      image: hot,
    },
    {
      id: 3,
      name: "Wagyu Beef Tenderloin",
      price: "$65.99",
      category: "Non-Coffee",
      image: noncoffee,
    },
    {
      id: 4,
      name: "Mediterranean Quinoa Bowl",
      price: "$19.99",
      category: "Pastries",
      image: bread,
    }
  ];

  return (
    <div className="relative bg-transparent">
      {/* Parallax Background - Extended */}
      <div 
        className="fixed inset-0 w-full h-full -z-10"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${eris})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Header */} 
      <header className="fixed top-0 right-10 z-50 border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex justify-between">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <RouterLink to="/cart" className="hover:text-amber-400 transition-colors font-large text-white">
                ABOUT US
              </RouterLink>
              <RouterLink to="/about" className="hover:text-amber-400 transition-colors font-large text-white">
                CONTACT
              </RouterLink>
            </div>

            {/* Profile & Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Profile Avatar */}
              <div className="hidden md:flex items-center space-x-3 mx-10">
                {isAuthenticated ? (
                  <UserProfile />
                ) : (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg"
                  >
                    Sign In
                  </button>
                )}
              </div>
              
              {/* Mobile Menu Button */}
              <button 
                className="md:hidden text-white hover:text-amber-400 transition-colors p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </nav>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
              <div className="space-y-4">
                <RouterLink 
                  to="/" 
                  className="block hover:text-amber-400 transition-colors font-medium text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  HOME
                </RouterLink>
                <RouterLink 
                  to="/menu" 
                  className="block text-amber-400 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  MENU
                </RouterLink>
                <RouterLink 
                  to="/cart" 
                  className="block text-amber-400 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  CART
                </RouterLink>
                <RouterLink 
                  to="/about" 
                  className="block hover:text-amber-400 transition-colors font-medium text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ABOUT US
                </RouterLink>
                <div className="pt-4 border-t border-white/10">
                  {isAuthenticated ? (
                    <UserProfile />
                  ) : (
                    <button
                      onClick={() => {
                        setIsLoginModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />

      {/* Hero Section with Parallax */}
      <div className="relative h-screen overflow-hidden">
        {/* Background Image with Parallax Effect */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0)), url(${eris})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            transform: `translateY(${scrollY * 0.5}px)`,
            willChange: 'transform',
            minHeight: '200vh'
          }}
        />
        
        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center h-full px-4 sm:px-8">
          <div className="text-center">
            <div 
              className="transform transition-all duration-1000 flex flex-col items-center"
              style={{
                transform: `translateY(${scrollY * 0.2}px)`,
                opacity: Math.max(1 - scrollY / 500, 0)
              }}
            >
              <img 
                src={erislogo} 
                alt="Eris Cafe Logo" 
                className='ml-[50px] w-[300px] md:w-[400px] lg:w-[600px] mb-8'
              />
              <p className="absolute mt-[400px]  text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed drop-shadow-lg max-w-3xl">
                Your Daily Dose of Caffeine and Comfort.
              </p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute z-50 bottom-[150px] left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="relative py-16 sm:py-24 -mt-24 pt-32">
        
        <div className="absolute inset-0 bg-[#EDEDE6] rounded-t-[150px]">
              <div className="d">
          <img className='absolute w-[420px]' src={BEAN2} alt="" />
          <img className='absolute w-[420px] translate-x-[250%] translate-y-[160%]' src={BEAN2} alt="" />
        </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16 mt-[140px]">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-4 font-playfair">
              Featured Products
            </h2>
            {/* <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each dish is carefully crafted to deliver an unforgettable dining experience
            </p> */}
          </div>

          {/* Food Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {menuItems.map((item, index) => (
              <div 
                key={item.id}
                className="group rounded-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 cursor-pointer"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                  <RouterLink to={'/hotespresso'}>
                    {/* Image Section */}
                  <div className="w-full  h-64 sm:h-auto relative overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-[450px] h-[450px] object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4 ml-[55px] mt-[350px]">
                      <span className="px-3 py-1  text-black text-xl font-semibold font-playfair rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  </RouterLink>

                </div>
            ))}
          </div>
            <section className='border-t-2 border-black  mt-[180px]' >
              <div className="mt-[150px]">
              <h1 className='font-playfair text-center text-4xl'>Your Daily Dose of Caffeine and Comfort</h1>
              <p className='text-center mt-5 text-3xl font-thin'>brewed with love, served with a smile.</p>
            </div>
            <div className="grid grid-cols-2 gap-16 mt-[100px]">
              <img src={HERO} alt="" className='w-[700px] h-[450px] shadow-2xl ' />
              <img src={HERO2} alt="" className='w-[700px] h-[450px] shadow-2xl ' />
            </div>
            </section>
          {/* Call to Action */}
          <div className="text-center mt-16">
            <Link to="/reservation" className="group relative px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold text-lg rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-gray-400 focus:ring-opacity-50">
              <span className="relative z-10 font-light">Reserve a Seat.</span>
              <div className="absolute inset-0 bg-gradient-to-r from-stone-600 to-amber-950 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
        </div>
      </div>
      <footer>
      <div className="text-start text-white m5 py-6 mt-16 ml-10">
        <h1 className='text-5xl font-light'>Connect with us</h1>
        <h1 className='text-3xl py-5 font-thin' >Buksu Eris Coffee</h1>
        <h1 className='text-3xl py-5 font-thin' >@Eris_Coffee</h1>
      </div>
      <div className="text-center text-white m10 ">
        <h1>© 2025 Eris Cafe</h1>
      </div>
      </footer>
    </div>
  );
};

export default Home;