import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, deleteItem, updateSwipeOffset, getTotalItems, getTotalPrice, clearCart } = useCart();

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter items based on search query
  const filteredItems = searchQuery.trim() 
    ? cartItems.filter(item => {
        const lowercaseQuery = searchQuery.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(lowercaseQuery);
        const categoryMatch = item.category?.toLowerCase().includes(lowercaseQuery);
        return nameMatch || categoryMatch;
      })
    : cartItems;

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e, id) => {
    setTouchEnd(e.targetTouches[0].clientX);
    const distance = touchStart - e.targetTouches[0].clientX;
    
    if (distance > 0 && distance <= 100) {
      updateSwipeOffset(id, distance);
    }
  };

  const handleTouchEnd = (id) => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    
    if (isLeftSwipe) {
      updateSwipeOffset(id, 80);
    } else {
      updateSwipeOffset(id, 0);
    }
  };

  const handleMouseDown = (e) => {
    setTouchStart(e.clientX);
    setTouchEnd(null);
  };

  const handleMouseMove = (e, id) => {
    if (touchStart === null) return;
    setTouchEnd(e.clientX);
    const distance = touchStart - e.clientX;
    
    if (distance > 0 && distance <= 100) {
      updateSwipeOffset(id, distance);
    }
  };

  const handleMouseUp = (id) => {
    if (!touchStart) return;
    
    const distance = touchStart - (touchEnd || touchStart);
    const isLeftSwipe = distance > 50;
    
    if (isLeftSwipe) {
      updateSwipeOffset(id, 80);
    } else {
      updateSwipeOffset(id, 0);
    }
    setTouchStart(null);
  };

  const handleDelete = (item) => {
    // Use the item's id for deletion (works for both guest and authenticated users)
    deleteItem(item.id);
  };

  const handleQuantityUpdate = (item, delta) => {
    // Use the item's id for quantity update
    updateQuantity(item.id, delta);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleClearCart = () => {
    setShowClearConfirm(true);
  };

  const confirmClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
  };

  const cancelClearCart = () => {
    setShowClearConfirm(false);
  };

  const toggleSearchBar = () => {
    setShowSearchBar(!showSearchBar);
    if (showSearchBar) {
      setSearchQuery('');
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCategorySearch = (category) => {
    setSearchQuery(category);
  };

  return (
    <motion.div className="min-h-screen bg-[#EDEDE6]"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: "100%", opacity: 1 }}
      exit={{ x: window.innerWidth, transition: { duration: 0.3 } }}
    >
       {/* Header */}
      <header className="bg-[#EDEDE6] border-b border-stone-900 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between relative">
          <button className="p-2 hover:bg-stone-100 rounded-full transition"
            onClick={() => navigate(-1)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSearchBar}
              className="p-2 hover:bg-stone-100 rounded-full transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button 
              onClick={() => navigate('/orders')}
              className="p-2 hover:bg-stone-100 rounded-full transition"
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
          </div>

          {/* Slide-in Search Bar */}
          <div 
            className={`absolute top-0 right-0 h-full bg-white/0 shadow-lg border-l border-stone-300 transition-all duration-300 ease-in-out overflow-hidden z-10 ${
              showSearchBar ? 'w-full md:w-96' : 'w-0'
            }`}
          >
            <div className="h-full flex flex-col p-4 min-w-[280px]">
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={toggleSearchBar}
                  className="p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search cart items..."
                  className="flex-1 px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-gray-600 font-semibold">Quick Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {['Iced Espresso', 'Hot Espresso', 'Non-Coffee', 'Pastries'].map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategorySearch(category)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-amber-900 hover:text-white rounded-lg text-xs transition"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 md:px-8">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl md:text-5xl font-serif">Cart</h1>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 border border-red-300 rounded transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">Clear Cart</span>
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-xl text-gray-600 mb-4">Your cart is empty</p>
            <button
              onClick={() => navigate('/hotespresso')}
              className="bg-amber-900 hover:bg-amber-800 text-white px-6 py-2 rounded transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Search Results Info */}
            {searchQuery && (
              <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-900">
                  Found <span className="font-semibold">{filteredItems.length}</span> item{filteredItems.length !== 1 ? 's' : ''} matching "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-amber-700 hover:text-amber-900 underline"
                >
                  Clear search
                </button>
              </div>
            )}

            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg text-gray-600 mb-2">No items found</p>
                <p className="text-sm text-gray-500">Try a different search term</p>
              </div>
            ) : (
              <>
            {/* Cart Items */}
            <div className="space-y-6">
          {filteredItems.map((item) => (
            <div key={item._id || item.id} className="relative overflow-hidden bg-[#EDEDE6]">
              {/* Delete Button Background */}
              <div className="absolute right-0 top-0 h-full w-24 bg-red-500 flex items-center justify-center">
                <button
                  onClick={() => handleDelete(item)}
                  className="text-white h-full w-full flex items-center justify-center"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Swipeable Item */}
              <div 
                className="bg-[#EDEDE6] border-b border-stone-900 pb-6 transition-transform duration-200 cursor-grab active:cursor-grabbing relative"
                style={{ transform: `translateX(-${item.swipeOffset}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={(e) => handleTouchMove(e, item.id)}
                onTouchEnd={() => handleTouchEnd(item.id)}
                onMouseDown={(e) => handleMouseDown(e, item.id)}
                onMouseMove={(e) => handleMouseMove(e, item.id)}
                onMouseUp={() => handleMouseUp(item.id)}
                onMouseLeave={() => handleMouseUp(item.id)}
              >
                <div className="flex items-center gap-4 pr-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded"
                    />
                  </div>

                  {/* Product Name and Size */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-serif truncate">{item.name}</h2>
                    {item.size && (
                      <p className="text-sm text-stone-600 mt-1">Size: {item.size}</p>
                    )}
                  </div>

                  {/* Quantity Controls - Hidden on mobile when swiped */}
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center border border-stone-300 rounded bg-white">
                      <button
                        onClick={() => handleQuantityUpdate(item, -1)}
                        className="px-2 sm:px-3 py-1 hover:bg-stone-100 transition text-lg"
                      >
                        -
                      </button>
                      <span className="px-3 sm:px-4 py-1 text-center min-w-[30px] sm:min-w-[40px]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityUpdate(item, 1)}
                        className="px-2 sm:px-3 py-1 hover:bg-stone-100 transition text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex-shrink-0 min-w-[60px] sm:min-w-[80px] text-right">
                    <p className="text-lg sm:text-xl md:text-2xl font-light">
                      {typeof item.price === 'string' ? item.price : `₱${item.price}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            ))}
        </div>

        {/* Checkout Button */}
        <div className="mt-8 border-t border-stone-300 pt-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-2xl font-semibold">Total:</span>
            <span className="text-3xl font-bold">₱{getTotalPrice().toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full bg-amber-900 hover:bg-amber-800 text-white px-8 py-3 rounded text-lg font-medium transition"
          >
            Proceed to Checkout
          </button>
        </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Clear Cart</h3>
                <p className="text-sm text-gray-600">Are you sure you want to remove all items?</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              This will remove all {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} from your cart. This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelClearCart}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearCart}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}