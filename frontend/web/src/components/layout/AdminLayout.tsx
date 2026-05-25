/**
 * Admin Layout Component
 * 
 * Main layout wrapper for admin dashboard:
 * - Sidebar navigation
 * - Top bar header
 * - Main content area
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAdminStore } from '../../store/admin.store';

export const AdminLayout: React.FC = () => {
  const { sidebarWidth } = useAdminStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Top Bar */}
      <TopBar />

      {/* Main Content */}
      <main
        className="pt-16 min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
