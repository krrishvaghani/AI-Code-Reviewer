const LANGUAGES = [
  { value: 'python',     label: 'Python',      icon: '🐍' },
  { value: 'javascript', label: 'JavaScript',  icon: '🟨' },
  { value: 'java',       label: 'Java',        icon: '☕' },
  { value: 'cpp',        label: 'C++',         icon: '⚙️'  },
];

export default function LanguageSelector({ language, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-400 whitespace-nowrap">
        Language:
      </label>
      <div className="relative">
        <select
          value={language}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer hover:border-gray-500 transition-colors"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.icon}  {lang.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
