/**
 * ActivityFeed Component
 * 
 * Real-time activity feed showing:
 * - Trip started/ended
 * - Pickup requests
 * - Payments
 * - System alerts
 */

import React from 'react';
import { 
  Play, 
  Flag, 
  MapPin, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAdminStore } from '../../store/admin.store';

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'trip_started':
      return { icon: Play, color: 'text-green-600', bg: 'bg-green-100' };
    case 'trip_ended':
      return { icon: Flag, color: 'text-blue-600', bg: 'bg-blue-100' };
    case 'pickup_request':
      return { icon: MapPin, color: 'text-orange-600', bg: 'bg-orange-100' };
    case 'payment':
      return { icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-100' };
    case 'alert':
      return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' };
    default:
      return { icon: CheckCircle, color: 'text-gray-600', bg: 'bg-gray-100' };
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return new Date(date).toLocaleDateString();
};

export const ActivityFeed: React.FC = () => {
  const { recentActivity, addActivity } = useAdminStore();

  // Mock activities if empty
  const activities = recentActivity.length > 0 ? recentActivity : [
    {
      id: '1',
      type: 'trip_started',
      message: 'Bus BK-101 started trip on Route A',
      timestamp: new Date(Date.now() - 5 * 60000),
    },
    {
      id: '2',
      type: 'pickup_request',
      message: 'New pickup request from Student #1234',
      timestamp: new Date(Date.now() - 15 * 60000),
    },
    {
      id: '3',
      type: 'payment',
      message: 'Payment received ₹2,500 from John Doe',
      timestamp: new Date(Date.now() - 30 * 60000),
    },
    {
      id: '4',
      type: 'trip_ended',
      message: 'Bus BK-102 completed trip on Route B',
      timestamp: new Date(Date.now() - 45 * 60000),
    },
    {
      id: '5',
      type: 'alert',
      message: 'Bus BK-103 running 15 min behind schedule',
      timestamp: new Date(Date.now() - 60 * 60000),
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-500 mt-1">
          Real-time updates from fleet operations
        </p>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {activities.map((activity) => {
          const { icon: Icon, color, bg } = getActivityIcon(activity.type);
          
          return (
            <div
              key={activity.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${bg} flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 py-3 border-t border-gray-200 text-center">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all activity
        </button>
      </div>
    </div>
  );
};

export default ActivityFeed;
