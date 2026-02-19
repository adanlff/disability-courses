"use client";

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { SettingButtonProps, SliderControlProps } from './types';

// Reusable Setting Button Component
export const SettingButton: React.FC<SettingButtonProps & { speakText?: (text: string) => void }> = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick, 
  onMouseEnter,
  disabled = false,
  variant = 'primary',
  speakText
}) => {
  const variantStyles = {
    primary: active 
      ? 'bg-[#005EB8] text-white border-[#005EB8]' 
      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
    accent: active 
      ? 'bg-[#F4B400] text-[#1A1A1A] border-[#F4B400]' 
      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
    success: active 
      ? 'bg-[#008A00] text-white border-[#008A00]' 
      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
    danger: active 
      ? 'bg-[#D93025] text-white border-[#D93025]' 
      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => {
        if (onMouseEnter && !disabled) onMouseEnter();
        if (speakText && !disabled) speakText(label);
      }}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200
        ${disabled 
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50 border-gray-200 dark:border-gray-700' 
          : variantStyles[variant]
        }
        focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:ring-offset-1
        min-h-[70px] w-full
      `}
      aria-pressed={active}
      aria-label={label}
      aria-disabled={disabled}
    >
      <Icon className="w-5 h-5 mb-1.5" />
      <span className="text-xs font-medium text-center leading-tight">{label}</span>
    </button>
  );
};

// Reusable Slider Control Component
export const SliderControl: React.FC<SliderControlProps> = ({ 
  label, 
  value, 
  min, 
  max, 
  step, 
  onChange, 
  unit = '',
  disabled = false,
  onIncrement,
  onDecrement,
  icon: Icon,
  displayValue
}) => (
  <div className={`p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${disabled ? 'opacity-50' : ''}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[#005EB8]" />}
        <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
      </div>
      <span className="text-xs font-semibold text-[#005EB8] bg-[#005EB8]/10 px-2 py-0.5 rounded">
        {displayValue || value}{unit}
      </span>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={disabled ? undefined : onDecrement}
        disabled={disabled || value <= min}
        className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label={`Kurangi ${label}`}
      >
        <Minus className="w-3 h-3 text-gray-600 dark:text-gray-300" />
      </button>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => !disabled && onChange(Number(e.target.value))}
        disabled={disabled}
        className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#005EB8] disabled:cursor-not-allowed"
        aria-label={`${label} control`}
      />
      <button
        onClick={disabled ? undefined : onIncrement}
        disabled={disabled || value >= max}
        className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label={`Tambah ${label}`}
      >
        <Plus className="w-3 h-3 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  </div>
);

// Select Control Component
interface SelectControlProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export const SelectControl: React.FC<SelectControlProps> = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  icon: Icon
}) => (
  <div className={`p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${disabled ? 'opacity-50' : ''}`}>
    <label className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
      {Icon && <Icon className="w-4 h-4 text-[#005EB8]" />}
      <span>{label}</span>
    </label>
    <select
      value={value}
      onChange={(e) => !disabled && onChange(e.target.value)}
      disabled={disabled}
      className="w-full p-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// Info Box Component
interface InfoBoxProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  variant?: 'info' | 'success' | 'warning';
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  icon: Icon,
  title,
  description,
  variant = 'info'
}) => {
  const variantStyles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
  };

  const iconStyles = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400'
  };

  const textStyles = {
    info: 'text-blue-800 dark:text-blue-200',
    success: 'text-green-800 dark:text-green-200',
    warning: 'text-yellow-800 dark:text-yellow-200'
  };

  const subTextStyles = {
    info: 'text-blue-700 dark:text-blue-300',
    success: 'text-green-700 dark:text-green-300',
    warning: 'text-yellow-700 dark:text-yellow-300'
  };

  return (
    <div className={`p-3 rounded-lg border ${variantStyles[variant]}`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 mt-0.5 ${iconStyles[variant]}`} />
        <div>
          <p className={`text-sm font-medium ${textStyles[variant]}`}>{title}</p>
          <p className={`text-xs ${subTextStyles[variant]}`}>{description}</p>
        </div>
      </div>
    </div>
  );
};
