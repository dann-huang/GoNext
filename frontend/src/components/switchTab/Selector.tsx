import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SelectorProps {
  tabs: readonly string[];
  activeTab: number;
  onTabChange: (index: number) => void;
  className?: string;
}

export default function Selector({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: SelectorProps) {
  return (
    <div className={cn('w-full flex justify-between', className)}>
      {tabs.map((tab, index) => (
        <button
          key={index}
          onClick={() => onTabChange(index)}
          className={cn(`relative px-4 py-2 rounded-md transition-colors`, {
            'text-primary': activeTab === index,
            'text-on-surface/60 hover:text-on-surface': activeTab !== index,
          })}
        >
          {tab}
          {activeTab === index && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}