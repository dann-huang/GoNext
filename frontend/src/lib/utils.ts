import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility to generate color variants for components
export function getColorVariants(
  color: 'primary' | 'secondary' | 'accent' | 'destructive' | 'success' | 'warning' | 'info',
  variant: 'bg' | 'text' | 'border' | 'ring' | 'hover' | 'focus' = 'bg'
) {
  const variants = {
    bg: {
      primary: 'bg-primary text-on-primary',
      secondary: 'bg-secondary text-on-secondary',
      accent: 'bg-accent text-on-accent',
      destructive: 'bg-error text-on-error',
      success: 'bg-success text-on-success',
      warning: 'bg-warning text-on-warning',
      info: 'bg-info text-on-info',
    },
    text: {
      primary: 'text-primary',
      secondary: 'text-secondary',
      accent: 'text-accent',
      destructive: 'text-error',
      success: 'text-success',
      warning: 'text-warning',
      info: 'text-info',
    },
    border: {
      primary: 'border-primary',
      secondary: 'border-secondary',
      accent: 'border-accent',
      destructive: 'border-error',
      success: 'border-success',
      warning: 'border-warning',
      info: 'border-info',
    },
    ring: {
      primary: 'ring-primary',
      secondary: 'ring-secondary',
      accent: 'ring-accent',
      destructive: 'ring-error',
      success: 'ring-success',
      warning: 'ring-warning',
      info: 'ring-info',
    },
    hover: {
      primary: 'hover:bg-primary/90',
      secondary: 'hover:bg-secondary/80',
      accent: 'hover:bg-accent/90',
      destructive: 'hover:bg-error/90',
      success: 'hover:bg-success/90',
      warning: 'hover:bg-warning/90',
      info: 'hover:bg-info/90',
    },
    focus: {
      primary: 'focus:ring-primary',
      secondary: 'focus:ring-secondary',
      accent: 'focus:ring-accent',
      destructive: 'focus:ring-error',
      success: 'focus:ring-success',
      warning: 'focus:ring-warning',
      info: 'focus:ring-info',
    },
  };

  return variants[variant][color];
}
