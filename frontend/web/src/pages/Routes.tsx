import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, MoreVertical, MapPin, Clock, Users, Bus } from 'lucide-react';
import axios from 'axios';

interface Route {
  id: string;
  name: string;
  code: string;
  startPoint: string;
  endPoint: string;
  distance: number;
  estimatedTime: number;
  stops: number;
  assignedBus?: string;
  assignedDriver?: string;
  activeStudents: number;
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_REVIEW';
  schedule: {
    morning: string;
    evening: string;
  };
  createdAt: string;
}

export const Routes: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchRoutes();
  }, [statusFilter]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/admin/routes`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: searchTerm || undefined,
        },
      });
      
      setRoutes(response.data.data.routes || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch routes');
      setRoutes([
        { id: '1', name: 'City Center - University', code: 'RT-001', startPoint: 'City Center', endPoint: 'University Campus', distance: 12.5, estimatedTime: 45, stops: 8, assignedBus: 'BUS-001', assignedDriver: 'Rajesh Kumar', activeStudents: 156, status: 'ACTIVE', schedule: { morning: '08:00 AM', evening: '05:30 PM' }, createdAt: '2024-01-10' },
        { id: '2', name: 'North Zone - Campus', code: 'RT-002', startPoint: 'North Zone', endPoint: 'University Campus', distance: 18.2, estimatedTime: 60, stops: 12, assignedBus: 'BUS-002', assignedDriver: 'Suresh Patel', activeStudents: 98, status: 'ACTIVE', schedule: { morning: '07:45 AM', evening: '05:45 PM' }, createdAt: '2024-01-15' },
        { id: '3', name: 'South Zone - Campus', code: 'RT-003', startPoint: 'South Zone', endPoint: 'University Campus', distance: 15.0, estimatedTime: 50, stops: 10, activeStudents: 0, status: 'INACTIVE', schedule: { morning: '08:15 AM', evening: '05:15 PM' }, createdAt: '2024-02-01' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRoutes.length === routes.length) {
      setSelectedRoutes([]);
    } else {
      setSelectedRoutes(routes.map(r => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedRoutes(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Management</h1>
          <p className="text-gray-500 mt-1">Manage bus routes, stops, and schedules</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Create Route
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Routes', value: routes.length, icon: MapPin },
          { label: 'Active Routes', value: routes.filter(r => r.status === 'ACTIVE').length, icon: MapPin },
          { label: 'Total Stops', value: routes.reduce((acc, r) => acc + r.stops, 0), icon: MapPin },
          { label: 'Active Students', value: routes.reduce((acc, r) => acc + r.activeStudents, 0), icon: Users },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search routes by name, code, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="UNDER_REVIEW">Under Review</option>
        </select>
        <button
          onClick={fetchRoutes}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading routes...</p>
          </div>
        ) : (
          routes.map((route) => (
            <div key={route.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedRoutes.includes(route.id)}
                    onChange={() => toggleSelect(route.id)}
                    className="rounded border-gray-300"
                  />
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{route.name}</h3>
                    <p className="text-sm text-gray-500">{route.code}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(route.status)}`}>
                  {route.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {route.startPoint} → {route.endPoint}
                  </span>
                  <span className="font-medium">{route.distance} km</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Est. Time
                  </span>
                  <span className="font-medium">{route.estimatedTime} min</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Total Stops
                  </span>
                  <span className="font-medium">{route.stops}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Active Students
                  </span>
                  <span className="font-medium">{route.activeStudents}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Bus className="w-4 h-4" />
                    Assigned Bus
                  </span>
                  <span className="font-medium">{route.assignedBus || 'Not assigned'}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Morning Departure</p>
                    <p className="font-semibold text-gray-900">{route.schedule.morning}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Evening Departure</p>
                    <p className="font-semibold text-gray-900">{route.schedule.evening}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Routes;
