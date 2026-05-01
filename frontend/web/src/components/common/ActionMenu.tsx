import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Edit2, Ban, CheckCircle, Trash2, MapPin } from 'lucide-react';

interface ActionItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'danger' | 'success';
  onClick: () => void;
}

interface ActionMenuProps {
  actions: ActionItem[];
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return 'text-red-600 hover:bg-red-50';
      case 'success':
        return 'text-green-600 hover:bg-green-50';
      default:
        return 'text-gray-700 hover:bg-gray-50';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
          {actions.map((action) => (
            <button
              key={action.key}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${getVariantStyles(action.variant)}`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const createStudentActions = (
  student: any,
  onView: (student: any) => void,
  onAssignRoute: (student: any) => void,
  onToggleStatus: (student: any) => void
): ActionItem[] => [
  {
    key: 'view',
    label: 'View Details',
    icon: <Eye className="w-4 h-4" />,
    onClick: () => onView(student),
  },
  {
    key: 'assign-route',
    label: 'Assign Route',
    icon: <MapPin className="w-4 h-4" />,
    onClick: () => onAssignRoute(student),
  },
  {
    key: 'toggle-status',
    label: student.status === 'ACTIVE' ? 'Disable Student' : 'Enable Student',
    icon: student.status === 'ACTIVE' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />,
    variant: student.status === 'ACTIVE' ? 'danger' : 'success',
    onClick: () => onToggleStatus(student),
  },
];

export default ActionMenu;
