'use client';

import React from 'react';
import { SlidersHorizontal, LucideIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface UserFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
  icon?: LucideIcon;
}

export function UserFilter({
  value,
  onValueChange,
  options,
  placeholder = "Filter",
  className,
  icon: Icon = SlidersHorizontal,
}: UserFilterProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn(
        "w-full md:w-[180px] h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]",
        className
      )}>
        <Icon className="h-4 w-4 mr-2 text-gray-400" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="min-w-[180px] p-1">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="rounded-md cursor-pointer mb-1 last:mb-0">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
