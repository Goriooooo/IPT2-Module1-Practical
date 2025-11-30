import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Phone, MapPin, Calendar, Save, Lock } from 'lucide-react';
import Swal from 'sweetalert2';
import Navigation from '../components/Navigation';

const MyAccount = () => {
  const { user, userData, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Profile form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: ''
  });

  // Initialize form data when user data is available
  useEffect(() => {
    if (userData || user) {
      setFormData({
        name: userData?.name || user?.name || '',
        email: userData?.email || user?.email || '',
        phone: userData?.phone || '',
        address: userData?.address || '',
        bio: userData?.bio || ''
      });
    }
  }, [userData, user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.email) {
      await Swal.fire({
        title: 'Validation Error',
        text: 'Name and email are required',
        icon: 'error',
        confirmButtonColor: '#78350f'
      });
      return;
    }

    if (!formData.phone) {
      await Swal.fire({
        title: 'Validation Error',
        text: 'Phone number is required',
        icon: 'error',
        confirmButtonColor: '#78350f'
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('appToken');
      const response = await axios.put(
        'http://localhost:4000/api/auth/update-profile',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        await Swal.fire({
          title: 'Profile Updated!',
          text: 'Your profile has been successfully updated.',
          icon: 'success',
          confirmButtonColor: '#78350f',
          timer: 2000
        });
        
        // Update token if provided
        if (response.data.appToken) {
          localStorage.setItem('appToken', response.data.appToken);
        }
        
        setIsEditing(false);
        // Reload to get fresh user data
        window.location.reload();
      }
    } catch (error) {
      await Swal.fire({
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update profile',
        icon: 'error',
        confirmButtonColor: '#78350f'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      await Swal.fire({
        title: 'Validation Error',
        text: 'All password fields are required',
        icon: 'error',
        confirmButtonColor: '#78350f'
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      await Swal.fire({
        title: 'Validation Error',
        text: 'New password must be at least 6 characters',
        icon: 'error',
        confirmButtonColor: '#78350f'
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      await Swal.fire({
        title: 'Validation Error',
        text: 'New passwords do not match',
        icon: 'error',
        confirmButtonColor: '#78350f'
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('appToken');
      const response = await axios.put(
        'http://localhost:4000/api/auth/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        await Swal.fire({
          title: 'Password Changed!',
          text: 'Your password has been successfully changed.',
          icon: 'success',
          confirmButtonColor: '#78350f',
          timer: 2000
        });
        
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setActiveTab('profile');
      }
    } catch (error) {
      await Swal.fire({
        title: 'Change Password Failed',
        text: error.response?.data?.message || 'Failed to change password',
        icon: 'error',
        confirmButtonColor: '#78350f'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDEDE6]">
      <Navigation />
      
      {/* Header */}
      <div className='bg-gradient-to-r from-amber-600 to-orange-600 px-4 md:px-8 pt-24 pb-8'>
        <div className="max-w-4xl mx-auto">
          <h1 className='text-white text-3xl md:text-4xl font-bold mb-2 font-playfair'>My Account</h1>
          <p className='text-white/90'>Manage your account information</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 h-32"></div>
            <div className="px-6 pb-6">
              <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 mb-6">
                <div className="w-32 h-32 rounded-full bg-white p-2 shadow-xl">
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-full h-full rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-4xl font-bold"
                    style={{ display: user?.picture ? 'none' : 'flex' }}
                  >
                    {(formData.name || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="md:ml-6 mt-4 md:mt-0 text-center md:text-left flex-1">
                  <h2 className="text-2xl font-bold text-gray-800">{formData.name || 'User'}</h2>
                  <p className="text-gray-600 capitalize">{userData?.role || 'Customer'}</p>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-sm text-gray-500">
                    <Calendar size={16} />
                    <span>Member since {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap gap-2 justify-center">
                  {activeTab === 'profile' && (
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                    >
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setActiveTab(activeTab === 'profile' ? 'password' : 'profile');
                      setIsEditing(false);
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                  >
                    <Lock size={16} />
                    {activeTab === 'profile' ? 'Change Password' : 'Back to Profile'}
                  </button>
                </div>
              </div>

              {/* Profile Form */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <User size={16} />
                        Full Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Mail size={16} />
                        Email Address <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Phone size={16} />
                        Phone Number <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                        placeholder="+63 XXX XXX XXXX"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <MapPin size={16} />
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {/* Save Button */}
                  {isEditing && (
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <Save size={20} />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* Password Form */}
              {activeTab === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Lock size={16} />
                        Current Password <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Lock size={16} />
                        New Password <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="At least 6 characters"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Lock size={16} />
                        Confirm New Password <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Re-enter new password"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Save size={20} />
                      {loading ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Account Status</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Last Login</h3>
              <p className="text-gray-600">{new Date().toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Role</h3>
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold capitalize">
                {userData?.role || 'Customer'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
