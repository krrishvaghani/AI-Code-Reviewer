import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Settings } from 'lucide-react';
import ProfileCard from '../components/settings/ProfileCard';
import BackendConfigCard from '../components/settings/BackendConfigCard';
import AppInfoCard from '../components/settings/AppInfoCard';
import DangerZoneCard from '../components/settings/DangerZoneCard';

export default function SettingsPage() {
  const { isDark } = useTheme();

  return (
    <div className={`h-full overflow-y-auto ${isDark ? 'bg-[#09090b]' : 'bg-[#f4f4f5]'}`}>
      <div className="max-w-4xl mx-auto px-8 py-12">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3.5 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
              ${isDark ? 'bg-white/[0.05]' : 'bg-white border border-gray-200 shadow-sm'}`}>
              <Settings size={20} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
            </div>
            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Settings
            </h1>
          </div>
          <p className={`text-sm ml-[54px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Manage your account, configure your backend, and view application details.
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-8">
          <ProfileCard />
          <BackendConfigCard />
          <AppInfoCard />
          <DangerZoneCard />
        </div>
      </div>
    </div>
  );
}
