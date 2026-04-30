import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, Edit2, Trash2, MoreVertical, Bus, Users, Route, Gauge } from 'lucide-react';
import axios from 'axios';

interface Bus {
  id: string;
  number: string;
  model: string;
  capacity: number;
  driverId?: string;
  driverName?: string;
  routeId?: string;
  routeName?: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'ON_ROUTE';
  fuelLevel?: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  totalKm: number;
  createdAt: string;
}

export const Buses: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBuses, setSelectedBuses] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchBuses();
  }, [currentPage, statusFilter]);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/admin/buses`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 10,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: searchTerm || undefined,
        },
      });
      
      setBuses(response.data.data.buses || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch buses');
      // Fallback demo data
      setBuses([
        { id: '1', number: 'BUS-001', model: 'Tata Starbus', capacity: 52, driverName: 'Rajesh Kumar', routeName: 'Route A', status: 'ON_ROUTE', fuelLevel: 78, totalKm: 45230, lastMaintenance: '2024-03-15', nextMaintenance: '2024-04-15', createdAt: '2023-01-10' },
        { id: '2', number: 'BUS-002', model: 'Ashok Leyland', capacity: 48, driverName: 'Suresh Patel', routeName: 'Route B', status: 'ACTIVE', fuelLevel: 92, totalKm: 32150, lastMaintenance: '2024-03-20', nextMaintenance: '2024-04-20', createdAt: '2023-02-15' },
        { id: '3', number: 'BUS-003', model: 'Volvo 8400', capacity: 60, status: 'MAINTENANCE', fuelLevel: 45, totalKm: 28900, lastMaintenance: '2024-03-01', nextMaintenance: '2024-04-01', createdAt: '2023-03-20' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchBuses();
  };

  const toggleSelectAll = () => {
    if (selectedBuses.length === buses.length) {
      setSelectedBuses([]);
    } else {
      setSelectedBuses(buses.map(b => b.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedBuses(prev => 
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'ON_ROUTE': return 'bg-blue-100 text-blue-800';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFuelColor = (level?: number) => {
    if (!level) return 'bg-gray-200';
    if (level > 70) return 'bg-green-500';
    if (level > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-500 mt-1">Manage buses, maintenance, and assignments</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add Bus
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Buses', value: buses.length, icon: Bus, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Active', value: buses.filter(b => b.status === 'ACTIVE' || b.status === 'ON_ROUTE').length, icon: Bus, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'In Maintenance', value: buses.filter(b => b.status === 'MAINTENANCE').length, icon: Gauge, color: 'text-yellow-600', bg: 'bg-yellow-100' },
          { label: 'Total Capacity', value: buses.reduce((acc, b) => acc + b.capacity, 0), icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
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
            placeholder="Search by bus number, model, driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
          <option value="ON_ROUTE">On Route</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading buses...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedBuses.length === buses.length && buses.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus Details</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver & Route</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fuel</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maintenance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total KM</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {buses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedBuses.includes(bus.id)}
                          onChange={() => toggleSelect(bus.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Bus className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{bus.number}</p>
                            <p className="text-sm text-gray-500">{bus.model} • {bus.capacity} seats</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{bus.driverName || 'No driver'}</p>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Route className="w-3 h-3" />
                            {bus.routeName || 'No route'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bus.status)}`}>
                          {bus.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full max-w-[100px]">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{bus.fuelLevel || 0}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getFuelColor(bus.fuelLevel)} transition-all`}
                              style={{ width: `${bus.fuelLevel || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p className="text-gray-700">Last: {bus.lastMaintenance ? new Date(bus.lastMaintenance).toLocaleDateString() : 'N/A'}</p>
                        <p className="text-gray-500">Next: {bus.nextMaintenance ? new Date(bus.nextMaintenance).toLocaleDateString() : 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {bus.totalKm.toLocaleString()} km
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-1 hover:bg-red-50 rounded text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Buses;
