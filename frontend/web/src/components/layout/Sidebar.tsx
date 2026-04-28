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

import React from 'react';
import { NavLink } from 'react-router-dom';
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
  const { sidebarOpen, toggleSidebar } = useAdminStore();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Bus className="w-8 h-8 text-blue-600" />
        {sidebarOpen && (
          <span className="ml-3 text-xl font-bold text-gray-900">BusKaro</span>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition-colors"
      >
        {sidebarOpen ? '‹' : '›'}
      </button>

      {/* Navigation */}
      <nav className="mt-6 px-3">
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
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <span className="ml-3 text-sm font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200">
        <NavLink
          to="/settings"
          className="flex items-center px-3 py-3 mb-1 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="ml-3 text-sm font-medium">Settings</span>}
        </NavLink>
        <button className="w-full flex items-center px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="ml-3 text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
