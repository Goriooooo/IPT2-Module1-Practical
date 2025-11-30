import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navigation from '../components/Navigation';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { SkeletonProductGrid } from '../components/SkeletonLoaders';

// Import local images as fallback
import PastriesPlaceholder from '../assets/PASTRIES.png';

const Category4 = () => {
  const navigate = useNavigate();
  const { getTotalItems } = useCart();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching products from: http://localhost:4000/api/products');
      
      const response = await axios.get('http://localhost:4000/api/products');
      
      console.log('Response:', response.data);
      
      // Handle different response structures
      let products = [];
      if (response.data.data) {
        products = response.data.data;
      } else if (Array.isArray(response.data)) {
        products = response.data;
      }
      
      console.log('All products found:', products.length);
      
      // Filter by category on frontend
      const pastriesProducts = products.filter(p => 
        p.category === 'Pastries' || 
        p.category === 'Bakery' ||
        p.category === 'Desserts' ||
        p.category === 'Food' ||
        p.name.toLowerCase().includes('cake') ||
        p.name.toLowerCase().includes('croissant') ||
        p.name.toLowerCase().includes('muffin') ||
        p.name.toLowerCase().includes('cookie')
      );
      
      console.log('Filtered pastries products:', pastriesProducts.length);
      
      if (pastriesProducts.length === 0) {
        setError('No products found in this category. Please run the seed script.');
        setLoading(false);
        return;
      }
      
      // Use Cloudinary images from ProductsPage, with local fallback
      const productsWithImages = pastriesProducts.map(product => ({
        ...product,
        // Prioritize Cloudinary image from database, fallback to placeholder
        image: product.image || PastriesPlaceholder,
        category: product.category || 'Pastries',
        stock: product.stock || 100,
        isAvailable: product.isAvailable !== false
      }));
      
      console.log('Products with images:', productsWithImages);
      
      setMenuItems(productsWithImages);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      console.error('Error details:', err.response?.data);
      
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend is running on port 4000.');
      } else if (err.response?.status === 404) {
        setError('Products endpoint not found. Please check the backend routes.');
      } else {
        setError(err.response?.data?.message || 'Failed to load products. Please try again later.');
      }
      
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='bg-[#EDEDE6] min-h-screen'>
        <Navigation />
        <div className="container mx-auto px-8 py-12">
          <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-8 animate-pulse"></div>
          <SkeletonProductGrid items={8} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-[#EDEDE6] min-h-screen'>
        <Navigation />
        <div className="flex justify-center items-center h-[70vh]">
          <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-playfair mb-4">Error Loading Products</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button 
                onClick={fetchProducts}
                className="w-full px-6 py-3 bg-amber-950 text-white rounded-lg hover:bg-amber-900 transition"
              >
                Try Again
              </button>
              {error.includes('seed script') && (
                <div className="text-left bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">To fix this, run:</p>
                  <code className="text-xs bg-gray-800 text-white p-2 rounded block">
                    node backend/scripts/seedProducts.js
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (menuItems.length === 0) {
    return (
      <div className='bg-[#EDEDE6] min-h-screen'>
        <Navigation />
        <div className="flex justify-center items-center h-[70vh]">
          <div className="text-center">
            <p className="text-gray-600 text-xl mb-4">No products available in this category</p>
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-amber-950 text-white rounded-lg hover:bg-amber-900"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div className='bg-[#EDEDE6] min-h-screen'
      initial={{ width: 0}}
      animate={{ width: "100%" }}
      exit={{ x: window.innerWidth, transition: { duration: 0.3 } }}
    >
       {/* Header */}
      <header className="bg-[#EDEDE6] border-b border-stone-900 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button className="p-2 hover:bg-stone-100 rounded-full transition"
            onClick={() => navigate(-1)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-stone-100 rounded-full transition"
              onClick={() => navigate('/orders')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <button 
              onClick={() => navigate('/cart')}
              className="p-2 hover:bg-stone-100 rounded-full transition relative"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
            <button className="p-2 hover:bg-stone-100 rounded-full transition"
              onClick={() => navigate('/Category1')}
             >
              <p>Next Page</p>
            </button>
          </div>
        </div>
      </header>

      {/* Header */}
      <h1 className='font-playfair text-center mt-12 text-5xl'>Pastries & Desserts</h1>
      <p className='text-center text-gray-600 mt-2 mb-8'>{menuItems.length} Products Available</p>
      
      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-8 py-12 max-w-7xl mx-auto">
        {menuItems.map((item, index) => (
          <div 
            key={item._id}
            onClick={() => navigate('/product', { state: { product: item } })}
            className="group bg-[#EDEDE6] rounded-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 cursor-pointer"
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            {/* Image Section */}
            <div className="w-full h-64 relative overflow-hidden bg-[#EDEDE6]">
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  console.error('Image failed to load:', item.image);
                  e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                }}
              />
              
              {/* Stock Badge */}
              {!item.isAvailable && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
                    Out of Stock
                  </span>
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            {/* Product Info */}
            <div className="p-5">
              <h3 className="font-playfair text-xl mb-2 line-clamp-1">{item.name}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
              
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-amber-950">
                  {item.hasSizes && item.sizes && item.sizes.length > 0 ? (
                    `₱${Math.min(...item.sizes.map(s => s.price)).toFixed(2)} - ₱${Math.max(...item.sizes.map(s => s.price)).toFixed(2)}`
                  ) : (
                    `₱${item.price.toFixed(2)}`
                  )}
                </span>
                <span className="text-sm text-gray-500">
                  {item.hasSizes ? (
                    <span className="bg-[#B0CE88]/20 text-stone-500 px-2 py-1 rounded text-xs">
                      Multiple Sizes
                    </span>
                  ) : (
                    `Stock: ${item.stock}`
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default Category4;
