import React from 'react';
import { Filter, X } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters: {
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  onClear?: () => void;
  hasActiveFilters?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onClear, hasActiveFilters }) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 text-gray-500 mr-2">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters</span>
      </div>
      
      {filters.map((filter) => (
        <div key={filter.key} className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">{filter.label}</label>
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px]"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      
      {hasActiveFilters && onClear && (
        <button
          onClick={onClear}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Clear all
        </button>
      )}
    </div>
  );
};

export default FilterBar;
