import React from 'react';
import { motion } from 'framer-motion';
import './Loader3D.css';

// Loader3D Component
const Loader3D = ({ size = 40, duration = 800 }) => {
  return (
    <div className="loader-3d-container">
      <div 
        className="boxes"
        style={{
          '--size': `${size}px`,
          '--duration': `${duration}ms`
        }}
      >
        <div className="box">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="box">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="box">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="box">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  );
};

// LoadingScreen Component
const LoadingScreen = ({ 
  message = "Loading...", 
  showMessage = true, 
  fullScreen = true,
  className = "",
  size = 40,
  duration = 800 
}) => {
  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] flex flex-col items-center justify-center z-50"
    : `flex flex-col items-center justify-center p-8 ${className}`;

  return (
    <div className={containerClasses}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-12"
      >
        {/* 3D Loader */}
        <div className="mb-4">
          <Loader3D size={size} duration={duration} />
        </div>

        {/* Loading Message */}
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mt-8"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              {message}
            </h3>
            <div className="flex items-center justify-center gap-1">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default LoadingScreen;