import React, { useState } from 'react';
import { Search, Eye } from 'lucide-react';

const OrdersPage = () => {
  const [orders] = useState([
    { 
      id: '#12345', 
      customer: 'John Doe', 
      items: 3,
      amount: '$45.99', 
      status: 'Completed', 
      date: '2025-10-10',
      time: '10:30 AM'
    },
    { 
      id: '#12346', 
      customer: 'Jane Smith', 
      items: 2,
      amount: '$32.50', 
      status: 'Processing', 
      date: '2025-10-10',
      time: '11:15 AM'
    },
    { 
      id: '#12347', 
      customer: 'Bob Johnson', 
      items: 5,
      amount: '$78.25', 
      status: 'Pending', 
      date: '2025-10-09',
      time: '2:45 PM'
    },
    { 
      id: '#12348', 
      customer: 'Alice Brown', 
      items: 4,
      amount: '$55.00', 
      status: 'Completed', 
      date: '2025-10-09',
      time: '4:20 PM'
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-800">Orders Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Items</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date & Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{order.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{order.customer}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{order.items} items</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{order.amount}</td>
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
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="text-gray-800">{order.date}</div>
                      <div className="text-gray-500 text-xs">{order.time}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
