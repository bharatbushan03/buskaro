import React, { useState, useEffect } from 'react';
import { X, Bus as BusIcon, AlertCircle, CheckCircle } from 'lucide-react';
import type { Bus, BusRoute, CreateBusPayload, UpdateBusPayload } from '../../types/bus';

interface AddEditBusModalProps {
  bus: Bus | null;
  availableRoutes: BusRoute[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (busId: string | null, payload: CreateBusPayload | UpdateBusPayload) => Promise<void>;
  loading: boolean;
}

export const AddEditBusModal: React.FC<AddEditBusModalProps> = ({
  bus,
  availableRoutes,
  isOpen,
  onClose,
  onSave,
  loading,
}) => {
  const isEditing = !!bus;
  
  const [formData, setFormData] = useState({
    number: '',
    model: '',
    capacity: '',
    routeId: '',
    status: 'IDLE' as Bus['status'],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bus) {
      setFormData({
        number: bus.number,
        model: bus.model,
        capacity: bus.capacity.toString(),
        routeId: bus.routeId || '',
        status: bus.status,
      });
    } else {
      setFormData({
        number: '',
        model: '',
        capacity: '',
        routeId: '',
        status: 'IDLE',
      });
    }
    setErrors({});
  }, [bus, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.number.trim()) {
      newErrors.number = 'Bus number is required';
    } else if (formData.number.length < 3) {
      newErrors.number = 'Bus number must be at least 3 characters';
    }
    
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }
    
    if (!formData.capacity) {
      newErrors.capacity = 'Capacity is required';
    } else if (isNaN(Number(formData.capacity)) || Number(formData.capacity) <= 0) {
      newErrors.capacity = 'Capacity must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setSaving(true);
    
    try {
      const payload = {
        number: formData.number.trim(),
        model: formData.model.trim(),
        capacity: Number(formData.capacity),
        ...(formData.routeId && { routeId: formData.routeId }),
        ...(isEditing && { status: formData.status }),
      };
      
      await onSave(bus?.id || null, payload);
    } catch (err) {
      console.error('Failed to save bus:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <BusIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Bus' : 'Add New Bus'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? `Editing ${bus?.number}` : 'Enter bus details'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Bus Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bus Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
              placeholder="e.g., BUS-001"
              className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.number ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              disabled={saving}
            />
            {errors.number && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.number}
              </p>
            )}
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              placeholder="e.g., Tata Starbus Ultra"
              className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.model ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              disabled={saving}
            />
            {errors.model && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.model}
              </p>
            )}
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Capacity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              placeholder="e.g., 52"
              min="1"
              className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.capacity ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              disabled={saving}
            />
            {errors.capacity && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.capacity}
              </p>
            )}
          </div>

          {/* Route */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Assigned Route
            </label>
            <select
              value={formData.routeId}
              onChange={(e) => setFormData(prev => ({ ...prev, routeId: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              disabled={saving}
            >
              <option value="">-- Select Route --</option>
              {availableRoutes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name} ({route.stops} stops, {route.distance}km)
                </option>
              ))}
            </select>
            {availableRoutes.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">
                No routes available. Create routes first.
              </p>
            )}
          </div>

          {/* Status (only when editing) */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Bus['status'] }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                disabled={saving}
              >
                <option value="IDLE">IDLE</option>
                <option value="IN_SERVICE">IN_SERVICE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
              </select>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {isEditing ? 'Update Bus' : 'Create Bus'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditBusModal;
