import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, Edit2, Trash2, MoreVertical, Truck, Phone, MapPin } from 'lucide-react';
import axios from 'axios';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  busId?: string;
  busNumber?: string;
  routeId?: string;
  routeName?: string;
  status: 'ONLINE' | 'OFFLINE' | 'ON_TRIP' | 'ON_BREAK';
  currentLocation?: { lat: number; lng: number };
  rating: number;
  totalTrips: number;
  createdAt: string;
}

export const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchDrivers();
  }, [currentPage, statusFilter]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/admin/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 10,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: searchTerm || undefined,
        },
      });
      
      setDrivers(response.data.data.drivers || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch drivers');
      // Fallback demo data
      setDrivers([
        { id: '1', name: 'Rajesh Kumar', email: 'rajesh@buskaro.com', phone: '+91 9876543210', licenseNumber: 'DL-123456', busNumber: 'BUS-001', routeName: 'Route A', status: 'ON_TRIP', rating: 4.8, totalTrips: 156, createdAt: '2024-01-15' },
        { id: '2', name: 'Suresh Patel', email: 'suresh@buskaro.com', phone: '+91 9876543211', licenseNumber: 'DL-123457', busNumber: 'BUS-002', routeName: 'Route B', status: 'ONLINE', rating: 4.5, totalTrips: 98, createdAt: '2024-02-01' },
        { id: '3', name: 'Amit Singh', email: 'amit@buskaro.com', phone: '+91 9876543212', licenseNumber: 'DL-123458', status: 'OFFLINE', rating: 4.2, totalTrips: 45, createdAt: '2024-02-15' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchDrivers();
  };

  const toggleSelectAll = () => {
    if (selectedDrivers.length === drivers.length) {
      setSelectedDrivers([]);
    } else {
      setSelectedDrivers(drivers.map(d => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedDrivers(prev => 
      prev.includes(id) ? prev.filter(did => did !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-100 text-green-800';
      case 'OFFLINE': return 'bg-gray-100 text-gray-800';
      case 'ON_TRIP': return 'bg-blue-100 text-blue-800';
      case 'ON_BREAK': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers Management</h1>
          <p className="text-gray-500 mt-1">Manage drivers, assignments, and performance</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add Driver
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Drivers', value: drivers.length, icon: Truck },
          { label: 'Online', value: drivers.filter(d => d.status === 'ONLINE').length, icon: Truck },
          { label: 'On Trip', value: drivers.filter(d => d.status === 'ON_TRIP').length, icon: MapPin },
          { label: 'On Break', value: drivers.filter(d => d.status === 'ON_BREAK').length, icon: Truck },
          { label: 'Offline', value: drivers.filter(d => d.status === 'OFFLINE').length, icon: Truck },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 text-blue-600 opacity-50" />
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
            placeholder="Search drivers by name, email, license..."
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
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="ON_BREAK">On Break</option>
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
            <p className="text-gray-500">Loading drivers...</p>
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
                        checked={selectedDrivers.length === drivers.length && drivers.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus & Route</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trips</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {drivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedDrivers.includes(driver.id)}
                          onChange={() => toggleSelect(driver.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Truck className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{driver.name}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone className="w-3 h-3" />
                              {driver.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{driver.licenseNumber}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{driver.busNumber || 'No bus'}</p>
                          <p className="text-gray-500">{driver.routeName || 'No route'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(driver.status)}`}>
                          {driver.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">{driver.rating}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{driver.totalTrips}</td>
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

            {/* Pagination */}
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing {drivers.length} drivers
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Drivers;
