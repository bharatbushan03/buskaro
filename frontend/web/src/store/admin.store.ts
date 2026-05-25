/**
 * Admin Store
 * 
 * Zustand store for admin dashboard state:
 * - Live buses with locations
 * - Analytics data
 * - Users (students, drivers)
 * - System stats
 * - Real-time updates
 */

import { create } from 'zustand';

// Types
export interface BusLocation {
  id: string;
  busNumber: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: 'IDLE' | 'IN_SERVICE' | 'OFFLINE';
  driverName?: string;
  routeName?: string;
  lastUpdated: Date;
}

export interface SystemStats {
  totalStudents: number;
  activeBuses: number;
  tripsToday: number;
  pendingPayments: number;
  totalPickupsToday: number;
  attendanceRate: number;
}

export interface Activity {
  id: string;
  type: 'trip_started' | 'trip_ended' | 'pickup_request' | 'payment' | 'alert';
  message: string;
  timestamp: Date;
  metadata?: any;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  busId?: string;
  routeId?: string;
  pickupPoint?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  busId?: string;
  licenseNumber: string;
  status: 'ON_DUTY' | 'OFF_DUTY' | 'ON_LEAVE';
}

export interface Bus {
  id: string;
  number: string;
  model: string;
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  driverId?: string;
  routeId?: string;
}

export interface Route {
  id: string;
  name: string;
  description: string;
  pickupPoints: number;
  busCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Payment {
  id: string;
  studentName: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  dueDate: string;
  paidDate?: string;
}

interface AdminState {
  // Live Data
  liveBuses: BusLocation[];
  systemStats: SystemStats;
  recentActivity: Activity[];
  
  // Management Data
  students: Student[];
  drivers: Driver[];
  buses: Bus[];
  routes: Route[];
  payments: Payment[];
  
  // UI State
  selectedBusId: string | null;
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  sidebarWidth: number;
  
  // Analytics
  pickupTrends: Array<{ date: string; count: number }>;
  attendanceData: Array<{ date: string; rate: number }>;
  busUtilization: Array<{ busId: string; utilization: number }>;
  
  // Actions
  setLiveBuses: (buses: BusLocation[]) => void;
  updateBusLocation: (busId: string, location: Partial<BusLocation>) => void;
  setSystemStats: (stats: SystemStats) => void;
  addActivity: (activity: Activity) => void;
  setStudents: (students: Student[]) => void;
  setDrivers: (drivers: Driver[]) => void;
  setBuses: (buses: Bus[]) => void;
  setRoutes: (routes: Route[]) => void;
  setPayments: (payments: Payment[]) => void;
  setSelectedBusId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setPickupTrends: (data: Array<{ date: string; count: number }>) => void;
  setAttendanceData: (data: Array<{ date: string; rate: number }>) => void;
  setBusUtilization: (data: Array<{ busId: string; utilization: number }>) => void;
  clearError: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  // Initial State
  liveBuses: [],
  systemStats: {
    totalStudents: 0,
    activeBuses: 0,
    tripsToday: 0,
    pendingPayments: 0,
    totalPickupsToday: 0,
    attendanceRate: 0,
  },
  recentActivity: [],
  students: [],
  drivers: [],
  buses: [],
  routes: [],
  payments: [],
  selectedBusId: null,
  isLoading: false,
  error: null,
  sidebarOpen: true,
  sidebarWidth: 256,
  pickupTrends: [],
  attendanceData: [],
  busUtilization: [],

  // Actions
  setLiveBuses: (liveBuses) => set({ liveBuses }),
  
  updateBusLocation: (busId, location) => set((state) => ({
    liveBuses: state.liveBuses.map((bus) =>
      bus.id === busId ? { ...bus, ...location, lastUpdated: new Date() } : bus
    ),
  })),
  
  setSystemStats: (systemStats) => set({ systemStats }),
  
  addActivity: (activity) => set((state) => ({
    recentActivity: [activity, ...state.recentActivity].slice(0, 50),
  })),
  
  setStudents: (students) => set({ students }),
  setDrivers: (drivers) => set({ drivers }),
  setBuses: (buses) => set({ buses }),
  setRoutes: (routes) => set({ routes }),
  setPayments: (payments) => set({ payments }),
  
  setSelectedBusId: (selectedBusId) => set({ selectedBusId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen,
    sidebarWidth: !state.sidebarOpen ? 256 : 80 
  })),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth, sidebarOpen: sidebarWidth > 100 }),
  
  setPickupTrends: (pickupTrends) => set({ pickupTrends }),
  setAttendanceData: (attendanceData) => set({ attendanceData }),
  setBusUtilization: (busUtilization) => set({ busUtilization }),
  
  clearError: () => set({ error: null }),
}));

export default useAdminStore;
