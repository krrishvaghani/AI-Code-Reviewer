import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserMenu() {
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const MenuItem = ({ icon: Icon, label, onClick, danger }) => (
    <button
      onClick={() => { setOpen(false); onClick?.(); }}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-full mx-auto transition-all ease-linear
        ${danger
          ? (isDark
            ? 'text-red-400 hover:bg-red-500/10 hover:shadow-inner'
            : 'text-red-500 hover:bg-red-50 hover:shadow-inner')
          : (isDark
            ? 'text-gray-300 hover:bg-purple-500/10 hover:shadow-inner'
            : 'text-gray-700 hover:bg-purple-100 hover:shadow-inner')
        }`}
    >
      <Icon size={18} strokeWidth={1.75} className={danger ? '' : (isDark ? 'text-gray-400' : 'text-gray-600')} />
      {label}
    </button>
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="group relative flex items-center justify-center w-[131px] h-[51px] rounded-[15px] cursor-pointer transition-all duration-300 ease outline-none bg-[rgba(46,142,255,0.2)] bg-gradient-to-br from-[#2e8eff] from-0% to-transparent to-30% hover:bg-[rgba(46,142,255,0.7)] hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] focus:bg-[rgba(46,142,255,0.7)] focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
      >
        <div className={`w-[127px] h-[47px] rounded-[13px] flex items-center justify-center gap-2 font-semibold transition-colors ${isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-800'}`}>
          <User size={18} className={isDark ? 'text-white' : 'text-gray-800'} />
          <span className="truncate max-w-[50px] text-sm">{user?.name?.split(' ')[0] || 'User'}</span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border p-3 z-50
              ${isDark
                ? 'bg-[#111115] border-white/[0.08] shadow-xl shadow-black/50'
                : 'bg-white border-gray-100 shadow-xl shadow-purple-200/50'}`}
          >
            {/* User card */}
            <div className={`flex items-center gap-3 px-3 py-3 mb-2 rounded-2xl
              ${isDark ? 'bg-white/[0.03]' : 'bg-purple-50/50'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg shadow-purple-500/25">
                {initials}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.name}
                </p>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <MenuItem icon={User}     label="Profile"  onClick={() => navigate('/dashboard/settings')} />
              <MenuItem icon={Settings} label="Settings" onClick={() => navigate('/dashboard/settings')} />

              <div className={`my-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`} />

              <MenuItem icon={LogOut} label="Logout" onClick={handleLogout} danger />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
