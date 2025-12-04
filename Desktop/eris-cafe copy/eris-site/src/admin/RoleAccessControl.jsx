import React, { useState, useEffect } from 'react';
import { Shield, Users, Eye, Edit2, Save, X, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { SkeletonTable, SkeletonCard } from '../components/SkeletonLoaders';

const RoleAccessControl = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [tempPermissions, setTempPermissions] = useState(null);
  const { userData } = useAuth();
  const currentUserRole = userData?.role;

  // Fetch role permissions from backend
  useEffect(() => {
    const fetchRolePermissions = async () => {
      try {
        const token = localStorage.getItem('appToken');
        const [permissionsResponse, usersResponse] = await Promise.all([
          axios.get('http://localhost:4000/api/admin/role-permissions', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:4000/api/admin/all-users', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (permissionsResponse.data.success && usersResponse.data.success) {
          // Count users by role
          const userCounts = usersResponse.data.data.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
          }, {});

          // Transform backend data to match UI format
          // Filter out owner role and sort: Admin first, then Staff, then Customer
          const filteredData = permissionsResponse.data.data.filter(
            roleData => roleData.role !== 'owner'
          );
          
          const roleOrder = { admin: 1, staff: 2, customer: 3 };
          const sortedData = filteredData.sort(
            (a, b) => roleOrder[a.role] - roleOrder[b.role]
          );
          
          const rolesData = sortedData.map((roleData, index) => ({
            id: index + 1,
            name: roleData.role.charAt(0).toUpperCase() + roleData.role.slice(1),
            roleKey: roleData.role,
            description: getRoleDescription(roleData.role),
            permissions: roleData.permissions,
            color: getRoleColor(roleData.role),
            users: userCounts[roleData.role] || 0
          }));
          setRoles(rolesData);
        }
      } catch (error) {
        console.error('Error fetching role permissions:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to load role permissions',
          icon: 'error',
          confirmButtonColor: '#8B5CF6'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRolePermissions();
  }, []);

  const getRoleDescription = (role) => {
    const descriptions = {
      admin: 'Highest authority - Full system control and RBAC management',
      staff: 'Daily operations - Access controlled by Admin via RBAC',
      customer: 'End users - Limited access to customer-facing features'
    };
    return descriptions[role] || '';
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-violet-500',
      staff: 'bg-blue-500',
      customer: 'bg-green-500'
    };
    return colors[role] || 'bg-gray-500';
  };

  const handleEditRole = (role) => {
    // Only admins can edit role permissions
    if (currentUserRole !== 'admin') {
      Swal.fire({
        title: 'Access Denied',
        text: 'Only Admins can modify role permissions. Staff and Customer permissions are controlled by Admin.',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
      return;
    }
    
    setEditingRole(role.id);
    setTempPermissions(JSON.parse(JSON.stringify(role.permissions)));
  };

  const handleCancelEdit = () => {
    setEditingRole(null);
    setTempPermissions(null);
  };

  const handleSaveRole = async (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    // Prompt for admin password
    const { value: adminPassword } = await Swal.fire({
      title: 'Admin Verification',
      text: 'Please enter your admin password to update role permissions',
      input: 'password',
      inputPlaceholder: 'Enter your password',
      inputAttributes: {
        autocomplete: 'current-password'
      },
      showCancelButton: true,
      confirmButtonColor: '#8B5CF6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Verify & Save',
      inputValidator: (value) => {
        if (!value) {
          return 'Password is required!'
        }
      }
    });

    if (!adminPassword) return;

    try {
      const token = localStorage.getItem('appToken');
      const response = await axios.put(
        `http://localhost:4000/api/admin/role-permissions/${role.roleKey}`,
        {
          permissions: tempPermissions,
          adminPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Update local state
        setRoles(roles.map(r => 
          r.id === roleId 
            ? { ...r, permissions: tempPermissions }
            : r
        ));
        
        await Swal.fire({
          title: 'Permissions Updated!',
          text: 'Role permissions have been successfully updated.',
          icon: 'success',
          confirmButtonColor: '#8B5CF6',
          timer: 2000,
          showConfirmButton: false
        });
        
        setEditingRole(null);
        setTempPermissions(null);
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      Swal.fire({
        title: 'Update Failed!',
        text: error.response?.data?.message || 'Failed to update role permissions',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    }
  };

  const togglePermission = (module, action) => {
    if (typeof tempPermissions[module] === 'boolean') {
      setTempPermissions({
        ...tempPermissions,
        [module]: !tempPermissions[module],
      });
    } else {
      setTempPermissions({
        ...tempPermissions,
        [module]: {
          ...tempPermissions[module],
          [action]: !tempPermissions[module][action],
        },
      });
    }
  };

  const renderPermissionBadge = (hasPermission) => (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
      hasPermission ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {hasPermission ? '✓ Allowed' : '✗ Denied'}
    </span>
  );

  const renderPermissionToggle = (hasPermission, module, action) => (
    <button
      onClick={() => togglePermission(module, action)}
      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
        hasPermission 
          ? 'bg-green-500 text-white hover:bg-green-600' 
          : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
      }`}
    >
      {hasPermission ? '✓ On' : '✗ Off'}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className='bg-gradient-to-bl from-violet-500 to-fuchsia-500 px-4 md:px-8 pt-8 pb-8'>
          <div className="h-8 bg-white/20 rounded w-96 mb-2 animate-pulse"></div>
          <div className="h-4 bg-white/10 rounded w-64 animate-pulse"></div>
        </div>
        <div className="px-4 md:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-6">
            <SkeletonTable rows={8} columns={5} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8'>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className='text-[#EDEDE6] text-3xl md:text-4xl font-bold mb-2'>Role-Based Access Control</h1>
            <p className='text-white/90'>Manage user roles and their permissions</p>
          </div>
        </div>
        
        {/* Role Hierarchy Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-300 flex-shrink-0 mt-1" size={20} />
            <div className="text-white">
              <p className="font-semibold mb-1">Role Hierarchy</p>
              <p className="text-sm text-white/90">
                <span className="font-bold">Admin</span> is the highest authority with full control. 
                Admins can restrict <span className="font-semibold">Staff</span> and <span className="font-semibold">Customer</span> access to any module including Settings, RBAC, and Login Monitoring.
                {currentUserRole !== 'admin' && <span className="block mt-1 text-yellow-300">⚠️ You cannot modify permissions. Only Admins can edit RBAC settings.</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 ${role.color} rounded-lg flex items-center justify-center`}>
                  <Shield className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{role.name}</h3>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users size={16} />
                <span className="text-sm">{role.users} user{role.users !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Role Permissions */}
        <div className="space-y-6">
          {roles.map((role) => {
            const isEditing = editingRole === role.id;
            const permissions = isEditing ? tempPermissions : role.permissions;

            return (
              <div key={role.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Role Header */}
                <div className={`${role.color} p-6 flex justify-between items-center`}>
                  <div className="flex items-center gap-3">
                    <Shield className="text-white" size={28} />
                    <div>
                      <h2 className="text-2xl font-bold text-white">{role.name}</h2>
                      <p className="text-white/90 text-sm">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveRole(role.id)}
                          className="px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition font-semibold flex items-center gap-2"
                        >
                          <Save size={18} />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-semibold flex items-center gap-2"
                        >
                          <X size={18} />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEditRole(role)}
                        className="px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition font-semibold flex items-center gap-2"
                      >
                        <Edit2 size={18} />
                        Edit Permissions
                      </button>
                    )}
                  </div>
                </div>

                {/* Permissions Table */}
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Module</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">View</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Create</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Edit</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Dashboard */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">Dashboard</td>
                          <td className="py-3 px-4 text-center" colSpan="4">
                            {isEditing 
                              ? renderPermissionToggle(permissions.dashboard, 'dashboard')
                              : renderPermissionBadge(permissions.dashboard)
                            }
                          </td>
                        </tr>

                        {/* Products */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">Products</td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.products.view, 'products', 'view')
                              : renderPermissionBadge(permissions.products.view)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.products.create, 'products', 'create')
                              : renderPermissionBadge(permissions.products.create)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.products.edit, 'products', 'edit')
                              : renderPermissionBadge(permissions.products.edit)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.products.delete, 'products', 'delete')
                              : renderPermissionBadge(permissions.products.delete)
                            }
                          </td>
                        </tr>

                        {/* Orders */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">Orders</td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.orders.view, 'orders', 'view')
                              : renderPermissionBadge(permissions.orders.view)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.orders.create, 'orders', 'create')
                              : renderPermissionBadge(permissions.orders.create)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.orders.edit, 'orders', 'edit')
                              : renderPermissionBadge(permissions.orders.edit)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.orders.delete, 'orders', 'delete')
                              : renderPermissionBadge(permissions.orders.delete)
                            }
                          </td>
                        </tr>

                        {/* Reservations */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">Reservations</td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.reservations.view, 'reservations', 'view')
                              : renderPermissionBadge(permissions.reservations.view)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.reservations.create, 'reservations', 'create')
                              : renderPermissionBadge(permissions.reservations.create)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.reservations.edit, 'reservations', 'edit')
                              : renderPermissionBadge(permissions.reservations.edit)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.reservations.delete, 'reservations', 'delete')
                              : renderPermissionBadge(permissions.reservations.delete)
                            }
                          </td>
                        </tr>

                        {/* Customers */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">Customers</td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.customers.view, 'customers', 'view')
                              : renderPermissionBadge(permissions.customers.view)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.customers.create, 'customers', 'create')
                              : renderPermissionBadge(permissions.customers.create)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.customers.edit, 'customers', 'edit')
                              : renderPermissionBadge(permissions.customers.edit)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.customers.delete, 'customers', 'delete')
                              : renderPermissionBadge(permissions.customers.delete)
                            }
                          </td>
                        </tr>

                        {/* Feedbacks */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">Feedbacks</td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.feedbacks.view, 'feedbacks', 'view')
                              : renderPermissionBadge(permissions.feedbacks.view)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.feedbacks.create, 'feedbacks', 'create')
                              : renderPermissionBadge(permissions.feedbacks.create)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.feedbacks.edit, 'feedbacks', 'edit')
                              : renderPermissionBadge(permissions.feedbacks.edit)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.feedbacks.delete, 'feedbacks', 'delete')
                              : renderPermissionBadge(permissions.feedbacks.delete)
                            }
                          </td>
                        </tr>

                        {/* Settings */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">Settings</td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.settings.view, 'settings', 'view')
                              : renderPermissionBadge(permissions.settings.view)
                            }
                          </td>
                          <td className="py-3 px-4 text-center" colSpan="2">
                            {isEditing 
                              ? renderPermissionToggle(permissions.settings.edit, 'settings', 'edit')
                              : renderPermissionBadge(permissions.settings.edit)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-xs text-gray-400">N/A</span>
                          </td>
                        </tr>

                        {/* Role Access Control */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">Role Access Control</td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.roles.view, 'roles', 'view')
                              : renderPermissionBadge(permissions.roles.view)
                            }
                          </td>
                          <td className="py-3 px-4 text-center" colSpan="2">
                            {isEditing 
                              ? renderPermissionToggle(permissions.roles.edit, 'roles', 'edit')
                              : renderPermissionBadge(permissions.roles.edit)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-xs text-gray-400">N/A</span>
                          </td>
                        </tr>

                        {/* Login Monitoring */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">Login Monitoring</td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.monitoring.view, 'monitoring', 'view')
                              : renderPermissionBadge(permissions.monitoring.view)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.monitoring.create, 'monitoring', 'create')
                              : renderPermissionBadge(permissions.monitoring.create)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.monitoring.edit, 'monitoring', 'edit')
                              : renderPermissionBadge(permissions.monitoring.edit)
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing 
                              ? renderPermissionToggle(permissions.monitoring.delete, 'monitoring', 'delete')
                              : renderPermissionBadge(permissions.monitoring.delete)
                            }
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoleAccessControl;
