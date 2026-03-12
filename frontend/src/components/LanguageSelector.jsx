import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  {
    value: 'python',
    label: 'Python',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.23.01h-8l-.84.08-.79.14-.74.19-.69.24-.61.29-.53.32-.44.36-.34.39-.23.43-.12.46-.01.5.07.55.21.59.36.62.5.62.63.59.74.54.82.46.87.35.9.21.91.06h.51l.19-.01.19-.02.16-.03.14-.04.12-.04.1-.05.08-.06.06-.06.04-.07.03-.07-.01-.07-.05-.07-.1-.06-.14-.06-.19-.06-.22-.05-.26-.04-.29-.03-.3-.02-.32-.01h-.04l-.06.01-.08.02-.1.03-.11.04-.12.06-.12.07-.12.09-.11.1-.1.13-.09.15-.07.18-.05.21-.02.24 0 .27.03.3.07.32.13.34.18.35.24.35.3.34.36.31.42.27.48.22.53.15.58.07h.64l.69-.07.74-.14.78-.2.81-.24.83-.28.84-.3.84-.32.83-.32.81-.3.79-.27.77-.24.73-.2.7-.15.65-.1.59-.04h.54l.5.04.45.07.4.1.34.13.29.15.23.17.17.2.12.22.07.24.04.27.02.29-.03.32-.09.35-.15.38-.22.41-.28.43-.35.44-.42.44-.48.43-.54.4-.59.36-.64.3-.68.23-.71.15-.72.06h-.23l-.26.01-.29.03-.3.05-.31.08-.3.11-.28.14-.26.18-.22.22-.18.26-.11.31-.05.35.02.4.1.45.18.49.27.53.38.56.48.57.59.56.7.54.8.49.89.44.97.37 1.04.3 1.09.21 1.13.11h1.16l1.15-.12 1.12-.24 1.07-.35 1.01-.45.93-.55.84-.63.73-.7.61-.76.49-.8.35-.83.2-.84.06-.84-.1-.82-.26-.78-.4-.73-.54-.67-.67-.59-.79-.5-.9-.4-.99-.3-1.07-.19-1.12-.08-1.84.04z"/>
      </svg>
    ),
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    value: 'javascript',
    label: 'JavaScript',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/>
      </svg>
    ),
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  {
    value: 'java',
    label: 'Java',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M8.851 18.56s-.917.534.653.714c1.902.218 2.874.187 4.969-.211 0 0 .552.346 1.321.646-4.699 2.013-10.633-.118-6.943-1.149M8.276 15.933s-1.028.761.542.924c2.032.209 3.636.227 6.413-.308 0 0 .384.389.987.602-5.679 1.661-12.007.13-7.942-1.218M13.116 11.475c1.158 1.333-.304 2.533-.304 2.533s2.939-1.518 1.589-3.418c-1.261-1.772-2.228-2.652 3.007-5.688 0-.001-8.216 2.051-4.292 6.573M19.33 20.504s.679.559-.747.991c-2.712.822-11.288 1.069-13.669.033-.856-.373.75-.89 1.254-.998.527-.114.828-.093.828-.093-.953-.671-6.156 1.317-2.643 1.887 9.58 1.553 17.462-.7 14.977-1.82M9.292 13.21s-4.362 1.036-1.544 1.412c1.189.159 3.561.123 5.77-.062 1.806-.152 3.618-.477 3.618-.477s-.637.272-1.098.587c-4.429 1.165-12.986.623-10.522-.568 2.082-1.006 3.776-.892 3.776-.892M17.116 17.584c4.503-2.34 2.421-4.589.968-4.285-.355.074-.515.138-.515.138s.132-.207.385-.297c2.875-1.011 5.086 2.981-.928 4.562 0-.001.07-.062.09-.118M14.401 0s2.494 2.494-2.365 6.33c-3.896 3.077-.888 4.832-.001 6.836-2.274-2.053-3.943-3.858-2.824-5.539 1.644-2.469 6.197-3.665 5.19-7.627M9.734 23.924c4.322.277 10.959-.153 11.116-2.198 0 0-.302.775-3.572 1.391-3.688.694-8.239.613-10.937.168 0-.001.553.457 3.393.639"/>
      </svg>
    ),
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    value: 'cpp',
    label: 'C++',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M22.394 6c-.167-.29-.398-.543-.652-.69L12.926.22c-.508-.293-1.339-.293-1.848 0L2.26 5.31c-.508.293-.923 1.013-.923 1.6v10.18c0 .294.104.62.271.91.167.29.398.543.652.69l8.816 5.09c.508.293 1.339.293 1.848 0l8.816-5.09c.254-.147.485-.4.652-.69.167-.29.27-.616.27-.91V6.91c.003-.294-.1-.62-.268-.91zM12 19.11c-3.92 0-7.109-3.19-7.109-7.11 0-3.92 3.19-7.11 7.11-7.11a7.133 7.133 0 016.156 3.553l-3.076 1.78a3.567 3.567 0 00-3.08-1.78A3.56 3.56 0 008.444 12 3.56 3.56 0 0012 15.555a3.57 3.57 0 003.08-1.778l3.078 1.78A7.135 7.135 0 0112 19.11zm7.11-6.715h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79zm2.962 0h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79z"/>
      </svg>
    ),
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
];

export default function LanguageSelector({ language, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = LANGUAGES.find((l) => l.value === language) ?? LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-lg border text-sm font-medium transition-all
          ${open
            ? 'bg-indigo-500/10 border-indigo-500/40 text-white'
            : 'bg-white/[0.04] border-white/[0.1] text-gray-300 hover:bg-white/[0.07] hover:border-white/[0.18] hover:text-white'
          }`}
      >
        <span className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${selected.color}`}>
          {selected.icon}
        </span>
        <span>{selected.label}</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[148px] bg-[#161b27] border border-white/[0.1] rounded-xl shadow-2xl shadow-black/50 py-1 animate-fade-in">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              onClick={() => { onChange(lang.value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors
                ${lang.value === language
                  ? 'text-white bg-indigo-500/15'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                }`}
            >
              <span className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${lang.color}`}>
                {lang.icon}
              </span>
              <span className="font-medium">{lang.label}</span>
              {lang.value === language && (
                <svg className="ml-auto w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
