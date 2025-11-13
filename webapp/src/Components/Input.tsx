import React from 'react';

interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  error,
  required = false,
  disabled = false
}) => {
  const id = React.useId();
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-600 font-sora">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800 font-sora text-sm focus:outline-none focus:ring-2 focus:ring-[#7F22FE] focus:border-transparent shadow-sm ${
          error ? 'border-red-500' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {error && (
        <span className="text-sm text-red-500 font-sora">{error}</span>
      )}
    </div>
  );
};
