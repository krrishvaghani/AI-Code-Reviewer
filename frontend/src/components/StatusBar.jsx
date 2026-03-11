import { useState, useEffect, useRef } from 'react';
import { checkHealth } from '../services/api';

export default function StatusBar({ code, reviewedAt }) {
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

  const charCount = code ? code.length : 0;

  const formattedTime = reviewedAt
    ? reviewedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-gray-900 border-t border-gray-800 text-xs text-gray-500 font-mono select-none">
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

      <span className="text-gray-700">|</span>

      {/* Provider */}
      {provider && (
        <>
          <span>Provider: {provider}</span>
          <span className="text-gray-700">|</span>
        </>
      )}

      {/* Char count */}
      <span>{charCount.toLocaleString()} chars</span>

      {/* Last reviewed */}
      {formattedTime && (
        <>
          <span className="text-gray-700">|</span>
          <span>Last reviewed: {formattedTime}</span>
        </>
      )}
    </div>
  );
}
