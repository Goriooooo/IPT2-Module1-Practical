import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addPDFFooter, addCSVSignature } from '../utils/pdfExport';
import Swal from 'sweetalert2';
import { Download, ExternalLink, TrendingUp, ShoppingCart, Package, Calendar } from 'lucide-react';
import { SkeletonStats, SkeletonChart, SkeletonTable, SkeletonList } from '../components/SkeletonLoaders';

export default function DashboardHome() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState(() => {
    const saved = localStorage.getItem('dismissedNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [notificationHistory, setNotificationHistory] = useState(() => {
    const saved = localStorage.getItem('notificationHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    pendingOrders: 0
  });
  const [chartData, setChartData] = useState({
    weeklyRevenue: [],
    ordersByStatus: [],
    dailyOrders: [],
    topProducts: [],
    reservationsByDay: []
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
          amount: `₱${order.totalPrice?.toFixed(2) || '0.00'}`,
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
            message: `New Order: ${order.orderId} - ₱${order.totalPrice?.toFixed(2)}`,
            time: timeAgo,
            data: order
          });
        });

        // Add recent reservations (last 2 in last 24 hours, including pending)
        const recentNewReservations = reservations
          .filter(res => new Date(res.createdAt) > last24Hours)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 2);

        recentNewReservations.forEach(res => {
          const timeAgo = getTimeAgo(new Date(res.createdAt));
          const statusLabel = res.status === 'pending' ? '(Pending Approval)' : '';
          notificationsList.push({
            id: `reservation-${res._id}`,
            type: res.status === 'pending' ? 'pending-reservation' : 'reservation',
            message: `New Reservation: ${res.customerInfo?.name} - ${res.guests} guests ${statusLabel}`,
            time: timeAgo,
            data: res
          });
        });

        // Add cancellation requests to notifications
        const cancelRequests = orders.filter(order => order.cancelRequested && order.status !== 'cancelled');
        cancelRequests.slice(0, 2).forEach(order => {
          const timeAgo = getTimeAgo(new Date(order.cancelRequestedAt));
          notificationsList.push({
            id: `order-cancel-${order._id}`,
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

        // Generate dynamic chart data
        generateChartData(orders, reservations);

        setRecentOrders(recentOrdersList);
        setUpcomingReservations(upcomingResList);
        
        // Filter out dismissed notifications
        const filteredNotifications = notificationsList.filter(
          notif => !dismissedNotifications.includes(notif.id)
        );
        setNotifications(filteredNotifications.slice(0, 5)); // Show max 5 notifications
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
  }, [dismissedNotifications]);

  // Helper function to calculate time ago
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return `${seconds} sec ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    return `${Math.floor(seconds / 86400)} day ago`;
  };

  // Generate dynamic chart data
  const generateChartData = (orders, reservations) => {
    // 1. Weekly Revenue Chart (last 7 days)
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push(date);
    }

    const weeklyRevenueData = last7Days.map(date => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayRevenue = orders
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= date && orderDate < nextDay && order.status === 'completed';
        })
        .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      return {
        name: dayName,
        revenue: parseFloat(dayRevenue.toFixed(2)),
        orders: orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= date && orderDate < nextDay;
        }).length
      };
    });

    // 2. Orders by Status (Pie Chart)
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0
    };

    orders.forEach(order => {
      if (Object.prototype.hasOwnProperty.call(statusCounts, order.status)) {
        statusCounts[order.status]++;
      }
    });

    const ordersByStatusData = Object.entries(statusCounts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count
      }));

    // 3. Daily Orders (Bar Chart - last 7 days)
    const dailyOrdersData = last7Days.map(date => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= date && orderDate < nextDay;
      });

      return {
        name: dayName,
        orders: dayOrders.length,
        completed: dayOrders.filter(o => o.status === 'completed').length,
        cancelled: dayOrders.filter(o => o.status === 'cancelled').length
      };
    });

    // 4. Top Products (from orders)
    const productSales = {};
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const productName = item.name || 'Unknown';
          if (!productSales[productName]) {
            productSales[productName] = {
              name: productName,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[productName].quantity += item.quantity || 0;
          productSales[productName].revenue += (item.price || 0) * (item.quantity || 0);
        });
      }
    });

    const topProductsData = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(product => ({
        ...product,
        revenue: parseFloat(product.revenue.toFixed(2))
      }));

    // 5. Reservations by Day (last 7 days)
    const reservationsByDayData = last7Days.map(date => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayReservations = reservations.filter(res => {
        const resDate = new Date(res.createdAt);
        return resDate >= date && resDate < nextDay;
      });

      return {
        name: dayName,
        total: dayReservations.length,
        confirmed: dayReservations.filter(r => r.status === 'confirmed').length,
        pending: dayReservations.filter(r => r.status === 'pending').length,
        cancelled: dayReservations.filter(r => r.status === 'cancelled').length
      };
    });

    setChartData({
      weeklyRevenue: weeklyRevenueData,
      ordersByStatus: ordersByStatusData,
      dailyOrders: dailyOrdersData,
      topProducts: topProductsData,
      reservationsByDay: reservationsByDayData
    });
  };

// Colors for charts - Brown palette
const COLORS = ['#92400e', '#78350f', '#a16207', '#854d0e', '#713f12', '#57534e'];
  // Custom tooltip for revenue chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{payload[0].payload.name}</p>
          <p className="text-sm text-blue-600">Revenue: ${payload[0].value}</p>
          {payload[0].payload.orders !== undefined && (
            <p className="text-sm text-gray-600">Orders: {payload[0].payload.orders}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const dismissNotification = (id) => {
    // Find the notification being dismissed
    const notification = notifications.find(n => n.id === id);
    
    // Remove from active notifications
    setNotifications(notifications.filter(notif => notif.id !== id));
    
    // Add to dismissed list and save to localStorage
    const updatedDismissed = [...dismissedNotifications, id];
    setDismissedNotifications(updatedDismissed);
    localStorage.setItem('dismissedNotifications', JSON.stringify(updatedDismissed));

    // Add to history with dismissed timestamp
    if (notification) {
      const historyItem = {
        ...notification,
        dismissedAt: new Date().toISOString(),
        status: 'dismissed'
      };
      const updatedHistory = [historyItem, ...notificationHistory].slice(0, 50); // Keep last 50
      setNotificationHistory(updatedHistory);
      localStorage.setItem('notificationHistory', JSON.stringify(updatedHistory));
    }

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('notificationDismissed', { 
      detail: { dismissedNotifications: updatedDismissed } 
    }));
  };

  const clearNotificationHistory = () => {
    setNotificationHistory([]);
    localStorage.removeItem('notificationHistory');
  };

  // Export chart data as PDF
  const exportChartToPDF = (chartTitle, data, columns) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(chartTitle, pageWidth / 2, 20, { align: 'center' });
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
    
    // Add table
    doc.autoTable({
      startY: 35,
      head: [columns],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [120, 53, 15] },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { bottom: 40 }
    });
    
    addPDFFooter(doc);
    doc.save(`${chartTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  };

  // Export chart data as CSV
  const exportChartToCSV = (chartTitle, data, headers) => {
    let csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');
    
    csvContent = addCSVSignature(csvContent, chartTitle);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${chartTitle.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle chart exports
  const handleExportRevenue = (format) => {
    const headers = ['Day', 'Revenue (₱)', 'Orders'];
    const data = chartData.weeklyRevenue.map(item => [
      item.name,
      item.revenue.toFixed(2),
      item.orders
    ]);
    
    if (format === 'pdf') {
      exportChartToPDF('Weekly Revenue Trend', data, headers);
    } else {
      exportChartToCSV('Weekly_Revenue_Trend', data, headers);
    }
  };

  const handleExportDailyOrders = (format) => {
    const headers = ['Day', 'Total Orders', 'Completed', 'Cancelled'];
    const data = chartData.dailyOrders.map(item => [
      item.name,
      item.orders,
      item.completed,
      item.cancelled
    ]);
    
    if (format === 'pdf') {
      exportChartToPDF('Daily Orders Report', data, headers);
    } else {
      exportChartToCSV('Daily_Orders_Report', data, headers);
    }
  };

  const handleExportOrderStatus = (format) => {
    const headers = ['Status', 'Count'];
    const data = chartData.ordersByStatus.map(item => [
      item.name,
      item.value
    ]);
    
    if (format === 'pdf') {
      exportChartToPDF('Order Status Distribution', data, headers);
    } else {
      exportChartToCSV('Order_Status_Distribution', data, headers);
    }
  };

  const handleExportTopProducts = (format) => {
    const headers = ['Product', 'Quantity Sold', 'Revenue ($)'];
    const data = chartData.topProducts.map(item => [
      item.name,
      item.quantity,
      item.revenue.toFixed(2)
    ]);
    
    if (format === 'pdf') {
      exportChartToPDF('Top 5 Products Report', data, headers);
    } else {
      exportChartToCSV('Top_5_Products_Report', data, headers);
    }
  };

  const handleExportReservations = (format) => {
    const headers = ['Day', 'Total', 'Confirmed', 'Pending', 'Cancelled'];
    const data = chartData.reservationsByDay.map(item => [
      item.name,
      item.total,
      item.confirmed,
      item.pending,
      item.cancelled
    ]);
    
    if (format === 'pdf') {
      exportChartToPDF('Reservations Trend Report', data, headers);
    } else {
      exportChartToCSV('Reservations_Trend_Report', data, headers);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100"> 
      {loading ? (
        <>
          {/* Skeleton Loading State */}
          <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8'>
            <div className="mb-8 animate-pulse">
              <div className="h-12 bg-white/20 rounded w-80 mb-2"></div>
            </div>
            <SkeletonStats />
          </div>
          <main className="mx-auto px-4 py-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SkeletonChart height={320} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SkeletonChart height={280} />
                  <SkeletonChart height={280} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SkeletonChart height={280} />
                  <SkeletonChart height={280} />
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
                  <SkeletonTable rows={5} columns={5} />
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-40 mb-4"></div>
                  <SkeletonList items={5} />
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-52 mb-4"></div>
                  <SkeletonList items={5} />
                </div>
              </div>
            </div>
          </main>
        </>
      ) : (
        <>
          {/* Gradient Header Section with Stats */}
          <div className='bg-gradient-to-bl from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8'>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-[#EDEDE6]">Welcome back, Admin!</h1>
            </div>  
            {/* Top Stats Bar - 4 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Total Revenue */}
              <div className="bg-white/70 border border-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#78350f] mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-bold text-[#78350f]">₱{Number(stats.totalRevenue || 0).toFixed(2)}</h3>
                    <p className="text-sm text-gray-500 mt-2">Active</p>
                  </div>
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-white/70 border border-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#78350f] mb-1">Total Orders</p>
                    <h3 className="text-3xl font-bold text-[#78350f]">{stats.totalOrders}</h3>
                    <p className="text-sm text-gray-500 mt-2">{stats.pendingOrders} pending</p>
                  </div>
                </div>
              </div>

              {/* Total Customers */}
              <div className="bg-white/70 border border-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#78350f] mb-1">Total Customers</p>
                    <h3 className="text-3xl font-bold text-[#78350f]">{stats.totalCustomers}</h3>
                    <p className="text-sm text-gray-500 mt-2">Unique users</p>
                  </div>
                </div>
              </div>

              {/* Pending Orders */}
              <div className="bg-white/70 border border-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#78350f] mb-1">Pending Orders</p>
                    <h3 className="text-3xl font-bold text-[#78350f]">{stats.pendingOrders}</h3>
                    <p className="text-sm text-gray-500 mt-2">Needs attention</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="mx-auto px-4 py-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Charts Section - Reorganized for Better Visual Flow */}
            
            {/* Main Revenue Chart - Full Width */}
            <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group relative overflow-visible">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-800">Weekly Revenue Trend</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Last 7 Days</span>
                  {chartData.weeklyRevenue.length > 0 && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportRevenue('pdf');
                        }}
                        className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        title="Export as PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportRevenue('csv');
                        }}
                        className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        title="Export as CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate('/admin/analytics/revenue')}
                        className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        title="View Revenue Analytics"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div 
                onClick={() => navigate('/admin/analytics/revenue')} 
                className="cursor-pointer"
              >
                {chartData.weeklyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={chartData.weeklyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p>No revenue data available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Two Column Layout for Orders Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Orders Bar Chart */}
              <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group relative overflow-visible">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-800">Daily Orders</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Last 7 Days</span>
                    {chartData.dailyOrders.length > 0 && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportDailyOrders('pdf');
                          }}
                          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          title="Export as PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportDailyOrders('csv');
                          }}
                          className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          title="Export as CSV"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate('/admin/analytics/orders')}
                          className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          title="View Orders Analytics"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div 
                  onClick={() => navigate('/admin/analytics/orders')} 
                  className="cursor-pointer"
                >
                  {chartData.dailyOrders.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData.dailyOrders}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="orders" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-sm">No order data</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Orders by Status Pie Chart */}
              <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group relative overflow-visible">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-bold text-gray-800">Status Distribution</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">All Orders</span>
                    {chartData.ordersByStatus.length > 0 && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportOrderStatus('pdf');
                          }}
                          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          title="Export as PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportOrderStatus('csv');
                          }}
                          className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          title="Export as CSV"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate('/admin/analytics/orders')}
                          className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          title="View Orders Analytics"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div 
                  onClick={() => navigate('/admin/analytics/orders')} 
                  className="cursor-pointer"
                >
                  {chartData.ordersByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={chartData.ordersByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.ordersByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                        <p className="text-sm">No status data</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Two Column Layout for Products & Reservations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Products */}
              <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group relative overflow-visible">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-bold text-gray-800">Top 5 Products</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">By Revenue</span>
                    {chartData.topProducts.length > 0 && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportTopProducts('pdf');
                          }}
                          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          title="Export as PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportTopProducts('csv');
                          }}
                          className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          title="Export as CSV"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate('/admin/analytics/products')}
                          className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          title="View Products Analytics"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div 
                  onClick={() => navigate('/admin/analytics/products')} 
                  className="cursor-pointer"
                >
                  {chartData.topProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData.topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#6b7280" />
                        <YAxis dataKey="name" type="category" width={120} stroke="#6b7280" />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#f59e0b" name="Revenue (₱)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        <p className="text-sm">No product data</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reservations Chart */}
              <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group relative overflow-visible">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-bold text-gray-800">Reservations Trend</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Last 7 Days</span>
                    {chartData.reservationsByDay.length > 0 && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportReservations('pdf');
                          }}
                          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          title="Export as PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportReservations('csv');
                          }}
                          className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          title="Export as CSV"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate('/admin/analytics/reservations')}
                          className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          title="View Reservations Analytics"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div 
                  onClick={() => navigate('/admin/analytics/reservations')} 
                  className="cursor-pointer"
                >
                  {chartData.reservationsByDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData.reservationsByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="confirmed" stackId="a" fill="#10b981" name="Confirmed" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
                        <Bar dataKey="cancelled" stackId="a" fill="#ef4444" name="Cancelled" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">No reservation data</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Header with Tabs */}
              <div className="px-6 py-4 bg-gradient-to-r from-[#2E1F1B] via-stone-700 to-[#5E4B43]">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                  </svg>
                  <h2 className="text-xl font-bold text-white">Notifications</h2>
                  {notifications.length > 0 && !showHistory && (
                    <span className="ml-auto bg-white text-stone-600 text-xs font-bold rounded-full px-2 py-1">
                      {notifications.length}
                    </span>
                  )}
                </div>
                {/* Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowHistory(false)}
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                      !showHistory 
                        ? 'bg-white text-[#B0CE88]' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    Active ({notifications.length})
                  </button>
                  <button
                    onClick={() => setShowHistory(true)}
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                      showHistory 
                        ? 'bg-white text-[#B0CE88]' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    History ({notificationHistory.length})
                  </button>
                </div>
              </div>
              <div className="p-6">
              {!showHistory ? (
                // Active Notifications
                <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p className="text-gray-500 text-sm">No active notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`rounded-lg p-4 ${
                      notif.type === 'cancel' ? 'bg-red-100' : 
                      notif.type === 'pending-reservation' ? 'bg-yellow-100' :
                      notif.type === 'reservation' ? 'bg-blue-100' : 
                      'bg-amber-100'
                    }`}>
                      <div 
                        className="flex items-start gap-3 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          if (notif.type === 'order' || notif.type === 'cancel') {
                            navigate('/admin/orders');
                          } else if (notif.type === 'reservation' || notif.type === 'pending-reservation') {
                            navigate('/admin/reservations');
                          }
                        }}
                      >
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
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notif.type === 'order' || notif.type === 'cancel') {
                              navigate('/admin/orders');
                            } else if (notif.type === 'reservation' || notif.type === 'pending-reservation') {
                              navigate('/admin/reservations');
                            }
                          }}
                          className="flex-1 bg-[#B0CE88] hover:bg-stone-700 text-white text-sm py-1.5 px-4 rounded transition"
                        >
                          View Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notif.id);
                          }}
                          className="bg-gray-700 hover:bg-gray-800 text-white text-sm py-1.5 px-4 rounded transition"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))
                )}
                </div>
              ) : (
                // Notification History
                <div className="space-y-3">
                {notificationHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No notification history</p>
                    <p className="text-gray-400 text-xs mt-1">Dismissed notifications will appear here</p>
                  </div>
                ) : (
                  notificationHistory.map((notif, index) => (
                    <div key={`${notif.id}-${index}`} className="rounded-lg p-4 bg-gray-50 border border-gray-200">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                              {notif.type === 'order' ? (
                                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                              ) : notif.type === 'cancel' ? (
                                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                              ) : (
                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                              )}
                            </svg>
                            <p className="text-sm font-medium text-gray-700">{notif.message}</p>
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full ml-auto">
                              Dismissed
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>Created: {notif.time}</span>
                            <span>•</span>
                            <span>Dismissed: {getTimeAgo(new Date(notif.dismissedAt))}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (notif.type === 'order' || notif.type === 'cancel') {
                            navigate('/admin/orders');
                          } else if (notif.type === 'reservation' || notif.type === 'pending-reservation') {
                            navigate('/admin/reservations');
                          }
                        }}
                        className="w-full bg-gray-400 hover:bg-gray-500 text-white text-sm py-1.5 px-4 rounded transition"
                      >
                        View Details
                      </button>
                    </div>
                  ))
                )}
                </div>
              )}
              </div>
              
              {/* Footer */}
              {showHistory && notificationHistory.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: 'Clear History?',
                        text: 'This will permanently delete all notification history.',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#EF4444',
                        cancelButtonColor: '#6B7280',
                        confirmButtonText: 'Yes, clear it',
                        cancelButtonText: 'Cancel'
                      }).then((result) => {
                        if (result.isConfirmed) {
                          clearNotificationHistory();
                          Swal.fire({
                            title: 'Cleared!',
                            text: 'Notification history has been cleared.',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                          });
                        }
                      });
                    }}
                    className="w-full text-sm text-red-600 hover:text-red-700 font-semibold py-2 transition"
                  >
                    Clear History
                  </button>
                </div>
              )}
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
        </main>
        </>
      )}
    </div>
  );
}