import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type InputVariant = 'primary' | 'secondary' | 'accent' | 'destructive' | 'ghost' | 'link';
type InputSize = 'sm' | 'md' | 'lg';

const baseStyles = 'flex w-full rounded-md border border-input bg-background font-medium ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const variantStyles = {
  primary: 'border-primary bg-background text-primary focus-visible:ring-primary/50',
  secondary: 'border-secondary text-foreground focus-visible:ring-secondary/50',
  accent: 'border-accent text-foreground focus-visible:ring-accent/50',
  destructive: 'border-destructive text-destructive focus-visible:ring-destructive/50',
  ghost: 'border-transparent hover:bg-accent/10',
  link: 'border-b border-foreground/20 rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground/50',
} as const;

const sizeStyles = {
  sm: 'h-8 px-3 py-1 text-xs',
  md: 'h-10 px-4 py-2 text-sm',
  lg: 'h-12 px-6 py-3 text-base',
} as const;

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  inputSize?: InputSize;
  fullWidth?: boolean;
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'primary',
  inputSize = 'md',
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  return <input
    ref={ref}
    className={cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[inputSize],
      fullWidth && 'w-full',
      className
    )}
    {...props}
  />;
});

Input.displayName = 'Input';
export default Input;