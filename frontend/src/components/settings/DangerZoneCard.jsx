import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AlertTriangle, LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DangerZoneCard() {
  const { isDark } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignOut = () => { logout(); navigate('/login'); };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-xl border shadow-sm overflow-hidden mt-2
          ${isDark
            ? 'bg-red-500/[0.04] border-red-500/20'
            : 'bg-red-50/50 border-red-200 shadow-red-100/30'}`}
      >
        {/* Header */}
        <div className={`flex items-center gap-2.5 px-6 py-4 border-b
          ${isDark ? 'border-red-500/10' : 'border-red-100'}`}>
          <AlertTriangle size={18} className="text-red-500" />
          <h2 className={`text-lg font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            Danger Zone
          </h2>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-1.5">
              <h3 className={`text-base font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Sign out of your account
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                This will remove your session from this device. You'll need to sign in again to access your reviews.
              </p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 flex-shrink-0
                ${isDark
                  ? 'text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50'
                  : 'text-red-500 border-red-200 hover:bg-red-100/60 hover:border-red-300'}`}
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </motion.section>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl border p-8 z-50
                ${isDark
                  ? 'bg-[#111115] border-white/[0.08] shadow-2xl shadow-black/60'
                  : 'bg-white border-gray-200 shadow-2xl shadow-gray-300/40'}`}
            >
              <button
                onClick={() => setShowConfirm(false)}
                className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors
                  ${isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <X size={16} />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5
                  ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                  <AlertTriangle size={24} className="text-red-500" />
                </div>

                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Sign out?
                </h3>
                <p className={`text-sm mt-3 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Are you sure you want to sign out? You'll need to sign in again to access your reviews.
                </p>

                <div className="flex gap-3 w-full mt-8">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold border transition-all
                      ${isDark
                        ? 'text-gray-300 border-white/[0.08] hover:bg-white/[0.04]'
                        : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-all shadow-sm shadow-red-500/20"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
