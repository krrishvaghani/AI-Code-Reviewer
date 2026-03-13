import React, { useState, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Github, Search, Bell, X, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';

export default function Navbar({ onMenuClick }) {
  const { isDark } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    searchRef.current?.focus();
  }, []);

  const IconBtn = ({ children, href, onClick, title, badge }) => {
    const cls = `relative p-2.5 rounded-full transition-all ease-linear
      ${isDark
        ? 'text-gray-400 hover:text-white hover:bg-purple-500/10 hover:shadow-inner'
        : 'text-gray-500 hover:text-purple-600 hover:bg-purple-100 hover:shadow-inner'}`;

    if (href) {
      return <a href={href} target="_blank" rel="noopener noreferrer" className={cls} title={title}>{children}{badge && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500 ring-2 ring-white dark:ring-[#0f0f13]" />}</a>;
    }
    return <button onClick={onClick} className={cls} title={title}>{children}{badge && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500 ring-2 ring-white dark:ring-[#0f0f13]" />}</button>;
  };

  return (
    <header
      className={`sticky top-0 z-30 flex items-center h-16 px-5 border-b flex-shrink-0 transition-all duration-200
        ${isDark
          ? 'bg-[#0f0f13]/80 backdrop-blur-xl border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
          : 'bg-white/80 backdrop-blur-xl border-gray-200/80 shadow-sm shadow-purple-100/30'}`}
    >
      {/* ── Mobile hamburger ──────────────────────── */}
      <button
        className={`lg:hidden p-2.5 -ml-1 mr-3 rounded-full transition-all ease-linear
          ${isDark
            ? 'text-gray-400 hover:text-white hover:bg-purple-500/10'
            : 'text-gray-500 hover:text-gray-900 hover:bg-purple-100'}`}
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* ── Mobile brand ──────────────────────────── */}
      <div className="lg:hidden flex items-center gap-2 mr-3">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white shadow-md shadow-purple-500/25">
          AI
        </div>
        <span className={`font-bold text-sm hidden sm:inline ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
          Code Reviewer
        </span>
      </div>

      {/* ── Search bar (center) ───────────────────── */}
      <div className="flex-1 flex justify-center max-w-xl mx-auto">
        <div className={`relative w-full transition-all duration-200 ${searchFocused ? 'scale-[1.01]' : ''}`}>
          <Search
            size={15}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors
              ${searchFocused
                ? 'text-purple-500'
                : (isDark ? 'text-gray-500' : 'text-gray-400')}`}
          />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search code reviews, files, or commands..."
            className={`w-full pl-10 pr-10 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200 outline-none
              ${isDark
                ? `bg-white/[0.04] border text-gray-200 placeholder-gray-500
                   ${searchFocused
                     ? 'border-purple-500/50 bg-white/[0.06] shadow-[0_0_0_3px_rgba(168,85,247,0.1)]'
                     : 'border-white/[0.06] hover:border-white/[0.1]'}`
                : `bg-gray-50/80 border text-gray-900 placeholder-gray-400
                   ${searchFocused
                     ? 'border-purple-400/50 bg-white shadow-[0_0_0_3px_rgba(168,85,247,0.08)]'
                     : 'border-gray-200 hover:border-gray-300'}`}`}
          />

          {searchQuery ? (
            <button
              onClick={handleSearchClear}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors
                ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className={`absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded-md border
              ${isDark
                ? 'text-gray-600 border-white/[0.08] bg-white/[0.03]'
                : 'text-gray-400 border-gray-200 bg-gray-50'}`}>
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* ── Right controls ────────────────────────── */}
      <div className="flex items-center gap-1 ml-3">
        <IconBtn
          href="https://github.com/krrishvaghani/AI-Code-Reviewer"
          title="View on GitHub"
        >
          <Github size={18} />
        </IconBtn>

        <ThemeToggle />

        <IconBtn title="Notifications" badge>
          <Bell size={18} />
        </IconBtn>

        <div className={`w-px h-5 mx-2 ${isDark ? 'bg-white/[0.08]' : 'bg-gray-200'}`} />

        <UserMenu />
      </div>
    </header>
  );
}
