import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, X, User, ShoppingBag, Calendar, Mail, Phone, MapPin, TrendingUp, Clock } from 'lucide-react';
import { SkeletonStats, SkeletonTable } from '../components/SkeletonLoaders';
import Pagination from '../components/Pagination';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('appToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/users/customers`, config);
      setCustomers(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    setDetailsLoading(true);
    try {
      const token = localStorage.getItem('appToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/users/customers/${customerId}`, config);
      setCustomerDetails(response.data.data);
      setDetailsLoading(false);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      setDetailsLoading(false);
    }
  };

  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
    fetchCustomerDetails(customer._id);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
    setCustomerDetails(null);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-200 via-stone-100 to-amber-50">
        <div className='bg-gradient-to-bl from-[#2E1F1B]/90 via-stone-700/90 to-[#5E4B43]/90 backdrop-blur-sm px-4 md:px-8 pt-8 pb-8'>
          <div className="h-8 bg-white/20 rounded w-96 mb-6 animate-pulse"></div>
          <SkeletonStats />
        </div>
        <div className="px-4 md:px-8 py-6">
          <SkeletonTable rows={10} columns={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-200 via-stone-100 to-amber-50">
      {/* Gradient Header */}
      <div className='bg-gradient-to-bl from-[#2E1F1B]/90 via-stone-700/90 to-[#5E4B43]/90 backdrop-blur-sm px-4 md:px-8 pt-8 pb-8'>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#EDEDE6] drop-shadow-lg">Customer Management</h1>
          <button
            onClick={fetchCustomers}
            className="px-4 py-3 glass-stat text-[#78350f] rounded-xl hover:bg-white/90 transition font-semibold"
          >
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-stat rounded-2xl p-4 hover:scale-[1.02] transition-all duration-300">
            <p className="text-sm text-gray-600">Total Customers</p>
            <p className="text-2xl font-bold text-gray-800">{customers.length}</p>
          </div>
          <div className="glass-stat rounded-2xl p-4 hover:scale-[1.02] transition-all duration-300">
            <p className="text-sm text-gray-600">Active This Month</p>
            <p className="text-2xl font-bold text-green-600">
              {customers.filter(c => {
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                return new Date(c.createdAt) > lastMonth;
              }).length}
            </p>
          </div>
          <div className="glass-stat rounded-2xl p-4 hover:scale-[1.02] transition-all duration-300">
            <p className="text-sm text-gray-600">Total Orders Placed</p>
            <p className="text-2xl font-bold text-blue-600">
              {customers.reduce((sum, c) => sum + (c.orderCount || 0), 0)}
            </p>
          </div>
        </div>
         {/* Search Bar */}
          <div className="glass-stat rounded-2xl p-4 mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search customers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>
      </div>

      <div className="px-4 md:px-8 py-6 space-y-6">  

     

      {/* Customers Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/30 backdrop-blur-sm">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Orders</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Reservations</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Member Since</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No customers found
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr key={customer._id} className="border-b border-gray-200/30 hover:bg-white/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {(customer.profilePicture || customer.picture) ? (
                          <img
                            src={customer.profilePicture || customer.picture}
                            alt={customer.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-amber-100/80 backdrop-blur-sm flex items-center justify-center">
                            <User size={20} className="text-amber-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{customer.name}</p>
                          {customer.googleId && (
                            <span className="text-xs text-blue-600">Google Account</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{customer.email}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100/80 backdrop-blur-sm text-blue-800 rounded-full text-sm">
                        <ShoppingBag size={14} />
                        {customer.orderCount || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100/80 backdrop-blur-sm text-purple-800 rounded-full text-sm">
                        <Calendar size={14} />
                        {customer.reservationCount || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => viewCustomerDetails(customer)}
                        className="px-3 py-1 text-sm bg-amber-600/80 backdrop-blur-sm text-white rounded-lg hover:bg-amber-700 transition"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={filteredCustomers.length}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      </div>

      {/* Customer Details Modal */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 border-b border-gray-200/50 pb-4">
                <div className="flex items-center gap-4">
                  {(selectedCustomer.profilePicture || selectedCustomer.picture) ? (
                    <img
                      src={selectedCustomer.profilePicture || selectedCustomer.picture}
                      alt={selectedCustomer.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-amber-100/80 backdrop-blur-sm flex items-center justify-center">
                      <User size={32} className="text-amber-600" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedCustomer.name}</h2>
                    <p className="text-gray-600">{selectedCustomer.email}</p>
                    {selectedCustomer.googleId && (
                      <span className="inline-block mt-1 text-xs px-2 py-1 bg-blue-100/80 backdrop-blur-sm text-blue-600 rounded-lg">
                        Google Account
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100/50 rounded-full transition"
                >
                  <X size={24} />
                </button>
              </div>

              {detailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
                    <p className="text-gray-600">Loading details...</p>
                  </div>
                </div>
              ) : customerDetails ? (
                <div className="space-y-6">
                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingBag size={20} className="text-blue-600" />
                        <p className="text-sm text-blue-600 font-medium">Total Orders</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-800">
                        {customerDetails.statistics.totalOrders}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={20} className="text-green-600" />
                        <p className="text-sm text-green-600 font-medium">Total Spent</p>
                      </div>
                      <p className="text-2xl font-bold text-green-800">
                        ₱{customerDetails.statistics.totalSpent.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={20} className="text-purple-600" />
                        <p className="text-sm text-purple-600 font-medium">Reservations</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-800">
                        {customerDetails.statistics.totalReservations}
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={20} className="text-amber-600" />
                        <p className="text-sm text-amber-600 font-medium">Member Since</p>
                      </div>
                      <p className="text-sm font-bold text-amber-800">
                        {new Date(customerDetails.statistics.memberSince).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Order History */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <ShoppingBag size={20} />
                      Order History ({customerDetails.orders.length})
                    </h3>
                    {customerDetails.orders.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No orders yet</p>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Order ID</th>
                              <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Date</th>
                              <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Items</th>
                              <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Total</th>
                              <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerDetails.orders.slice(0, 5).map((order) => (
                              <tr key={order._id} className="border-t hover:bg-gray-50">
                                <td className="py-2 px-3 text-sm font-medium">{order.orderId}</td>
                                <td className="py-2 px-3 text-sm">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-2 px-3 text-sm">{order.items?.length || 0}</td>
                                <td className="py-2 px-3 text-sm font-medium">
                                  ₱{order.totalPrice?.toFixed(2) || '0.00'}
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                    {order.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Reservation History */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar size={20} />
                      Reservation History ({customerDetails.reservations.length})
                    </h3>
                    {customerDetails.reservations.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No reservations yet</p>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Reservation ID</th>
                              <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Date</th>
                              <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Time</th>
                              <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Guests</th>
                              <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerDetails.reservations.slice(0, 5).map((reservation) => (
                              <tr key={reservation._id} className="border-t hover:bg-gray-50">
                                <td className="py-2 px-3 text-sm font-medium">{reservation.reservationId}</td>
                                <td className="py-2 px-3 text-sm">
                                  {new Date(reservation.date).toLocaleDateString()}
                                </td>
                                <td className="py-2 px-3 text-sm">{reservation.time}</td>
                                <td className="py-2 px-3 text-sm">{reservation.guests}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                                    {reservation.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}