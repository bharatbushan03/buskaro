import React, { useState } from 'react';
import { Plus, Bus as BusIcon, AlertCircle, MapPin, MoreHorizontal, Eye, Edit2, Trash2, Power } from 'lucide-react';
import { useBuses } from '../../hooks/useBuses';
import { DataTable, Column } from '../../components/table/DataTable';
import { SearchInput } from '../../components/filters/SearchInput';
import { FilterBar } from '../../components/filters/FilterBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionMenu } from '../../components/common/ActionMenu';
import { AddEditBusModal } from '../../components/modals/AddEditBusModal';
import { BusDetailsModal } from '../../components/modals/BusDetailsModal';
import type { Bus } from '../../types/bus';

// Action menu for buses
const createBusActions = (
  bus: Bus,
  onView: (bus: Bus) => void,
  onEdit: (bus: Bus) => void,
  onDelete: (bus: Bus) => void,
  onChangeStatus: (bus: Bus) => void
) => [
  {
    key: 'view',
    label: 'View Details',
    icon: <Eye className="w-4 h-4" />,
    onClick: () => onView(bus),
  },
  {
    key: 'edit',
    label: 'Edit Bus',
    icon: <Edit2 className="w-4 h-4" />,
    onClick: () => onEdit(bus),
  },
  {
    key: 'status',
    label: 'Change Status',
    icon: <Power className="w-4 h-4" />,
    onClick: () => onChangeStatus(bus),
  },
  {
    key: 'delete',
    label: 'Delete Bus',
    icon: <Trash2 className="w-4 h-4" />,
    variant: 'danger' as const,
    onClick: () => onDelete(bus),
  },
];

export const BusesPage: React.FC = () => {
  const {
    buses,
    availableRoutes,
    loading,
    routesLoading,
    error,
    pagination,
    selectedBus,
    isDetailsModalOpen,
    isAddEditModalOpen,
    editingBus,
    setPage,
    setFilters,
    refresh,
    openBusDetails,
    closeDetailsModal,
    openAddModal,
    openEditModal,
    closeAddEditModal,
    createBus,
    updateBus,
    deleteBus,
    updateBusStatus,
  } = useBuses();

  const [sortKey, setSortKey] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusDropdownBus, setStatusDropdownBus] = useState<string | null>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (bus: Bus) => {
    if (confirm(`Are you sure you want to delete ${bus.number}?`)) {
      await deleteBus(bus.id);
    }
  };

  const handleStatusChange = async (busId: string, newStatus: Bus['status']) => {
    await updateBusStatus(busId, newStatus);
    setStatusDropdownBus(null);
  };

  const columns: Column<Bus>[] = [
    {
      key: 'number',
      title: 'Bus Number',
      sortable: true,
      render: (bus) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
            <BusIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{bus.number}</p>
            <p className="text-sm text-gray-500">{bus.model}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'capacity',
      title: 'Capacity',
      sortable: true,
      render: (bus) => (
        <span className="text-sm text-gray-700 font-medium">
          {bus.capacity} seats
        </span>
      ),
    },
    {
      key: 'routeName',
      title: 'Route',
      render: (bus) => (
        <span className="text-sm text-gray-700">
          {bus.routeName ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
              </svg>
              {bus.routeName}
            </span>
          ) : (
            <span className="text-gray-400 italic">Not assigned</span>
          )}
        </span>
      ),
    },
    {
      key: 'driverName',
      title: 'Driver',
      render: (bus) => (
        <span className="text-sm text-gray-700">
          {bus.driverName || (
            <span className="text-gray-400 italic">Unassigned</span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (bus) => (
        <div className="relative">
          <button
            onClick={() => setStatusDropdownBus(statusDropdownBus === bus.id ? null : bus.id)}
            className="flex items-center gap-1 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
          >
            <StatusBadge status={bus.status} />
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
          {statusDropdownBus === bus.id && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              {['IDLE', 'IN_SERVICE', 'COMPLETED', 'MAINTENANCE', 'OUT_OF_SERVICE'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(bus.id, status as Bus['status'])}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    status === 'IDLE' ? 'bg-gray-400' :
                    status === 'IN_SERVICE' ? 'bg-green-500' :
                    status === 'COMPLETED' ? 'bg-blue-500' :
                    status === 'MAINTENANCE' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'lastLocation',
      title: 'Last Location',
      render: (bus) => (
        <span className="text-sm text-gray-700">
          {bus.lastLocation ? (
            <span className="flex items-center gap-1.5" title={`Lat: ${bus.lastLocation.lat}, Lng: ${bus.lastLocation.lng}`}>
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              {bus.lastLocation.address || 'Unknown'}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </span>
      ),
    },
    {
      key: 'lastUpdated',
      title: 'Last Updated',
      sortable: true,
      render: (bus) => (
        <span className="text-sm text-gray-500">
          {bus.lastUpdated ? new Date(bus.lastUpdated).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (bus) => (
        <ActionMenu
          actions={createBusActions(
            bus,
            () => openBusDetails(bus.id),
            () => openEditModal(bus),
            () => handleDelete(bus),
            () => setStatusDropdownBus(bus.id)
          )}
        />
      ),
    },
  ];

  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'ALL', label: 'All Status' },
        { value: 'IDLE', label: 'IDLE' },
        { value: 'IN_SERVICE', label: 'IN_SERVICE' },
        { value: 'COMPLETED', label: 'COMPLETED' },
        { value: 'MAINTENANCE', label: 'MAINTENANCE' },
        { value: 'OUT_OF_SERVICE', label: 'OUT_OF_SERVICE' },
      ],
      value: 'ALL',
      onChange: (value: string) => setFilters({ status: value as any }),
    },
    {
      key: 'route',
      label: 'Route',
      options: [
        { value: 'ALL', label: 'All Routes' },
        ...availableRoutes.map(r => ({ value: r.id, label: r.name })),
      ],
      value: 'ALL',
      onChange: (value: string) => setFilters({ routeId: value }),
    },
  ];

  const hasActiveFilters = filterConfig.some(f => f.value !== 'ALL');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BusIcon className="w-7 h-7 text-blue-600" />
            Buses
          </h1>
          <p className="text-gray-500 mt-1">Manage buses, routes, and operational status</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Bus
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <SearchInput
          placeholder="Search by bus number or model..."
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
            <p className="text-red-800 font-medium">Failed to load buses</p>
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
        data={buses}
        loading={loading}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} buses
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

      {/* Bus Details Modal */}
      <BusDetailsModal
        bus={selectedBus}
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
      />

      {/* Add/Edit Bus Modal */}
      <AddEditBusModal
        bus={editingBus}
        availableRoutes={availableRoutes}
        isOpen={isAddEditModalOpen}
        onClose={closeAddEditModal}
        onSave={async (busId, payload) => {
          if (busId) {
            await updateBus(busId, payload);
          } else {
            await createBus(payload as any);
          }
        }}
        loading={routesLoading}
      />
    </div>
  );
};

export default BusesPage;
