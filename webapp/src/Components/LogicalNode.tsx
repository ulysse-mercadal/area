import React from 'react';
import { Handle, Position } from '@xyflow/react';

export interface LogicalNodeData extends Record<string, unknown> {
  label?: string;
  logicType?: 'IF' | 'AND' | 'OR' | 'WHILE';
  condition?: string;
  icon?: string;
  configured?: boolean;
}

interface LogicalNodeProps {
  data: LogicalNodeData;
  selected?: boolean;
  onClick?: () => void;
}

export const LogicalNode: React.FC<LogicalNodeProps> = ({ data, selected, onClick }) => {
  const isConfigured = data?.configured ?? false;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick && onClick(); } }}
      aria-label={data?.label ? `Configure ${String(data.label)}` : `Configure ${String(data?.logicType || 'logic')} node`}
      className={`
      relative bg-white rounded-lg border-2 shadow-lg min-w-[200px] transition-all duration-200 cursor-pointer
      ${selected ? 'border-yellow-500 shadow-yellow-200' : isConfigured ? 'border-yellow-400' : 'border-gray-300'}
      ${selected ? 'shadow-lg' : 'shadow-md'}
      hover:shadow-lg hover:border-yellow-400
    `}>
      <div className={`
        absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white
        ${isConfigured ? 'bg-yellow-500' : 'bg-orange-400'}
      `} />

      <div className={`
        px-4 py-3 rounded-t-lg flex items-center gap-3
        ${isConfigured ? 'bg-yellow-50 border-b border-yellow-100' : 'bg-orange-50 border-b border-orange-100'}
      `}>
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium
          ${isConfigured ? 'bg-yellow-500' : 'bg-orange-500'}
        `}>
          {data?.icon ? (
            <span className="material-icons text-sm">{data.icon}</span>
          ) : (
            'L'
          )}
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Logic
          </div>
          <div className="text-sm font-semibold text-gray-800">
            {data?.logicType || 'IF'}
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="text-sm text-gray-700 font-medium mb-1">
          {data?.label || 'Configure Logic'}
        </div>
        <div className="text-xs text-gray-500">
          {(data as any).condition || (data as any).conf?.condition || 'Set a condition or expression for this node'}
        </div>
      </div>

      <div className={`
        px-4 py-2 rounded-b-lg text-xs font-medium text-center
        ${isConfigured 
          ? 'bg-yellow-100 text-yellow-700' 
          : 'bg-orange-100 text-orange-700'
        }
      `}>
        {isConfigured ? '✓ Configured' : '⚠ Needs Configuration'}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        title="Input"
        aria-label="Logic input"
      />

      <Handle
        id="true"
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ top: '34%' }}
        title="True output"
        aria-label="True output"
      />

      <Handle
        id="false"
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ top: '66%' }}
        title="False output"
        aria-label="False output"
      />
      <div
        className="absolute w-14 text-center text-[10px] font-semibold text-white px-2 py-0.5 rounded-full shadow-sm pointer-events-none"
        style={{ top: '34%', right: '-72px', background: 'rgba(34,197,94,1)', transform: 'translateY(-50%)', zIndex: 30 }}
      >
        True
      </div>
      <div
        className="absolute w-14 text-center text-[10px] font-semibold text-white px-2 py-0.5 rounded-full shadow-sm pointer-events-none"
        style={{ top: '66%', right: '-72px', background: 'rgba(239,68,68,1)', transform: 'translateY(-50%)', zIndex: 30 }}
      >
        False
      </div>
    </div>
  );
};
