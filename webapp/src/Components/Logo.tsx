import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = ''
}) => {
  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl'
  };
  
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className={`material-icons ${iconSizes[size]} text-[#7F22FE]`}>
        grain
      </span>
      {showText && (
        <a href="/" className={`font-bold text-gray-800 ${textSizes[size]} font-sora`}>
          Flow Connect
        </a>
      )}
    </div>
  );
};
