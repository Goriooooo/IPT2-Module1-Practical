import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import axios from 'axios';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  FileText, 
  Calendar,
  MessageSquare,
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  UserCog,
  Shield,
  Activity,
  BarChart3,
  Bell,
  AlertCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [dismissedNotifications, setDismissedNotifications] = useState(() => {
    const saved = localStorage.getItem('dismissedNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userData } = useAuth();

  // Define role-based access
  const userRole = userData?.role || 'staff'; // 'admin', 'owner', or 'staff'

  // Fetch permissions on mount
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const token = localStorage.getItem('appToken');
        const response = await axios.get(
          `http://localhost:4000/api/admin/permissions/${userRole}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          setPermissions(response.data.data.permissions);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, [userRole]);

  // Route-level permission enforcement - prevent direct URL navigation to restricted routes
  useEffect(() => {
    if (loading || !permissions) return;

    // Combine all menu items and settings items for permission checking
    const allRouteItems = [
      { path: '/admin', label: 'Dashboard', permissionKey: 'dashboard' },
      { path: '/admin/products', label: 'Products', permissionKey: 'products' },
      { path: '/admin/product-analytics', label: 'Product Analytics', permissionKey: 'products' },
      { path: '/admin/orders', label: 'Orders', permissionKey: 'orders' },
      { path: '/admin/reservations', label: 'Reservations', permissionKey: 'reservations' },
      { path: '/admin/customers', label: 'Customers', permissionKey: 'customers' },
      { path: '/admin/feedbacks', label: 'User Feedbacks', permissionKey: 'feedbacks' },
      { path: '/admin/settings/profile', label: 'Admin Profile', permissionKey: 'settings' },
      { path: '/admin/settings/roles', label: 'Role Access Control', permissionKey: 'roles' },
      { path: '/admin/settings/monitoring', label: 'Login Monitoring', permissionKey: 'monitoring' },
    ];

    // Find if current path matches any route
    const currentRouteItem = allRouteItems.find(item => 
      location.pathname === item.path
    );

    if (currentRouteItem && currentRouteItem.path !== '/admin') {
      const perm = permissions[currentRouteItem.permissionKey];
      let hasAccess = false;

      // For simple boolean permissions (monitoring)
      if (typeof perm === 'boolean') {
        hasAccess = perm;
      } else {
        // For object permissions, check view access
        hasAccess = perm?.view === true;
      }

      if (!hasAccess) {
        navigate('/admin');
        Swal.fire({
          title: 'Access Denied',
          text: `You don't have permission to access ${currentRouteItem.label}.`,
          icon: 'warning',
          confirmButtonColor: '#8B5CF6',
          timer: 3000,
          timerProgressBar: true
        });
      }
    }
  }, [location.pathname, permissions, loading, navigate]);

  // Listen for notification dismissals from other components
  useEffect(() => {
    const handleNotificationDismissed = (event) => {
      const updatedDismissed = event.detail?.dismissedNotifications || [];
      setDismissedNotifications(updatedDismissed);
    };

    const handleStorageChange = (e) => {
      if (e.key === 'dismissedNotifications') {
        const newDismissed = e.newValue ? JSON.parse(e.newValue) : [];
        setDismissedNotifications(newDismissed);
      }
    };

    // Listen for custom event from same window
    window.addEventListener('notificationDismissed', handleNotificationDismissed);
    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('notificationDismissed', handleNotificationDismissed);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Fetch cancellation requests
  useEffect(() => {
    const fetchCancellationRequests = async () => {
      try {
        const token = localStorage.getItem('appToken');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [ordersRes, reservationsRes] = await Promise.all([
          axios.get('http://localhost:4000/api/orders/admin/all', config),
          axios.get('http://localhost:4000/api/reservations/admin/all', config)
        ]);

        const orders = ordersRes.data.data || [];
        const reservations = reservationsRes.data.data || [];

        const notificationsList = [];

        // Check for new orders (pending or confirmed in last 24 hours)
        const newOrders = orders.filter(
          order => ['pending', 'confirmed'].includes(order.status) && 
          new Date(order.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        newOrders.forEach(order => {
          notificationsList.push({
            id: `new-order-${order._id}`,
            type: 'new-order',
            title: 'New Order',
            message: `${order.customerInfo?.name || 'Customer'} placed Order #${order.orderId} - ₱${order.totalAmount?.toFixed(2) || '0.00'}`,
            data: order,
            createdAt: order.createdAt,
            navigate: '/admin/orders'
          });
        });

        // Check for order cancellation requests
        const orderCancelRequests = orders.filter(
          order => order.cancelRequested && order.status !== 'cancelled'
        );

        orderCancelRequests.forEach(order => {
          notificationsList.push({
            id: `order-cancel-${order._id}`,
            type: 'order-cancel',
            title: 'Order Cancellation Request',
            message: `${order.customerInfo?.name || 'Customer'} wants to cancel Order #${order.orderId}`,
            data: order,
            createdAt: order.cancelRequestedAt || order.updatedAt,
            navigate: '/admin/orders'
          });
        });

        // Check for new reservations (pending or confirmed in last 24 hours)
        const newReservations = reservations.filter(
          res => ['pending', 'confirmed'].includes(res.status) &&
          new Date(res.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        newReservations.forEach(reservation => {
          notificationsList.push({
            id: `new-reservation-${reservation._id}`,
            type: 'new-reservation',
            title: 'New Reservation',
            message: `${reservation.customerInfo?.name || 'Customer'} booked for ${reservation.guests} guests on ${new Date(reservation.date).toLocaleDateString()} at ${reservation.time}`,
            data: reservation,
            createdAt: reservation.createdAt,
            navigate: '/admin/reservations'
          });
        });

        // Check for reservation cancellation requests
        const reservationCancelRequests = reservations.filter(
          res => res.cancelRequested && res.status !== 'cancelled'
        );

        reservationCancelRequests.forEach(reservation => {
          notificationsList.push({
            id: `reservation-cancel-${reservation._id}`,
            type: 'reservation-cancel',
            title: 'Reservation Cancellation Request',
            message: `${reservation.customerInfo?.name || 'Customer'} wants to cancel reservation for ${reservation.guests} guests on ${new Date(reservation.date).toLocaleDateString()}`,
            data: reservation,
            createdAt: reservation.cancelRequestedAt || reservation.updatedAt,
            navigate: '/admin/reservations'
          });
        });

        // Sort by date (newest first)
        notificationsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Filter out dismissed notifications
        const activeNotifications = notificationsList.filter(
          notif => !dismissedNotifications.includes(notif.id)
        );

        setNotifications(activeNotifications);
      } catch (error) {
        console.error('Error fetching cancellation requests:', error);
      }
    };

    if (!loading && permissions) {
      fetchCancellationRequests();
      // Refresh every 30 seconds
      const interval = setInterval(fetchCancellationRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [loading, permissions, dismissedNotifications]);

  const allMenuItems = [ 
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, permissionKey: 'dashboard' },
    { path: '/admin/products', label: 'Products', icon: ShoppingBag, permissionKey: 'products' },
    { path: '/admin/product-analytics', label: 'Product Analytics', icon: BarChart3, permissionKey: 'products' },
    { path: '/admin/orders', label: 'Orders', icon: FileText, permissionKey: 'orders' },
    { path: '/admin/reservations', label: 'Reservations', icon: Calendar, permissionKey: 'reservations' },
    { path: '/admin/customers', label: 'Customers', icon: Users, permissionKey: 'customers' },
    { path: '/admin/feedbacks', label: 'User Feedbacks', icon: MessageSquare, permissionKey: 'feedbacks' },
  ];

  const allSettingsItems = [
    { path: '/admin/settings/profile', label: 'Admin Profile', icon: UserCog, permissionKey: 'settings' },
    { path: '/admin/settings/roles', label: 'Role Access Control', icon: Shield, permissionKey: 'roles' },
    { path: '/admin/settings/monitoring', label: 'Login Monitoring', icon: Activity, permissionKey: 'monitoring' },
  ];

  const isActive = (path) => location.pathname === path;

  // Filter menu items based on fetched permissions
  const filteredMenuItems = allMenuItems.filter(item => {
    if (!permissions) return false;
    const perm = permissions[item.permissionKey];
    // For simple boolean permissions (dashboard)
    if (typeof perm === 'boolean') return perm;
    // For object permissions (products, orders, etc.), check if user has view access
    return perm?.view === true;
  });

  const filteredSettingsItems = allSettingsItems.filter(item => {
    if (!permissions) return false;
    const perm = permissions[item.permissionKey];
    // For simple boolean permissions (monitoring)
    if (typeof perm === 'boolean') return perm;
    // For object permissions (settings, roles), check if user has view access
    return perm?.view === true;
  });

  const isSettingsActive = filteredSettingsItems.some(item => location.pathname === item.path);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout Confirmation',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8B5CF6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      logout();
      navigate('/');
      Swal.fire({
        title: 'Logged Out!',
        text: 'You have been successfully logged out.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  // Show loading state while fetching permissions
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarMinimized ? 'lg:w-20' : 'lg:w-64'}
        fixed inset-y-0 left-0 z-50 w-64 bg-charcoal text-white transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h1 className={`text-2xl font-bold font-playfair transition-opacity duration-300 ${sidebarMinimized ? 'lg:opacity-0 lg:hidden' : 'opacity-100'}`}>
            Eris Admin
          </h1>
          <div className="flex items-center gap-2">
            {/* Minimize/Expand button - only on desktop */}
            <button 
              onClick={() => setSidebarMinimized(!sidebarMinimized)}
              className="hidden lg:block p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title={sidebarMinimized ? 'Expand Sidebar' : 'Minimize Sidebar'}
            >
              {sidebarMinimized ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            {/* Close button - only on mobile */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {/* Main Menu Items */}
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200
                  ${sidebarMinimized ? 'lg:justify-center' : ''}
                  ${isActive(item.path) 
                    ? 'bg-coffee text-white' 
                    : 'text-gray-300 hover:bg-[#B0CE88]/70 hover:text-white'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
                title={sidebarMinimized ? item.label : ''}
              >
                <Icon size={20} />
                <span className={`${sidebarMinimized ? 'lg:hidden' : ''}`}>{item.label}</span>
              </Link>
            );
          })}

          {/* Settings Dropdown (Only for Admin/Owner) */}
          {filteredSettingsItems.length > 0 && (
            <div className="space-y-1">
              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className={`
                  flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors duration-200
                  ${sidebarMinimized ? 'lg:justify-center' : ''}
                  ${isSettingsActive 
                    ? 'bg-coffee text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
                title={sidebarMinimized ? 'Settings' : ''}
              >
                <div className="flex items-center space-x-3">
                  <Settings size={20} />
                  <span className={`${sidebarMinimized ? 'lg:hidden' : ''}`}>Settings</span>
                </div>
                {!sidebarMinimized && (
                  settingsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                )}
              </button>

              {/* Settings Submenu */}
              {settingsExpanded && !sidebarMinimized && (
                <div className="ml-4 space-y-1">
                  {filteredSettingsItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`
                          flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors duration-200 text-sm
                          ${isActive(item.path) 
                            ? 'bg-coffee text-white' 
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }
                        `}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 space-y-3">
          {/* Notification Bell - Read Only (Links to Dashboard) */}
          <button
            onClick={() => navigate('/admin')}
            className={`
              flex items-center space-x-3 px-4 py-3 w-full text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors duration-200
              ${sidebarMinimized ? 'lg:justify-center' : ''}
            `}
            title={sidebarMinimized ? 'View Notifications' : ''}
          >
            <div className="relative">
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </div>
            <span className={`${sidebarMinimized ? 'lg:hidden' : ''}`}>Notifications</span>
          </button>

          {/* Admin Profile */}
          <div className={`
            flex items-center space-x-3 px-4 py-3 bg-gray-800 rounded-lg
            ${sidebarMinimized ? 'lg:justify-center' : ''}
          `}>
            <div className="w-10 h-10 rounded-full bg-coffee text-white flex items-center justify-center font-semibold flex-shrink-0">
              {userData?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className={`flex-1 min-w-0 ${sidebarMinimized ? 'lg:hidden' : ''}`}>
              <p className="text-sm font-medium text-white truncate">{userData?.name || 'Admin User'}</p>
              <p className="text-xs text-gray-400 truncate">{userData?.email || 'admin@eriscafe.com'}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className={`
              flex items-center space-x-3 px-4 py-3 w-full text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors duration-200
              ${sidebarMinimized ? 'lg:justify-center' : ''}
            `}
            title={sidebarMinimized ? 'Logout' : ''}
          >
            <LogOut size={20} />
            <span className={`${sidebarMinimized ? 'lg:hidden' : ''}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 bg-charcoal text-white p-2 rounded-lg shadow-lg"
        >
          <Menu size={24} />
        </button>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
