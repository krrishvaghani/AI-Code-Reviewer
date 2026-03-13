import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { User, Camera, Mail, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfileCard() {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className={`rounded-xl border shadow-sm overflow-hidden
        ${isDark
          ? 'bg-[#111115] border-white/[0.06]'
          : 'bg-white border-gray-200 shadow-gray-100/60'}`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2.5 px-6 py-4 border-b
        ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
        <User size={18} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile</h2>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-purple-500/20">
              {initials}
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
              <Camera size={20} className="text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <h3 className={`text-xl font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user?.name || 'User'}
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <Mail size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user?.email || 'user@example.com'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Hash size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                <span className={`text-sm font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  ID: {user?.id || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div className={`self-start px-3.5 py-1.5 rounded-full text-xs font-semibold
            ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            Active
          </div>
        </div>
      </div>
    </motion.section>
  );
}
