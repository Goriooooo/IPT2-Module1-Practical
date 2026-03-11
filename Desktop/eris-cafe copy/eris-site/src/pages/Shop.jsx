import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navigation from '../components/Navigation';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { SkeletonProductGrid } from '../components/SkeletonLoaders';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'Iced Espresso Series', label: 'Iced Espresso' },
  { key: 'Hot Espresso Series', label: 'Hot Espresso' },
  { key: 'Non-Coffee', label: 'Non-Coffee' },
  { key: 'Pastries & Desserts', label: 'Pastries & Desserts' },
];

const Shop = () => {
  const navigate = useNavigate();
  const { getTotalItems } = useCart();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/products`);
      
      let products = [];
      if (response.data.data) {
        products = response.data.data;
      } else if (Array.isArray(response.data)) {
        products = response.data;
      }
      
      const productsWithDefaults = products.map(product => ({
        ...product,
        image: product.image || product.imageUrl || '',
        stock: product.stock || 100,
        isAvailable: product.isAvailable !== false
      }));

      setAllProducts(productsWithDefaults);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(err.response?.data?.message || 'Failed to load products.');
      }
      setLoading(false);
    }
  };

  const filteredProducts = activeCategory === 'all'
    ? allProducts
    : allProducts.filter(p => {
        if (activeCategory === 'Iced Espresso Series') {
          return p.category === 'Iced Espresso Series' || p.name.includes('ICED') || p.name.includes('(ICED)');
        }
        if (activeCategory === 'Hot Espresso Series') {
          return p.category === 'Hot Espresso Series' || p.name.includes('HOT') || p.name.includes('(HOT)');
        }
        if (activeCategory === 'Non-Coffee') {
          return p.category === 'Non-Coffee' || p.category === 'Non Coffee';
        }
        if (activeCategory === 'Pastries & Desserts') {
          return p.category === 'Pastries & Desserts' || p.category === 'Pastries';
        }
        return p.category === activeCategory;
      });

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

  return (
    <motion.div className='bg-[#EDEDE6] min-h-screen'
      initial={{ width: 0 }}
      animate={{ width: "100%" }}
      exit={{ x: window.innerWidth, transition: { duration: 0.3 } }}
    >
      <Navigation />

      <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-playfair text-center mb-2">Our Menu</h1>
        <p className="text-center text-gray-600 mb-8">Browse our full selection of drinks and treats</p>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.key
                  ? 'bg-amber-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-amber-100 border border-gray-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={fetchProducts} className="px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition">
              Retry
            </button>
          </div>
        )}

        {!error && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No products found in this category.</p>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              onClick={() => navigate('/product', { state: { product } })}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group hover:-translate-y-1"
            >
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                />
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 mb-1">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-amber-900">₱{product.price?.toFixed(2)}</span>
                  {!product.isAvailable && (
                    <span className="text-xs text-red-600 font-medium">Unavailable</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Shop;
