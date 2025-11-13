import React from 'react';

interface SidebarItem {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  theme?: 'light' | 'dark';
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  collapsed = false,
  onToggleCollapse,
  theme = 'light',
  className = ''
}) => {
  const themeClasses = {
    light: 'bg-white border-r border-gray-200 shadow-xl',
    dark: 'bg-gray-800 border-r border-gray-700 shadow-xl'
  };
  
  const textColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const logoTextColor = theme === 'dark' ? 'text-white' : 'text-gray-800';
  
  return (
    <div className={`flex flex-col h-full ${themeClasses[theme]} ${className}`}>
      <div className={`p-4 ${collapsed ? 'pb-6' : 'pb-12'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <span className={`material-icons ${collapsed ? 'text-3xl' : 'text-4xl'} text-[#7F22FE]`}>grain</span>
          {!collapsed && (
            <span className={`font-bold text-xl font-sora ${logoTextColor}`}>
              Flow Connect
            </span>
          )}
        </div>
      </div>
      
      <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-6'}`}>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index}>
              <a
                href={item.href}
                title={item.label}
                className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} ${collapsed ? 'px-0 py-4' : 'px-3 py-3'} rounded-lg transition-colors w-full ${
                  item.active
                    ? 'bg-purple-100 text-[#7F22FE]'
                    : `${textColor} hover:bg-gray-100 ${theme === 'dark' ? 'hover:bg-gray-700' : ''}`
                }`}
              >
                <span className="material-icons text-2xl">{item.icon}</span>
                {!collapsed && (
                  <span className="font-medium font-sora">{item.label}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4">
        <div className={`${collapsed ? 'flex flex-col items-center gap-2' : 'flex items-center gap-3'}`}>
          

          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`mt-2 ${collapsed ? 'w-10 h-10 flex items-center justify-center rounded-md' : 'flex items-center gap-3 px-3 py-3 rounded-lg'} transition-colors ${textColor} hover:bg-gray-100 ${theme === 'dark' ? 'hover:bg-gray-700' : ''}`}
          >
            <span className="material-icons">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
