import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Globe, Check, RotateCcw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const STORAGE_KEY = 'ai_reviewer_backend_url';
function getStoredUrl() { try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; } }

export default function BackendConfigCard() {
  const { isDark } = useTheme();
  const defaultUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const [url, setUrl] = useState(getStoredUrl() || defaultUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [urlValid, setUrlValid] = useState(true);

  const validate = (v) => {
    try { new URL(v); setUrlValid(true); } catch { setUrlValid(false); }
  };

  const handleChange = (e) => { setUrl(e.target.value); validate(e.target.value); setSaved(false); };

  const handleSave = async () => {
    if (!urlValid) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    try { localStorage.setItem(STORAGE_KEY, url.trim()); } catch {}
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUrl(defaultUrl);
    setSaved(false);
    setUrlValid(true);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`rounded-xl border shadow-sm overflow-hidden
        ${isDark
          ? 'bg-[#111115] border-white/[0.06]'
          : 'bg-white border-gray-200 shadow-gray-100/60'}`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2.5 px-6 py-4 border-b
        ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
        <Globe size={18} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Backend Configuration
        </h2>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          <label className={`text-sm font-medium block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            API Base URL
          </label>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="url"
                value={url}
                onChange={handleChange}
                placeholder="https://api.example.com"
                className={`w-full border rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 outline-none
                  ${!urlValid
                    ? (isDark ? 'border-red-500/50 bg-red-500/[0.05]' : 'border-red-300 bg-red-50/50')
                    : (isDark
                      ? 'bg-[#09090b] border-white/[0.08] text-gray-200 focus:border-purple-500/50 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.08)]'
                      : 'bg-gray-50/80 border-gray-200 text-gray-900 focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.06)]')
                  }
                  placeholder-gray-500`}
              />
              {url && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {urlValid
                    ? <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    : <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !urlValid}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0
                ${saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50'}`}
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Saving...</>
              ) : saved ? (
                <><Check size={14} /> Saved</>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>

        {/* Helpers */}
        <div className="flex items-center justify-between pt-1">
          <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            Stored in <code className={`px-1.5 py-0.5 rounded text-[11px] ${isDark ? 'bg-white/[0.04] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>localStorage</code>. Overrides <code className={`px-1.5 py-0.5 rounded text-[11px] ${isDark ? 'bg-white/[0.04] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>VITE_API_BASE_URL</code> at runtime.
          </p>
          {getStoredUrl() && (
            <button
              onClick={handleReset}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors flex-shrink-0 ml-4
                ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <RotateCcw size={12} /> Reset to default
            </button>
          )}
        </div>

        {!urlValid && (
          <p className="text-xs text-red-500">Please enter a valid URL (e.g. https://api.example.com)</p>
        )}
      </div>
    </motion.section>
  );
}
