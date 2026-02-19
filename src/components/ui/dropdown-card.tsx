// components/ui/dropdown-card.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

const DropdownCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground border-gray-200 dark:border-gray-700',
      className
    )}
    {...props}
  />
));
DropdownCard.displayName = 'DropdownCard';

const DropdownCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
DropdownCardHeader.displayName = 'DropdownCardHeader';

const DropdownCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
DropdownCardTitle.displayName = 'DropdownCardTitle';

const DropdownCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
DropdownCardContent.displayName = 'DropdownCardContent';

export {
  DropdownCard,
  DropdownCardHeader,
  DropdownCardTitle,
  DropdownCardContent,
};