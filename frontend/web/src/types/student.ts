export interface Student {
  id: string;
  name: string;
  email: string;
  collegeId: string;
  phone?: string;
  avatar?: string;
  routeId?: string;
  routeName?: string;
  feeStatus: 'PAID' | 'PENDING' | 'OVERDUE';
  attendancePercentage: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface StudentPayment {
  id: string;
  month: string;
  amount: number;
  status: 'PAID' | 'PENDING';
  paidAt?: string;
}

export interface StudentAttendance {
  month: string;
  present: number;
  absent: number;
  percentage: number;
}

export interface StudentDetails extends Student {
  payments: StudentPayment[];
  attendance: StudentAttendance[];
  pickupLocation?: {
    address: string;
    lat: number;
    lng: number;
  };
}

export interface StudentsFilters {
  search?: string;
  routeId?: string;
  feeStatus?: 'PAID' | 'PENDING' | 'OVERDUE' | 'ALL';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ALL';
}

export interface StudentsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StudentsResponse {
  data: Student[];
  pagination: StudentsPagination;
}
