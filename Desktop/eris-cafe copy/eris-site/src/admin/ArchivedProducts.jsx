import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { SkeletonTable } from '../components/SkeletonLoaders';

const ArchivedProducts = () => {
  const navigate = useNavigate();
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch archived products
  useEffect(() => {
    fetchArchivedProducts();
  }, []);

  const fetchArchivedProducts = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/products/archived/all');
      setArchivedProducts(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching archived products:', error);
      setLoading(false);
    }
  };

  // Restore product
  const handleRestore = async (productId, productName) => {
    const result = await Swal.fire({
      title: 'Restore Product?',
      text: `Do you want to restore "${productName}" back to active products?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, restore it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }
    
    try {
      await axios.patch(`http://localhost:4000/api/products/${productId}/unarchive`);
      await fetchArchivedProducts();
      await Swal.fire({
        title: 'Restored!',
        text: 'Product has been restored successfully!',
        icon: 'success',
        confirmButtonColor: '#8B5CF6',
        timer: 2000
      });
    } catch (error) {
      await Swal.fire({
        title: 'Restore Failed',
        text: error.response?.data?.message || 'Failed to restore product',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    }
  };

  // Delete permanently
  const handleDeletePermanently = async (productId, productName) => {
    const result = await Swal.fire({
      title: 'Delete Permanently?',
      html: `
        <p>Are you sure you want to <strong>permanently delete</strong> "${productName}"?</p>
        <p class="text-red-600 font-semibold mt-2">⚠️ This action cannot be undone!</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete forever!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:4000/api/products/${productId}`);
      await fetchArchivedProducts();
      await Swal.fire({
        title: 'Deleted!',
        text: 'Product has been permanently deleted.',
        icon: 'success',
        confirmButtonColor: '#8B5CF6',
        timer: 2000
      });
    } catch (error) {
      await Swal.fire({
        title: 'Delete Failed',
        text: error.response?.data?.message || 'Failed to delete product',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    }
  };

  const filteredProducts = archivedProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8'>
          <div className="h-8 bg-white/20 rounded w-96 mb-4 animate-pulse"></div>
          <div className="h-4 bg-white/10 rounded w-48 animate-pulse"></div>
        </div>
        <div className="px-4 md:px-8 py-6">
          <SkeletonTable rows={8} columns={6} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Gradient Header */}
      <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8'>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/products')}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
              title="Back to Products"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-[#EDEDE6]">Archived Products</h1>
          </div>
          <div className="bg-white/20 text-white px-4 py-2 rounded-lg">
            <span className="font-semibold">{archivedProducts.length}</span> archived items
          </div>
        </div>
        <div className="mt-5">
          {/* Search Bar */}
          <div className="bg-white/70 border border-white rounded-lg shadow-md p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search archived products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">About Archived Products</h3>
              <p className="text-sm text-blue-700">
                Archived products are hidden from your active catalog but can be restored at any time. 
                You can also permanently delete items if needed. Archived items are no longer available for purchase.
              </p>
            </div>
          </div>
        </div>

        {/* Archived Products Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Price</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Stock</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Archived Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        <p className="text-lg font-medium">No archived products</p>
                        <p className="text-sm mt-1">
                          {searchTerm ? 'Try adjusting your search' : 'Archived products will appear here'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={product.image || 'https://via.placeholder.com/50'} 
                            alt={product.name} 
                            className="w-12 h-12 rounded-lg object-cover opacity-60"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/50'}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{product.name}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{product.category}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">₱{product.price.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {product.archivedAt 
                          ? new Date(product.archivedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'N/A'
                        }
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleRestore(product._id, product.name)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Restore product"
                          >
                            <RotateCcw size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeletePermanently(product._id, product.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete permanently"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistics */}
        {archivedProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Archived</p>
                  <p className="text-3xl font-bold text-gray-800">{archivedProducts.length}</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Stock Value</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {archivedProducts.reduce((sum, p) => sum + p.stock, 0)}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Potential Revenue</p>
                  <p className="text-3xl font-bold text-gray-800">
                    ₱{archivedProducts.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedProducts;
