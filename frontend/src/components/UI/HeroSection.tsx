import { ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  children: React.ReactNode;
  className?: string;
  arrowColor?: string;
}

export default function HeroSection({
  children,
  className = '',
  arrowColor = 'text-primary',
}: HeroSectionProps) {
  return (
    <section 
      className={`relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden ${className}`}
    >
      <div className="container mx-auto px-4 flex-1 flex flex-col items-center justify-center">
        {children}
      </div>

      {/* Decorative arrow */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 p-2">
        <div className="animate-bounce flex flex-col items-center">
          <ChevronDown 
            className={`h-8 w-8 ${arrowColor} transition-colors duration-300`}
            strokeWidth={2}
          />
          <span className={`text-sm mt-1 ${arrowColor} transition-colors duration-300`}>
            Scroll down
          </span>
        </div>
      </div>
    </section>
  );
}
