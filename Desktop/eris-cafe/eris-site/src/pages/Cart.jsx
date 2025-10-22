import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, deleteItem, updateSwipeOffset, getTotalItems, getTotalPrice } = useCart();

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

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

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#EDEDE6]">
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
            <button className="p-2 hover:bg-stone-100 rounded-full transition relative">
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
      <main className="max-w-4xl mx-auto px-4 py-8 md:px-8">
        <h1 className="text-4xl md:text-5xl font-serif text-center mb-12">Cart</h1>

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
            {/* Cart Items */}
            <div className="space-y-6">
          {cartItems.map((item) => (
            <div key={item.id} className="relative overflow-hidden bg-[#EDEDE6]">
              {/* Delete Button Background */}
              <div className="absolute right-0 top-0 h-full w-24 bg-red-500 flex items-center justify-center">
                <button
                  onClick={() => deleteItem(item.id)}
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

                  {/* Product Name */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-serif truncate">{item.name}</h2>
                  </div>

                  {/* Quantity Controls - Hidden on mobile when swiped */}
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center border border-stone-300 rounded bg-white">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="px-2 sm:px-3 py-1 hover:bg-stone-100 transition text-lg"
                      >
                        -
                      </button>
                      <span className="px-3 sm:px-4 py-1 text-center min-w-[30px] sm:min-w-[40px]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
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
      </main>
    </div>
  );
}