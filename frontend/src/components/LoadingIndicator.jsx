import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function LoadingIndicator({ message = 'Analyzing your code...' }) {
  const { isDark } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-[2px]
        ${isDark ? 'bg-black/50' : 'bg-white/50'}`}
    >
      <div className={`flex flex-col items-center gap-3 px-6 py-5 rounded-xl border shadow-lg
        ${isDark ? 'bg-[#111] border-white/10 shadow-black/40' : 'bg-white border-gray-200 shadow-gray-200/60'}`}>
        <Loader2 size={24} className={`animate-spin ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
        <div className="text-center">
          <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{message}</p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>This may take a few seconds</p>
        </div>
      </div>
    </motion.div>
  );
}
