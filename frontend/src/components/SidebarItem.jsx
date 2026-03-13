import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

export default function SidebarItem({ to, icon: Icon, label, collapsed, onClick }) {
  const { isDark } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <NavLink
      to={to}
      onClick={onClick}
      onMouseEnter={() => collapsed && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className={({ isActive }) =>
        `group relative flex items-center gap-4 font-semibold transition-all ease-linear
         ${collapsed ? 'justify-center p-3 rounded-2xl' : 'p-4 rounded-full'}
         ${isActive
           ? 'bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-lg shadow-purple-500/25'
           : (isDark
             ? 'text-gray-300 hover:bg-purple-500/10 hover:shadow-inner'
             : 'text-gray-700 hover:bg-purple-100 hover:shadow-inner')
         }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={collapsed ? 22 : 20}
            strokeWidth={1.75}
            className={`flex-shrink-0 transition-colors ${
              isActive
                ? 'text-white'
                : (isDark
                  ? 'text-gray-400 group-hover:text-purple-400'
                  : 'text-gray-600 group-hover:text-purple-600')
            }`}
          />

          {!collapsed && (
            <span className={`text-sm ${isActive ? 'text-white' : ''}`}>{label}</span>
          )}

          {/* Tooltip — collapsed mode */}
          {collapsed && showTooltip && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className={`absolute left-full ml-3 z-50 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap pointer-events-none shadow-lg
                ${isDark
                  ? 'bg-[#1e1e24] text-white border border-white/10 shadow-black/40'
                  : 'bg-gray-900 text-white shadow-gray-400/30'}`}
            >
              {label}
              <div className={`absolute right-full top-1/2 -translate-y-1/2 w-0 h-0
                border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent
                ${isDark ? 'border-r-[6px] border-r-[#1e1e24]' : 'border-r-[6px] border-r-gray-900'}`}
              />
            </motion.div>
          )}
        </>
      )}
    </NavLink>
  );
}
