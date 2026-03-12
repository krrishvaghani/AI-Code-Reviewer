import { useState, useEffect, useRef } from 'react';
import { checkHealth } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function StatusBar({ code, reviewedAt, cursor }) {
  const { isDark, toggle } = useTheme();
  const [backendOnline, setBackendOnline] = useState(null); // null = checking
  const [provider, setProvider] = useState(null);
  const intervalRef = useRef(null);

  const ping = async () => {
    try {
      const data = await checkHealth();
      setBackendOnline(true);
      // health endpoint may return { status, ai_provider, mock_mode }
      if (data?.ai_provider) {
        const label = data.mock_mode ? `${data.ai_provider} (mock)` : data.ai_provider;
        setProvider(label);
      }
    } catch {
      setBackendOnline(false);
      setProvider(null);
    }
  };

  useEffect(() => {
    ping();
    intervalRef.current = setInterval(ping, 30_000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const charCount  = code ? code.length : 0;
  const lineCount  = code ? code.split('\n').length : 0;

  const formattedTime = reviewedAt
    ? reviewedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className={`flex items-center gap-3 px-4 py-1.5 border-t text-xs font-mono select-none flex-wrap transition-colors
      ${isDark
        ? 'bg-gray-900 border-gray-800 text-gray-500'
        : 'bg-gray-100 border-gray-300 text-gray-500'}`
    }>
      {/* Backend status */}
      <span className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            backendOnline === null
              ? 'bg-yellow-500 animate-pulse'
              : backendOnline
              ? 'bg-green-500'
              : 'bg-red-500'
          }`}
        />
        {backendOnline === null ? 'Connecting…' : backendOnline ? 'Backend Online' : 'Backend Offline'}
      </span>

      <Divider isDark={isDark} />

      {/* Provider */}
      {provider && (
        <>
          <span>Provider: {provider}</span>
          <Divider isDark={isDark} />
        </>
      )}

      {/* Char count */}
      <span>{charCount.toLocaleString()} chars</span>

      <Divider isDark={isDark} />

      {/* Line count */}
      <span>{lineCount.toLocaleString()} lines</span>

      {/* Cursor position */}
      {cursor && (
        <>
          <Divider isDark={isDark} />
          <span>Ln {cursor.line}, Col {cursor.column}</span>
        </>
      )}

      {/* Last reviewed */}
      {formattedTime && (
        <>
          <Divider isDark={isDark} />
          <span>Last reviewed: {formattedTime}</span>
        </>
      )}

      {/* Spacer */}
      <span className="flex-1" />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors
          ${isDark
            ? 'hover:bg-gray-800 hover:text-gray-300'
            : 'hover:bg-gray-200 hover:text-gray-700'}`}
      >
        {isDark ? '☀ Light' : '🌙 Dark'}
      </button>
    </div>
  );
}

function Divider({ isDark }) {
  return <span className={isDark ? 'text-gray-700' : 'text-gray-400'}>|</span>;
}
