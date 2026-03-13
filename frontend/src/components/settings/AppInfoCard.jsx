import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Info, Cpu, Globe, Layout, Database, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

const INFO_ROWS = [
  { icon: Layout,   key: 'Application',  value: 'AI Code Reviewer' },
  { icon: Tag,      key: 'Version',      value: '2.0.0' },
  { icon: Cpu,      key: 'AI Providers', value: 'Google Gemini / OpenAI GPT-4' },
  { icon: Globe,    key: 'Frontend',     value: 'React + Vite + Tailwind CSS' },
  { icon: Database, key: 'Backend',      value: 'FastAPI + SQLite' },
];

export default function AppInfoCard() {
  const { isDark } = useTheme();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={`rounded-xl border shadow-sm overflow-hidden
        ${isDark
          ? 'bg-[#111115] border-white/[0.06]'
          : 'bg-white border-gray-200 shadow-gray-100/60'}`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2.5 px-6 py-4 border-b
        ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
        <Info size={18} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Application Information
        </h2>
      </div>

      {/* Table rows with dividers */}
      <div>
        {INFO_ROWS.map((row, i) => {
          const Icon = row.icon;
          const isLast = i === INFO_ROWS.length - 1;
          return (
            <div
              key={row.key}
              className={`flex items-center justify-between px-6 py-4 transition-colors
                ${!isLast
                  ? (isDark ? 'border-b border-white/[0.04]' : 'border-b border-gray-100')
                  : ''}
                ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50/60'}`}
            >
              <div className="flex items-center gap-3">
                <Icon size={15} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{row.key}</span>
              </div>
              <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{row.value}</span>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
