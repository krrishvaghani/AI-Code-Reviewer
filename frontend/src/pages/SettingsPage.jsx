import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'ai_reviewer_backend_url';

function getStoredBackendUrl() {
  try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const defaultUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const [backendUrl, setBackendUrl] = useState(getStoredBackendUrl() || defaultUrl);
  const [saved, setSaved] = useState(false);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleSaveUrl = () => {
    try {
      localStorage.setItem(STORAGE_KEY, backendUrl.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
  };

  const handleResetUrl = () => {
    localStorage.removeItem(STORAGE_KEY);
    setBackendUrl(defaultUrl);
    setSaved(false);
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account and preferences</p>
        </div>

        {/* Profile card */}
        <section className="bg-gray-900/60 border border-gray-700/60 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Profile</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <div className="text-base font-semibold text-white">{user?.name}</div>
              <div className="text-sm text-gray-400">{user?.email}</div>
              <div className="text-xs text-gray-600 mt-1">Account ID #{user?.id}</div>
            </div>
          </div>
        </section>

        {/* Backend URL */}
        <section className="bg-gray-900/60 border border-gray-700/60 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Backend Configuration</h2>
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">API Base URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={handleSaveUrl}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
              >
                {saved ? '✓ Saved' : 'Save'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Stored in your browser's localStorage. Overrides the <code className="text-gray-500">VITE_API_BASE_URL</code> env variable at runtime.
            </p>
            {getStoredBackendUrl() && (
              <button
                onClick={handleResetUrl}
                className="text-xs text-gray-600 hover:text-gray-400 mt-2 underline underline-offset-2 transition-colors"
              >
                Reset to default ({defaultUrl})
              </button>
            )}
          </div>
        </section>

        {/* About */}
        <section className="bg-gray-900/60 border border-gray-700/60 rounded-xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">About</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-gray-500">Application</span>
            <span className="text-gray-300">AI Code Reviewer</span>
            <span className="text-gray-500">Version</span>
            <span className="text-gray-300">2.0.0</span>
            <span className="text-gray-500">AI Providers</span>
            <span className="text-gray-300">Google Gemini / OpenAI GPT-4</span>
            <span className="text-gray-500">Frontend</span>
            <span className="text-gray-300">React + Vite + Tailwind CSS</span>
            <span className="text-gray-500">Backend</span>
            <span className="text-gray-300">FastAPI + SQLite</span>
          </div>
        </section>

        {/* Danger zone */}
        <section className="bg-red-950/20 border border-red-800/40 rounded-xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Sign out</p>
              <p className="text-xs text-gray-500">Removes your session from this device.</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-red-400 border border-red-700/60 rounded-lg hover:bg-red-900/30 transition-colors"
            >
              Sign out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
