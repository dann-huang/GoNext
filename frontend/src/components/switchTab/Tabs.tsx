import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface TabsProps {
  tabs: readonly React.ReactNode[];
  activeTab: number;
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  className = '',
}: TabsProps) {
  const prevTabRef = useRef(activeTab);
  
  useEffect(() => {
    prevTabRef.current = activeTab;
  }, [activeTab]);
  
  const prevTab = prevTabRef.current;
  const direction = activeTab > prevTab ? 'right' : 'left';

  const variants = {
    enter: (dir: 'left' | 'right') => ({
      x: dir === 'right' ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: 'left' | 'right') => ({
      x: dir === 'right' ? -50 : 50,
      opacity: 0,
    }),
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeTab}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'tween', duration: 0.2 },
            opacity: { duration: 0.15 },
          }}
          className="w-full"
        >
          {tabs[activeTab]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}