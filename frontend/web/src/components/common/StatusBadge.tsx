import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'fee' | 'attendance' | 'general';
  value?: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'general', value }) => {
  const getStyles = () => {
    if (variant === 'fee') {
      switch (status) {
        case 'PAID':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'PENDING':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'OVERDUE':
          return 'bg-red-100 text-red-800 border-red-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }
    
    if (variant === 'attendance') {
      if (value === undefined) return 'bg-gray-100 text-gray-800';
      if (value >= 90) return 'bg-green-100 text-green-800';
      if (value >= 75) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    }

    switch (status) {
      case 'ACTIVE':
      case 'ONLINE':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
      case 'OFFLINE':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SUSPENDED':
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const displayText = variant === 'attendance' && value !== undefined 
    ? `${value}%` 
    : status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles()}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        variant === 'attendance' 
          ? value && value >= 90 ? 'bg-green-500' : value && value >= 75 ? 'bg-yellow-500' : 'bg-red-500'
          : status === 'PAID' || status === 'ACTIVE' ? 'bg-green-500' : 
            status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
      }`} />
      {displayText}
    </span>
  );
};

export default StatusBadge;
