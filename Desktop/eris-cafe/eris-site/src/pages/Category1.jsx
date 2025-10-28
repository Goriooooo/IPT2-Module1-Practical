import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navigation from '../components/Navigation';

// Import local images as fallback
import CL from '../assets/ICED SERIES/(ICED) Cafe Latte.png';
import AM from '../assets/ICED SERIES/(ICED) Americano.png';
import SC from '../assets/ICED SERIES/(ICED) Salted Caramel.png';
import SL from '../assets/ICED SERIES/(ICED) Spanish Latte.png';
import CM from '../assets/ICED SERIES/CARAMELMACCHIATO.png';
import DM from '../assets/ICED SERIES/DIRTYMOCHA.png';
import OAM from '../assets/ICED SERIES/ISORANGEAM.png';
import WC from '../assets/ICED SERIES/WHIPPEDCOFFE.png';

const Category1 = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mapping for local images
  const imageMap = {
    'Cafe Latte (ICED)': CL,
    'Americano (ICED)': AM,
    'Salted Caramel (ICED)': SC,
    'Spanish Latte (ICED)': SL,
    'Caramel Macchiato (ICED)': CM,
    'Dirty Mocha (ICED)': DM,
    'Orange Americano (ICED)': OAM,
    'Whipped Coffee (ICED)': WC,
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching products from: http://localhost:4000/api/products');
      
      // Temporarily fetch ALL products to debug
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
      
      // Filter by category on frontend for now
      const icedProducts = products.filter(p => 
        p.category === 'Iced Espresso Series' || 
        p.name.includes('ICED') ||
        p.name.includes('(ICED)')
      );
      
      console.log('Filtered iced products:', icedProducts.length);
      
      if (icedProducts.length === 0) {
        setError('No products found in this category. Please run the seed script.');
        setLoading(false);
        return;
      }
      
      // Map products and add local images
      const productsWithImages = icedProducts.map(product => ({
        ...product,
        image: imageMap[product.name] || product.image,
        category: product.category || 'Iced Espresso Series', // Add default category
        stock: product.stock || 100, // Add default stock
        isAvailable: product.isAvailable !== false // Default to true
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
        <div className="flex justify-center items-center h-[70vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-950 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
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
    <div className='bg-[#EDEDE6] min-h-screen'>
      <Navigation />
      
      {/* Header */}
      <h1 className='font-playfair text-center mt-12 text-5xl'>Iced Espresso Series</h1>
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
              
              {/* Category Badge */}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-amber-950 text-white text-xs font-semibold rounded-full">
                  {item.category}
                </span>
              </div>
              
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
                  ₱{item.price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  Stock: {item.stock}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Category1;