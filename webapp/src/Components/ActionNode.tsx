import React from 'react';
import { Handle, Position } from '@xyflow/react';

export interface ActionNodeData extends Record<string, unknown> {
  label?: string;
  service?: string;
  action?: string;
  icon?: string;
  configured?: boolean;
}

interface ActionNodeProps {
  data: ActionNodeData;
  selected?: boolean;
  onClick?: () => void;
}

export const ActionNode: React.FC<ActionNodeProps> = ({ data, selected, onClick }) => {
  const isConfigured = data?.configured ?? false;
  
  return (
    <div 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick && onClick(); } }}
      aria-label={data?.label ? `Configure ${String(data.label)}` : `Configure ${String(data?.service || 'action')} node`}
      className={`
      relative bg-white rounded-lg border-2 shadow-lg min-w-[200px] transition-all duration-200 cursor-pointer
      ${selected ? 'border-blue-500 shadow-blue-200' : isConfigured ? 'border-green-400' : 'border-gray-300'}
      ${selected ? 'shadow-lg' : 'shadow-md'}
      hover:shadow-lg hover:border-blue-400
    `}>
      <div className={`
        absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white
        ${isConfigured ? 'bg-green-500' : 'bg-orange-400'}
      `} />
      
      <div className={`
        px-4 py-3 rounded-t-lg flex items-center gap-3
        ${isConfigured ? 'bg-green-50 border-b border-green-100' : 'bg-orange-50 border-b border-orange-100'}
      `}>
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium
          ${isConfigured ? 'bg-green-500' : 'bg-orange-500'}
        `}>
          {data?.icon ? (
            <span className="material-icons text-sm">{data.icon}</span>
          ) : (
            'A'
          )}
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Action
          </div>
          <div className="text-sm font-semibold text-gray-800">
            {data?.service || 'Select Service'}
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3">
        <div className="text-sm text-gray-700 font-medium mb-1">
          {data?.label || 'Configure Action'}
        </div>
        <div className="text-xs text-gray-500">
          {data?.action || 'Choose an action to perform'}
        </div>
      </div>
      
      <div className={`
        px-4 py-2 rounded-b-lg text-xs font-medium text-center
        ${isConfigured 
          ? 'bg-green-100 text-green-700' 
          : 'bg-orange-100 text-orange-700'
        }
      `}>
        {isConfigured ? '✓ Configured' : '⚠ Needs Configuration'}
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
};
