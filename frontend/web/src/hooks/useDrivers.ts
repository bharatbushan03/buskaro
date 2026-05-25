import { useState, useEffect, useCallback } from 'react';
import { Driver, DriversFilters, DriversResponse, DriverDetails, Bus, AssignBusPayload } from '../types/driver';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UseDriversReturn {
  drivers: Driver[];
  availableBuses: Bus[];
  loading: boolean;
  busesLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  selectedDriver: DriverDetails | null;
  isDetailsModalOpen: boolean;
  isAssignBusModalOpen: boolean;
  driverForAssignment: Driver | null;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (filters: Partial<DriversFilters>) => void;
  refresh: () => void;
  openDriverDetails: (driverId: string) => Promise<void>;
  closeDetailsModal: () => void;
  openAssignBusModal: (driver: Driver) => void;
  closeAssignBusModal: () => void;
  assignBus: (payload: AssignBusPayload) => Promise<void>;
  toggleDriverStatus: (driverId: string, currentStatus: string) => Promise<void>;
  fetchAvailableBuses: () => Promise<void>;
}

export const useDrivers = (initialFilters: DriversFilters = {}): UseDriversReturn => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [availableBuses, setAvailableBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(false);
  const [busesLoading, setBusesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFiltersState] = useState<DriversFilters>(initialFilters);
  const [selectedDriver, setSelectedDriver] = useState<DriverDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAssignBusModalOpen, setIsAssignBusModalOpen] = useState(false);
  const [driverForAssignment, setDriverForAssignment] = useState<Driver | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.assigned !== undefined && filters.assigned !== 'ALL') {
        params.append('assigned', filters.assigned.toString());
      }

      const response = await fetch(`${API_URL}/api/v1/admin/drivers?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }

      const data: DriversResponse = await response.json();
      setDrivers(data.data);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Mock data for development
      setDrivers([
        {
          id: '1',
          name: 'Rajesh Kumar',
          email: 'rajesh@buskaro.com',
          phone: '+91 9876543210',
          licenseNumber: 'DL-01-2024-001',
          licenseExpiry: '2027-04-15',
          busId: 'BUS-001',
          busNumber: 'BUS-001',
          busStatus: 'ACTIVE',
          routeId: 'RT-001',
          routeName: 'City Center Route',
          status: 'ACTIVE',
          rating: 4.8,
          totalTrips: 156,
          joinedAt: '2023-01-15',
          createdAt: '2023-01-15T00:00:00Z',
          updatedAt: '2024-04-28T00:00:00Z',
        },
        {
          id: '2',
          name: 'Suresh Patel',
          email: 'suresh@buskaro.com',
          phone: '+91 9876543211',
          licenseNumber: 'DL-01-2024-002',
          licenseExpiry: '2026-08-20',
          busId: 'BUS-002',
          busNumber: 'BUS-002',
          busStatus: 'ACTIVE',
          routeId: 'RT-002',
          routeName: 'North Zone Route',
          status: 'ACTIVE',
          rating: 4.5,
          totalTrips: 98,
          joinedAt: '2023-02-01',
          createdAt: '2023-02-01T00:00:00Z',
          updatedAt: '2024-04-28T00:00:00Z',
        },
        {
          id: '3',
          name: 'Amit Singh',
          email: 'amit@buskaro.com',
          phone: '+91 9876543212',
          licenseNumber: 'DL-01-2024-003',
          licenseExpiry: '2028-03-10',
          busId: null,
          busNumber: null,
          routeId: null,
          routeName: null,
          status: 'INACTIVE',
          rating: 4.2,
          totalTrips: 45,
          joinedAt: '2023-03-10',
          createdAt: '2023-03-10T00:00:00Z',
          updatedAt: '2024-04-28T00:00:00Z',
        },
        {
          id: '4',
          name: 'Vikram Rao',
          email: 'vikram@buskaro.com',
          phone: '+91 9876543213',
          licenseNumber: 'DL-01-2024-004',
          licenseExpiry: '2027-12-05',
          busId: 'BUS-003',
          busNumber: 'BUS-003',
          busStatus: 'MAINTENANCE',
          routeId: 'RT-003',
          routeName: 'South Zone Route',
          status: 'ON_LEAVE',
          rating: 4.7,
          totalTrips: 203,
          joinedAt: '2023-01-05',
          createdAt: '2023-01-05T00:00:00Z',
          updatedAt: '2024-04-28T00:00:00Z',
        },
      ]);
      setTotal(4);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  const fetchAvailableBuses = useCallback(async () => {
    setBusesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/admin/buses?available=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch buses');

      const data = await response.json();
      setAvailableBuses(data.data || []);
    } catch (err) {
      // Mock data for development
      setAvailableBuses([
        { id: 'BUS-004', number: 'BUS-004', model: 'Tata Starbus', capacity: 52, status: 'ACTIVE', routeName: 'East Zone Route' },
        { id: 'BUS-005', number: 'BUS-005', model: 'Ashok Leyland', capacity: 48, status: 'ACTIVE', routeName: 'West Zone Route' },
        { id: 'BUS-006', number: 'BUS-006', model: 'Volvo 8400', capacity: 60, status: 'INACTIVE' },
      ]);
    } finally {
      setBusesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const setFilters = useCallback((newFilters: Partial<DriversFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const openDriverDetails = useCallback(async (driverId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/admin/drivers/${driverId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch driver details');

      const data = await response.json();
      setSelectedDriver(data.data);
      setIsDetailsModalOpen(true);
    } catch (err) {
      const driver = drivers.find(d => d.id === driverId);
      if (driver) {
        setSelectedDriver({
          ...driver,
          trips: [
            { id: 't1', routeName: 'City Center Route', date: '2024-04-28', startTime: '08:00', endTime: '09:30', passengers: 42, status: 'COMPLETED' },
            { id: 't2', routeName: 'City Center Route', date: '2024-04-27', startTime: '08:00', endTime: '09:15', passengers: 38, status: 'COMPLETED' },
            { id: 't3', routeName: 'City Center Route', date: '2024-04-26', startTime: '08:00', endTime: '09:45', passengers: 45, status: 'COMPLETED' },
          ],
          recentActivity: [
            { type: 'trip', description: 'Completed morning trip', timestamp: '2024-04-28T09:30:00Z' },
            { type: 'login', description: 'Logged in', timestamp: '2024-04-28T07:45:00Z' },
            { type: 'trip', description: 'Completed evening trip', timestamp: '2024-04-27T17:30:00Z' },
          ],
        });
        setIsDetailsModalOpen(true);
      }
    }
  }, [drivers]);

  const closeDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedDriver(null);
  }, []);

  const openAssignBusModal = useCallback((driver: Driver) => {
    setDriverForAssignment(driver);
    fetchAvailableBuses();
    setIsAssignBusModalOpen(true);
  }, [fetchAvailableBuses]);

  const closeAssignBusModal = useCallback(() => {
    setIsAssignBusModalOpen(false);
    setDriverForAssignment(null);
  }, []);

  const assignBus = useCallback(async (payload: AssignBusPayload) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/v1/admin/assign-bus`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to assign bus');

      // Update local state
      setDrivers(prev =>
        prev.map(d =>
          d.id === payload.driverId
            ? {
                ...d,
                busId: payload.busId,
                busNumber: payload.busId,
                busStatus: 'ACTIVE',
              }
            : d
        )
      );

      closeAssignBusModal();
    } catch (err) {
      console.error('Failed to assign bus:', err);
      throw err;
    }
  }, [closeAssignBusModal]);

  const toggleDriverStatus = useCallback(async (driverId: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      
      const response = await fetch(`${API_URL}/api/v1/admin/drivers/${driverId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update driver status');

      setDrivers(prev =>
        prev.map(d =>
          d.id === driverId ? { ...d, status: newStatus as any } : d
        )
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
      setDrivers(prev =>
        prev.map(d =>
          d.id === driverId ? { ...d, status: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' as any } : d
        )
      );
    }
  }, []);

  return {
    drivers,
    availableBuses,
    loading,
    busesLoading,
    error,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    selectedDriver,
    isDetailsModalOpen,
    isAssignBusModalOpen,
    driverForAssignment,
    setPage,
    setLimit,
    setFilters,
    refresh: fetchDrivers,
    openDriverDetails,
    closeDetailsModal,
    openAssignBusModal,
    closeAssignBusModal,
    assignBus,
    toggleDriverStatus,
    fetchAvailableBuses,
  };
};

export default useDrivers;
