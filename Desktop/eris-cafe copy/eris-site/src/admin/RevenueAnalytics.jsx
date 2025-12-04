import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addPDFFooter } from '../utils/pdfExport';
import { ArrowLeft, Download, TrendingUp, DollarSign, ShoppingBag, Calendar } from 'lucide-react';
import { SkeletonStats, SkeletonChart, SkeletonTable } from '../components/SkeletonLoaders';

export default function RevenueAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days'); // 7days, 30days, 90days, year
  const [revenueData, setRevenueData] = useState({
    total: 0,
    growth: 0,
    avgOrderValue: 0,
    totalOrders: 0,
    dailyRevenue: [],
    monthlyRevenue: [],
    revenueByCategory: [],
    topRevenueProducts: []
  });

  useEffect(() => {
    fetchRevenueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('appToken');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const [ordersResponse, productsResponse] = await Promise.all([
        axios.get('http://localhost:4000/api/orders/admin/all', config),
        axios.get('http://localhost:4000/api/products', config)
      ]);
      
      const orders = ordersResponse.data.data || [];
      const products = productsResponse.data.data || [];
      
      // Create a product map for quick lookup
      const productMap = {};
      products.forEach(product => {
        productMap[product._id] = product;
        productMap[product.name] = product; // Also map by name for fallback
      });

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      switch(timeRange) {
        case '7days': startDate.setDate(now.getDate() - 7); break;
        case '30days': startDate.setDate(now.getDate() - 30); break;
        case '90days': startDate.setDate(now.getDate() - 90); break;
        case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
      }

      // Filter orders by date range
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && order.status === 'completed';
      });

      // Calculate total revenue
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const totalOrders = filteredOrders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate daily revenue
      const dailyRevenueMap = {};
      filteredOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const dateKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        const displayDate = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        if (!dailyRevenueMap[dateKey]) {
          dailyRevenueMap[dateKey] = { date: displayDate, dateKey, revenue: 0, orders: 0 };
        }
        dailyRevenueMap[dateKey].revenue += order.totalPrice || 0;
        dailyRevenueMap[dateKey].orders += 1;
      });

      const dailyRevenue = Object.values(dailyRevenueMap)
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        .map(item => ({
          date: item.date,
          revenue: parseFloat(item.revenue.toFixed(2)),
          orders: item.orders
        }));

      // Calculate revenue by product category
      const categoryRevenue = {};
      filteredOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            // Try to get category from productId first, then name, or default
            let category = 'Uncategorized';
            if (item.productId && productMap[item.productId]) {
              category = productMap[item.productId].category || 'Uncategorized';
            } else if (item.name && productMap[item.name]) {
              category = productMap[item.name].category || 'Uncategorized';
            }
            
            if (!categoryRevenue[category]) {
              categoryRevenue[category] = 0;
            }
            categoryRevenue[category] += (item.price || 0) * (item.quantity || 0);
          });
        }
      });

      const revenueByCategory = Object.entries(categoryRevenue)
        .map(([category, revenue]) => ({
          category,
          revenue: parseFloat(revenue.toFixed(2))
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Top revenue products
      const productRevenue = {};
      filteredOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const name = item.name || 'Unknown';
            if (!productRevenue[name]) {
              productRevenue[name] = { name, revenue: 0, quantity: 0 };
            }
            productRevenue[name].revenue += (item.price || 0) * (item.quantity || 0);
            productRevenue[name].quantity += item.quantity || 0;
          });
        }
      });

      const topRevenueProducts = Object.values(productRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(item => ({
          ...item,
          revenue: parseFloat(item.revenue.toFixed(2))
        }));

      // Calculate growth compared to previous period
      let previousStartDate = new Date(startDate);
      const periodDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      previousStartDate.setDate(startDate.getDate() - periodDays);
      
      const previousOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= previousStartDate && orderDate < startDate && order.status === 'completed';
      });
      
      const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const growth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue * 100) : 0;

      setRevenueData({
        total: totalRevenue,
        growth: parseFloat(growth.toFixed(1)),
        avgOrderValue,
        totalOrders,
        dailyRevenue,
        monthlyRevenue: [],
        revenueByCategory,
        topRevenueProducts
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Revenue Analytics Report', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Period: ${timeRange} | Generated: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });

    // Summary stats
    doc.autoTable({
      startY: 30,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', `₱${revenueData.total.toFixed(2)}`],
        ['Total Orders', revenueData.totalOrders],
        ['Average Order Value', `₱${revenueData.avgOrderValue.toFixed(2)}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [120, 53, 15] }
    });

    // Top Products
    const productData = revenueData.topRevenueProducts.map(p => [
      p.name, p.quantity, `₱${p.revenue.toFixed(2)}`
    ]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Product', 'Quantity Sold', 'Revenue']],
      body: productData,
      theme: 'grid',
      headStyles: { fillColor: [120, 53, 15] },
      margin: { bottom: 40 }
    });

    addPDFFooter(doc);
    doc.save(`Revenue_Analytics_${timeRange}_${Date.now()}.pdf`);
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
          <SkeletonTable rows={10} columns={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
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
              <TrendingUp className="w-8 h-8 text-blue-600" />
              Revenue Analytics
            </h1>
            <p className="text-gray-600 mt-1">Detailed revenue insights and trends</p>
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
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">₱{revenueData.total.toFixed(2)}</h3>
              {revenueData.growth !== 0 && (
                <p className={`text-sm mt-1 ${revenueData.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueData.growth > 0 ? '↑' : '↓'} {Math.abs(revenueData.growth)}% vs previous period
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900">{revenueData.totalOrders}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <h3 className="text-2xl font-bold text-gray-900">₱{revenueData.avgOrderValue.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Time Period</p>
              <h3 className="text-xl font-bold text-gray-900">{timeRange.replace('days', ' Days').replace('year', 'Year')}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Revenue Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Revenue Trend</h2>
          {revenueData.dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#93c5fd" name="Revenue (₱)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No revenue data available for this period</p>
              </div>
            </div>
          )}
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue by Category</h2>
          {revenueData.revenueByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData.revenueByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue (₱)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No category data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Top 10 Revenue Products</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Product Name</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity Sold</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Revenue</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {revenueData.topRevenueProducts.length > 0 ? (
                revenueData.topRevenueProducts.map((product, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-blue-600">#{index + 1}</td>
                    <td className="py-3 px-4 text-gray-900">{product.name}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{product.quantity}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">
                      ₱{product.revenue.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      ₱{(product.revenue / product.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    No product data available for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
