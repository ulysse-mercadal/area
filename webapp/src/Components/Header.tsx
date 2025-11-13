import React from 'react';
import { Button } from './Button';

interface HeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: string;
    onClick: () => void;
  };
  actions?: Array<{
    label: string;
    icon?: string;
    onClick: () => void;
  }>
  theme?: 'light' | 'dark';
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  description,
  action,
  actions,
  theme = 'light',
  className = ''
}) => {
  const themeClasses = {
    light: 'bg-gray-100/80 border-gray-200',
    dark: 'bg-gray-900/80 border-gray-700'
  };
  
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-800';
  const descColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  
  return (
    <header className={`${themeClasses[theme]} border-b backdrop-blur-sm px-6 py-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold font-sora ${textColor}`}>
            {title}
          </h1>
          {description && (
            <p className={`text-sm font-sora mt-1 ${descColor}`}>
              {description}
            </p>
          )}
        </div>
        
        {actions && actions.length > 0 ? (
          <div className="flex items-center gap-3">
            {actions.map((a: { label: string; icon?: string; onClick: () => void }, idx: number) => (
              <Button
                key={idx}
                onClick={a.onClick}
                icon={a.icon && <span className="material-icons text-2xl">{a.icon}</span>}
              >
                {a.label}
              </Button>
            ))}
          </div>
        ) : action ? (
          <Button
            onClick={action.onClick}
            icon={action.icon && <span className="material-icons text-2xl">{action.icon}</span>}
          >
            {action.label}
          </Button>
        ) : null}
      </div>
    </header>
  );
};
