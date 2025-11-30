import React, { useState, useEffect } from 'react';
import { Search, Eye, X, Clock, ChefHat, Package, CheckCircle, GripVertical, LayoutGrid, List, FileDown, FileText, Files } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { generateOrderPDF, generateOrdersReportPDF, generateDetailedOrdersReportPDF } from '../utils/pdfExport';
import { SkeletonTable, SkeletonKanban } from '../components/SkeletonLoaders';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [clearedOrders, setClearedOrders] = useState([]);
  const [showClearedOrders, setShowClearedOrders] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const kanbanColumns = [
    { id: 'pending', label: 'Pending', icon: Clock, color: 'bg-orange-500', emoji: '⏰' },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'bg-cyan-500', emoji: '✓' },
    { id: 'preparing', label: 'Preparing', icon: ChefHat, color: 'bg-blue-500', emoji: '👨‍🍳' },
    { id: 'ready', label: 'Ready', icon: Package, color: 'bg-purple-500', emoji: '📦' },
    { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-green-500', emoji: '✅' },
  ];

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('appToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const response = await axios.get('http://localhost:4000/api/orders/admin/all', config);
      setOrders(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('appToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      await axios.patch(`http://localhost:4000/api/orders/${orderId}/status`, { status: newStatus }, config);
      await fetchOrders();

      // Update selected order if it's the one being modified
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      await Swal.fire({
        title: 'Status Updated!',
        text: `Order status updated to ${newStatus}`,
        icon: 'success',
        confirmButtonColor: '#8B5CF6',
        timer: 2000
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      await Swal.fire({
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update order status',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelRequest = async (orderId, approve) => {
    try {
      const token = localStorage.getItem('appToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      if (approve) {
        // Approve cancellation - change status to cancelled
        await handleStatusChange(orderId, 'cancelled');
      } else {
        // Reject cancellation - remove the cancel request flag
        await axios.patch(
          `http://localhost:4000/api/orders/${orderId}/reject-cancel`,
          {},
          config
        );

        // Update local state
        setOrders(orders.map(order =>
          order._id === orderId ? { ...order, cancelRequested: false } : order
        ));

        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, cancelRequested: false });
        }

        await Swal.fire({
          title: 'Request Rejected',
          text: 'Cancellation request has been rejected',
          icon: 'info',
          confirmButtonColor: '#8B5CF6',
          timer: 2000
        });
      }

      fetchOrders(); // Refresh to get latest data
    } catch (error) {
      console.error('Error handling cancel request:', error);
      await Swal.fire({
        title: 'Processing Failed',
        text: error.response?.data?.message || 'Failed to process cancellation request',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (draggedOrder && draggedOrder.status !== newStatus) {
      // Update status via API
      await handleStatusChange(draggedOrder._id, newStatus);
    }
    setDraggedOrder(null);
  };

  const handleDragEnd = () => {
    setDraggedOrder(null);
  };

  const getOrdersByStatus = (status) => {
    return filteredOrders.filter(order => 
      order.status === status && !clearedOrders.find(co => co._id === order._id)
    );
  };

  const handleClearBoard = async () => {
    const result = await Swal.fire({
      title: 'Clear Board?',
      text: 'This will move all completed and cancelled orders to the Cleared Orders archive. You can view them anytime.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8B5CF6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, clear board',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      // Get only the orders that are on the board (not already cleared)
      const ordersToClear = filteredOrders.filter(order => {
        const isCompletedOrCancelled = order.status === 'completed' || order.status === 'cancelled';
        const notAlreadyCleared = !clearedOrders.find(co => co._id === order._id);
        return isCompletedOrCancelled && notAlreadyCleared;
      });
      
      if (ordersToClear.length === 0) {
        await Swal.fire({
          title: 'No Orders to Clear',
          text: 'There are no completed or cancelled orders to clear.',
          icon: 'info',
          confirmButtonColor: '#8B5CF6'
        });
        return;
      }

      // Add only the new orders to the cleared list (avoid duplicates)
      setClearedOrders(prev => [...prev, ...ordersToClear]);
      
      await Swal.fire({
        title: 'Board Cleared!',
        text: `${ordersToClear.length} order(s) moved to Cleared Orders.`,
        icon: 'success',
        confirmButtonColor: '#8B5CF6',
        timer: 2000
      });
    }
  };

  const handleRestoreOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'Restore Order?',
      text: 'This will restore the order back to the kanban board.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8B5CF6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, restore',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      setClearedOrders(clearedOrders.filter(order => order._id !== orderId));
      await Swal.fire({
        title: 'Order Restored!',
        text: 'Order has been restored to the board.',
        icon: 'success',
        confirmButtonColor: '#8B5CF6',
        timer: 2000
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'confirmed': return 'bg-cyan-100 text-cyan-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div>
        {/* Skeleton Header */}
        <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8'>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 animate-pulse">
            <div className="h-12 bg-white/20 rounded w-80"></div>
            <div className="flex items-center gap-4">
              <div className="h-12 bg-white/20 rounded w-32"></div>
              <div className="flex gap-2 bg-white/20 rounded-lg p-1">
                <div className="h-10 bg-white/10 rounded w-32"></div>
                <div className="h-10 bg-white/10 rounded w-32"></div>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-10 bg-white/20 rounded flex-1"></div>
            <div className="h-10 bg-white/20 rounded w-32"></div>
            <div className="h-10 bg-white/20 rounded w-24"></div>
          </div>
        </div>
        {/* Skeleton Content */}
        <div className="px-4 md:px-8 py-6">
          {viewMode === 'kanban' ? <SkeletonKanban /> : <SkeletonTable rows={10} columns={6} />}
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px) rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: translateX(2px) rotate(1deg); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }
      `}</style>
      {/* Gradient Header */}
      <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8'>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-4xl md:text-5xl font-bold text-[#EDEDE6]">Orders Management</h1>
          
          <div className="flex items-center gap-4">
            {/* Export PDF Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="px-4 py-3 bg-white text-violet-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-semibold shadow-lg"
              >
                <FileDown size={18} />
                Export PDF
              </button>
            
            {/* Dropdown Menu */}
            {showExportDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowExportDropdown(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        generateOrdersReportPDF(filteredOrders, filterStatus);
                        setShowExportDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <FileText size={18} className="text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-800">Summary Report</div>
                        <div className="text-xs text-gray-500">All orders in one page</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        generateDetailedOrdersReportPDF(filteredOrders);
                        setShowExportDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Files size={18} className="text-green-600" />
                      <div>
                        <div className="font-medium text-gray-800">Detailed Report</div>
                        <div className="text-xs text-gray-500">Each order on separate page</div>
                      </div>
                    </button>
                    
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    <div className="px-4 py-2">
                      <div className="text-xs text-gray-500">
                        <strong>Tip:</strong> Click "View Details" on any order to export individual order PDF
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-white/20 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-violet-600 shadow-lg' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <List size={18} />
              Table View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-white text-violet-600 shadow-lg' 
                : 'text-white hover:bg-white/10'
              }`}
            >
              <LayoutGrid size={18} />
              Kanban View
            </button>
          </div>
          
          {/* Clear Board & Cleared Orders Buttons (only in kanban view) */}
          {viewMode === 'kanban' && (
            <div className="flex gap-2">
              <button
                onClick={handleClearBoard}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-semibold shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Board
              </button>
              <button
                onClick={() => setShowClearedOrders(!showClearedOrders)}
                className="px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 font-semibold shadow-lg relative"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Cleared Orders
                {clearedOrders.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {clearedOrders.length}
                  </span>
                )}
              </button>
            </div>
          )}
          </div>
        </div>
        <div className="mt-5">
          {/* Filters */}
            <div className="mb-6 flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by Order ID, Customer Name or Email..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {viewMode === 'table' && (
                <div>
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option>All</option>
                    <option>Pending</option>
                    <option>Confirmed</option>
                    <option>Preparing</option>
                    <option>Ready</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </div>
              )}
              <button
                onClick={fetchOrders}
                className="px-4 py-3 bg-white/70 border border-white text-[#78350f] rounded-lg hover:bg-gray-100 transition font-semibold shadow-lg"
              >
                Refresh
              </button>
            </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6">
      
      

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          <div className="flex gap-4">
            {kanbanColumns.map(column => {
              const columnOrders = getOrdersByStatus(column.id);
              const Icon = column.icon;
              
              return (
                <div key={column.id} className="flex flex-col flex-shrink-0 w-80">
                  {/* Column Header */}
                  <div className="bg-stone-800/70 border-3 border-white rounded-t-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{column.emoji}</span>
                      <h2 className="text-white font-semibold">{column.label}</h2>
                    </div>
                    <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-full">
                      {columnOrders.length}
                    </span>
                  </div>

                  {/* Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                    className="bg-gray-100 rounded-b-lg p-3 min-h-[600px] flex flex-col gap-3"
                  >
                    {columnOrders.map(order => (
                      <div
                        key={order._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, order)}
                        onDragEnd={handleDragEnd}
                        className={`bg-stone-700/20 border border-white rounded-lg p-4 shadow-md cursor-move hover:shadow-xl transition-all hover:scale-105 border-l-4 border-transparent hover:border-amber-500 ${
                          draggedOrder?._id === order._id ? 'animate-shake opacity-50' : ''
                        }`}
                      >
                        {/* Order Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-stone-600 font-bold text-sm">{order.orderId}</span>
                              <GripVertical className="w-4 h-4 text-gray-400" />
                              {order.cancelRequested && (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 animate-pulse">
                                  Cancel Request
                                </span>
                              )}
                            </div>
                            <h3 className="text-gray-800 font-semibold">{order.customerInfo?.name || 'N/A'}</h3>
                            <p className="text-gray-500 text-xs">{order.customerInfo?.email}</p>
                          </div>
                          <span className="text-gray-400 text-xs">
                            {new Date(order.createdAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>

                        {/* Order Details */}
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-gray-400 text-xs">📝</span>
                            <p className="text-gray-600 text-sm flex-1">
                              {order.items?.slice(0, 2).map(item => item.name).join(', ')}
                              {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="text-green-600 font-bold">₱{order.totalPrice?.toFixed(2)}</span>
                            <button
                              onClick={() => viewOrderDetails(order)}
                              className="text-stone-600 hover:text-amber-700 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {columnOrders.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                        Drop orders here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {order.orderId}
                      {order.cancelRequested && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 animate-pulse">
                          Cancel Request
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.customerInfo?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{order.customerInfo?.email || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{order.totalPrice?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => viewOrderDetails(order)}
                      className="text-amber-600 hover:text-amber-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => generateOrderPDF(selectedOrder)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  title="Export this order as PDF"
                >
                  <FileDown size={18} />
                  Export PDF
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-semibold">{selectedOrder.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-semibold">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer Name</p>
                  <p className="font-semibold">{selectedOrder.customerInfo?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold">{selectedOrder.customerInfo?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-semibold">{selectedOrder.customerInfo?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-semibold text-lg text-amber-600">
                    ₱{selectedOrder.totalPrice?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              {/* Cancellation Request Alert */}
              {selectedOrder.cancelRequested && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-red-800 font-semibold mb-1">Cancellation Requested</h3>
                      <p className="text-red-700 text-sm">
                        Customer requested to cancel this order on{' '}
                        {new Date(selectedOrder.cancelRequestedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancelRequest(selectedOrder._id, true)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleCancelRequest(selectedOrder._id, false)}
                        className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Management */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Order Status</h3>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full capitalize ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                    disabled={updatingStatus || selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled'}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready for Pickup</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {updatingStatus && (
                    <span className="text-sm text-gray-500">Updating...</span>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">₱{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Info */}
              {selectedOrder.deliveryInfo && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Delivery Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Address:</span> {selectedOrder.deliveryInfo.address || 'N/A'}</p>
                    {selectedOrder.deliveryInfo.notes && (
                      <p><span className="text-gray-500">Notes:</span> {selectedOrder.deliveryInfo.notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Banner for Kanban Mode */}
      {viewMode === 'kanban' && !showClearedOrders && (
        <div className="mt-6 bg-amber-500 rounded-lg p-4 text-white text-center shadow-lg">
          <p className="text-sm">💡 <strong>Tip:</strong> Drag and drop orders between columns to update their status instantly</p>
        </div>
      )}

      {/* Cleared Orders Modal */}
      {showClearedOrders && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Cleared Orders Archive</h2>
                <p className="text-sm text-gray-500 mt-1">Total: {clearedOrders.length} order(s)</p>
              </div>
              <button
                onClick={() => setShowClearedOrders(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {clearedOrders.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <p className="text-gray-500 text-lg">No cleared orders yet</p>
                  <p className="text-gray-400 text-sm mt-2">Orders marked as completed or cancelled will appear here after clearing the board</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clearedOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.orderId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{order.customerInfo?.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{order.customerInfo?.email || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₱{order.totalPrice?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button 
                              onClick={() => viewOrderDetails(order)}
                              className="text-amber-600 hover:text-amber-900"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => handleRestoreOrder(order._id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Restore
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default OrdersPage;
