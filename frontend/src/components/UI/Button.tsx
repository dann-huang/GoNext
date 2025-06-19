import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'destructive' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const variantStyles = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90',
  secondary: 'bg-secondary text-on-secondary hover:bg-secondary/80',
  accent: 'bg-accent text-on-accent hover:bg-accent/90',
  destructive: 'bg-error text-on-error hover:bg-error/90',
  ghost: 'hover:bg-accent/10 hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
} as const;

const outlineStyles = {
  primary: 'border border-primary text-primary hover:bg-primary/10',
  secondary: 'border border-secondary text-secondary hover:bg-secondary/10',
  accent: 'border border-accent text-accent hover:bg-accent/10',
  destructive: 'border border-error text-error hover:bg-error/10',
  ghost: 'border border-muted text-foreground hover:bg-muted/50',
  link: 'border-0 text-primary underline-offset-4 hover:underline',
} as const;

const sizeStyles = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
} as const;


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  outline?: boolean;
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  outline = false,
  className = '',
  children,
  disabled,
  ...props
}, ref) => {

  const buttonStyles = outline
    ? outlineStyles[variant as keyof typeof outlineStyles]
    : variantStyles[variant];

  return (
    <button
      ref={ref}
      className={cn(
        baseStyles,
        buttonStyles,
        sizeStyles[size],
        fullWidth && 'w-full',
        isLoading && 'relative text-transparent',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;