import { useState } from 'react';

export default function PointOfSale() {
  const [orderItems, setOrderItems] = useState([]);
  const [orderNumber, setOrderNumber] = useState('#' + Math.floor(Math.random() * 10000));
  const [customerName, setCustomerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Coffee', 'Tea', 'Pastries', 'Smoothies'];

  const products = [
    { id: 1, name: 'Cafe Latte', price: 100, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=200' },
    { id: 2, name: 'Spanish Latte', price: 100, category: 'Coffee', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200' },
    { id: 3, name: 'Cappuccino', price: 120, category: 'Coffee', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200' },
    { id: 4, name: 'Americano', price: 90, category: 'Coffee', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200' },
    { id: 5, name: 'Green Tea', price: 80, category: 'Tea', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200' },
    { id: 6, name: 'Croissant', price: 60, category: 'Pastries', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200' },
    { id: 7, name: 'Mango Smoothie', price: 110, category: 'Smoothies', image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=200' },
    { id: 8, name: 'Matcha Latte', price: 130, category: 'Coffee', image: 'https://images.unsplash.com/photo-1536013493761-241f4f387f3c?w=200' },
  ];

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const addToOrder = (product) => {
    const existingItem = orderItems.find(item => item.id === product.id);
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setOrderItems([...orderItems, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const removeItem = (id) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const getSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.12; // 12% tax
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const clearOrder = () => {
    setOrderItems([]);
    setCustomerName('');
    setOrderNumber('#' + Math.floor(Math.random() * 10000));
  };

  const exportToPDF = () => {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    
    let receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .order-info { margin-bottom: 20px; }
          .order-info p { margin: 5px 0; }
          .items { border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 8px 0; }
          .item-name { flex: 1; }
          .item-qty { width: 50px; text-align: center; }
          .item-price { width: 80px; text-align: right; }
          .totals { margin-top: 20px; }
          .totals .row { display: flex; justify-content: space-between; margin: 8px 0; }
          .totals .total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; border-top: 2px dashed #333; padding-top: 10px; }
          .footer p { margin: 5px 0; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>COFFEE SHOP</h1>
          <p>123 Main Street</p>
          <p>Phone: (123) 456-7890</p>
        </div>
        
        <div class="order-info">
          <p><strong>Order #:</strong> ${orderNumber}</p>
          <p><strong>Customer:</strong> ${customerName || 'Walk-in'}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
        </div>
        
        <div class="items">
          <div class="item" style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            <span class="item-name">Item</span>
            <span class="item-qty">Qty</span>
            <span class="item-price">Price</span>
          </div>
          ${orderItems.map(item => `
            <div class="item">
              <span class="item-name">${item.name}</span>
              <span class="item-qty">${item.quantity}</span>
              <span class="item-price">₱${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="totals">
          <div class="row">
            <span>Subtotal:</span>
            <span>₱${getSubtotal().toFixed(2)}</span>
          </div>
          <div class="row">
            <span>Tax (12%):</span>
            <span>₱${getTax().toFixed(2)}</span>
          </div>
          <div class="row total">
            <span>TOTAL:</span>
            <span>₱${getTotal().toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>Please come again</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const confirmOrder = () => {
    if (orderItems.length === 0) return;
    alert(`Order ${orderNumber} confirmed!\nCustomer: ${customerName || 'Walk-in'}\nTotal: ₱${getTotal().toFixed(2)}`);
    clearOrder();
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <main className="max-w-7xl mx-auto px-4 py-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            {/* Category Filter */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                    selectedCategory === category
                      ? 'bg-amber-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-stone-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToOrder(product)}
                  className="bg-white rounded-lg p-4 hover:shadow-lg transition group"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-medium text-gray-800 mb-1">{product.name}</h3>
                  <p className="text-lg font-semibold text-amber-900">₱{product.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold mb-4">Current Order</h2>
              
              {/* Order Number */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-semibold">{orderNumber}</p>
              </div>

              {/* Customer Name */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900"
                />
              </div>

              {/* Order Items */}
              <div className="max-h-64 overflow-y-auto mb-4 border-t border-b border-stone-200 py-4">
                {orderItems.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No items added</p>
                ) : (
                  orderItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-sm text-gray-600">₱{item.price} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 bg-stone-200 hover:bg-stone-300 rounded flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 bg-stone-200 hover:bg-stone-300 rounded flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₱{getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (12%):</span>
                  <span>₱{getTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-stone-200">
                  <span>Total:</span>
                  <span>₱{getTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={confirmOrder}
                  disabled={orderItems.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm Order
                </button>
                <button
                  onClick={exportToPDF}
                  disabled={orderItems.length === 0}
                  className="w-full bg-amber-900 hover:bg-amber-800 text-white py-3 rounded-lg font-medium transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Print Receipt
                </button>
                <button
                  onClick={clearOrder}
                  className="w-full bg-white hover:bg-stone-100 text-gray-700 py-3 rounded-lg font-medium transition border border-stone-300"
                >
                  Clear Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}