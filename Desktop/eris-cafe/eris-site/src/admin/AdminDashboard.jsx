import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const menuItems = [ 
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/products', label: 'Products', icon: ShoppingBag },
    { path: '/admin/orders', label: 'Orders', icon: FileText },
    { path: '/admin/pos', label: 'Customers', icon: Users },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed inset-y-0 left-0 z-50 w-64 bg-charcoal text-white transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold font-playfair">Eris Admin</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200
                  ${isActive(item.path) 
                    ? 'bg-coffee text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button className="flex items-center space-x-3 px-4 py-3 w-full text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors duration-200">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu size={24} />
            </button>
            <div className="flex-1 lg:ml-0 ml-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">Admin User</p>
                <p className="text-xs text-gray-500">admin@eriscafe.com</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-coffee text-white flex items-center justify-center">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
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
