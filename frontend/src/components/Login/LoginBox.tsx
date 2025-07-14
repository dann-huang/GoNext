import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginGuest from './LoginGuest';
import LoginReturn from './LoginReturn';

type TabType = 'new' | 'returning';

export default function LoginBox() {
  const [activeTab, setActiveTab] = useState<TabType>('new');

  return (
    <div className="w-full h-full p-10 flex flex-col items-center">
      <h2 className="text-2xl font-bold text-primary">Welcome</h2>
      <p className="text-sm mt-2">
        Some live features like chat requires an account.
      </p>
      <div className="w-full flex justify-around mt-5">
        <button
          onClick={() => setActiveTab('new')}
          className={`relative px-4 py-2 rounded-md transition-colors ${
            activeTab === 'new'
              ? 'text-primary'
              : 'text-on-surface/60 hover:text-on-surface'
          }`}
        >
          First time?
          {activeTab === 'new' && (
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
        <button
          onClick={() => setActiveTab('returning')}
          className={`relative px-4 py-2 rounded-md transition-colors ${
            activeTab === 'returning'
              ? 'text-primary'
              : 'text-on-surface/60 hover:text-on-surface'
          }`}
        >
          Returning?
          {activeTab === 'returning' && (
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
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {activeTab === 'new' ? <LoginGuest /> : <LoginReturn />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
