import React, { useState, useEffect } from 'react';
import { Plus, Edit, Archive, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { SkeletonCard } from '../components/SkeletonLoaders';

const ProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    image: '',
    stock: 0,
    isAvailable: true,
    hasSizes: false,
    sizes: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const categories = [
    'Iced Espresso Series',
    'Hot Espresso Series',
    'Non-Coffee',
    'Pastries',
    'Desserts',
    'Other'
  ];

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/products');
      setProducts(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  // Open modal for add/edit
  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        image: product.image || '',
        stock: product.stock || 0,
        isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
        hasSizes: product.hasSizes || false,
        sizes: product.sizes || []
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        description: '',
        category: '',
        image: '',
        stock: 0,
        isAvailable: true,
        hasSizes: false,
        sizes: []
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      description: '',
      category: '',
      image: '',
      stock: 0,
      isAvailable: true,
      hasSizes: false,
      sizes: []
    });
    setSelectedFile(null);
    setImagePreview(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      await Swal.fire({
        title: 'Invalid File',
        text: 'Please select an image file',
        icon: 'warning',
        confirmButtonColor: '#8B5CF6'
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      await Swal.fire({
        title: 'File Too Large',
        text: 'Image size must be less than 5MB',
        icon: 'warning',
        confirmButtonColor: '#8B5CF6'
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: '' }));
  };

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async () => {
    if (!selectedFile) return formData.image;

    setUploadingImage(true);
    const uploadFormData = new FormData();
    uploadFormData.append('image', selectedFile);

    try {
      const response = await axios.post(
        'http://localhost:4000/api/upload/image',
        uploadFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data.data.url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Create or update product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Upload image if a new file is selected
      let imageUrl = formData.image;
      if (selectedFile) {
        imageUrl = await uploadImageToCloudinary();
      }

      const productData = {
        ...formData,
        image: imageUrl
      };

      if (editingProduct) {
        // Update existing product
        const response = await axios.put(
          `http://localhost:4000/api/products/${editingProduct._id}`,
          productData
        );
        setProducts(products.map(p => 
          p._id === editingProduct._id ? response.data.data : p
        ));
        await Swal.fire({
          title: 'Updated!',
          text: 'Product updated successfully!',
          icon: 'success',
          confirmButtonColor: '#8B5CF6',
          timer: 2000
        });
      } else {
        // Create new product
        const response = await axios.post(
          'http://localhost:4000/api/products',
          productData
        );
        setProducts([response.data.data, ...products]);
        await Swal.fire({
          title: 'Created!',
          text: 'Product created successfully!',
          icon: 'success',
          confirmButtonColor: '#8B5CF6',
          timer: 2000
        });
      }
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
      await Swal.fire({
        title: 'Save Failed',
        text: error.response?.data?.message || error.message || 'Failed to save product',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Archive product
  const handleArchive = async (productId, productName) => {
    const result = await Swal.fire({
      title: 'Archive Product?',
      text: `Are you sure you want to archive "${productName}"? It will be moved to the archive and hidden from active products.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, archive it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }
    
    try {
      await axios.patch(`http://localhost:4000/api/products/${productId}/archive`);
      await fetchProducts();
      await Swal.fire({
        title: 'Archived!',
        text: 'Product has been archived successfully!',
        icon: 'success',
        confirmButtonColor: '#8B5CF6',
        timer: 2000
      });
    } catch (error) {
      await Swal.fire({
        title: 'Archive Failed',
        text: error.response?.data?.message || 'Failed to archive product',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    }
  };  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8'>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 animate-pulse">
            <div className="h-12 bg-white/20 rounded w-80"></div>
            <div className="flex gap-3">
              <div className="h-12 bg-white/20 rounded w-32"></div>
              <div className="h-12 bg-white/20 rounded w-48"></div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-10 bg-white/20 rounded flex-1"></div>
            <div className="h-10 bg-white/20 rounded w-24"></div>
          </div>
        </div>
        <div className="px-4 md:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Gradient Header */}
      <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8'>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-4xl md:text-5xl font-bold text-[#EDEDE6]">Products Management</h1>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/admin/products/archived')}
              className="bg-[#B0CE88] text-white px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors flex items-center space-x-2 font-semibold shadow-lg"
            >
              <Archive size={20} />
              <span>View Archive</span>
            </button>
            <button 
              onClick={() => openModal()}
              className="bg-white text-violet-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2 font-semibold shadow-lg"
            >
              <Plus size={20} />
              <span>Add Product</span>
            </button>
          </div>
        </div>
        <div className="mt-5">
           {/* Search Bar */}
            <div className="bg-white/70 border border-white rounded-lg shadow-md p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee"
                />
              </div>
            </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 space-y-6">

     

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
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    {searchTerm ? 'No products found matching your search' : 'No products available. Click "Add Product" to create one.'}
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
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => e.target.src = 'https://via.placeholder.com/50'}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{product.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{product.category}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">
                      {product.hasSizes && product.sizes && product.sizes.length > 0 ? (
                        <div>
                          <div>₱{Math.min(...product.sizes.map(s => s.price)).toFixed(2)} - ₱{Math.max(...product.sizes.map(s => s.price)).toFixed(2)}</div>
                          <span className="text-xs text-gray-500">({product.sizes.length} sizes)</span>
                        </div>
                      ) : (
                        `₱${product.price.toFixed(2)}`
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`
                        px-2 py-1 text-xs font-semibold rounded-full
                        ${product.stock > 50 ? 'bg-green-100 text-green-800' : 
                          product.stock > 20 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}
                      `}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`
                        px-2 py-1 text-xs font-semibold rounded-full
                        ${product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      `}>
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => openModal(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleArchive(product._id, product.name)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Archive product"
                        >
                          <Archive size={18} />
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

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                  placeholder="e.g., Caramel Macchiato"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₱) * {formData.hasSizes && <span className="text-xs text-gray-500">(Base price - sizes will override this)</span>}
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                  placeholder="0.00"
                />
              </div>

              {/* Has Sizes Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="hasSizes"
                  checked={formData.hasSizes}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      hasSizes: checked,
                      sizes: checked && prev.sizes.length === 0 
                        ? [
                            { name: '12oz', price: '', stock: 100 },
                            { name: '16oz', price: '', stock: 100 },
                            { name: '22oz', price: '', stock: 100 }
                          ]
                        : prev.sizes
                    }));
                  }}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  This product has multiple sizes
                </label>
              </div>

              {/* Sizes Configuration */}
              {formData.hasSizes && (
                <div className="border border-gray-300 rounded-lg p-4 space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size Options *
                  </label>
                  {formData.sizes.map((size, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={size.name}
                          onChange={(e) => {
                            const newSizes = [...formData.sizes];
                            newSizes[index].name = e.target.value;
                            setFormData(prev => ({ ...prev, sizes: newSizes }));
                          }}
                          placeholder="Size name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          value={size.price}
                          onChange={(e) => {
                            const newSizes = [...formData.sizes];
                            newSizes[index].price = parseFloat(e.target.value) || 0;
                            setFormData(prev => ({ ...prev, sizes: newSizes }));
                          }}
                          placeholder="Price"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={size.stock}
                          onChange={(e) => {
                            const newSizes = [...formData.sizes];
                            newSizes[index].stock = parseInt(e.target.value) || 0;
                            setFormData(prev => ({ ...prev, sizes: newSizes }));
                          }}
                          placeholder="Stock"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => {
                            const newSizes = formData.sizes.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, sizes: newSizes }));
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        sizes: [...prev.sizes, { name: '', price: '', stock: 100 }]
                      }));
                    }}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-amber-600 hover:text-amber-600 transition-colors"
                  >
                    + Add Size
                  </button>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                  placeholder="Describe the product..."
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                  placeholder="0"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image
                </label>
                
                {/* Image Preview */}
                {(imagePreview || formData.image) && (
                  <div className="mb-3 relative inline-block">
                    <img
                      src={imagePreview || formData.image}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* File Input */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  {selectedFile && (
                    <span className="text-sm text-gray-600">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
                </p>

                {/* Manual URL Input (Optional) */}
                <div className="mt-3">
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                    placeholder="Or paste image URL..."
                  />
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Product is available for sale
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? 'Uploading Image...' : submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProductsPage;
