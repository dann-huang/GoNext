import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AlternatingSectionProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode;
  reverse?: boolean;
  contentClassName?: string;
  bg?: 'card' | 'background' | 'accent' | 'primary' | 'secondary';
  fullWidth?: boolean;
}

export function AlternatingSection({
  children,
  reverse = false,
  className = '',
  contentClassName = '',
  bg = 'background',
  fullWidth = false,
}: AlternatingSectionProps) {
  const bgClasses = {
    card: 'bg-card',
    background: 'bg-background',
    accent: 'bg-accent/10',
    primary: 'bg-primary/5',
    secondary: 'bg-secondary/5',
  };

  return (
    <section className={cn(
      'py-20',
      bgClasses[bg],
      className
    )}>
      <div className={cn(
        'mx-auto px-4',
        fullWidth ? 'w-full' : 'container'
      )}>
        <div className={cn(
          'flex flex-col items-center gap-12',
          reverse ? 'md:flex-row-reverse' : 'md:flex-row',
          contentClassName
        )}>
          {children}
        </div>
      </div>
    </section>
  );
}

interface SectionContentProps {
  children: ReactNode;
  width?: 'half' | 'full' | 'auto';
  className?: string;
  center?: boolean;
}

export function SectionContent({
  children,
  width = 'half',
  className = '',
  center = false,
}: SectionContentProps) {
  const widthClasses = {
    half: 'md:w-1/2',
    full: 'w-full',
    auto: 'flex-1',
  };

  return (
    <div className={cn(
      'w-full',
      widthClasses[width],
      center ? 'flex flex-col items-center text-center' : '',
      className
    )}>
      {children}
    </div>
  );
}
