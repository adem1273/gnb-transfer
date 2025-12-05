import React from 'react';
import { motion } from 'framer-motion';

function Loading({ message = 'Loading...', fullScreen = false }) {
  const containerClass = fullScreen
    ? 'fixed inset-0 flex flex-col justify-center items-center bg-white z-50'
    : 'flex flex-col justify-center items-center py-12';

  return (
    <div className={containerClass} role="status" aria-live="polite" aria-label={message}>
      <motion.div
        className="relative w-16 h-16 mb-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full"></div>
      </motion.div>

      <motion.p
        className="text-gray-600 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.p>

      {/* Animated dots */}
      <motion.div className="flex gap-1 mt-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-blue-600 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

export default Loading;
