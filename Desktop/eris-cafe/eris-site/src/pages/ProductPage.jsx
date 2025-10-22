import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, getTotalItems } = useCart();
  const product = location.state?.product;
  
  const [quantity, setQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setShowNotification(true);
    setQuantity(1); // Reset quantity after adding
  };

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  return (
    <div className="min-h-screen bg-[#EDEDE6]">
      {/* Notification */}
      <div className={`fixed top-20 right-4 z-50 transition-all duration-500 ${showNotification ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="font-semibold">Added to Cart!</p>
            <p className="text-sm">{quantity} {product.name}(s) added successfully</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#EDEDE6] border-b border-stone-900 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-stone-100 rounded-full transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-stone-100 rounded-full transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-stone-100 rounded-full transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-stone-100 rounded-full transition relative"
              onClick={() => navigate('/cart')}
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 md:px-8 mt-10">
        <div className="flex flex-col lg:flex-row lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Product Image - Left on Desktop, Top on Mobile */}
          <div className="flex justify-center order-1">
            <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Product Details - Right on Desktop, Bottom on Mobile */}
          <div className="flex flex-col justify-center space-y-6 lg:space-y-8 order-2 mt-12">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair mb-4">
                {product.name}
              </h1>
              <p className="text-3xl md:text-4xl font-light text-stone-800">
                {product.price}
              </p>
            </div>

            <div className="border-t border-stone-300 pt-6">
              <p className="text-stone-600 text-base md:text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-3">
                Quantity
              </label>
              <div className="inline-flex items-center border border-stone-300 rounded-lg">
                <button
                  onClick={decrementQuantity}
                  className="p-3 hover:bg-stone-300 rounded-lg transition"
                  aria-label="Decrease quantity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="px-8 py-3 text-lg font-medium min-w-[80px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={incrementQuantity}
                  className="p-3 hover:bg-stone-300 rounded-lg transition"
                  aria-label="Increase quantity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="w-full bg-[#EDEDE6] border-2 border-stone-900 text-stone-900 py-4 px-8 text-lg font-medium hover:bg-stone-900 hover:text-white transition duration-300 rounded-lg"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}