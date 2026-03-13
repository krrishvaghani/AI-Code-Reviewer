import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle({ size = 18, className = '' }) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
      className={`relative p-2.5 rounded-full transition-all ease-linear
        ${isDark
          ? 'text-gray-400 hover:text-amber-300 hover:bg-purple-500/10 hover:shadow-inner'
          : 'text-gray-500 hover:text-purple-600 hover:bg-purple-100 hover:shadow-inner'}
        ${className}`}
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -90, scale: 0, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isDark ? <Sun size={size} /> : <Moon size={size} />}
      </motion.div>
    </button>
  );
}
