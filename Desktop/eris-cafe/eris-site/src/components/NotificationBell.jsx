import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { Bell, X, CheckCheck, Trash2 } from 'lucide-react';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'text-green-600',
      cancelled: 'text-red-600',
      completed: 'text-blue-600',
      preparing: 'text-orange-600',
      ready: 'text-purple-600',
      pending: 'text-yellow-600',
      'no-show': 'text-gray-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    setShowDropdown(false);
    
    if (notification.type === 'order') {
      navigate('/orders');
    } else if (notification.type === 'reservation') {
      navigate('/orders');
    }
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    if (confirm('Clear all notifications?')) {
      clearAll();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-700 hover:text-amber-600 transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-white" />
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
              </div>
              {unreadCount > 0 && (
                <span className="text-xs bg-white text-amber-600 px-2 py-1 rounded-full font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs mt-1">You'll be notified when your order or reservation status changes</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        !notification.read ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${getStatusColor(notification.status)}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
                            ? new Date(notification.createdAt).toLocaleString()
                            : 'Unknown date'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Actions */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className="flex-1 text-xs text-blue-600 hover:text-blue-700 font-semibold py-2 flex items-center justify-center gap-1"
                  >
                    <CheckCheck size={14} />
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  className="flex-1 text-xs text-red-600 hover:text-red-700 font-semibold py-2 flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} />
                  Clear all
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
