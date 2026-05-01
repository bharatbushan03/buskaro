import React from 'react';
import { X, Bus, MapPin, User, Calendar, Clock, CheckCircle, Route, Navigation, History } from 'lucide-react';
import { BusDetails } from '../../types/bus';
import { StatusBadge } from '../common/StatusBadge';

interface BusDetailsModalProps {
  bus: BusDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BusDetailsModal: React.FC<BusDetailsModalProps> = ({
  bus,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !bus) return null;

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
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
              <Bus className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{bus.number}</h2>
              <p className="text-gray-500">{bus.model}</p>
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
            {/* Bus Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Capacity</p>
                  <p className="text-sm font-medium text-gray-900">{bus.capacity} seats</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Added</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(bus.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Current Status</span>
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge status={bus.status} />
                {bus.lastUpdated && (
                  <span className="text-xs text-blue-600">
                    Updated: {new Date(bus.lastUpdated).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Current Assignment */}
            <div className="grid grid-cols-2 gap-4">
              {bus.route && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Route className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Assigned Route</span>
                  </div>
                  <p className="font-medium text-green-900">{bus.route.name}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-green-700">
                    <span>{bus.route.stops} stops</span>
                    <span>•</span>
                    <span>{bus.route.distance} km</span>
                    <span>•</span>
                    <span>{bus.route.estimatedTime} min</span>
                  </div>
                </div>
              )}

              {bus.driver && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Assigned Driver</span>
                  </div>
                  <p className="font-medium text-purple-900">{bus.driver.name}</p>
                  <div className="text-xs text-purple-700 mt-1">
                    {bus.driver.licenseNumber}
                  </div>
                </div>
              )}
            </div>

            {/* Last Location */}
            {bus.lastLocation && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Last Known Location</span>
                </div>
                <p className="text-sm text-amber-900">{bus.lastLocation.address || 'Unknown location'}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-amber-700">
                  <Navigation className="w-3 h-3" />
                  <span>Lat: {bus.lastLocation.lat.toFixed(4)}, Lng: {bus.lastLocation.lng.toFixed(4)}</span>
                </div>
              </div>
            )}

            {/* Recent Trips */}
            {bus.recentTrips && bus.recentTrips.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
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
                      {bus.recentTrips.slice(0, 5).map((trip) => (
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

            {/* Location History */}
            {bus.locationHistory && bus.locationHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Location History
                </h3>
                <div className="space-y-2">
                  {bus.locationHistory.slice(0, 5).map((loc, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{loc.address || 'Unknown location'}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>Lat: {loc.lat.toFixed(4)}, Lng: {loc.lng.toFixed(4)}</span>
                          <span>•</span>
                          <span>{new Date(loc.timestamp).toLocaleString()}</span>
                        </div>
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

export default BusDetailsModal;
