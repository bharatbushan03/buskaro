export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry?: string;
  avatar?: string;
  busId?: string;
  busNumber?: string;
  busStatus?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  routeId?: string;
  routeName?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  rating?: number;
  totalTrips?: number;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bus {
  id: string;
  number: string;
  model: string;
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'ON_ROUTE';
  routeId?: string;
  routeName?: string;
  driverId?: string;
  driverName?: string;
}

export interface DriverTrip {
  id: string;
  routeName: string;
  date: string;
  startTime: string;
  endTime?: string;
  passengers: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'CANCELLED';
}

export interface DriverDetails extends Driver {
  trips: DriverTrip[];
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
  }[];
}

export interface DriversFilters {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'ALL';
  assigned?: boolean | 'ALL';
}

export interface DriversPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DriversResponse {
  data: Driver[];
  pagination: DriversPagination;
}

export interface AssignBusPayload {
  driverId: string;
  busId: string;
}
