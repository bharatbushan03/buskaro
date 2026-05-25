/**
 * Sidebar Component
 * 
 * Navigation sidebar with menu items:
 * - Dashboard
 * - Students
 * - Drivers
 * - Buses
 * - Routes
 * - Payments
 * - Analytics
 */

import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  Bus, 
  MapPin, 
  CreditCard, 
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';
import { useAdminStore } from '../../store/admin.store';
import { SystemSettingsModal } from '../modals/SystemSettingsModal';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const menuItems: MenuItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/students', label: 'Students', icon: Users },
  { path: '/drivers', label: 'Drivers', icon: UserCircle },
  { path: '/buses', label: 'Buses', icon: Bus },
  { path: '/routes', label: 'Routes', icon: MapPin },
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar, sidebarWidth, setSidebarWidth } = useAdminStore();
  const [isResizing, setIsResizing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(80, Math.min(mouseMoveEvent.clientX, 400));
      setSidebarWidth(newWidth);
    }
  }, [isResizing, setSidebarWidth]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <>
    <aside
      className="fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 flex"
      style={{ width: sidebarWidth, transition: isResizing ? 'none' : 'width 0.3s ease-in-out' }}
    >
      <div className="flex-1 overflow-hidden flex flex-col h-full relative">
        {/* Logo */}
        <div className="h-16 flex justify-start items-center px-6 border-b border-gray-200 shrink-0">
          <Bus className="w-8 h-8 text-blue-600 shrink-0" />
          {sidebarWidth > 150 && (
            <span className="ml-3 text-xl font-bold text-gray-900 whitespace-nowrap">BusKaro</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-3 mb-1 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {sidebarWidth > 150 && (
                <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-200 shrink-0">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center px-3 py-3 mb-1 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Settings className="w-5 h-5 shrink-0" />
            {sidebarWidth > 150 && <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">Settings</span>}
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarWidth > 150 && <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">Logout</span>}
          </button>
        </div>
      </div>

      {/* Resize Handle */}
      <div 
        className="w-1.5 cursor-col-resize hover:bg-blue-400 bg-transparent h-full absolute right-0 top-0 transition-colors"
        onMouseDown={startResizing}
      />
    </aside>
    {<SystemSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
};

export default Sidebar;
