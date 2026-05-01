export interface Bus {
  id: string;
  number: string;
  model: string;
  capacity: number;
  status: 'IDLE' | 'IN_SERVICE' | 'COMPLETED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  routeId?: string;
  routeName?: string;
  driverId?: string;
  driverName?: string;
  lastLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  lastUpdated?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusRoute {
  id: string;
  name: string;
  stops: number;
  distance: number;
  estimatedTime: number;
}

export interface BusDriver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
}

export interface BusDetails extends Bus {
  route?: BusRoute;
  driver?: BusDriver;
  recentTrips: {
    id: string;
    routeName: string;
    date: string;
    startTime: string;
    endTime?: string;
    passengers: number;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'CANCELLED';
  }[];
  locationHistory: {
    lat: number;
    lng: number;
    timestamp: string;
    address?: string;
  }[];
}

export interface BusesFilters {
  search?: string;
  status?: 'IDLE' | 'IN_SERVICE' | 'COMPLETED' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'ALL';
  routeId?: string;
}

export interface BusesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BusesResponse {
  data: Bus[];
  pagination: BusesPagination;
}

export interface CreateBusPayload {
  number: string;
  model: string;
  capacity: number;
  routeId?: string;
  status?: 'IDLE' | 'IN_SERVICE' | 'COMPLETED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
}

export interface UpdateBusPayload {
  number?: string;
  model?: string;
  capacity?: number;
  routeId?: string;
  status?: 'IDLE' | 'IN_SERVICE' | 'COMPLETED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
}
