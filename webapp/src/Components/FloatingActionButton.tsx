import React from 'react';

interface FloatingActionButtonProps {
  icon: string;
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onClick,
  className = ''
  , ariaLabel
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel || icon}
      className={`fixed bottom-6 right-6 w-12 h-12 bg-gray-800 text-white rounded-full shadow-xl hover:bg-gray-700 transition-colors flex items-center justify-center ${className}`}
    >
      <span className="material-icons text-2xl">{icon}</span>
    </button>
  );
};
