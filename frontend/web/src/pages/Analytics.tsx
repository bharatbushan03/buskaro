import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Bus, MapPin, DollarSign, 
  Calendar, Download, ArrowUp, ArrowDown, Activity
} from 'lucide-react';
import axios from 'axios';

// Simple bar chart component
const SimpleBarChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="w-24 text-sm text-gray-600">{item.label}</span>
          <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
            <div 
              className="h-full rounded-lg transition-all duration-500"
              style={{ 
                width: `${(item.value / maxValue) * 100}%`, 
                backgroundColor: item.color 
              }}
            />
          </div>
          <span className="w-12 text-sm font-medium text-gray-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

// Simple line chart component (visual only)
const SimpleLineChart: React.FC = () => {
  return (
    <div className="h-48 bg-gradient-to-b from-blue-50 to-white rounded-lg border border-gray-200 p-4 relative">
      <svg className="w-full h-full" viewBox="0 0 400 150">
        {/* Grid lines */}
        <line x1="0" y1="37.5" x2="400" y2="37.5" stroke="#e5e7eb" strokeDasharray="4" />
        <line x1="0" y1="75" x2="400" y2="75" stroke="#e5e7eb" strokeDasharray="4" />
        <line x1="0" y1="112.5" x2="400" y2="112.5" stroke="#e5e7eb" strokeDasharray="4" />
        
        {/* Line path */}
        <path
          d="M 0 112.5 L 50 90 L 100 100 L 150 60 L 200 75 L 250 30 L 300 45 L 350 20 L 400 15"
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Area fill */}
        <path
          d="M 0 112.5 L 50 90 L 100 100 L 150 60 L 200 75 L 250 30 L 300 45 L 350 20 L 400 15 L 400 150 L 0 150 Z"
          fill="url(#gradient)"
          opacity="0.2"
        />
        
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Data points */}
        <circle cx="0" cy="112.5" r="4" fill="#2563eb" />
        <circle cx="50" cy="90" r="4" fill="#2563eb" />
        <circle cx="100" cy="100" r="4" fill="#2563eb" />
        <circle cx="150" cy="60" r="4" fill="#2563eb" />
        <circle cx="200" cy="75" r="4" fill="#2563eb" />
        <circle cx="250" cy="30" r="4" fill="#2563eb" />
        <circle cx="300" cy="45" r="4" fill="#2563eb" />
        <circle cx="350" cy="20" r="4" fill="#2563eb" />
        <circle cx="400" cy="15" r="4" fill="#2563eb" />
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
        <span>Jul</span>
        <span>Aug</span>
        <span>Sep</span>
      </div>
    </div>
  );
};

// Pie chart component
const SimplePieChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  let currentAngle = 0;
  
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-32 h-32">
        {data.map((item, idx) => {
          const angle = (item.value / total) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;
          
          const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
          const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
          const x2 = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180);
          const y2 = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180);
          
          const largeArc = angle > 180 ? 1 : 0;
          
          return (
            <path
              key={idx}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={item.color}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
      </svg>
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-gray-600">{item.label}</span>
            <span className="text-sm font-medium">{((item.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Sample data
  const monthlyRevenue = [
    { label: 'Jan', value: 45000, color: '#3b82f6' },
    { label: 'Feb', value: 52000, color: '#3b82f6' },
    { label: 'Mar', value: 48000, color: '#3b82f6' },
    { label: 'Apr', value: 61000, color: '#3b82f6' },
    { label: 'May', value: 58000, color: '#3b82f6' },
    { label: 'Jun', value: 72000, color: '#3b82f6' },
  ];

  const routeUsage = [
    { label: 'Route A', value: 3420, color: '#10b981' },
    { label: 'Route B', value: 2890, color: '#3b82f6' },
    { label: 'Route C', value: 2150, color: '#f59e0b' },
    { label: 'Route D', value: 1800, color: '#ef4444' },
    { label: 'Route E', value: 1200, color: '#8b5cf6' },
  ];

  const paymentMethods = [
    { label: 'UPI', value: 65, color: '#3b82f6' },
    { label: 'Card', value: 25, color: '#10b981' },
    { label: 'Net Banking', value: 10, color: '#f59e0b' },
  ];

  const kpiData = [
    { 
      label: 'Total Revenue', 
      value: '₹6,45,000', 
      change: '+12.5%', 
      trend: 'up',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600'
    },
    { 
      label: 'Active Students', 
      value: '2,847', 
      change: '+8.2%', 
      trend: 'up',
      icon: Users,
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      label: 'Trips Completed', 
      value: '15,234', 
      change: '+15.3%', 
      trend: 'up',
      icon: Bus,
      color: 'bg-purple-100 text-purple-600'
    },
    { 
      label: 'Avg. Trip Time', 
      value: '42 min', 
      change: '-5.2%', 
      trend: 'down',
      icon: Activity,
      color: 'bg-orange-100 text-orange-600'
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 3 Months</option>
            <option value="1y">Last Year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                {kpi.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-sm text-gray-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Revenue Trend
            </h3>
            <span className="text-sm text-green-600 font-medium">+18% vs last month</span>
          </div>
          <SimpleLineChart />
        </div>

        {/* Route Usage */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Top Routes by Usage
            </h3>
            <span className="text-sm text-gray-500">Total: 11,460 trips</span>
          </div>
          <SimpleBarChart data={routeUsage} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Payment Methods
          </h3>
          <SimplePieChart data={paymentMethods} />
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Monthly Revenue Comparison
          </h3>
          <SimpleBarChart data={monthlyRevenue} />
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700">Apr 28, 2024</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">New Student Registration</td>
                <td className="px-4 py-3 text-sm text-gray-600">15 students enrolled</td>
                <td className="px-4 py-3"><span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700">Apr 27, 2024</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Payment Received</td>
                <td className="px-4 py-3 text-sm text-gray-600">₹45,000 from 30 students</td>
                <td className="px-4 py-3"><span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700">Apr 26, 2024</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Route Optimization</td>
                <td className="px-4 py-3 text-sm text-gray-600">Route C updated - 15% faster</td>
                <td className="px-4 py-3"><span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Active</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700">Apr 25, 2024</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Maintenance Alert</td>
                <td className="px-4 py-3 text-sm text-gray-600">Bus 003 scheduled maintenance</td>
                <td className="px-4 py-3"><span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
