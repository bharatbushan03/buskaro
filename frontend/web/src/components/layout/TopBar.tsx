/**
 * TopBar Component
 * 
 * Admin dashboard header with:
 * - Page title
 * - Notifications
 * - Admin profile
 * - System status indicator
 */

import React, { useState } from 'react';
import { Bell, User, ChevronDown, Circle } from 'lucide-react';
import { useAdminStore } from '../../store/admin.store';
import { ProfileSettingsModal } from '../modals/ProfileSettingsModal';
import { SystemSettingsModal } from '../modals/SystemSettingsModal';

export const TopBar: React.FC = () => {
  const { sidebarOpen, systemStats } = useAdminStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);

  // Mock notifications
  const notifications = [
    { id: 1, message: 'New pickup request from Student #123', time: '2 min ago', unread: true },
    { id: 2, message: 'Bus BK-101 started trip', time: '5 min ago', unread: true },
    { id: 3, message: 'Payment received from John Doe', time: '10 min ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40 transition-all duration-300 ${
        sidebarOpen ? 'left-64' : 'left-20'
      }`}
    >
      {/* Left - Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Manage your fleet and monitor operations</p>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-4">
        {/* System Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
          <Circle className="w-2 h-2 fill-green-500 text-green-500" />
          <span className="text-sm font-medium text-green-700">System Online</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
              </div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                    notification.unread ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                </div>
              ))}
              <div className="px-4 py-2 border-t border-gray-100 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
              <button 
                onClick={() => { setShowProfileMenu(false); setIsProfileModalOpen(true); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Profile Settings
              </button>
              <button 
                onClick={() => { setShowProfileMenu(false); setIsSystemModalOpen(true); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                System Settings
              </button>
              <hr className="my-1 border-gray-100" />
              <button 
                onClick={() => { setShowProfileMenu(false); alert('Logout logic pending...'); }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Settings Modals */}
      <ProfileSettingsModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
      <SystemSettingsModal 
        isOpen={isSystemModalOpen} 
        onClose={() => setIsSystemModalOpen(false)} 
      />
    </header>
  );
};

export default TopBar;
