/**
 * LiveMap Component
 * 
 * Real-time map showing all buses with:
 * - Live location markers
 * - Route overlays
 * - Status color coding
 * - Socket.IO integration for updates
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { useAdminStore, BusLocation } from '../../store/admin.store';

// Mock map component - in production, use Mapbox or Google Maps
export const LiveMap: React.FC = () => {
  const { liveBuses, selectedBusId, setSelectedBusId, updateBusLocation, addActivity } = useAdminStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(true);

  // Simulate socket connection for live updates
  useEffect(() => {
    // In production, this would be actual Socket.IO
    const interval = setInterval(() => {
      // Simulate random bus movement
      liveBuses.forEach((bus) => {
        if (bus.status === 'IN_SERVICE') {
          const lat = bus.lat + (Math.random() - 0.5) * 0.001;
          const lng = bus.lng + (Math.random() - 0.5) * 0.001;
          updateBusLocation(bus.id, { lat, lng });
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [liveBuses, updateBusLocation]);

  // Mock initial buses
  useEffect(() => {
    if (liveBuses.length === 0) {
      const mockBuses: BusLocation[] = [
        {
          id: '1',
          busNumber: 'BK-101',
          lat: 28.6139,
          lng: 77.2090,
          heading: 45,
          speed: 25,
          status: 'IN_SERVICE',
          driverName: 'Rajesh Kumar',
          routeName: 'Route A - North Delhi',
          lastUpdated: new Date(),
        },
        {
          id: '2',
          busNumber: 'BK-102',
          lat: 28.6229,
          lng: 77.2180,
          heading: 120,
          speed: 0,
          status: 'IDLE',
          driverName: 'Suresh Singh',
          routeName: 'Route B - South Delhi',
          lastUpdated: new Date(),
        },
        {
          id: '3',
          busNumber: 'BK-103',
          lat: 28.5989,
          lng: 77.2280,
          heading: 200,
          speed: 30,
          status: 'IN_SERVICE',
          driverName: 'Amit Patel',
          routeName: 'Route C - East Delhi',
          lastUpdated: new Date(),
        },
      ];
      mockBuses.forEach((bus) => updateBusLocation(bus.id, bus));
    }
  }, []);

  const getStatusColor = (status: BusLocation['status']) => {
    switch (status) {
      case 'IN_SERVICE':
        return 'bg-green-500';
      case 'IDLE':
        return 'bg-yellow-500';
      case 'OFFLINE':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: BusLocation['status']) => {
    switch (status) {
      case 'IN_SERVICE':
        return 'In Service';
      case 'IDLE':
        return 'Idle';
      case 'OFFLINE':
        return 'Offline';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Map Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Live Bus Tracking</h3>
          <p className="text-sm text-gray-500">
            {liveBuses.filter((b) => b.status === 'IN_SERVICE').length} buses active
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              Disconnected
            </span>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="relative h-96 bg-gray-100"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      >
        {/* Mock Map Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Navigation className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              Map view - Integrate Mapbox/Google Maps
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {liveBuses.length} buses on map
            </p>
          </div>
        </div>

        {/* Bus Markers (mock positions) */}
        {liveBuses.map((bus, index) => (
          <div
            key={bus.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{
              left: `${20 + index * 25}%`,
              top: `${30 + (index % 2) * 40}%`,
            }}
            onClick={() => setSelectedBusId(bus.id)}
          >
            <div
              className={`relative ${
                selectedBusId === bus.id ? 'scale-125' : ''
              } transition-transform`}
            >
              {/* Marker */}
              <div
                className={`w-10 h-10 rounded-full ${getStatusColor(
                  bus.status
                )} flex items-center justify-center shadow-lg border-2 border-white`}
              >
                <MapPin className="w-5 h-5 text-white" />
              </div>

              {/* Info Card on Hover/Select */}
              {selectedBusId === bus.id && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      {bus.busNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        bus.status === 'IN_SERVICE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {getStatusText(bus.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Driver: {bus.driverName}
                  </p>
                  <p className="text-sm text-gray-500">{bus.routeName}</p>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>Speed: {bus.speed} km/h</span>
                    <span>
                      Last updated: {bus.lastUpdated.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bus List */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {liveBuses.map((bus) => (
            <div
              key={bus.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedBusId === bus.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedBusId(bus.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">
                  {bus.busNumber}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${getStatusColor(bus.status)}`}
                />
              </div>
              <p className="text-sm text-gray-600">{bus.driverName}</p>
              <p className="text-xs text-gray-500 mt-1">{bus.routeName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
