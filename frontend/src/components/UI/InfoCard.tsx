import { useState } from 'react';
import { Info, X } from 'lucide-react';

interface InfoCardProps {
  children: React.ReactNode;
  width?: number;
}

export const InfoCard = ({ children, width = 64 }: InfoCardProps) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Info
        className="cursor-pointer"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onTouchStart={() => setShow(true)}
        onTouchEnd={() => setShow(false)}
      />

      {show && (
        <div
          className={`absolute left-5 top-5 w-${width} bg-surface text-text 
          rounded-md shadow-lg border border-primary p-3 z-50`}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};
