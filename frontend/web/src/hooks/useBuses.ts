import { useState, useEffect, useCallback } from 'react';
import { Bus, BusDetails, BusesFilters, BusesResponse, BusRoute, CreateBusPayload, UpdateBusPayload } from '../types/bus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UseBusesReturn {
  buses: Bus[];
  availableRoutes: BusRoute[];
  loading: boolean;
  routesLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  selectedBus: BusDetails | null;
  isDetailsModalOpen: boolean;
  isAddEditModalOpen: boolean;
  editingBus: Bus | null;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (filters: Partial<BusesFilters>) => void;
  refresh: () => void;
  openBusDetails: (busId: string) => Promise<void>;
  closeDetailsModal: () => void;
  openAddModal: () => void;
  openEditModal: (bus: Bus) => void;
  closeAddEditModal: () => void;
  createBus: (payload: CreateBusPayload) => Promise<void>;
  updateBus: (busId: string, payload: UpdateBusPayload) => Promise<void>;
  deleteBus: (busId: string) => Promise<void>;
  updateBusStatus: (busId: string, status: Bus['status']) => Promise<void>;
  fetchAvailableRoutes: () => Promise<void>;
}

export const useBuses = (initialFilters: BusesFilters = {}): UseBusesReturn => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFiltersState] = useState<BusesFilters>(initialFilters);
  const [selectedBus, setSelectedBus] = useState<BusDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);

  const fetchBuses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.routeId && filters.routeId !== 'ALL') params.append('routeId', filters.routeId);

      const response = await fetch(`${API_URL}/api/v1/admin/buses?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch buses');
      }

      const data: BusesResponse = await response.json();
      setBuses(data.data);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Mock data for development
      setBuses([
        {
          id: '1',
          number: 'BUS-001',
          model: 'Tata Starbus Ultra',
          capacity: 52,
          status: 'IN_SERVICE',
          routeId: 'RT-001',
          routeName: 'City Center Route',
          driverId: 'DRV-001',
          driverName: 'Rajesh Kumar',
          lastLocation: { lat: 28.6139, lng: 77.2090, address: 'Connaught Place, Delhi' },
          lastUpdated: '2024-04-28T10:30:00Z',
          createdAt: '2023-01-15T00:00:00Z',
          updatedAt: '2024-04-28T10:30:00Z',
        },
        {
          id: '2',
          number: 'BUS-002',
          model: 'Ashok Leyland Oyster',
          capacity: 48,
          status: 'IDLE',
          routeId: 'RT-002',
          routeName: 'North Zone Route',
          driverId: 'DRV-002',
          driverName: 'Suresh Patel',
          lastLocation: { lat: 28.7041, lng: 77.1025, address: 'Rohini, Delhi' },
          lastUpdated: '2024-04-28T08:15:00Z',
          createdAt: '2023-02-01T00:00:00Z',
          updatedAt: '2024-04-28T08:15:00Z',
        },
        {
          id: '3',
          number: 'BUS-003',
          model: 'Volvo 8400 City Bus',
          capacity: 60,
          status: 'MAINTENANCE',
          routeId: null,
          routeName: null,
          driverId: null,
          driverName: null,
          lastLocation: null,
          lastUpdated: null,
          createdAt: '2023-03-10T00:00:00Z',
          updatedAt: '2024-04-25T14:00:00Z',
        },
        {
          id: '4',
          number: 'BUS-004',
          model: 'Tata Marcopolo',
          capacity: 55,
          status: 'COMPLETED',
          routeId: 'RT-003',
          routeName: 'South Zone Route',
          driverId: 'DRV-003',
          driverName: 'Amit Singh',
          lastLocation: { lat: 28.5355, lng: 77.3910, address: 'Noida, UP' },
          lastUpdated: '2024-04-28T09:45:00Z',
          createdAt: '2023-01-20T00:00:00Z',
          updatedAt: '2024-04-28T09:45:00Z',
        },
      ]);
      setTotal(4);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  const fetchAvailableRoutes = useCallback(async () => {
    setRoutesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/admin/routes?active=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch routes');

      const data = await response.json();
      setAvailableRoutes(data.data || []);
    } catch (err) {
      // Mock data for development
      setAvailableRoutes([
        { id: 'RT-001', name: 'City Center Route', stops: 12, distance: 15.5, estimatedTime: 45 },
        { id: 'RT-002', name: 'North Zone Route', stops: 8, distance: 22.0, estimatedTime: 60 },
        { id: 'RT-003', name: 'South Zone Route', stops: 10, distance: 18.5, estimatedTime: 50 },
        { id: 'RT-004', name: 'East Zone Route', stops: 6, distance: 12.0, estimatedTime: 35 },
      ]);
    } finally {
      setRoutesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  const setFilters = useCallback((newFilters: Partial<BusesFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const openBusDetails = useCallback(async (busId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/admin/buses/${busId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch bus details');

      const data = await response.json();
      setSelectedBus(data.data);
      setIsDetailsModalOpen(true);
    } catch (err) {
      const bus = buses.find(b => b.id === busId);
      if (bus) {
        setSelectedBus({
          ...bus,
          route: bus.routeId ? {
            id: bus.routeId,
            name: bus.routeName || '',
            stops: 12,
            distance: 15.5,
            estimatedTime: 45,
          } : undefined,
          driver: bus.driverId ? {
            id: bus.driverId,
            name: bus.driverName || '',
            licenseNumber: 'DL-01-2024-001',
            phone: '+91 9876543210',
          } : undefined,
          recentTrips: [
            { id: 't1', routeName: 'City Center Route', date: '2024-04-28', startTime: '08:00', endTime: '09:30', passengers: 42, status: 'COMPLETED' },
            { id: 't2', routeName: 'City Center Route', date: '2024-04-27', startTime: '08:00', endTime: '09:15', passengers: 38, status: 'COMPLETED' },
          ],
          locationHistory: [
            { lat: 28.6139, lng: 77.2090, timestamp: '2024-04-28T10:30:00Z', address: 'Connaught Place' },
            { lat: 28.62, lng: 77.21, timestamp: '2024-04-28T10:15:00Z', address: 'Rajiv Chowk' },
          ],
        });
        setIsDetailsModalOpen(true);
      }
    }
  }, [buses]);

  const closeDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedBus(null);
  }, []);

  const openAddModal = useCallback(() => {
    setEditingBus(null);
    fetchAvailableRoutes();
    setIsAddEditModalOpen(true);
  }, [fetchAvailableRoutes]);

  const openEditModal = useCallback((bus: Bus) => {
    setEditingBus(bus);
    fetchAvailableRoutes();
    setIsAddEditModalOpen(true);
  }, [fetchAvailableRoutes]);

  const closeAddEditModal = useCallback(() => {
    setIsAddEditModalOpen(false);
    setEditingBus(null);
  }, []);

  const createBus = useCallback(async (payload: CreateBusPayload) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/v1/admin/buses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create bus');
      }

      const data = await response.json();
      setBuses(prev => [data.data, ...prev]);
      setTotal(prev => prev + 1);
      closeAddEditModal();
    } catch (err) {
      console.error('Failed to create bus:', err);
      // Optimistic update for development
      const newBus: Bus = {
        id: `bus-${Date.now()}`,
        ...payload,
        routeName: payload.routeId ? availableRoutes.find(r => r.id === payload.routeId)?.name : undefined,
        driverId: null,
        driverName: null,
        lastLocation: null,
        lastUpdated: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBuses(prev => [newBus, ...prev]);
      setTotal(prev => prev + 1);
      closeAddEditModal();
    }
  }, [availableRoutes, closeAddEditModal]);

  const updateBus = useCallback(async (busId: string, payload: UpdateBusPayload) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/v1/admin/buses/${busId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to update bus');

      const data = await response.json();
      setBuses(prev =>
        prev.map(b => b.id === busId ? { ...b, ...data.data } : b)
      );
      closeAddEditModal();
    } catch (err) {
      console.error('Failed to update bus:', err);
      // Optimistic update for development
      setBuses(prev =>
        prev.map(b =>
          b.id === busId
            ? {
                ...b,
                ...payload,
                routeName: payload.routeId ? availableRoutes.find(r => r.id === payload.routeId)?.name : b.routeName,
                updatedAt: new Date().toISOString(),
              }
            : b
        )
      );
      closeAddEditModal();
    }
  }, [availableRoutes, closeAddEditModal]);

  const deleteBus = useCallback(async (busId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/v1/admin/buses/${busId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete bus');

      setBuses(prev => prev.filter(b => b.id !== busId));
      setTotal(prev => prev - 1);
    } catch (err) {
      console.error('Failed to delete bus:', err);
      // Optimistic update for development
      setBuses(prev => prev.filter(b => b.id !== busId));
      setTotal(prev => prev - 1);
    }
  }, []);

  const updateBusStatus = useCallback(async (busId: string, status: Bus['status']) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/v1/admin/buses/${busId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update bus status');

      setBuses(prev =>
        prev.map(b => b.id === busId ? { ...b, status } : b)
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      // Optimistic update for development
      setBuses(prev =>
        prev.map(b => b.id === busId ? { ...b, status } : b)
      );
    }
  }, []);

  return {
    buses,
    availableRoutes,
    loading,
    routesLoading,
    error,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    selectedBus,
    isDetailsModalOpen,
    isAddEditModalOpen,
    editingBus,
    setPage,
    setLimit,
    setFilters,
    refresh: fetchBuses,
    openBusDetails,
    closeDetailsModal,
    openAddModal,
    openEditModal,
    closeAddEditModal,
    createBus,
    updateBus,
    deleteBus,
    updateBusStatus,
    fetchAvailableRoutes,
  };
};

export default useBuses;
