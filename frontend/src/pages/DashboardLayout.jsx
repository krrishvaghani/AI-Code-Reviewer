import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const STORAGE_KEY = 'ai_reviewer_sidebar_collapsed';

export default function DashboardLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  });

  const handleToggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-[#09090b]' : 'bg-white'}`}>
        <div className="relative w-8 h-8">
          <div className={`absolute inset-0 rounded-full border-[2px] ${isDark ? 'border-white/10' : 'border-gray-200'}`} />
          <div className={`absolute inset-0 rounded-full border-[2px] border-transparent animate-spin ${isDark ? 'border-t-indigo-500' : 'border-t-indigo-600'}`} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className={`flex h-screen overflow-hidden transition-colors ${isDark ? 'bg-[#09090b]' : 'bg-white'}`}>
      {/* Sidebar — mobile overlay */}
      <Sidebar
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isMobile={true}
        collapsed={false}
        onToggleCollapse={() => {}}
      />
      {/* Sidebar — desktop (collapsible) */}
      <Sidebar
        isOpen={true}
        onClose={() => {}}
        isMobile={false}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}