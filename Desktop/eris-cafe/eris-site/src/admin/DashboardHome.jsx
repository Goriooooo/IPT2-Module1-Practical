import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

export default function DashboardHome() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    pendingOrders: 0
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('appToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        // Fetch orders
        const ordersResponse = await axios.get('http://localhost:4000/api/orders/admin/all', config);
        const orders = ordersResponse.data.data || [];

        // Fetch reservations
        const reservationsResponse = await axios.get('http://localhost:4000/api/reservations/admin/all', config);
        const reservations = reservationsResponse.data.data || [];

        // Process orders for recent orders list (last 5)
        const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const recentOrdersList = sortedOrders.slice(0, 5).map(order => ({
          id: order.orderId,
          customer: order.customerInfo?.name || 'Unknown',
          amount: `$${order.totalPrice?.toFixed(2) || '0.00'}`,
          status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
          date: new Date(order.createdAt).toLocaleDateString('en-US')
        }));

        // Process reservations for upcoming (today and future, confirmed only)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingResList = reservations
          .filter(res => {
            const resDate = new Date(res.date);
            resDate.setHours(0, 0, 0, 0);
            return resDate >= today && res.status === 'confirmed';
          })
          .sort((a, b) => {
            const dateCompare = new Date(a.date) - new Date(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.time.localeCompare(b.time);
          })
          .slice(0, 5)
          .map(res => ({
            id: res._id,
            time: res.time,
            name: res.customerInfo?.name || 'Unknown',
            table: `${res.guests} ${res.guests === 1 ? 'Guest' : 'Guests'}`,
            date: new Date(res.date).toLocaleDateString('en-US')
          }));

        // Create notifications from recent orders and reservations
        const notificationsList = [];
        
        // Add recent orders (last 3 in last 24 hours)
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentNewOrders = orders
          .filter(order => new Date(order.createdAt) > last24Hours)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);

        recentNewOrders.forEach(order => {
          const timeAgo = getTimeAgo(new Date(order.createdAt));
          notificationsList.push({
            id: `order-${order._id}`,
            type: 'order',
            message: `New Order: ${order.orderId} - $${order.totalPrice?.toFixed(2)}`,
            time: timeAgo,
            data: order
          });
        });

        // Add recent reservations (last 2 in last 24 hours)
        const recentNewReservations = reservations
          .filter(res => new Date(res.createdAt) > last24Hours && res.status === 'confirmed')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 2);

        recentNewReservations.forEach(res => {
          const timeAgo = getTimeAgo(new Date(res.createdAt));
          notificationsList.push({
            id: `reservation-${res._id}`,
            type: 'reservation',
            message: `New Reservation: ${res.customerInfo?.name} - ${res.guests} guests`,
            time: timeAgo,
            data: res
          });
        });

        // Add cancellation requests to notifications
        const cancelRequests = orders.filter(order => order.cancelRequested && order.status !== 'cancelled');
        cancelRequests.slice(0, 2).forEach(order => {
          const timeAgo = getTimeAgo(new Date(order.cancelRequestedAt));
          notificationsList.push({
            id: `cancel-${order._id}`,
            type: 'cancel',
            message: `Cancellation Request: ${order.orderId} - ${order.customerInfo?.name}`,
            time: timeAgo,
            data: order
          });
        });

        // Sort notifications by time
        notificationsList.sort((a, b) => {
          const timeA = a.data.cancelRequestedAt || a.data.createdAt;
          const timeB = b.data.cancelRequestedAt || b.data.createdAt;
          return new Date(timeB) - new Date(timeA);
        });

        // Calculate stats
        const totalRevenue = orders
          .filter(order => order.status === 'completed')
          .reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        
        const totalOrders = orders.length;
        
        // Get unique customers
        const uniqueCustomers = new Set(orders.map(order => order.userId.toString()));
        const totalCustomers = uniqueCustomers.size;

        const pendingOrders = orders.filter(order => 
          ['pending', 'confirmed', 'preparing'].includes(order.status)
        ).length;

        setStats({
          totalRevenue: totalRevenue.toFixed(2),
          totalOrders,
          totalCustomers,
          pendingOrders
        });

        setRecentOrders(recentOrdersList);
        setUpcomingReservations(upcomingResList);
        setNotifications(notificationsList.slice(0, 5)); // Show max 5 notifications
        setLoading(false);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to calculate time ago
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return `${seconds} sec ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    return `${Math.floor(seconds / 86400)} day ago`;
  };

  const statsDisplay = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue}`,
      change: stats.totalOrders > 0 ? 'Active' : 'No orders',
      color: 'bg-green-500',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      change: `${stats.pendingOrders} pending`,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      change: 'Unique users',
      color: 'bg-purple-500',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      change: 'Needs attention',
      color: 'bg-orange-500',
    },
  ];

  const chartData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 5000 },
    { name: 'Thu', revenue: 4500 },
    { name: 'Fri', revenue: 6000 },
    { name: 'Sat', revenue: 7500 },
    { name: 'Sun', revenue: 7000 },
  ];

  const dismissNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  return (
    <div className="min-h-screen bg-stone-100"> 
      <main className="max-w-7xl mx-auto px-4 py-6 md:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statsDisplay.map((stat, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                        <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                        <p className="text-sm text-gray-600 mt-1">{stat.change}</p>
                      </div>
                      <div className={`${stat.color} p-3 rounded-lg w-12 h-12`}></div>
                    </div>
                  </div>
                ))}
              </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Revenue</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-800">{order.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">{order.customer}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">{order.amount}</td>
                        <td className="py-3 px-4">
                          <span className={`
                            px-2 py-1 text-xs font-semibold rounded-full
                            ${order.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                            ${order.status === 'Processing' ? 'bg-blue-100 text-blue-800' : ''}
                            ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          `}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Notifications & Reservations */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
                {notifications.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                    {notifications.length}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p className="text-gray-500 text-sm">No new notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`rounded-lg p-4 ${
                      notif.type === 'cancel' ? 'bg-red-100' : 
                      notif.type === 'reservation' ? 'bg-blue-100' : 
                      'bg-amber-100'
                    }`}>
                      <div className="flex items-start gap-3 mb-2">
                        <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                          {notif.type === 'order' ? (
                            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                          ) : notif.type === 'cancel' ? (
                            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                          ) : (
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                          )}
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notif.message}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs text-gray-600">{notif.time}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => dismissNotification(notif.id)}
                        className="w-full bg-gray-700 hover:bg-gray-800 text-white text-sm py-1.5 px-4 rounded transition"
                      >
                        Dismiss
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Reservations */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Reservations</h2>
              <div className="space-y-3">
                {upcomingReservations.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No upcoming reservations</p>
                  </div>
                ) : (
                  upcomingReservations.map((reservation) => (
                    <div key={reservation.id} className="border-l-4 border-amber-500 pl-3 py-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{reservation.name}</p>
                          <p className="text-sm text-gray-600">{reservation.table}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-amber-700">{reservation.time}</p>
                          <p className="text-xs text-gray-500">{reservation.date}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button 
                onClick={() => navigate('/admin/reservations')}
                className="w-full mt-4 text-center text-sm font-medium text-amber-700 hover:text-amber-600 transition"
              >
                View All Reservations ›
              </button>
            </div>

            {/* Menu Highlights */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Menu Highlights</h2>
              <p className="text-gray-600 text-sm">Popular items will appear here</p>
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}