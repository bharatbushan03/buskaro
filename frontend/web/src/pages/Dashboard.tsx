/**
 * Dashboard Page
 * 
 * Main admin dashboard with:
 * - Stats overview cards
 * - Live bus map
 * - Recent activity feed
 * - Quick actions
 */

import React, { useEffect, useState } from 'react';
import { Users, Bus, Route, CreditCard, Activity, Plus, FileText, Bell, ChevronDown, UserPlus } from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { LiveMap } from '../components/dashboard/LiveMap';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { useAdminStore } from '../store/admin.store';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { systemStats, setSystemStats } = useAdminStore();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const navigate = useNavigate();

  // Load mock stats on mount
  useEffect(() => {
    setSystemStats({
      totalStudents: 1245,
      activeBuses: 8,
      tripsToday: 24,
      pendingPayments: 15,
      totalPickupsToday: 156,
      attendanceRate: 94,
    });
  }, [setSystemStats]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Action</span>
            <ChevronDown className="w-4 h-4 ml-1" />
          </button>
          
          {showQuickActions && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button 
                onClick={() => { setShowQuickActions(false); navigate('/admin/students'); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add New Student
              </button>
              <button 
                onClick={() => { setShowQuickActions(false); navigate('/admin/drivers'); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add New Driver
              </button>
              <button 
                onClick={() => { setShowQuickActions(false); navigate('/buses'); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Bus className="w-4 h-4" />
                Assign Bus
              </button>
              <hr className="my-1 border-gray-100" />
              <button 
                onClick={() => { setShowQuickActions(false); alert('Send notification modal pending...'); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Send Notification
              </button>
              <button 
                onClick={() => { setShowQuickActions(false); navigate('/analytics'); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          value={systemStats.totalStudents.toLocaleString()}
          label="Total Students"
          trend={{ value: 5.2, isPositive: true }}
          color="blue"
        />
        <StatCard
          icon={Bus}
          value={systemStats.activeBuses}
          label="Active Buses"
          trend={{ value: 1, isPositive: true }}
          color="green"
        />
        <StatCard
          icon={Route}
          value={systemStats.tripsToday}
          label="Trips Today"
          color="orange"
        />
        <StatCard
          icon={CreditCard}
          value={systemStats.pendingPayments}
          label="Pending Payments"
          trend={{ value: 2, isPositive: false }}
          color="red"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Map - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <LiveMap />
        </div>

        {/* Activity Feed - Takes up 1 column */}
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Pickups</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {systemStats.totalPickupsToday}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Success Rate</span>
              <span className="font-medium text-green-600">98.5%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {systemStats.attendanceRate}%
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">vs Last Week</span>
              <span className="font-medium text-green-600">+2.3%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Trip Time</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">42 min</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Route className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Efficiency</span>
              <span className="font-medium text-blue-600">Good</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
