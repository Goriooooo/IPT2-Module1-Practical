import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Filter
} from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ProductAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productStats, setProductStats] = useState([]);
  const [dateRange, setDateRange] = useState('30'); // 7, 30, 90, 365, all, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minSalesFilter, setMinSalesFilter] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('revenue'); // revenue, quantity, profit

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (products.length > 0 && orders.length > 0) {
      calculateProductStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, orders, dateRange, startDate, endDate, minSalesFilter, categoryFilter, sortBy]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('appToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [productsRes, ordersRes] = await Promise.all([
        axios.get('http://localhost:4000/api/products', config),
        axios.get('http://localhost:4000/api/orders/admin/all', config)
      ]);

      setProducts(productsRes.data.data || []);
      setOrders(ordersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProductStats = () => {
    // Filter orders by date range
    const now = new Date();
    let filteredOrders = orders;

    if (dateRange === 'custom') {
      // Custom date range
      if (startDate || endDate) {
        filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          const start = startDate ? new Date(startDate) : new Date('2000-01-01');
          const end = endDate ? new Date(endDate) : new Date();
          end.setHours(23, 59, 59, 999); // Include the entire end date
          return orderDate >= start && orderDate <= end;
        });
      }
    } else if (dateRange !== 'all') {
      // Preset date ranges
      const daysAgo = parseInt(dateRange);
      const rangeStartDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(order => new Date(order.createdAt) >= rangeStartDate);
    }

    // Calculate stats for each product
    const productMap = new Map();

    products.forEach(product => {
      productMap.set(product._id, {
        id: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        isAvailable: product.isAvailable,
        image: product.image,
        totalQuantitySold: 0,
        totalRevenue: 0,
        orderCount: 0,
        lastOrderDate: null
      });
    });

    // Aggregate order data
    filteredOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const product = productMap.get(item.productId);
          if (product) {
            product.totalQuantitySold += item.quantity || 0;
            product.totalRevenue += (item.price || 0) * (item.quantity || 0);
            product.orderCount += 1;
            
            const orderDate = new Date(order.createdAt);
            if (!product.lastOrderDate || orderDate > product.lastOrderDate) {
              product.lastOrderDate = orderDate;
            }
          }
        });
      }
    });

    // Convert to array and calculate additional metrics
    let stats = Array.from(productMap.values()).map(product => {
      const daysSinceLastOrder = product.lastOrderDate 
        ? Math.floor((now - product.lastOrderDate) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...product,
        avgOrderValue: product.orderCount > 0 ? product.totalRevenue / product.orderCount : 0,
        profitMargin: product.price * 0.6, // Assuming 40% cost, 60% profit margin
        totalProfit: product.totalRevenue * 0.6,
        daysSinceLastOrder,
        performance: calculatePerformance(product.totalQuantitySold, daysSinceLastOrder, product.isAvailable)
      };
    });

    // Apply filters
    if (categoryFilter !== 'all') {
      stats = stats.filter(p => p.category === categoryFilter);
    }

    if (minSalesFilter > 0) {
      stats = stats.filter(p => p.totalQuantitySold >= minSalesFilter);
    }

    // Sort by selected criteria
    stats.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'quantity':
          return b.totalQuantitySold - a.totalQuantitySold;
        case 'profit':
          return b.totalProfit - a.totalProfit;
        default:
          return 0;
      }
    });

    setProductStats(stats);
  };

  const calculatePerformance = (quantitySold, daysSinceLastOrder, isAvailable) => {
    if (!isAvailable) return 'discontinued';
    if (quantitySold === 0) return 'no-sales';
    if (quantitySold >= 50) return 'best-seller';
    if (quantitySold >= 20) return 'good';
    if (quantitySold >= 10) return 'moderate';
    if (daysSinceLastOrder && daysSinceLastOrder > 30) return 'low-demand';
    return 'poor';
  };

  const getPerformanceColor = (performance) => {
    const colors = {
      'best-seller': 'bg-green-100 text-green-800 border-green-300',
      'good': 'bg-blue-100 text-blue-800 border-blue-300',
      'moderate': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'poor': 'bg-orange-100 text-orange-800 border-orange-300',
      'low-demand': 'bg-red-100 text-red-800 border-red-300',
      'no-sales': 'bg-gray-100 text-gray-800 border-gray-300',
      'discontinued': 'bg-gray-200 text-gray-600 border-gray-400'
    };
    return colors[performance] || 'bg-gray-100 text-gray-800';
  };

  const getPerformanceLabel = (performance) => {
    const labels = {
      'best-seller': 'Best Seller',
      'good': 'Good Sales',
      'moderate': 'Moderate',
      'poor': 'Poor Sales',
      'low-demand': 'Low Demand',
      'no-sales': 'No Sales',
      'discontinued': 'Discontinued'
    };
    return labels[performance] || 'Unknown';
  };

  const getBestSellers = () => {
    return productStats.filter(p => p.performance === 'best-seller' || p.performance === 'good');
  };

  const getLowPerformers = () => {
    return productStats.filter(p => 
      p.performance === 'poor' || 
      p.performance === 'low-demand' || 
      p.performance === 'no-sales'
    );
  };

  const exportBestSellersReport = (format) => {
    const bestSellers = getBestSellers();
    const dateRangeText = dateRange === 'all' ? 'All Time' : 
                         dateRange === 'custom' ? `${startDate || 'Start'} to ${endDate || 'End'}` :
                         `Last ${dateRange} Days`;

    if (format === 'pdf') {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(40);
      doc.text('Best Selling Products Report', 14, 20);
      
      // Subtitle
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Period: ${dateRangeText}`, 14, 28);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);
      
      // Summary Stats
      const totalRevenue = bestSellers.reduce((sum, p) => sum + p.totalRevenue, 0);
      const totalQuantity = bestSellers.reduce((sum, p) => sum + p.totalQuantitySold, 0);
      
      doc.setFontSize(10);
      doc.text(`Total Best Selling Products: ${bestSellers.length}`, 14, 42);
      doc.text(`Total Revenue: ₱${totalRevenue.toFixed(2)}`, 14, 48);
      doc.text(`Total Units Sold: ${totalQuantity}`, 14, 54);
      
      // Table
      const tableData = bestSellers.map(p => [
        p.name,
        p.category,
        `₱${p.price.toFixed(2)}`,
        p.totalQuantitySold,
        `₱${p.totalRevenue.toFixed(2)}`,
        `₱${p.totalProfit.toFixed(2)}`,
        getPerformanceLabel(p.performance)
      ]);
      
      doc.autoTable({
        startY: 60,
        head: [['Product', 'Category', 'Price', 'Units Sold', 'Revenue', 'Profit', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] },
        styles: { fontSize: 8 }
      });
      
      // Recommendations
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.text('Recommendations:', 14, finalY);
      
      doc.setFontSize(9);
      doc.setTextColor(60);
      const recommendations = [
        '✓ Maintain adequate stock levels for these high-performing products',
        '✓ Consider creating product bundles with best sellers',
        '✓ Monitor inventory closely to prevent stockouts',
        '✓ Analyze customer preferences for product development'
      ];
      
      recommendations.forEach((rec, index) => {
        doc.text(rec, 14, finalY + 8 + (index * 6));
      });
      
      doc.save(`Best_Sellers_Report_${Date.now()}.pdf`);
    } else {
      // CSV Export
      const headers = ['Product Name', 'Category', 'Price', 'Units Sold', 'Revenue', 'Profit', 'Avg Order Value', 'Performance'];
      const csvData = bestSellers.map(p => [
        p.name,
        p.category,
        p.price.toFixed(2),
        p.totalQuantitySold,
        p.totalRevenue.toFixed(2),
        p.totalProfit.toFixed(2),
        p.avgOrderValue.toFixed(2),
        getPerformanceLabel(p.performance)
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Best_Sellers_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportLowPerformersReport = (format) => {
    const lowPerformers = getLowPerformers();
    const dateRangeText = dateRange === 'all' ? 'All Time' : 
                         dateRange === 'custom' ? `${startDate || 'Start'} to ${endDate || 'End'}` :
                         `Last ${dateRange} Days`;

    if (format === 'pdf') {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(220, 38, 38);
      doc.text('Low Performing Products Report', 14, 20);
      
      // Subtitle
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Period: ${dateRangeText}`, 14, 28);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);
      
      // Summary Stats
      const totalRevenue = lowPerformers.reduce((sum, p) => sum + p.totalRevenue, 0);
      const totalQuantity = lowPerformers.reduce((sum, p) => sum + p.totalQuantitySold, 0);
      const noSalesCount = lowPerformers.filter(p => p.performance === 'no-sales').length;
      
      doc.setFontSize(10);
      doc.text(`Total Low Performing Products: ${lowPerformers.length}`, 14, 42);
      doc.text(`Products with No Sales: ${noSalesCount}`, 14, 48);
      doc.text(`Total Revenue: ₱${totalRevenue.toFixed(2)}`, 14, 54);
      doc.text(`Total Units Sold: ${totalQuantity}`, 14, 60);
      
      // Table
      const tableData = lowPerformers.map(p => [
        p.name,
        p.category,
        `₱${p.price.toFixed(2)}`,
        p.totalQuantitySold,
        `₱${p.totalRevenue.toFixed(2)}`,
        p.stock,
        p.daysSinceLastOrder ? `${p.daysSinceLastOrder}d` : 'Never',
        getPerformanceLabel(p.performance)
      ]);
      
      doc.autoTable({
        startY: 68,
        head: [['Product', 'Category', 'Price', 'Sold', 'Revenue', 'Stock', 'Last Sale', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] },
        styles: { fontSize: 8 }
      });
      
      // Recommendations
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setTextColor(220, 38, 38);
      doc.text('Recommendations:', 14, finalY);
      
      doc.setFontSize(9);
      doc.setTextColor(60);
      const recommendations = [
        '⚠ Consider discontinuing products with no sales',
        '⚠ Reduce stock levels for low-demand products',
        '⚠ Analyze pricing strategy for poor performers',
        '⚠ Evaluate if product marketing/placement needs improvement',
        '⚠ Consider seasonal factors before making decisions',
        '⚠ Bundle low performers with best sellers to move inventory'
      ];
      
      recommendations.forEach((rec, index) => {
        doc.text(rec, 14, finalY + 8 + (index * 6));
      });
      
      doc.save(`Low_Performers_Report_${Date.now()}.pdf`);
    } else {
      // CSV Export
      const headers = ['Product Name', 'Category', 'Price', 'Units Sold', 'Revenue', 'Current Stock', 'Days Since Last Sale', 'Performance'];
      const csvData = lowPerformers.map(p => [
        p.name,
        p.category,
        p.price.toFixed(2),
        p.totalQuantitySold,
        p.totalRevenue.toFixed(2),
        p.stock,
        p.daysSinceLastOrder || 'Never',
        getPerformanceLabel(p.performance)
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Low_Performers_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportAllProductsReport = (format) => {
    const dateRangeText = dateRange === 'all' ? 'All Time' : 
                         dateRange === 'custom' ? `${startDate || 'Start'} to ${endDate || 'End'}` :
                         `Last ${dateRange} Days`;

    if (format === 'pdf') {
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(18);
      doc.text('Complete Product Performance Report', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Period: ${dateRangeText} | Generated: ${new Date().toLocaleString()}`, 14, 28);
      
      const tableData = productStats.map(p => [
        p.name,
        p.category,
        `₱${p.price.toFixed(2)}`,
        p.totalQuantitySold,
        `₱${p.totalRevenue.toFixed(2)}`,
        `₱${p.totalProfit.toFixed(2)}`,
        p.stock,
        p.daysSinceLastOrder ? `${p.daysSinceLastOrder}d` : 'Never',
        getPerformanceLabel(p.performance)
      ]);
      
      doc.autoTable({
        startY: 35,
        head: [['Product', 'Category', 'Price', 'Sold', 'Revenue', 'Profit', 'Stock', 'Last Sale', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [120, 53, 15] },
        styles: { fontSize: 7 }
      });
      
      doc.save(`Complete_Product_Report_${Date.now()}.pdf`);
    } else {
      const headers = ['Product', 'Category', 'Price', 'Units Sold', 'Revenue', 'Profit', 'Stock', 'Last Sale', 'Performance'];
      const csvData = productStats.map(p => [
        p.name,
        p.category,
        p.price.toFixed(2),
        p.totalQuantitySold,
        p.totalRevenue.toFixed(2),
        p.totalProfit.toFixed(2),
        p.stock,
        p.daysSinceLastOrder || 'Never',
        getPerformanceLabel(p.performance)
      ]);
      
      const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', `All_Products_Report_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const categories = [...new Set(products.map(p => p.category))];
  const bestSellers = getBestSellers();
  const lowPerformers = getLowPerformers();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
          <p className="text-gray-600">Loading product analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2E1F1B] via-stone-700 to-[#5E4B43] px-4 md:px-8 pt-8 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[#EDEDE6] text-3xl md:text-4xl font-bold mb-2">Product Performance Analytics</h1>
            <p className="text-white/90">Analyze best sellers and identify low-performing products for better inventory management</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-white text-amber-600 rounded-lg hover:bg-gray-100 transition font-semibold"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/20 border border-white backdrop-blur-sm rounded-lg p-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Date Range Type */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  if (e.target.value !== 'custom') {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
                <option value="all">All Time</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Start Date - Only show when custom is selected */}
            {dateRange === 'custom' && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
            )}

            {/* End Date - Only show when custom is selected */}
            {dateRange === 'custom' && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
            )}

            {/* Category Filter */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <Filter className="inline w-4 h-4 mr-1" />
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <BarChart3 className="inline w-4 h-4 mr-1" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="revenue">Revenue</option>
                <option value="quantity">Quantity Sold</option>
                <option value="profit">Profit</option>
              </select>
            </div>

            {/* Min Sales Filter */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <Package className="inline w-4 h-4 mr-1" />
                Min Sales
              </label>
              <input
                type="number"
                value={minSalesFilter}
                onChange={(e) => setMinSalesFilter(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-8 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Best Sellers</p>
                <h3 className="text-2xl font-bold text-gray-800">{bestSellers.length}</h3>
                <p className="text-xs text-green-600">High demand products</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Low Performers</p>
                <h3 className="text-2xl font-bold text-gray-800">{lowPerformers.length}</h3>
                <p className="text-xs text-red-600">Needs attention</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <h3 className="text-2xl font-bold text-gray-800">{productStats.length}</h3>
                <p className="text-xs text-blue-600">In analysis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Best Sellers Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-white" size={28} />
                <div>
                  <h2 className="text-2xl font-bold text-white">Best Selling Products</h2>
                  <p className="text-white/90 text-sm">High-performing products to maintain stock</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => exportBestSellersReport('pdf')}
                  className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition font-semibold flex items-center gap-2"
                >
                  <Download size={18} />
                  PDF
                </button>
                <button
                  onClick={() => exportBestSellersReport('csv')}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-semibold flex items-center gap-2"
                >
                  <Download size={18} />
                  CSV
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {bestSellers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p>No best sellers found with current filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Price</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Units Sold</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Revenue</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Profit</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Stock</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bestSellers.map((product) => (
                      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {product.image && (
                              <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />
                            )}
                            <span className="font-medium text-gray-800">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{product.category}</td>
                        <td className="py-3 px-4 text-center text-gray-800">₱{product.price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center font-semibold text-green-600">{product.totalQuantitySold}</td>
                        <td className="py-3 px-4 text-center font-semibold text-gray-800">₱{product.totalRevenue.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center font-semibold text-green-600">₱{product.totalProfit.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            product.stock > 20 ? 'bg-green-100 text-green-700' :
                            product.stock > 5 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPerformanceColor(product.performance)}`}>
                            {getPerformanceLabel(product.performance)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Low Performers Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingDown className="text-white" size={28} />
                <div>
                  <h2 className="text-2xl font-bold text-white">Low Performing Products</h2>
                  <p className="text-white/90 text-sm">Products requiring action - reduce stock or discontinue</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => exportLowPerformersReport('pdf')}
                  className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-gray-100 transition font-semibold flex items-center gap-2"
                >
                  <Download size={18} />
                  PDF
                </button>
                <button
                  onClick={() => exportLowPerformersReport('csv')}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-semibold flex items-center gap-2"
                >
                  <Download size={18} />
                  CSV
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {lowPerformers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p>No low performers found with current filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Price</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Units Sold</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Revenue</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Stock</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Last Sale</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowPerformers.map((product) => (
                      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {product.image && (
                              <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />
                            )}
                            <span className="font-medium text-gray-800">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{product.category}</td>
                        <td className="py-3 px-4 text-center text-gray-800">₱{product.price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center font-semibold text-red-600">{product.totalQuantitySold}</td>
                        <td className="py-3 px-4 text-center text-gray-800">₱{product.totalRevenue.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            product.stock > 50 ? 'bg-red-100 text-red-700' :
                            product.stock > 20 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600 text-sm">
                          {product.daysSinceLastOrder ? `${product.daysSinceLastOrder} days ago` : 'Never'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPerformanceColor(product.performance)}`}>
                            {getPerformanceLabel(product.performance)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Export All Button */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Export Complete Report</h3>
              <p className="text-sm text-gray-600">Download a comprehensive report of all products with current filters</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => exportAllProductsReport('pdf')}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold flex items-center gap-2"
              >
                <Download size={18} />
                Export PDF
              </button>
              <button
                onClick={() => exportAllProductsReport('csv')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold flex items-center gap-2"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalytics;
