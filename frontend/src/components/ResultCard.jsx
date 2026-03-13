import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import CodeDiffViewer from './CodeDiffViewer';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

function parseInlineCode(text, isDark) {
  const parts = text.split(/(`[^`\n]+`)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code key={i} className={`text-xs font-mono px-1.5 py-0.5 rounded mx-0.5
        ${isDark ? 'bg-white/[0.06] text-cyan-300' : 'bg-gray-100 text-indigo-600'}`}>
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function ExplanationBody({ text, isDark }) {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return (
    <div className="mt-2 space-y-3">
      {paragraphs.map((p, i) => {
        const isStep = p.toLowerCase().startsWith('step ');
        return (
          <div key={i} className={`text-sm leading-relaxed ${isStep ? 'p-3 rounded-lg border ' + (isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-gray-50 border-gray-200') : ''} ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {parseInlineCode(p, isDark)}
          </div>
        );
      })}
    </div>
  );
}

const SEV_STYLES = {
  high:   { text: 'text-red-500',    label: 'HIGH'  },
  medium: { text: 'text-orange-500', label: 'MED'   },
  low:    { text: 'text-yellow-500', label: 'LOW'   },
  perf:   { text: 'text-blue-400',   label: 'PERF'  },
  owasp:  { text: 'text-rose-500',   label: 'OWASP' },
};

function detectSeverity(text) {
  const t = text.toUpperCase();
  if (t.includes('[SEVERITY: HIGH]') || t.includes('HIGH]'))   return 'high';
  if (t.includes('[SEVERITY: MEDIUM]') || t.includes('MEDIUM]')) return 'medium';
  if (t.includes('[SEVERITY: LOW]') || t.includes('LOW]'))     return 'low';
  if (t.includes('[PERF]'))                                     return 'perf';
  if (t.includes('[OWASP') || t.includes('[CWE'))               return 'owasp';
  return null;
}

function stripTag(text) {
  return text.replace(/\[SEVERITY:\s*(HIGH|MEDIUM|LOW)\]\s*/i, '').replace(/\[PERF\]\s*/i, '').replace(/\[OWASP\s+CWE-\d+\]\s*/i, '').trim();
}

function splitLocation(text) {
  const locRe = /^([A-Za-z0-9_.()\<\>:, ]{1,60}(?:line\s+\d+)?)\s*[—–-]{1,2}\s*/;
  const m = text.match(locRe);
  if (m && m[1].length < text.length - 5) return { location: m[1].trim(), body: text.slice(m[0].length) };
  return { location: null, body: text };
}

function ItemRow({ text, index, sectionKey, isDark, onIssueClick }) {
  const severity = detectSeverity(text);
  const cleaned = severity ? stripTag(text) : text;
  const { location, body } = splitLocation(cleaned);
  const sevStyle = severity ? SEV_STYLES[severity] : null;

  let lineNumber = null;
  if (location) {
    const match = location.match(/(?:line\s+|:)(\d+)/i);
    if (match && match[1]) lineNumber = parseInt(match[1], 10);
  }

  const isWarning = ['issues', 'security_issues'].includes(sectionKey);
  const isSuggestion = sectionKey === 'suggestions';
  const isPerf = sectionKey === 'performance_issues';

  const accentColor = isWarning ? 'border-red-500' : isSuggestion ? 'border-green-500' : isPerf ? 'border-yellow-500' : 'border-gray-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => lineNumber && onIssueClick?.(lineNumber)}
      className={`border-b last:border-b-0 border-l-[3px] p-4 transition-colors group ${accentColor}
        ${lineNumber ? 'cursor-pointer' : ''}
        ${isDark ? 'border-b-white/[0.06] hover:bg-white/[0.03]' : 'border-b-gray-100/50 hover:bg-white'}`}
    >
      <div className="flex items-start gap-3.5">
        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5 shadow-sm
          ${isWarning ? 'bg-red-500 shadow-red-500/20' : isSuggestion ? 'bg-green-500 shadow-green-500/20' : isPerf ? 'bg-yellow-500 shadow-yellow-500/20' : 'bg-gray-500 shadow-gray-500/20'}`}>
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          {(location || sevStyle) && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {location && (
                <code className={`text-xs font-mono px-2 py-0.5 rounded-md border
                  ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  {location}
                </code>
              )}
              {sevStyle && (
                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/[0.05] ${sevStyle.text}`}>
                  {sevStyle.label}
                </span>
              )}
            </div>
          )}
          <p className={`text-[13px] leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {parseInlineCode(body, isDark)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function ResultCard({
  title, icon, items, code, language, colorClass, sectionKey, isOpen, onToggle, onIssueClick, originalCode, onReplaceCode
}) {
  const { isDark } = useTheme();
  const isExplanation = sectionKey === 'explanation';
  const isImprovedCode = sectionKey === 'improved_code';

  return (
    <div className={`border rounded-xl mb-4 transition-all duration-300
      ${isOpen ? (isDark ? 'bg-[#111115] border-white/[0.08] shadow-lg shadow-black/40' : 'bg-white border-gray-200 shadow-md shadow-gray-100/50') : (isDark ? 'bg-[#0a0a0a] border-white/[0.06] hover:border-white/[0.12]' : 'bg-gray-50/50 border-gray-100 hover:border-gray-200 hover:bg-white')}
      overflow-hidden`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-4 transition-colors outline-none`}
      >
        <div className="flex items-center gap-3">
          <span className={`w-1 h-5 rounded-full flex-shrink-0 ${colorClass.dot}`} />
          <span className="text-base leading-none">{icon}</span>
          <span className={`text-sm font-semibold ${colorClass.text}`}>{title}</span>
          {Array.isArray(items) && items.length > 0 && (
            <span className={`ml-1 min-w-[20px] h-5 px-1.5 text-[10px] rounded-full font-bold flex items-center justify-center
              ${isDark ? 'bg-white/[0.08] text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {items.length}
            </span>
          )}
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
              {Array.isArray(items) && items.length > 0 && (
                <div>
                  {items.map((item, idx) => (
                    <ItemRow key={idx} text={item} index={idx} sectionKey={sectionKey} isDark={isDark} onIssueClick={onIssueClick} />
                  ))}
                </div>
              )}
              {isExplanation && typeof items?.[0] === 'string' && (
                <div className="px-5 py-4">
                  <ExplanationBody text={items[0]} isDark={isDark} />
                </div>
              )}
              {isImprovedCode && code && (
                <div className="p-4">
                  <CodeDiffViewer originalCode={originalCode || ''} improvedCode={code} language={language} onReplace={onReplaceCode} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
