'use client';

import { Sizes, Variants } from '@/config/variantConsts';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import Button from './Button';

const menuBaseStyles = 'absolute z-10 mt-1 w-full rounded-md border border-primary bg-background shadow-md overflow-hidden';

const optionBaseStyles = 'w-full text-left px-4 py-2 text-sm hover:bg-primary/80 hover:text-on-primary transition-colors';

interface SelectProps {
  options: string[];
  text: string;
  onChange: (value: string) => void;
  variant?: Variants;
  selectSize?: Sizes;
  className?: string;
  menuClassName?: string;
  optionClassName?: string;
}

export function Select({
  options,
  text,
  onChange,
  variant = 'primary',
  selectSize = 'md',
  className = '',
  menuClassName = '',
  optionClassName = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const handleCancel = useCallback((event: PointerEvent) => {
    if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);
  useEffect(() => {
    document.addEventListener('pointerdown', handleCancel);
    return () => {
      document.removeEventListener('pointerdown', handleCancel);
    };
  }, [handleCancel]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };
  return <div ref={selectRef} className='relative'  >
    <Button
      variant={variant}
      size={selectSize}
      className={cn(
        'w-full justify-between w-full',
        className
      )}
      onClick={toggleDropdown}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
    >
      <>
        <span className="truncate">{text}</span>
        <ChevronDown
          className={cn(
            'ml-2 h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </>
    </Button>

    {isOpen && (
      <div className={cn(menuBaseStyles, 'bg-background', menuClassName)}
        role="listbox"
        tabIndex={-1}
      >
        {options.map(option => (
          <button
            key={option}
            onClick={() => handleOptionClick(option)}
            className={cn(
              optionBaseStyles,
              'text-left',
              text === option && 'bg-secondary text-on-secondary',
              optionClassName
            )}
            role="option"
            aria-selected={text === option}
          >
            {option}
          </button>
        ))}
      </div>
    )}
  </div>;
}
