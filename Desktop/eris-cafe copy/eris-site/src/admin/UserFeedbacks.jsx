import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Filter, TrendingUp, Eye, Trash2, Check } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { SkeletonStats, SkeletonList } from '../components/SkeletonLoaders';

const UserFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem('appToken');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` }
      };

      const response = await axios.get('http://localhost:4000/api/feedback/admin/all', config);
      setFeedbacks(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('appToken');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` }
      };

      const response = await axios.get('http://localhost:4000/api/feedback/admin/stats', config);
      setStats(response.data.data || null);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateFeedbackStatus = async (feedbackId, status, adminNotes = '') => {
    try {
      const token = localStorage.getItem('appToken');
      await axios.patch(
        `http://localhost:4000/api/feedback/${feedbackId}/status`,
        { status, adminNotes },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      await Swal.fire({
        title: 'Success!',
        text: 'Feedback status updated successfully',
        icon: 'success',
        confirmButtonColor: '#8B5CF6',
        timer: 2000
      });
      fetchFeedbacks();
      fetchStats();
      setShowModal(false);
    } catch (error) {
      console.error('Error updating feedback:', error);
      await Swal.fire({
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update feedback',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    }
  };

  const deleteFeedback = async (feedbackId) => {
    const result = await Swal.fire({
      title: 'Delete Feedback?',
      text: 'Are you sure you want to delete this feedback?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('appToken');
        await axios.delete(`http://localhost:4000/api/feedback/${feedbackId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        await Swal.fire({
          title: 'Deleted!',
          text: 'Feedback deleted successfully',
          icon: 'success',
          confirmButtonColor: '#8B5CF6',
          timer: 2000
        });
        fetchFeedbacks();
        fetchStats();
      } catch (error) {
        console.error('Error deleting feedback:', error);
        await Swal.fire({
          title: 'Delete Failed',
          text: error.response?.data?.message || 'Failed to delete feedback',
          icon: 'error',
          confirmButtonColor: '#8B5CF6'
        });
      }
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesStatus = filterStatus === 'All' || feedback.status === filterStatus.toLowerCase();
    const matchesType = filterType === 'All' || feedback.feedbackType === filterType.toLowerCase();
    const matchesSearch = 
      feedback.feedbackId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-500';
    if (rating >= 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div>
        <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8'>
          <div className="h-8 bg-white/20 rounded w-96 mb-6 animate-pulse"></div>
          <SkeletonStats />
        </div>
        <div className="px-4 md:px-8 py-6">
          <SkeletonList items={6} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Gradient Header */}
      <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8'>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-4xl md:text-5xl font-bold text-[#EDEDE6]">Customer Feedbacks</h1>
          <button
            onClick={fetchFeedbacks}
            className="px-4 py-3 bg-white/70 border border-white text-[#78350f] rounded-lg hover:bg-gray-100 transition font-semibold shadow-lg"
          >
            Refresh
          </button>
        </div>
        <div className="mt-5">
         {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/70 border border-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Feedbacks</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalFeedback}</p>
                  </div>
                  <MessageSquare className="text-blue-500" size={40} />
                </div>
              </div>

              <div className="bg-white/70 border border-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <p className="text-3xl font-bold text-amber-600">{stats.averageRating.toFixed(1)}</p>
                  </div>
                  <TrendingUp className="text-amber-500" size={40} />
                </div>
              </div>

              <div className="bg-white/70 border border-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Review</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {stats.feedbackByStatus.find(s => s._id === 'pending')?.count || 0}
                    </p>
                  </div>
                  <Filter className="text-yellow-500" size={40} />
                </div>
              </div>

              <div className="bg-white/70 border border-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolved</p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.feedbackByStatus.find(s => s._id === 'resolved')?.count || 0}
                    </p>
                  </div>
                  <Check className="text-green-500" size={40} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-5">
          {/* Filters */}
      <div className="bg-white/70 rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by feedback ID, customer name, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
          >
            <option value="All">All Types</option>
            <option value="General">General</option>
            <option value="Food">Food Quality</option>
            <option value="Service">Service</option>
            <option value="Ambiance">Ambiance</option>
            <option value="Delivery">Delivery</option>
          </select>
        </div>
      </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 space-y-6">

     

      

      {/* Feedbacks Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feedback ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFeedbacks.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No feedbacks found
                </td>
              </tr>
            ) : (
              filteredFeedbacks.map((feedback) => (
                <tr key={feedback._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {feedback.feedbackId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{feedback.customerInfo.name}</div>
                    <div className="text-sm text-gray-500">{feedback.customerInfo.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {feedback.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < feedback.rating ? `fill-amber-500 ${getRatingColor(feedback.rating)}` : 'text-gray-300'}
                        />
                      ))}
                      <span className="ml-2 text-sm font-semibold">{feedback.rating}.0</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {feedback.feedbackType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(feedback.status)}`}>
                      {feedback.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedFeedback(feedback);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => deleteFeedback(feedback._id)}
                        className="text-red-600 hover:text-red-900"
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

      {/* Feedback Details Modal */}
      {showModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Feedback Details</h2>
                  <p className="text-sm opacity-90">{selectedFeedback.feedbackId}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-semibold">{selectedFeedback.customerInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">{selectedFeedback.customerInfo.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-semibold">{selectedFeedback.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date Submitted</p>
                  <p className="font-semibold">
                    {new Date(selectedFeedback.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Rating</p>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={24}
                      className={i < selectedFeedback.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}
                    />
                  ))}
                  <span className="ml-2 text-lg font-bold">{selectedFeedback.rating}.0 / 5.0</span>
                </div>
              </div>

              {/* Feedback Type */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Feedback Type</p>
                <p className="font-semibold capitalize">{selectedFeedback.feedbackType}</p>
              </div>

              {/* Message */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Feedback Message</p>
                <p className="text-gray-800 bg-gray-50 p-4 rounded-lg">
                  {selectedFeedback.message}
                </p>
              </div>

              {/* Admin Notes */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Admin Notes</p>
                <textarea
                  defaultValue={selectedFeedback.adminNotes}
                  placeholder="Add admin notes..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={3}
                  id="adminNotes"
                />
              </div>

              {/* Status Update */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Update Status</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const notes = document.getElementById('adminNotes').value;
                      updateFeedbackStatus(selectedFeedback._id, 'reviewed', notes);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Mark as Reviewed
                  </button>
                  <button
                    onClick={() => {
                      const notes = document.getElementById('adminNotes').value;
                      updateFeedbackStatus(selectedFeedback._id, 'resolved', notes);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Mark as Resolved
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default UserFeedbacks;
