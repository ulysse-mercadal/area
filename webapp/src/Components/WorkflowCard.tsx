import React from 'react';

interface WorkflowCardProps {
  title: string;
  lastModified: string;
  createdAt?: string;
  status: 'active' | 'inactive' | 'error';
  icon: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onPlay?: () => void;
  onToggle?: () => void;
  className?: string;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  title,
  lastModified,
  createdAt,
  status,
  icon,
  onEdit,
  onDelete,
  onPlay,
  onToggle,
  className = ''
}) => {
  const statusConfig = {
    active: {
      icon: 'check_circle',
      text: 'Active',
      color: 'text-green-600'
    },
    inactive: {
      icon: 'pause_circle',
      text: 'Inactive',
      color: 'text-gray-600'
    },
    error: {
      icon: 'error',
      text: 'Error',
      color: 'text-yellow-600'
    }
  };
  
  const currentStatus = statusConfig[status];
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="material-icons text-2xl text-[#7F22FE]">{icon}</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-800 font-sora">{title}</h3>
          <p className="text-sm text-gray-600 font-sora">{lastModified}</p>
          {createdAt && <p className="text-xs text-gray-500 mt-1">{createdAt}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <span className={`material-icons text-base ${currentStatus.color}`}>
          {currentStatus.icon}
        </span>
        <span className={`text-sm font-semibold font-sora ${currentStatus.color}`}>
          {currentStatus.text}
        </span>
      </div>
      <div className="flex justify-end gap-2">
        {status === 'inactive' && onPlay && (
          <button
            onClick={onPlay}
            aria-label="Execute workflow"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="material-icons text-2xl">play_arrow</span>
          </button>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title={status === 'active' ? 'Disable workflow' : 'Enable workflow'}
            aria-label={status === 'active' ? 'Disable workflow' : 'Enable workflow'}
          >
            <span className="material-icons text-2xl">
              {status === 'active' ? 'toggle_on' : 'toggle_off'}
            </span>
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Edit workflow"
          >
            <span className="material-icons text-2xl">edit</span>
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Delete workflow"
          >
            <span className="material-icons text-2xl">delete</span>
          </button>
        )}
      </div>
    </div>
  );
};
