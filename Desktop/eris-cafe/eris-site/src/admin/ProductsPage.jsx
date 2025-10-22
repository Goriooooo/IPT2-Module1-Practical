import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

const ProductsPage = () => {
  const [products, setProducts] = useState([
    { id: 1, name: 'Espresso Hot', category: 'Hot Espresso', price: '$4.99', stock: 100, image: '/placeholder.jpg' },
    { id: 2, name: 'Iced Latte', category: 'Iced Espresso', price: '$5.99', stock: 85, image: '/placeholder.jpg' },
    { id: 3, name: 'Croissant', category: 'Pastries', price: '$3.99', stock: 50, image: '/placeholder.jpg' },
    { id: 4, name: 'Green Tea', category: 'Non-Coffee', price: '$3.50', stock: 120, image: '/placeholder.jpg' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Products Management</h1>
        <button className="bg-coffee text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors flex items-center space-x-2">
          <Plus size={20} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Price</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Stock</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                      <span className="text-sm font-medium text-gray-800">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{product.category}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{product.price}</td>
                  <td className="py-3 px-4">
                    <span className={`
                      px-2 py-1 text-xs font-semibold rounded-full
                      ${product.stock > 50 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                    `}>
                      {product.stock} in stock
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit size={18} />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
