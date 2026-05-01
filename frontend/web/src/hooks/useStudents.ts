import { useState, useEffect, useCallback } from 'react';
import { Student, StudentsFilters, StudentsResponse, StudentDetails } from '../types/student';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UseStudentsReturn {
  students: Student[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  selectedStudent: StudentDetails | null;
  isModalOpen: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (filters: Partial<StudentsFilters>) => void;
  refresh: () => void;
  openStudentDetails: (studentId: string) => Promise<void>;
  closeModal: () => void;
  toggleStudentStatus: (studentId: string, currentStatus: string) => Promise<void>;
  assignRoute: (studentId: string, routeId: string) => Promise<void>;
}

export const useStudents = (initialFilters: StudentsFilters = {}): UseStudentsReturn => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFiltersState] = useState<StudentsFilters>(initialFilters);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (filters.search) params.append('search', filters.search);
      if (filters.routeId && filters.routeId !== 'ALL') params.append('routeId', filters.routeId);
      if (filters.feeStatus && filters.feeStatus !== 'ALL') params.append('feeStatus', filters.feeStatus);
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);

      const response = await fetch(`${API_URL}/api/admin/students?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data: StudentsResponse = await response.json();
      setStudents(data.data);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Use mock data for development
      setStudents([
        {
          id: '1',
          name: 'John Doe',
          email: 'john@college.edu',
          collegeId: 'C2024001',
          phone: '+91 9876543210',
          routeId: 'RT-001',
          routeName: 'City Center Route',
          feeStatus: 'PAID',
          attendancePercentage: 92,
          status: 'ACTIVE',
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-04-28T00:00:00Z',
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@college.edu',
          collegeId: 'C2024002',
          phone: '+91 9876543211',
          routeId: 'RT-002',
          routeName: 'North Zone Route',
          feeStatus: 'PENDING',
          attendancePercentage: 88,
          status: 'ACTIVE',
          createdAt: '2024-01-20T00:00:00Z',
          updatedAt: '2024-04-28T00:00:00Z',
        },
        {
          id: '3',
          name: 'Mike Johnson',
          email: 'mike@college.edu',
          collegeId: 'C2024003',
          phone: '+91 9876543212',
          routeId: null,
          routeName: null,
          feeStatus: 'OVERDUE',
          attendancePercentage: 65,
          status: 'SUSPENDED',
          createdAt: '2024-02-01T00:00:00Z',
          updatedAt: '2024-04-28T00:00:00Z',
        },
      ]);
      setTotal(3);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const setFilters = useCallback((newFilters: Partial<StudentsFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const openStudentDetails = useCallback(async (studentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/students/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch student details');
      }

      const data = await response.json();
      setSelectedStudent(data.data);
      setIsModalOpen(true);
    } catch (err) {
      // Mock data for development
      const student = students.find(s => s.id === studentId);
      if (student) {
        setSelectedStudent({
          ...student,
          payments: [
            { id: 'p1', month: 'April 2024', amount: 1500, status: student.feeStatus === 'PAID' ? 'PAID' : 'PENDING' },
            { id: 'p2', month: 'March 2024', amount: 1500, status: 'PAID' },
            { id: 'p3', month: 'February 2024', amount: 1500, status: 'PAID' },
          ],
          attendance: [
            { month: 'April 2024', present: 22, absent: 2, percentage: 92 },
            { month: 'March 2024', present: 20, absent: 3, percentage: 87 },
            { month: 'February 2024', present: 18, absent: 2, percentage: 90 },
          ],
          pickupLocation: student.routeId ? {
            address: '123 Main Street, City Center',
            lat: 28.6139,
            lng: 77.2090,
          } : undefined,
        });
        setIsModalOpen(true);
      }
    }
  }, [students]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  }, []);

  const toggleStudentStatus = useCallback(async (studentId: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      
      const response = await fetch(`${API_URL}/api/admin/students/${studentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update student status');
      }

      setStudents(prev =>
        prev.map(s =>
          s.id === studentId ? { ...s, status: newStatus as any } : s
        )
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
      // Optimistic update for development
      setStudents(prev =>
        prev.map(s =>
          s.id === studentId ? { ...s, status: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' as any } : s
        )
      );
    }
  }, []);

  const assignRoute = useCallback(async (studentId: string, routeId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/admin/students/${studentId}/route`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ routeId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign route');
      }

      fetchStudents();
    } catch (err) {
      console.error('Failed to assign route:', err);
    }
  }, [fetchStudents]);

  return {
    students,
    loading,
    error,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    selectedStudent,
    isModalOpen,
    setPage,
    setLimit,
    setFilters,
    refresh: fetchStudents,
    openStudentDetails,
    closeModal,
    toggleStudentStatus,
    assignRoute,
  };
};

export default useStudents;
