import React, { useState } from 'react';
import { Plus, Users, AlertCircle } from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { DataTable, Column } from '../../components/table/DataTable';
import { SearchInput } from '../../components/filters/SearchInput';
import { FilterBar } from '../../components/filters/FilterBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionMenu, createStudentActions } from '../../components/common/ActionMenu';
import { StudentDetailsModal } from '../../components/modals/StudentDetailsModal';
import { Student } from '../../types/student';

export const StudentsPage: React.FC = () => {
  const {
    students,
    loading,
    error,
    pagination,
    selectedStudent,
    isModalOpen,
    setPage,
    setFilters,
    refresh,
    openStudentDetails,
    closeModal,
    toggleStudentStatus,
  } = useStudents();

  const [sortKey, setSortKey] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const columns: Column<Student>[] = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (student) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
            {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{student.name}</p>
            <p className="text-sm text-gray-500">{student.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'collegeId',
      title: 'College ID',
      sortable: true,
      render: (student) => (
        <span className="font-mono text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
          {student.collegeId}
        </span>
      ),
    },
    {
      key: 'routeName',
      title: 'Route',
      sortable: true,
      render: (student) => (
        <span className="text-sm text-gray-700">
          {student.routeName || (
            <span className="text-gray-400 italic">Not assigned</span>
          )}
        </span>
      ),
    },
    {
      key: 'feeStatus',
      title: 'Fee Status',
      render: (student) => <StatusBadge status={student.feeStatus} variant="fee" />,
    },
    {
      key: 'attendancePercentage',
      title: 'Attendance',
      sortable: true,
      render: (student) => <StatusBadge status={student.feeStatus} variant="attendance" value={student.attendancePercentage} />,
    },
    {
      key: 'status',
      title: 'Status',
      render: (student) => <StatusBadge status={student.status} />,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (student) => (
        <ActionMenu
          actions={createStudentActions(
            student,
            () => openStudentDetails(student.id),
            () => console.log('Assign route', student.id),
            () => toggleStudentStatus(student.id, student.status)
          )}
        />
      ),
    },
  ];

  const filterConfig = [
    {
      key: 'route',
      label: 'Route',
      options: [
        { value: 'ALL', label: 'All Routes' },
        { value: 'RT-001', label: 'City Center' },
        { value: 'RT-002', label: 'North Zone' },
        { value: 'RT-003', label: 'South Zone' },
      ],
      value: 'ALL',
      onChange: (value: string) => setFilters({ routeId: value }),
    },
    {
      key: 'feeStatus',
      label: 'Fee Status',
      options: [
        { value: 'ALL', label: 'All Status' },
        { value: 'PAID', label: 'Paid' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'OVERDUE', label: 'Overdue' },
      ],
      value: 'ALL',
      onChange: (value: string) => setFilters({ feeStatus: value as any }),
    },
    {
      key: 'status',
      label: 'Student Status',
      options: [
        { value: 'ALL', label: 'All' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'SUSPENDED', label: 'Suspended' },
      ],
      value: 'ALL',
      onChange: (value: string) => setFilters({ status: value as any }),
    },
  ];

  const hasActiveFilters = filterConfig.some(f => f.value !== 'ALL');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            Students
          </h1>
          <p className="text-gray-500 mt-1">Manage and monitor all students</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <SearchInput
          placeholder="Search by name, email, or college ID..."
          value=""
          onChange={(value) => setFilters({ search: value })}
          className="max-w-xl"
        />
        <FilterBar
          filters={filterConfig}
          hasActiveFilters={hasActiveFilters}
          onClear={() => {
            filterConfig.forEach(f => f.onChange('ALL'));
          }}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Failed to load students</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={students}
        loading={loading}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm font-medium text-gray-900">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      <StudentDetailsModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default StudentsPage;
