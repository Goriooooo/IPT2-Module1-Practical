import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ArrowLeft, Download, ShoppingCart, TrendingUp, Package, Clock } from 'lucide-react';
import { SkeletonStats, SkeletonChart } from '../components/SkeletonLoaders';

export default function OrdersAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');
  const [ordersData, setOrdersData] = useState({
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    avgProcessingTime: 0,
    dailyOrders: [],
    ordersByStatus: [],
    ordersByHour: [],
    peakOrderTime: ''
  });

  useEffect(() => {
    fetchOrdersData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('appToken');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const ordersResponse = await axios.get('http://localhost:4000/api/orders/admin/all', config);
      const orders = ordersResponse.data.data || [];

      const now = new Date();
      let startDate = new Date();
      switch(timeRange) {
        case '7days': startDate.setDate(now.getDate() - 7); break;
        case '30days': startDate.setDate(now.getDate() - 30); break;
        case '90days': startDate.setDate(now.getDate() - 90); break;
        case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
      }

      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate;
      });

      // Calculate stats
      const totalOrders = filteredOrders.length;
      const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
      const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length;

      // Daily orders
      const dailyOrdersMap = {};
      filteredOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const dateKey = orderDate.toISOString().split('T')[0];
        const displayDate = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        if (!dailyOrdersMap[dateKey]) {
          dailyOrdersMap[dateKey] = { date: displayDate, dateKey, total: 0, completed: 0, cancelled: 0, pending: 0 };
        }
        dailyOrdersMap[dateKey].total += 1;
        if (order.status === 'completed') dailyOrdersMap[dateKey].completed += 1;
        if (order.status === 'cancelled') dailyOrdersMap[dateKey].cancelled += 1;
        if (order.status === 'pending') dailyOrdersMap[dateKey].pending += 1;
      });

      const dailyOrders = Object.values(dailyOrdersMap)
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        .map(item => ({
          date: item.date,
          total: item.total,
          completed: item.completed,
          cancelled: item.cancelled,
          pending: item.pending
        }));

      // Orders by status
      const statusCounts = {
        pending: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        completed: 0,
        cancelled: 0
      };

      filteredOrders.forEach(order => {
        if (Object.prototype.hasOwnProperty.call(statusCounts, order.status)) {
          statusCounts[order.status]++;
        }
      });

      const ordersByStatus = Object.entries(statusCounts)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
          percentage: ((count / totalOrders) * 100).toFixed(1)
        }));

      // Orders by hour
      const ordersByHourMap = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        orders: 0
      }));

      filteredOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        ordersByHourMap[hour].orders += 1;
      });

      const peakHour = ordersByHourMap.reduce((max, curr) => 
        curr.orders > max.orders ? curr : max
      );

      setOrdersData({
        totalOrders,
        completedOrders,
        cancelledOrders,
        avgProcessingTime: 0,
        dailyOrders,
        ordersByStatus,
        ordersByHour: ordersByHourMap,
        peakOrderTime: peakHour.hour
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders data:', error);
      setLoading(false);
    }
  };

  const COLORS = ['#92400e', '#78350f', '#a16207', '#854d0e', '#713f12', '#57534e'];

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Orders Analytics Report', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Period: ${timeRange} | Generated: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });

    doc.autoTable({
      startY: 30,
      head: [['Metric', 'Value']],
      body: [
        ['Total Orders', ordersData.totalOrders],
        ['Completed Orders', ordersData.completedOrders],
        ['Cancelled Orders', ordersData.cancelledOrders],
        ['Peak Order Time', ordersData.peakOrderTime]
      ],
      theme: 'grid',
      headStyles: { fillColor: [120, 53, 15] }
    });

    const statusData = ordersData.ordersByStatus.map(s => [s.name, s.value, `${s.percentage}%`]);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Status', 'Count', 'Percentage']],
      body: statusData,
      theme: 'grid',
      headStyles: { fillColor: [120, 53, 15] }
    });

    doc.save(`Orders_Analytics_${timeRange}_${Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mb-6">
          <div className="h-8 bg-gray-300 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <SkeletonStats />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <div className="mt-6">
          <SkeletonChart />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              Orders Analytics
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive order insights and patterns</p>
          </div>
          
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>
            
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900">{ordersData.totalOrders}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <h3 className="text-2xl font-bold text-gray-900">{ordersData.completedOrders}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Cancelled</p>
              <h3 className="text-2xl font-bold text-gray-900">{ordersData.cancelledOrders}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Peak Hour</p>
              <h3 className="text-2xl font-bold text-gray-900">{ordersData.peakOrderTime}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Orders Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Orders Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ordersData.dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
              <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} name="Cancelled" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ordersData.ordersByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {ordersData.ordersByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders by Hour */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Orders by Hour of Day</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ordersData.ordersByHour}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="orders" fill="#3b82f6" name="Orders" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
