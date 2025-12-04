import React, { useState, useEffect } from 'react';
import { Activity, User, Clock, MapPin, Monitor, RefreshCw, Filter, Download, UserPlus, Trash2, Shield } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { SkeletonStats, SkeletonTable } from '../components/SkeletonLoaders';
import { addCSVSignature } from '../utils/pdfExport';

const LoginMonitoring = () => {
  const [loginLogs, setLoginLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'users'
  const [permissions, setPermissions] = useState(null);
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    totalLogins: 0,
    successfulLogins: 0,
    failedLogins: 0,
    activeUsers: 0,
  });

  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('appToken');
        const userRole = userData?.role || 'staff';
        const response = await axios.get(
          `http://localhost:4000/api/admin/permissions/${userRole}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          setPermissions(response.data.data.permissions.monitoring);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };
    
    fetchPermissions();
  }, [userData]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLoginLogs();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchLoginLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('appToken');
      const response = await axios.get('http://localhost:4000/api/admin/login-logs', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { role: filterRole, status: filterStatus, limit: 100 }
      });

      if (response.data.success) {
        setLoginLogs(response.data.data.logs);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching login logs:', error);
      await Swal.fire({
        title: 'Fetch Failed',
        text: error.response?.data?.message || 'Failed to fetch login logs',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('appToken');
      const response = await axios.get('http://localhost:4000/api/admin/all-users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      await Swal.fire({
        title: 'Fetch Failed',
        text: error.response?.data?.message || 'Failed to fetch users',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLoginLogs();
    }
    // eslint-disable-next-line
  }, [filterRole, filterStatus]);

  const handleAddUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Add New User',
      width: '600px',
      html: `
        <style>
          .add-user-form { text-align: left; padding: 0 20px; }
          .add-user-form .form-group { margin-bottom: 20px; }
          .add-user-form label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
          .add-user-form input, .add-user-form select { 
            width: 100%; 
            padding: 10px 12px; 
            border: 1px solid #D1D5DB; 
            border-radius: 8px; 
            font-size: 14px;
            box-sizing: border-box;
            margin: 0;
          }
          .add-user-form input:focus, .add-user-form select:focus { 
            outline: none; 
            border-color: #8B5CF6; 
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); 
          }
          .add-user-form .divider { 
            margin: 20px 0; 
            padding-top: 20px; 
            border-top: 1px solid #E5E7EB; 
          }
          .add-user-form .admin-section label { color: #DC2626; font-weight: 600; }
          .add-user-form .help-text { font-size: 12px; color: #6B7280; margin-top: 4px; }
        </style>
        <div class="add-user-form">
          <div class="form-group">
            <label>Full Name</label>
            <input id="swal-name" type="text" placeholder="Enter full name">
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input id="swal-email" type="email" placeholder="email@example.com">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input id="swal-password" type="password" placeholder="Minimum 6 characters">
          </div>
          <div class="form-group">
            <label>User Role</label>
            <select id="swal-role">
              <option value="customer">Customer</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div class="divider admin-section">
            <div class="form-group">
              <label>Admin Password (Required)</label>
              <input id="swal-admin-password" type="password" placeholder="Your admin password">
              <p class="help-text">Enter your admin password to confirm this action</p>
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#8B5CF6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Create User',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const name = document.getElementById('swal-name').value;
        const email = document.getElementById('swal-email').value;
        const password = document.getElementById('swal-password').value;
        const role = document.getElementById('swal-role').value;
        const adminPassword = document.getElementById('swal-admin-password').value;

        if (!name || !email || !password || !adminPassword) {
          Swal.showValidationMessage('Please fill in all fields');
          return false;
        }
        if (password.length < 6) {
          Swal.showValidationMessage('Password must be at least 6 characters');
          return false;
        }
        return { name, email, password, role, adminPassword };
      }
    });

    if (formValues) {
      try {
        const token = localStorage.getItem('appToken');
        const response = await axios.post(
          'http://localhost:4000/api/admin/users/add',
          formValues,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (response.data.success) {
          await Swal.fire({
            title: 'User Created!',
            text: 'User has been successfully created',
            icon: 'success',
            confirmButtonColor: '#8B5CF6',
            timer: 2000
          });
          fetchUsers();
        }
      } catch (error) {
        await Swal.fire({
          title: 'Creation Failed',
          text: error.response?.data?.message || 'Failed to create user',
          icon: 'error',
          confirmButtonColor: '#8B5CF6'
        });
      }
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const result = await Swal.fire({
      title: 'Delete User?',
      width: '500px',
      html: `
        <style>
          .delete-user-form { text-align: left; padding: 0 20px; }
          .delete-user-form .warning-message { 
            background: #FEF2F2; 
            border: 1px solid #FECACA; 
            border-radius: 8px; 
            padding: 12px; 
            margin-bottom: 20px;
            color: #991B1B;
          }
          .delete-user-form .form-group { margin-bottom: 20px; }
          .delete-user-form label { display: block; font-size: 14px; font-weight: 600; color: #DC2626; margin-bottom: 6px; }
          .delete-user-form input { 
            width: 100%; 
            padding: 10px 12px; 
            border: 1px solid #D1D5DB; 
            border-radius: 8px; 
            font-size: 14px;
            box-sizing: border-box;
            margin: 0;
          }
          .delete-user-form input:focus { 
            outline: none; 
            border-color: #DC2626; 
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); 
          }
          .delete-user-form .help-text { font-size: 12px; color: #6B7280; margin-top: 4px; }
        </style>
        <div class="delete-user-form">
          <div class="warning-message">
            Are you sure you want to delete <strong>${userName}</strong>? This action cannot be undone.
          </div>
          <div class="form-group">
            <label>Admin Password (Required)</label>
            <input id="swal-admin-password" type="password" placeholder="Your admin password">
            <p class="help-text">Enter your admin password to confirm deletion</p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete user',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const adminPassword = document.getElementById('swal-admin-password').value;
        if (!adminPassword) {
          Swal.showValidationMessage('Admin password is required');
          return false;
        }
        return { adminPassword };
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        const token = localStorage.getItem('appToken');
        const response = await axios.delete(
          `http://localhost:4000/api/admin/users/${userId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
            data: { adminPassword: result.value.adminPassword }
          }
        );

        if (response.data.success) {
          await Swal.fire({
            title: 'Deleted!',
            text: 'User has been successfully deleted',
            icon: 'success',
            confirmButtonColor: '#8B5CF6',
            timer: 2000
          });
          fetchUsers();
        }
      } catch (error) {
        await Swal.fire({
          title: 'Deletion Failed',
          text: error.response?.data?.message || 'Failed to delete user',
          icon: 'error',
          confirmButtonColor: '#8B5CF6'
        });
      }
    }
  };

  const handleUpdateRole = async (userId, currentRole, userName) => {
    const result = await Swal.fire({
      title: `Update Role for ${userName}`,
      width: '500px',
      html: `
        <style>
          .update-role-form { text-align: left; padding: 0 20px; }
          .update-role-form .form-group { margin-bottom: 20px; }
          .update-role-form label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
          .update-role-form select, .update-role-form input { 
            width: 100%; 
            padding: 10px 12px; 
            border: 1px solid #D1D5DB; 
            border-radius: 8px; 
            font-size: 14px;
            box-sizing: border-box;
            margin: 0;
          }
          .update-role-form select:focus, .update-role-form input:focus { 
            outline: none; 
            border-color: #8B5CF6; 
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); 
          }
          .update-role-form .divider { 
            margin: 20px 0; 
            padding-top: 20px; 
            border-top: 1px solid #E5E7EB; 
          }
          .update-role-form .admin-section label { color: #DC2626; font-weight: 600; }
          .update-role-form .help-text { font-size: 12px; color: #6B7280; margin-top: 4px; }
        </style>
        <div class="update-role-form">
          <div class="form-group">
            <label>Select New Role</label>
            <select id="swal-role">
              <option value="customer" ${currentRole === 'customer' ? 'selected' : ''}>Customer</option>
              <option value="staff" ${currentRole === 'staff' ? 'selected' : ''}>Staff</option>
              <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>Admin</option>
              <option value="owner" ${currentRole === 'owner' ? 'selected' : ''}>Owner</option>
            </select>
          </div>
          <div class="divider admin-section">
            <div class="form-group">
              <label>Admin Password (Required)</label>
              <input id="swal-admin-password" type="password" placeholder="Your admin password">
              <p class="help-text">Enter your admin password to confirm this action</p>
            </div>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8B5CF6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Update Role',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const role = document.getElementById('swal-role').value;
        const adminPassword = document.getElementById('swal-admin-password').value;
        if (!adminPassword) {
          Swal.showValidationMessage('Admin password is required');
          return false;
        }
        return { role, adminPassword };
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        const token = localStorage.getItem('appToken');
        const response = await axios.put(
          `http://localhost:4000/api/admin/users/${userId}/role`,
          result.value,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (response.data.success) {
          await Swal.fire({
            title: 'Role Updated!',
            text: 'User role has been successfully updated',
            icon: 'success',
            confirmButtonColor: '#8B5CF6',
            timer: 2000
          });
          fetchUsers();
        }
      } catch (error) {
        await Swal.fire({
          title: 'Update Failed',
          text: error.response?.data?.message || 'Failed to update user role',
          icon: 'error',
          confirmButtonColor: '#8B5CF6'
        });
      }
    }
  };

  const handleChangePassword = async (userId, userName) => {
    const result = await Swal.fire({
      title: `Change Password for ${userName}`,
      width: '500px',
      html: `
        <style>
          .change-password-form { text-align: left; padding: 0 20px; }
          .change-password-form .form-group { margin-bottom: 20px; }
          .change-password-form label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
          .change-password-form input { 
            width: 100%; 
            padding: 10px 12px; 
            border: 1px solid #D1D5DB; 
            border-radius: 8px; 
            font-size: 14px;
            box-sizing: border-box;
            margin: 0;
          }
          .change-password-form input:focus { 
            outline: none; 
            border-color: #8B5CF6; 
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); 
          }
          .change-password-form .divider { 
            margin: 20px 0; 
            padding-top: 20px; 
            border-top: 1px solid #E5E7EB; 
          }
          .change-password-form .admin-section label { color: #DC2626; font-weight: 600; }
          .change-password-form .help-text { font-size: 12px; color: #6B7280; margin-top: 4px; }
        </style>
        <div class="change-password-form">
          <div class="form-group">
            <label>New Password</label>
            <input id="swal-new-password" type="password" placeholder="Enter new password (min 6 characters)">
            <p class="help-text">Minimum 6 characters required</p>
          </div>
          <div class="divider admin-section">
            <div class="form-group">
              <label>Your Admin Password (Required)</label>
              <input id="swal-admin-password" type="password" placeholder="Your admin password">
              <p class="help-text">Enter your admin password to confirm this action</p>
            </div>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#8B5CF6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Change Password',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const newPassword = document.getElementById('swal-new-password').value;
        const adminPassword = document.getElementById('swal-admin-password').value;
        
        if (!newPassword) {
          Swal.showValidationMessage('New password is required');
          return false;
        }
        if (newPassword.length < 6) {
          Swal.showValidationMessage('Password must be at least 6 characters');
          return false;
        }
        if (!adminPassword) {
          Swal.showValidationMessage('Admin password is required');
          return false;
        }
        return { newPassword, adminPassword };
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        const token = localStorage.getItem('appToken');
        const response = await axios.put(
          `http://localhost:4000/api/admin/users/${userId}/password`,
          result.value,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (response.data.success) {
          await Swal.fire({
            title: 'Password Changed!',
            text: 'User password has been successfully updated',
            icon: 'success',
            confirmButtonColor: '#8B5CF6',
            timer: 2000
          });
        }
      } catch (error) {
        await Swal.fire({
          title: 'Update Failed',
          text: error.response?.data?.message || 'Failed to change password',
          icon: 'error',
          confirmButtonColor: '#8B5CF6'
        });
      }
    }
  };

  const handleExport = async () => {
    let csvContent = [
      'Timestamp,Username,Email,Role,Status,IP Address,Location,Device',
      ...loginLogs.map(log => [
        new Date(log.createdAt).toLocaleString(),
        log.userName,
        log.email,
        log.role,
        log.status,
        log.ipAddress,
        log.location,
        log.device
      ].join(','))
    ].join('\n');

    csvContent = addCSVSignature(csvContent, 'Login Monitoring Logs');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `login-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    await Swal.fire({
      title: 'Export Complete',
      text: `Exported ${loginLogs.length} login records`,
      icon: 'success',
      confirmButtonColor: '#8B5CF6',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const getStatusColor = (status) => {
    return status === 'success' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-red-100 text-red-700';
  };

  const getRoleColor = (role) => {
    const colors = {
      owner: 'bg-red-100 text-red-700',
      admin: 'bg-violet-100 text-violet-700',
      staff: 'bg-blue-100 text-blue-700',
      customer: 'bg-green-100 text-green-700',
      unknown: 'bg-gray-100 text-gray-700',
    };
    return colors[role] || colors.unknown;
  };

  return (
    <div>
      {/* Header */}
      <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8'>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className='text-white text-3xl md:text-4xl font-bold mb-2'>Login Monitoring & User Management</h1>
            <p className='text-white/90'>Track user login activities and manage system users</p>
          </div>
          <div className="flex gap-3">
            {activeTab === 'logs' && (
              <>
                <button
                  onClick={fetchLoginLogs}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-violet-600 rounded-lg hover:bg-gray-100 transition font-semibold shadow-lg"
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-violet-600 rounded-lg hover:bg-gray-100 transition font-semibold shadow-lg"
                >
                  <Download size={18} />
                  Export
                </button>
              </>
            )}
            {activeTab === 'users' && (
              <>
                <button
                  onClick={fetchUsers}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-violet-600 rounded-lg hover:bg-gray-100 transition font-semibold shadow-lg"
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>
                {permissions?.create && (
                  <button
                    onClick={handleAddUser}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-violet-600 rounded-lg hover:bg-gray-100 transition font-semibold shadow-lg"
                  >
                    <UserPlus size={18} />
                    Add User
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-stone-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Activity size={18} />
            Login Logs
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-stone-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <User size={18} />
            User Management
          </button>
        </div>

        {activeTab === 'logs' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Total Logins</h3>
              <Activity className="text-violet-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.totalLogins}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Successful</h3>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl font-bold">✓</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.successfulLogins}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Failed</h3>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xl font-bold">✗</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.failedLogins}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Active Users</h3>
              <User className="text-violet-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.activeUsers}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="customer">Customer</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Login Logs Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6">
                <SkeletonTable rows={8} columns={6} />
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">User</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Role</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Time</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Location</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Device</th>
                  </tr>
                </thead>
                <tbody>
                  {loginLogs.map((log, index) => (
                    <tr key={log._id || index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#2E1F1B] via-stone-700 to-[#5E4B43] rounded-full flex items-center justify-center text-white font-semibold">
                            {log.userName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{log.userName}</p>
                            <p className="text-sm text-gray-500">{log.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRoleColor(log.role)}`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock size={16} />
                          <span className="text-sm">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={16} />
                          <div>
                            <p className="text-sm">{log.location}</p>
                            <p className="text-xs text-gray-400">{log.ipAddress}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Monitor size={16} />
                          <span className="text-sm">{log.device}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {loginLogs.length === 0 && !loading && (
            <div className="text-center py-12">
              <Activity size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No login logs found</p>
            </div>
          )}
        </div>
        </>
        )}

        {activeTab === 'users' && (
          <>
            {/* User Management Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-violet-500"></div>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">User</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Role</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Created At</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Last Login</th>
                        <th className="text-center py-4 px-6 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#2E1F1B] via-stone-700 to-[#5E4B43] rounded-full flex items-center justify-center text-white font-semibold">
                                {user.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock size={16} />
                              <span className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-gray-600">{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Never'}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-2">
                              {permissions?.edit && (
                                <button
                                  onClick={() => handleUpdateRole(user._id, user.role, user.name)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Update Role"
                                >
                                  <Shield size={18} />
                                </button>
                              )}
                              {permissions?.edit && (
                                <button
                                  onClick={() => handleChangePassword(user._id, user.name)}
                                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Change Password"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                  </svg>
                                </button>
                              )}
                              {permissions?.delete && (
                                <button
                                  onClick={() => handleDeleteUser(user._id, user.name)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Delete User"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {users.length === 0 && !loading && (
                <div className="text-center py-12">
                  <User size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginMonitoring;
