import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardHome() {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'order', message: 'New Order: #1245 from Table 7', time: '1 min ago' },
    { id: 2, type: 'reservation', message: 'New Reservation: Table 1', time: '1 min ago' },
    { id: 3, type: 'order', message: 'New Order: #1245 from Table 7', time: '1 min ago' },
  ]);

  const stats = [
    {
      title: 'Total Revenue',
      value: '$12,345',
      change: '+12.5%',
      color: 'bg-green-500',
    },
    {
      title: 'Total Orders',
      value: '1,234',
      change: '+8.2%',
      color: 'bg-blue-500',
    },
    {
      title: 'Total Customers',
      value: '567',
      change: '+15.3%',
      color: 'bg-purple-500',
    },
    {
      title: 'Growth Rate',
      value: '23.5%',
      change: '+5.1%',
      color: 'bg-orange-500',
    },
  ];

  const recentOrders = [
    { id: '#12345', customer: 'John Doe', amount: '$45.99', status: 'Completed', date: '2025-10-10' },
    { id: '#12346', customer: 'Jane Smith', amount: '$32.50', status: 'Processing', date: '2025-10-10' },
    { id: '#12347', customer: 'Bob Johnson', amount: '$78.25', status: 'Pending', date: '2025-10-09' },
    { id: '#12348', customer: 'Alice Brown', amount: '$55.00', status: 'Completed', date: '2025-10-09' },
  ];

  const upcomingReservations = [
    { time: '1:00 PM', name: 'John Cruz', table: 'Table 4' },
    { time: '2:30 PM', name: 'Jane Hernandez', table: 'Table 2' },
    { time: '2:35 PM', name: 'Rhian Nuevez', table: 'Table 3' },
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                      <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
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
                <h2 className="text-xl font-bold text-gray-800">Notification</h2>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
              </div>
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className="bg-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                        {notif.type === 'order' ? (
                          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
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
                ))}
              </div>
            </div>

            {/* Upcoming Reservations */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Reservations</h2>
              <div className="space-y-3">
                {upcomingReservations.map((reservation, index) => (
                  <div key={index} className="flex items-start gap-3 text-gray-700">
                    <p className="font-medium">{reservation.time}</p>
                    <p className="text-gray-600">- {reservation.name} ({reservation.table})</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-center text-sm font-medium text-gray-800 hover:text-gray-600 transition">
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
      </main>
    </div>
  );
}