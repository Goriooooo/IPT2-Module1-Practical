import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Calendar, Save, Database, Upload, Download, Cloud } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import { SkeletonForm } from '../components/SkeletonLoaders';

const AdminProfile = () => {
  const { userData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
    bio: userData?.bio || '',
  });
  const [backupHistory, setBackupHistory] = useState([]);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);

  // Fetch backup history on mount
  useEffect(() => {
    fetchBackupHistory();
    checkDriveConnection();
  }, []);

  const fetchBackupHistory = async () => {
    try {
      const token = localStorage.getItem('appToken');
      const response = await axios.get('http://localhost:4000/api/backup/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBackupHistory(response.data.backups || []);
    } catch (error) {
      console.error('Error fetching backup history:', error);
    }
  };

  const checkDriveConnection = async () => {
    try {
      const token = localStorage.getItem('appToken');
      const response = await axios.get('http://localhost:4000/api/backup/drive-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDriveConnected(response.data.connected || false);
    } catch (error) {
      console.error('Error checking drive connection:', error);
    }
  };

  const handleBackup = async () => {
    const result = await Swal.fire({
      title: 'Create Backup?',
      text: 'This will create a backup of your entire database and upload it to Google Drive.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8B5CF6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, create backup',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        setLoadingBackup(true);
        const token = localStorage.getItem('appToken');
        const response = await axios.post(
          'http://localhost:4000/api/backup/create',
          {},
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        await Swal.fire({
          title: 'Backup Created!',
          text: `Backup successfully created and uploaded to Google Drive. File: ${response.data.filename}`,
          icon: 'success',
          confirmButtonColor: '#8B5CF6',
        });

        fetchBackupHistory();
      } catch (error) {
        console.error('Error creating backup:', error);
        await Swal.fire({
          title: 'Backup Failed',
          text: error.response?.data?.message || 'Failed to create backup',
          icon: 'error',
          confirmButtonColor: '#8B5CF6'
        });
      } finally {
        setLoadingBackup(false);
      }
    }
  };

  const handleRestore = async (backupFile) => {
    const result = await Swal.fire({
      title: 'Restore Database?',
      html: `<p>This will restore your database from the backup:</p><p class="font-bold">${backupFile}</p><p class="text-red-600 mt-2">⚠️ Warning: This will replace all current data!</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, restore backup',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        setLoadingRestore(true);
        const token = localStorage.getItem('appToken');
        await axios.post(
          'http://localhost:4000/api/backup/restore',
          { filename: backupFile },
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        await Swal.fire({
          title: 'Database Restored!',
          text: 'Database has been successfully restored from backup.',
          icon: 'success',
          confirmButtonColor: '#8B5CF6',
        });

        // Reload the page after restore
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        console.error('Error restoring backup:', error);
        await Swal.fire({
          title: 'Restore Failed',
          text: error.response?.data?.message || 'Failed to restore backup',
          icon: 'error',
          confirmButtonColor: '#8B5CF6'
        });
      } finally {
        setLoadingRestore(false);
      }
    }
  };

  const handleConnectDrive = async () => {
    try {
      const token = localStorage.getItem('appToken');
      const response = await axios.get('http://localhost:4000/api/backup/connect-drive', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.authUrl) {
        window.open(response.data.authUrl, '_blank', 'width=600,height=600');
        // Poll for connection status
        const interval = setInterval(async () => {
          const status = await checkDriveConnection();
          if (status) {
            clearInterval(interval);
            await Swal.fire({
              title: 'Connected!',
              text: 'Google Drive has been successfully connected.',
              icon: 'success',
              confirmButtonColor: '#8B5CF6',
            });
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error connecting to Google Drive:', error);
      await Swal.fire({
        title: 'Connection Failed',
        text: error.response?.data?.message || 'Failed to connect to Google Drive',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    }
  };

  const handleDisconnectDrive = async () => {
    const result = await Swal.fire({
      title: 'Disconnect Google Drive?',
      text: 'You will need to reconnect to upload backups to Google Drive.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, disconnect',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('appToken');
        await axios.post('http://localhost:4000/api/backup/disconnect-drive', {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setDriveConnected(false);
        await Swal.fire({
          title: 'Disconnected!',
          text: 'Google Drive has been disconnected.',
          icon: 'success',
          confirmButtonColor: '#8B5CF6',
        });
      } catch (error) {
        console.error('Error disconnecting Google Drive:', error);
        await Swal.fire({
          title: 'Disconnection Failed',
          text: error.response?.data?.message || 'Failed to disconnect Google Drive',
          icon: 'error',
          confirmButtonColor: '#8B5CF6'
        });
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement profile update API call
    console.log('Profile update:', formData);
    
    await Swal.fire({
      title: 'Profile Updated!',
      text: 'Your profile has been successfully updated.',
      icon: 'success',
      confirmButtonColor: '#8B5CF6',
      timer: 2000
    });
    
    setIsEditing(false);
  };

  return (
    <div>
      {/* Header */}
      <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] x-4 md:px-8 pt-8 pb-8'>
        <div className="flex justify-between items-center">
          <div>
            <h1 className='text-white text-3xl md:text-4xl font-bold mb-2'>Admin Profile</h1>
            <p className='text-white/90'>Manage your account information</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-[#2E1F1B] via-stone-700 to-[#5E4B43] h-32"></div>
            <div className="px-6 pb-6">
              <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 mb-6">
                <div className="w-32 h-32 rounded-full bg-white p-2 shadow-xl">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#2E1F1B] via-stone-700 to-[#5E4B43] flex items-center justify-center text-white text-4xl font-bold">
                    {userData?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                </div>
                <div className="md:ml-6 mt-4 md:mt-0 text-center md:text-left flex-1">
                  <h2 className="text-2xl font-bold text-gray-800">{userData?.name || 'Admin User'}</h2>
                  <p className="text-gray-600 capitalize">{userData?.role || 'Administrator'}</p>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-sm text-gray-500">
                    <Calendar size={16} />
                    <span>Joined {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="mt-4 md:mt-0 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <User size={16} />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Mail size={16} />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Phone size={16} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Save Button */}
                {isEditing && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition font-semibold shadow-lg"
                    >
                      <Save size={20} />
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
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
              <span className="inline-block px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-semibold capitalize">
                {userData?.role || 'Admin'}
              </span>
            </div>
          </div>

          {/* Backup & Restore Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mt-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Database size={24} />
                Backup & Restore
              </h3>
              <p className="text-blue-100 text-sm mt-1">Manage your database backups with Google Drive integration</p>
            </div>

            <div className="p-6">
              {/* Google Drive Connection Status */}
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cloud size={24} className={driveConnected ? 'text-green-600' : 'text-gray-400'} />
                    <div>
                      <h4 className="font-semibold text-gray-800">Google Drive</h4>
                      <p className="text-sm text-gray-600">
                        {driveConnected ? 'Connected' : 'Not Connected'}
                      </p>
                    </div>
                  </div>
                  {!driveConnected && (
                    <button
                      onClick={handleConnectDrive}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                    >
                      Connect Drive
                    </button>
                  )}
                  {driveConnected && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-600 text-sm font-medium">Active</span>
                      </div>
                      <button
                        onClick={handleDisconnectDrive}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-semibold"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Backup Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={handleBackup}
                  disabled={loadingBackup || !driveConnected}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingBackup ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Backup...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Create Backup
                    </>
                  )}
                </button>

                <button
                  disabled={loadingRestore || backupHistory.length === 0}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => backupHistory.length > 0 && handleRestore(backupHistory[0].filename)}
                >
                  {loadingRestore ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Restoring...
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      Restore Latest Backup
                    </>
                  )}
                </button>
              </div>

              {/* Backup History */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Database size={18} />
                  Backup History
                </h4>
                
                {backupHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>No backups found</p>
                    <p className="text-sm mt-1">Create your first backup to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {backupHistory.map((backup, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <Database size={20} className="text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{backup.filename}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(backup.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{backup.size}</span>
                          <button
                            onClick={() => handleRestore(backup.filename)}
                            disabled={loadingRestore}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition disabled:opacity-50"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warning Message */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Important Notes:</p>
                    <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                      <li>• Backups are automatically uploaded to your Google Drive</li>
                      <li>• Restoring a backup will replace ALL current data</li>
                      <li>• It's recommended to create regular backups</li>
                      <li>• Keep your Google Drive connected for automatic backups</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
