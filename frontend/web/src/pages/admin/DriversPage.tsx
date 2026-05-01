import React, { useState } from 'react';
import { Plus, Truck, AlertCircle } from 'lucide-react';
import { useDrivers } from '../../hooks/useDrivers';
import { DataTable, Column } from '../../components/table/DataTable';
import { SearchInput } from '../../components/filters/SearchInput';
import { FilterBar } from '../../components/filters/FilterBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionMenu, createStudentActions } from '../../components/common/ActionMenu';
import { AssignBusModal } from '../../components/modals/AssignBusModal';
import { DriverDetailsModal } from '../../components/modals/DriverDetailsModal';
import { Driver } from '../../types/driver';

// Action menu for drivers
const createDriverActions = (
  driver: Driver,
  onView: (driver: Driver) => void,
  onAssignBus: (driver: Driver) => void,
  onToggleStatus: (driver: Driver) => void
) => [
  {
    key: 'view',
    label: 'View Details',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
    onClick: () => onView(driver),
  },
  {
    key: 'assign-bus',
    label: driver.busId ? 'Reassign Bus' : 'Assign Bus',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
    onClick: () => onAssignBus(driver),
  },
  {
    key: 'toggle-status',
    label: driver.status === 'ACTIVE' ? 'Deactivate Driver' : 'Activate Driver',
    icon: driver.status === 'ACTIVE' 
      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    variant: driver.status === 'ACTIVE' ? ('danger' as const) : ('success' as const),
    onClick: () => onToggleStatus(driver),
  },
];

export const DriversPage: React.FC = () => {
  const {
    drivers,
    availableBuses,
    loading,
    busesLoading,
    error,
    pagination,
    selectedDriver,
    isDetailsModalOpen,
    isAssignBusModalOpen,
    driverForAssignment,
    setPage,
    setFilters,
    refresh,
    openDriverDetails,
    closeDetailsModal,
    openAssignBusModal,
    closeAssignBusModal,
    assignBus,
    toggleDriverStatus,
  } = useDrivers();

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

  const columns: Column<Driver>[] = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (driver) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-medium text-sm">
            {driver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{driver.name}</p>
            <p className="text-sm text-gray-500">{driver.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'licenseNumber',
      title: 'License Number',
      sortable: true,
      render: (driver) => (
        <span className="font-mono text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
          {driver.licenseNumber}
        </span>
      ),
    },
    {
      key: 'busNumber',
      title: 'Assigned Bus',
      render: (driver) => (
        <span className="text-sm text-gray-700">
          {driver.busNumber ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {driver.busNumber}
            </span>
          ) : (
            <span className="text-gray-400 italic">Not assigned</span>
          )}
        </span>
      ),
    },
    {
      key: 'routeName',
      title: 'Route',
      render: (driver) => (
        <span className="text-sm text-gray-700">
          {driver.routeName || (
            <span className="text-gray-400 italic">No route</span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (driver) => <StatusBadge status={driver.status} />,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (driver) => (
        <ActionMenu
          actions={createDriverActions(
            driver,
            () => openDriverDetails(driver.id),
            () => openAssignBusModal(driver),
            () => toggleDriverStatus(driver.id, driver.status)
          )}
        />
      ),
    },
  ];

  const filterConfig = [
    {
      key: 'status',
      label: 'Driver Status',
      options: [
        { value: 'ALL', label: 'All Status' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'ON_LEAVE', label: 'On Leave' },
      ],
      value: 'ALL',
      onChange: (value: string) => setFilters({ status: value as any }),
    },
    {
      key: 'assigned',
      label: 'Assignment',
      options: [
        { value: 'ALL', label: 'All' },
        { value: 'true', label: 'Has Bus' },
        { value: 'false', label: 'No Bus' },
      ],
      value: 'ALL',
      onChange: (value: string) => setFilters({ assigned: value === 'ALL' ? 'ALL' : value === 'true' }),
    },
  ];

  const hasActiveFilters = filterConfig.some(f => f.value !== 'ALL');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-green-600" />
            Drivers
          </h1>
          <p className="text-gray-500 mt-1">Manage drivers and bus assignments</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm">
          <Plus className="w-4 h-4" />
          Add Driver
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <SearchInput
          placeholder="Search by name, email, or license number..."
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
            <p className="text-red-800 font-medium">Failed to load drivers</p>
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
        data={drivers}
        loading={loading}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} drivers
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

      {/* Driver Details Modal */}
      <DriverDetailsModal
        driver={selectedDriver}
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
      />

      {/* Assign Bus Modal */}
      <AssignBusModal
        driver={driverForAssignment}
        availableBuses={availableBuses}
        isOpen={isAssignBusModalOpen}
        onClose={closeAssignBusModal}
        onAssign={(driverId: string, busId: string) => assignBus({ driverId, busId })}
        loading={busesLoading}
      />
    </div>
  );
};

export default DriversPage;
