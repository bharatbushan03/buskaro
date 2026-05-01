import React, { useState } from 'react';
import { X, Bus as BusIcon, MapPin, User, AlertCircle } from 'lucide-react';
import { Driver, Bus } from '../../types/driver';

interface AssignBusModalProps {
  driver: Driver | null;
  availableBuses: Bus[];
  isOpen: boolean;
  onClose: () => void;
  onAssign: (driverId: string, busId: string) => Promise<void>;
  loading: boolean;
}

export const AssignBusModal: React.FC<AssignBusModalProps> = ({
  driver,
  availableBuses,
  isOpen,
  onClose,
  onAssign,
  loading,
}) => {
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  if (!isOpen || !driver) return null;

  const handleAssign = async () => {
    if (!selectedBusId) {
      setError('Please select a bus');
      return;
    }

    setError(null);
    setAssigning(true);

    try {
      await onAssign(driver.id, selectedBusId);
      setSelectedBusId('');
    } catch (err) {
      setError('Failed to assign bus. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedBusId('');
    setError(null);
    onClose();
  };

  const selectedBus = availableBuses.find(b => b.id === selectedBusId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {driver.busId ? 'Reassign Bus' : 'Assign Bus'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              to {driver.name}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Assignment Info */}
          {driver.busId && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">Current Assignment</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Currently assigned to <span className="font-semibold">{driver.busNumber}</span>
                    {driver.routeName && (
                      <span> on {driver.routeName}</span>
                    )}
                  </p>
                  <p className="text-xs text-amber-600 mt-2">
                    Reassigning will remove the driver from this bus.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Driver Info Card */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-semibold">
              {driver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{driver.name}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {driver.licenseNumber}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {driver.routeName || 'No route assigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Bus Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Available Bus
            </label>
            {availableBuses.length === 0 ? (
              <div className="p-6 text-center bg-gray-50 rounded-xl border border-gray-200">
                <BusIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">No buses available</p>
                <p className="text-sm text-gray-400 mt-1">
                  All buses are currently assigned or unavailable.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableBuses.map((bus) => (
                  <label
                    key={bus.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedBusId === bus.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bus"
                      value={bus.id}
                      checked={selectedBusId === bus.id}
                      onChange={(e) => setSelectedBusId(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{bus.number}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            bus.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : bus.status === 'MAINTENANCE'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {bus.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>{bus.model}</span>
                        <span>•</span>
                        <span>{bus.capacity} seats</span>
                        {bus.routeName && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">{bus.routeName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Selected Bus Preview */}
          {selectedBus && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm font-medium text-blue-900 mb-2">Assignment Preview</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Driver:</span>
                  <span className="font-medium text-blue-900">{driver.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Bus:</span>
                  <span className="font-medium text-blue-900">{selectedBus.number}</span>
                </div>
                {selectedBus.routeName && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Route:</span>
                    <span className="font-medium text-blue-900">{selectedBus.routeName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={handleClose}
            disabled={assigning}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedBusId || assigning || availableBuses.length === 0}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {assigning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <BusIcon className="w-4 h-4" />
                {driver.busId ? 'Reassign Bus' : 'Assign Bus'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignBusModal;
