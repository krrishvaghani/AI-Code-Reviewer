import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'ai_reviewer_theme';

/**
 * Supported Monaco themes:
 *   dark  → 'ai-dark'   (custom dark, registered on first editor mount)
 *   light → 'ai-light'  (custom light, registered on first editor mount)
 */
export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) return saved === 'dark';
    } catch { /* ignore */ }
    // Respect OS preference on first visit
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  });

  // Keep <html> class in sync for Tailwind's `dark:` utilities
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try { localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [isDark]);

  const toggle = () => setIsDark((v) => !v);

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
