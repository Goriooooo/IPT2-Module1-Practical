import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ArrowLeft, Download, Calendar, Users, Clock, TrendingUp } from 'lucide-react';
import { SkeletonStats, SkeletonChart } from '../components/SkeletonLoaders';

export default function ReservationsAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [reservationsData, setReservationsData] = useState({
    totalReservations: 0,
    confirmedReservations: 0,
    cancelledReservations: 0,
    avgPartySize: 0,
    dailyReservations: [],
    reservationsByStatus: [],
    reservationsByTime: [],
    peakReservationTime: '',
    partySizeDistribution: []
  });

  useEffect(() => {
    fetchReservationsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchReservationsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('appToken');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const reservationsResponse = await axios.get('http://localhost:4000/api/reservations/admin/all', config);
      const reservations = reservationsResponse.data.data || [];

      const now = new Date();
      let startDate = new Date();
      switch(timeRange) {
        case '7days': startDate.setDate(now.getDate() - 7); break;
        case '30days': startDate.setDate(now.getDate() - 30); break;
        case '90days': startDate.setDate(now.getDate() - 90); break;
        case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
      }

      const filteredReservations = reservations.filter(res => {
        const resDate = new Date(res.createdAt);
        return resDate >= startDate;
      });

      // Calculate stats
      const totalReservations = filteredReservations.length;
      const confirmedReservations = filteredReservations.filter(r => r.status === 'confirmed').length;
      const cancelledReservations = filteredReservations.filter(r => r.status === 'cancelled').length;
      const totalGuests = filteredReservations.reduce((sum, r) => sum + (r.guests || 0), 0);
      const avgPartySize = totalReservations > 0 ? (totalGuests / totalReservations).toFixed(1) : 0;

      // Daily reservations
      const dailyResMap = {};
      filteredReservations.forEach(res => {
        const resDate = new Date(res.createdAt);
        const dateKey = resDate.toISOString().split('T')[0];
        const displayDate = resDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        if (!dailyResMap[dateKey]) {
          dailyResMap[dateKey] = { date: displayDate, dateKey, total: 0, confirmed: 0, cancelled: 0, pending: 0 };
        }
        dailyResMap[dateKey].total += 1;
        if (res.status === 'confirmed') dailyResMap[dateKey].confirmed += 1;
        if (res.status === 'cancelled') dailyResMap[dateKey].cancelled += 1;
        if (res.status === 'pending') dailyResMap[dateKey].pending += 1;
      });

      const dailyReservations = Object.values(dailyResMap)
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        .map(item => ({
          date: item.date,
          total: item.total,
          confirmed: item.confirmed,
          cancelled: item.cancelled,
          pending: item.pending
        }));

      // Reservations by status
      const statusCounts = {
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        completed: 0
      };

      filteredReservations.forEach(res => {
        if (Object.prototype.hasOwnProperty.call(statusCounts, res.status)) {
          statusCounts[res.status]++;
        }
      });

      const reservationsByStatus = Object.entries(statusCounts)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
          percentage: ((count / totalReservations) * 100).toFixed(1)
        }));

      // Reservations by time slot
      const timeSlots = [
        { slot: '8AM-10AM', start: 8, end: 10, count: 0 },
        { slot: '10AM-12PM', start: 10, end: 12, count: 0 },
        { slot: '12PM-2PM', start: 12, end: 14, count: 0 },
        { slot: '2PM-4PM', start: 14, end: 16, count: 0 },
        { slot: '4PM-6PM', start: 16, end: 18, count: 0 },
        { slot: '6PM-8PM', start: 18, end: 20, count: 0 },
        { slot: '8PM-10PM', start: 20, end: 22, count: 0 }
      ];

      filteredReservations.forEach(res => {
        if (res.time) {
          const hour = parseInt(res.time.split(':')[0]);
          const slot = timeSlots.find(s => hour >= s.start && hour < s.end);
          if (slot) slot.count += 1;
        }
      });

      const reservationsByTime = timeSlots.map(({ slot, count }) => ({ slot, count }));
      const peakSlot = timeSlots.reduce((max, curr) => curr.count > max.count ? curr : max);

      // Party size distribution
      const partySizeMap = {};
      filteredReservations.forEach(res => {
        const size = res.guests || 0;
        const category = size <= 2 ? '1-2' : size <= 4 ? '3-4' : size <= 6 ? '5-6' : '7+';
        partySizeMap[category] = (partySizeMap[category] || 0) + 1;
      });

      const partySizeDistribution = Object.entries(partySizeMap)
        .map(([size, count]) => ({ size, count }))
        .sort((a, b) => a.size.localeCompare(b.size));

      setReservationsData({
        totalReservations,
        confirmedReservations,
        cancelledReservations,
        avgPartySize,
        dailyReservations,
        reservationsByStatus,
        reservationsByTime,
        peakReservationTime: peakSlot.slot,
        partySizeDistribution
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching reservations data:', error);
      setLoading(false);
    }
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Reservations Analytics Report', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Period: ${timeRange} | Generated: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });

    doc.autoTable({
      startY: 30,
      head: [['Metric', 'Value']],
      body: [
        ['Total Reservations', reservationsData.totalReservations],
        ['Confirmed', reservationsData.confirmedReservations],
        ['Cancelled', reservationsData.cancelledReservations],
        ['Avg Party Size', reservationsData.avgPartySize],
        ['Peak Time', reservationsData.peakReservationTime]
      ],
      theme: 'grid',
      headStyles: { fillColor: [120, 53, 15] }
    });

    const statusData = reservationsData.reservationsByStatus.map(s => [
      s.name, s.value, `${s.percentage}%`
    ]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Status', 'Count', 'Percentage']],
      body: statusData,
      theme: 'grid',
      headStyles: { fillColor: [120, 53, 15] }
    });

    doc.save(`Reservations_Analytics_${timeRange}_${Date.now()}.pdf`);
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <SkeletonChart />
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
              <Calendar className="w-8 h-8 text-green-600" />
              Reservations Analytics
            </h1>
            <p className="text-gray-600 mt-1">Booking patterns and reservation insights</p>
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
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Reservations</p>
              <h3 className="text-2xl font-bold text-gray-900">{reservationsData.totalReservations}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <h3 className="text-2xl font-bold text-gray-900">{reservationsData.confirmedReservations}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Party Size</p>
              <h3 className="text-2xl font-bold text-gray-900">{reservationsData.avgPartySize}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Peak Time</p>
              <h3 className="text-xl font-bold text-gray-900">{reservationsData.peakReservationTime}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Reservations Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Reservations Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reservationsData.dailyReservations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="confirmed" stroke="#10b981" strokeWidth={2} name="Confirmed" />
              <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} name="Cancelled" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Reservations by Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reservationsData.reservationsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {reservationsData.reservationsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservations by Time */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Reservations by Time Slot</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reservationsData.reservationsByTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="slot" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="Reservations" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Party Size Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Party Size Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reservationsData.partySizeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="size" label={{ value: 'Guests', position: 'insideBottom', offset: -5 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8b5cf6" name="Reservations" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
