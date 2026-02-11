'use client';

import { motion } from 'framer-motion';
import { useGlobeStore } from '@/stores/globeStore';

export function StartCommonsButton() {
  const setShowOnboarding = useGlobeStore((s) => s.setShowOnboarding);

  const handleClick = () => setShowOnboarding(true);

  return (
    <motion.button
      onClick={handleClick}
      aria-label="Start a Commons"
      className="
        fixed bottom-6 right-6 z-40
        flex items-center gap-2
        rounded-full
        bg-gradient-to-r from-cyan-500 to-teal-400
        px-5 py-3 max-sm:px-4 max-sm:py-2.5
        text-sm max-sm:text-xs font-semibold text-gray-950
        shadow-lg shadow-cyan-500/25
        cursor-pointer focus-ring
      "
      whileHover={{ scale: 1.05, boxShadow: '0 0 24px rgba(6,182,212,0.45)' }}
      whileTap={{ scale: 0.97 }}
      animate={{
        boxShadow: [
          '0 0 12px rgba(6,182,212,0.2)',
          '0 0 20px rgba(6,182,212,0.4)',
          '0 0 12px rgba(6,182,212,0.2)',
        ],
      }}
      transition={{
        boxShadow: {
          repeat: Infinity,
          duration: 2.5,
          ease: 'easeInOut',
        },
      }}
    >
      {/* Plus icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="shrink-0"
      >
        <path
          d="M8 1v14M1 8h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      Start a Commons
    </motion.button>
  );
}
