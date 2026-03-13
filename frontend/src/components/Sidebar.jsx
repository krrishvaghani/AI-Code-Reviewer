import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Code2, MessageSquare, GitBranch,
  Clock, Settings, X, Sparkles, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SidebarItem from './SidebarItem';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard/analytics', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/dashboard/review',    icon: Code2,           label: 'Code Review' },
      { to: '/dashboard/chat',      icon: MessageSquare,   label: 'Chat with Code' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/dashboard/github',  icon: GitBranch, label: 'Repository Analysis' },
      { to: '/dashboard/history', icon: Clock,     label: 'Review History' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export default function Sidebar({ isOpen, onClose, isMobile, collapsed, onToggleCollapse }) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const width = collapsed ? 'w-[76px]' : 'w-[260px]';

  const sidebarContent = (
    <aside
      className={`flex flex-col h-full ${width} border-r transition-all duration-300 ease-in-out
        ${isDark
          ? 'bg-[#0f0f13] border-white/[0.06]'
          : 'bg-white border-gray-200/80'}`}
    >
      {/* ── Brand header ───────────────────────────── */}
      <div
        className={`flex items-center h-16 px-4 border-b flex-shrink-0
          ${collapsed ? 'justify-center' : 'justify-between'}
          ${isDark ? 'border-white/[0.06]' : 'border-gray-200/80'}`}
      >
        {collapsed ? (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Sparkles size={18} className="text-white" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <span className={`font-bold text-sm tracking-tight leading-none block truncate
                  ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  AI Code Reviewer
                </span>
                <span className={`block text-[10px] mt-1 font-medium
                  ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Developer Tools
                </span>
              </div>
            </div>

            {isMobile && (
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-all ${isDark
                  ? 'text-gray-500 hover:text-white hover:bg-purple-500/10'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-purple-50'}`}
              >
                <X size={18} />
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Navigation sections ────────────────────── */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-4">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={section.label} className={idx > 0 ? 'mt-5' : ''}>
            {/* Section label */}
            {!collapsed && (
              <div className={`px-6 mb-2 text-[10px] font-bold uppercase tracking-[0.16em]
                ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                {section.label}
              </div>
            )}
            {collapsed && idx > 0 && (
              <div className={`mx-5 mb-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-200'}`} />
            )}

            <div className={`flex flex-col gap-1 ${collapsed ? 'px-3 items-center' : 'px-4'}`}>
              {section.items.map(item => (
                <SidebarItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  collapsed={collapsed}
                  onClick={isMobile ? onClose : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Collapse toggle (desktop only) ─────────── */}
      {!isMobile && (
        <div className={`border-t px-4 py-3 flex-shrink-0
          ${isDark ? 'border-white/[0.06]' : 'border-gray-200/80'}`}>
          <button
            onClick={onToggleCollapse}
            className={`w-full flex items-center gap-3 py-2.5 transition-all duration-200 font-medium text-sm
              ${collapsed ? 'justify-center rounded-2xl px-0' : 'px-4 rounded-full'}
              ${isDark
                ? 'text-gray-500 hover:text-gray-300 hover:bg-purple-500/10 hover:shadow-inner'
                : 'text-gray-400 hover:text-gray-700 hover:bg-purple-50 hover:shadow-inner'}`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed && <span className="text-[13px]">Collapse</span>}
          </button>
        </div>
      )}

      {/* ── User footer ────────────────────────────── */}
      <div className={`border-t px-4 py-3 flex-shrink-0
        ${isDark ? 'border-white/[0.06]' : 'border-gray-200/80'}`}>
        <div className={`flex items-center gap-3 transition-all
          ${collapsed ? 'justify-center py-2' : 'px-3 py-2.5 rounded-2xl'}
          ${isDark
            ? 'bg-white/[0.03] hover:bg-white/[0.05]'
            : 'bg-purple-50/50 hover:bg-purple-50'}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-md shadow-purple-500/20">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className={`text-[13px] font-semibold truncate leading-tight
                ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {user?.name}
              </div>
              <div className={`text-[10px] truncate leading-tight mt-0.5
                ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {user?.email}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );

  /* Mobile: animated overlay */
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className={`fixed inset-y-0 left-0 z-50 shadow-2xl
                ${isDark ? 'shadow-black/40' : 'shadow-purple-200/50'}`}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="hidden lg:flex flex-shrink-0">
      {sidebarContent}
    </div>
  );
}
