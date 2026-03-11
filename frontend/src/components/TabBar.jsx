const TABS = [
  { id: 'review', label: 'Code Review', icon: '🔍' },
  { id: 'chat',   label: 'Chat with Code', icon: '💬' },
  { id: 'github', label: 'GitHub Review', icon: '🐙' },
];

export default function TabBar({ activeTab, onChange }) {
  return (
    <div className="flex gap-1 bg-gray-900 border-b border-gray-700 px-4 pt-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors focus:outline-none ${
            activeTab === tab.id
              ? 'bg-[#0f1117] border-gray-700 text-white'
              : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/60'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
