import { useState } from 'react';

// ---------------------------------------------------------------------------
// Color map — maps a semantic key to Tailwind utility classes
// ---------------------------------------------------------------------------

const COLORS = {
  red:    {
    border:  'border-red-500/25',
    bg:      'bg-red-500/[0.04]',
    iconBg:  'bg-red-500/15',
    icon:    'text-red-400',
    title:   'text-red-400',
    badge:   'bg-red-500/15 text-red-400',
    bar:     'bg-red-500/20',
  },
  orange: {
    border:  'border-orange-500/25',
    bg:      'bg-orange-500/[0.04]',
    iconBg:  'bg-orange-500/15',
    icon:    'text-orange-400',
    title:   'text-orange-400',
    badge:   'bg-orange-500/15 text-orange-400',
    bar:     'bg-orange-500/20',
  },
  rose:   {
    border:  'border-rose-500/25',
    bg:      'bg-rose-500/[0.04]',
    iconBg:  'bg-rose-500/15',
    icon:    'text-rose-400',
    title:   'text-rose-400',
    badge:   'bg-rose-500/15 text-rose-400',
    bar:     'bg-rose-500/20',
  },
  yellow: {
    border:  'border-yellow-500/25',
    bg:      'bg-yellow-500/[0.04]',
    iconBg:  'bg-yellow-500/15',
    icon:    'text-yellow-400',
    title:   'text-yellow-400',
    badge:   'bg-yellow-500/15 text-yellow-400',
    bar:     'bg-yellow-500/20',
  },
  green:  {
    border:  'border-green-500/25',
    bg:      'bg-green-500/[0.04]',
    iconBg:  'bg-green-500/15',
    icon:    'text-green-400',
    title:   'text-green-400',
    badge:   'bg-green-500/15 text-green-400',
    bar:     'bg-green-500/20',
  },
  indigo: {
    border:  'border-indigo-500/25',
    bg:      'bg-indigo-500/[0.04]',
    iconBg:  'bg-indigo-500/15',
    icon:    'text-indigo-400',
    title:   'text-indigo-400',
    badge:   'bg-indigo-500/15 text-indigo-400',
    bar:     'bg-indigo-500/20',
  },
  blue:   {
    border:  'border-blue-500/25',
    bg:      'bg-blue-500/[0.04]',
    iconBg:  'bg-blue-500/15',
    icon:    'text-blue-400',
    title:   'text-blue-400',
    badge:   'bg-blue-500/15 text-blue-400',
    bar:     'bg-blue-500/20',
  },
  violet: {
    border:  'border-violet-500/25',
    bg:      'bg-violet-500/[0.04]',
    iconBg:  'bg-violet-500/15',
    icon:    'text-violet-400',
    title:   'text-violet-400',
    badge:   'bg-violet-500/15 text-violet-400',
    bar:     'bg-violet-500/20',
  },
};

// ---------------------------------------------------------------------------
// ResultCard
// ---------------------------------------------------------------------------

/**
 * A clean collapsible card used for each AI review section.
 *
 * Props:
 *   icon        — string (emoji) or ReactNode
 *   title       — string
 *   colorKey    — one of the COLORS keys above
 *   count       — number | undefined — shown as badge in header
 *   children    — body content (rendered when open and not empty)
 *   defaultOpen — boolean (default true)
 *   stagger     — CSS animation-delay (e.g. '0.05s') for list entrance
 */
export default function ResultCard({
  icon,
  title,
  colorKey = 'indigo',
  count,
  children,
  defaultOpen = true,
  stagger,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const c = COLORS[colorKey] ?? COLORS.indigo;

  const hasContent = count === undefined ? true : count > 0;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-200 animate-fade-in-up
        ${c.border}
        ${open && hasContent ? c.bg : 'bg-transparent'}`}
      style={stagger ? { animationDelay: stagger } : undefined}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
          hover:bg-white/[0.025]
          ${open && hasContent ? 'border-b border-white/[0.06]' : ''}`}
      >
        {/* Icon bubble */}
        <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm
          ${c.iconBg} ${c.icon}`}>
          {icon}
        </span>

        {/* Title */}
        <span className={`flex-1 text-sm font-semibold ${c.title}`}>{title}</span>

        {/* Count badge */}
        {typeof count === 'number' && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
            {count}
          </span>
        )}

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      {open && (
        <div className="px-4 py-3">
          {!hasContent ? (
            <div className="flex items-center gap-2 text-sm text-gray-600 py-1">
              <svg className="w-4 h-4 text-green-600/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="italic">None detected — looks good!</span>
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Issue / suggestion list item
// ---------------------------------------------------------------------------

const SEV_DOT = {
  high:   'bg-red-500',
  medium: 'bg-orange-500',
  low:    'bg-yellow-500',
  info:   'bg-blue-500',
};

/**
 * A single item row inside a ResultCard body.
 * @param {{ text: string, index: number, severity?: 'high'|'medium'|'low'|'info' }} props
 */
export function ResultItem({ text, index, severity }) {
  const dotColor = SEV_DOT[severity] ?? 'bg-gray-600';

  return (
    <div className="flex items-start gap-2.5 py-1.5 border-b border-white/[0.04] last:border-0">
      <span className={`flex-shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className="text-sm text-gray-300 leading-relaxed">{text}</span>
    </div>
  );
}
