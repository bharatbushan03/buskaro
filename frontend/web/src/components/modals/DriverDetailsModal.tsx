import React from 'react';
import { X, User, Mail, Phone, CreditCard, MapPin, Calendar, Star, Bus, Route, Clock, CheckCircle } from 'lucide-react';
import { DriverDetails } from '../../types/driver';
import { StatusBadge } from '../common/StatusBadge';

interface DriverDetailsModalProps {
  driver: DriverDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DriverDetailsModal: React.FC<DriverDetailsModalProps> = ({
  driver,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !driver) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-50';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50';
      case 'CANCELLED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xl font-semibold">
              {driver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{driver.name}</h2>
              <p className="text-gray-500">{driver.licenseNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Driver Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{driver.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{driver.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">License Expiry</p>
                  <p className="text-sm font-medium text-gray-900">
                    {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(driver.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Status</span>
                </div>
                <StatusBadge status={driver.status} />
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Rating</span>
                </div>
                <span className="text-lg font-bold text-blue-900">
                  {driver.rating || 0} / 5.0
                </span>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Bus className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Total Trips</span>
                </div>
                <span className="text-lg font-bold text-purple-900">
                  {driver.totalTrips || 0}
                </span>
              </div>
            </div>

            {/* Current Assignment */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Bus className="w-4 h-4" />
                Current Assignment
              </h3>
              {driver.busId ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">Bus:</span>
                    <span className="font-medium text-blue-900">{driver.busNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">Bus Status:</span>
                    <StatusBadge status={driver.busStatus || 'ACTIVE'} />
                  </div>
                  {driver.routeName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700">Route:</span>
                      <span className="font-medium text-blue-900">{driver.routeName}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-blue-600">Not assigned to any bus</p>
              )}
            </div>

            {/* Recent Trips */}
            {driver.trips && driver.trips.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Route className="w-4 h-4" />
                  Recent Trips
                </h3>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Route</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Passengers</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {driver.trips.slice(0, 5).map((trip) => (
                        <tr key={trip.id}>
                          <td className="px-4 py-2 text-gray-900">
                            {new Date(trip.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-gray-900">{trip.routeName}</td>
                          <td className="px-4 py-2 text-gray-900">{trip.passengers}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                              {trip.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {driver.recentActivity && driver.recentActivity.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Activity
                </h3>
                <div className="space-y-2">
                  {driver.recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.timestamp} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDetailsModal;
