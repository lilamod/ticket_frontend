'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { markAsRead } from '../store/notificationsSlice';
import type { RootState, AppDispatch } from '../store';
import type { Notification } from '../types';

const Notifications = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications } = useSelector((state: RootState) => state.notifications);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
   
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAuthenticated]);

  useEffect(() => {
    const unread = notifications.filter((n: Notification) => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const handleMarkRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  const handleLogout = () => {
    dispatch(logout());
    setShowDropdown(false);
  };


  return (
    <div className="relative mb-4" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-3 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full h-6 w-6 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto border border-gray-200"
          style={{
            zIndex: 10000,
            opacity: 1,
            transform: 'scale(1)',
          }}
        >
          <div className="p-4 border-b border-gray-200">
            <h4 className="ml-2 text-lg font-bold text-gray-800">Activity Feed</h4>
            <p className="ml-2 text-xs text-gray-600">Updates for active users only</p>
          </div>

          <div className="p-4">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-sm">No notifications yet.</p>
            ) : (
              notifications.slice().reverse().map((notif: Notification) => (
                <div
                  key={notif.id}
                  className={`p-4 mb-3 rounded-md border-l-4 transition-all duration-300 ease-in-out hover:shadow-md ${
                    !notif.read ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium">{notif.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(notif.timestamp).toLocaleString()}
                  </p>
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="text-xs text-blue-600 hover:underline mt-2"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleLogout}
              className="w-full text-left text-sm text-red-600 hover:text-red-800 py-2 rounded-md hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
