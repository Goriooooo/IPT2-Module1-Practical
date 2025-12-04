import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addPDFFooter } from '../utils/pdfExport';
import { ArrowLeft, Download, Package, TrendingUp, DollarSign, Star } from 'lucide-react';
import { SkeletonStats, SkeletonChart } from '../components/SkeletonLoaders';

export default function ProductsAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [productsData, setProductsData] = useState({
    totalProducts: 0,
    topSellingProduct: '',
    totalRevenue: 0,
    totalQuantitySold: 0,
    productPerformance: [],
    categoryBreakdown: [],
    revenueByProduct: [],
    inventoryStatus: []
  });

  useEffect(() => {
    fetchProductsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchProductsData = async () => {
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
        return orderDate >= startDate && order.status === 'completed';
      });

      // Product performance
      const productStats = {};
      filteredOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const name = item.name || 'Unknown';
            if (!productStats[name]) {
              productStats[name] = {
                name,
                quantitySold: 0,
                revenue: 0,
                orderCount: 0
              };
            }
            productStats[name].quantitySold += item.quantity || 0;
            productStats[name].revenue += (item.price || 0) * (item.quantity || 0);
            productStats[name].orderCount += 1;
          });
        }
      });

      const productPerformance = Object.values(productStats)
        .map(p => ({
          ...p,
          revenue: parseFloat(p.revenue.toFixed(2)),
          avgPrice: parseFloat((p.revenue / p.quantitySold).toFixed(2))
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Category breakdown
      const categoryStats = {};
      filteredOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const category = item.category || 'Uncategorized';
            if (!categoryStats[category]) {
              categoryStats[category] = {
                category,
                quantity: 0,
                revenue: 0
              };
            }
            categoryStats[category].quantity += item.quantity || 0;
            categoryStats[category].revenue += (item.price || 0) * (item.quantity || 0);
          });
        }
      });

      const categoryBreakdown = Object.values(categoryStats)
        .map(c => ({
          ...c,
          revenue: parseFloat(c.revenue.toFixed(2))
        }))
        .sort((a, b) => b.revenue - a.revenue);

      const totalRevenue = productPerformance.reduce((sum, p) => sum + p.revenue, 0);
      const totalQuantitySold = productPerformance.reduce((sum, p) => sum + p.quantitySold, 0);
      const topProduct = productPerformance[0]?.name || 'N/A';

      setProductsData({
        totalProducts: products.length,
        topSellingProduct: topProduct,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalQuantitySold,
        productPerformance: productPerformance.slice(0, 15),
        categoryBreakdown,
        revenueByProduct: productPerformance.slice(0, 10),
        inventoryStatus: []
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching products data:', error);
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Products Analytics Report', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Period: ${timeRange} | Generated: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });

    doc.autoTable({
      startY: 30,
      head: [['Metric', 'Value']],
      body: [
        ['Total Products', productsData.totalProducts],
        ['Top Selling Product', productsData.topSellingProduct],
        ['Total Revenue', `₱${productsData.totalRevenue.toFixed(2)}`],
        ['Total Quantity Sold', productsData.totalQuantitySold]
      ],
      theme: 'grid',
      headStyles: { fillColor: [120, 53, 15] }
    });

    const productData = productsData.productPerformance.slice(0, 10).map((p, i) => [
      i + 1, p.name, p.quantitySold, `₱${p.revenue.toFixed(2)}`, `₱${p.avgPrice.toFixed(2)}`
    ]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Rank', 'Product', 'Qty Sold', 'Revenue', 'Avg Price']],
      body: productData,
      theme: 'grid',
      headStyles: { fillColor: [120, 53, 15] },
      margin: { bottom: 40 }
    });

    addPDFFooter(doc);
    doc.save(`Products_Analytics_${timeRange}_${Date.now()}.pdf`);
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
          <SkeletonChart height={400} />
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
              <Package className="w-8 h-8 text-amber-600" />
              Products Analytics
            </h1>
            <p className="text-gray-600 mt-1">Product performance and sales insights</p>
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
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <h3 className="text-2xl font-bold text-gray-900">{productsData.totalProducts}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">₱{productsData.totalRevenue.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Items Sold</p>
              <h3 className="text-2xl font-bold text-gray-900">{productsData.totalQuantitySold}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Top Product</p>
              <h3 className="text-lg font-bold text-gray-900 truncate">{productsData.topSellingProduct}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Product */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top 10 Products by Revenue</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={productsData.revenueByProduct} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#f59e0b" name="Revenue (₱)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue by Category</h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={productsData.categoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, revenue }) => `${category}: ₱${revenue.toFixed(0)}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="revenue"
              >
                {productsData.categoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Top 15 Product Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Product Name</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Qty Sold</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Price</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Orders</th>
              </tr>
            </thead>
            <tbody>
              {productsData.productPerformance.map((product, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className={`font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-700' : 'text-blue-600'}`}>
                      #{index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900 font-medium">{product.name}</td>
                  <td className="py-3 px-4 text-right text-gray-700">{product.quantitySold}</td>
                  <td className="py-3 px-4 text-right font-semibold text-green-600">
                    ₱{product.revenue.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    ₱{product.avgPrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">{product.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
