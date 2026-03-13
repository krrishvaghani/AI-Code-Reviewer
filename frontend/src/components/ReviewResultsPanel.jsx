import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import CodeQualitySummary from './CodeQualitySummary';
import ResultCard from './ResultCard';
import ChatPanel from './ChatPanel';
import { Code2, MessageSquare } from 'lucide-react';

const SECTIONS = [
  { key: 'issues',            title: 'Detected Issues',        icon: '🐛', colorClass: { text: 'text-red-500',    dot: 'bg-red-500' } },
  { key: 'performance_issues', title: 'Performance Issues',     icon: '⏳', colorClass: { text: 'text-yellow-500', dot: 'bg-yellow-500' } },
  { key: 'security_issues',   title: 'Security Vulnerabilities', icon: '🔒', colorClass: { text: 'text-rose-500',  dot: 'bg-rose-500' } },
  { key: 'suggestions',       title: 'Suggestions',            icon: '💡', colorClass: { text: 'text-green-500', dot: 'bg-green-500' } },
  { key: 'improved_code',     title: 'Improved Code',          icon: '✨', colorClass: { text: 'text-indigo-400', dot: 'bg-indigo-500' } },
  { key: 'explanation',       title: 'Explanation',            icon: '📚', colorClass: { text: 'text-blue-400',  dot: 'bg-blue-400' } },
];

const ALL_KEYS = { issues: true, performance_issues: true, security_issues: true, suggestions: true, improved_code: true, explanation: true };

export default function ReviewResultsPanel({ 
   review, originalCode, isLoading, error, language, 
   onIssueClick, onReplaceCode, chatMessages, chatLoading, chatError, onSendMessage, onClearChat
}) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('review');
  const [openSections, setOpenSections] = useState({ ...ALL_KEYS });

  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  if (isLoading) return <div className="p-8 text-center text-gray-500 text-sm">Processing results...</div>;
  if (error) return <div className="p-8 text-center text-red-500 text-sm">Error: {error}</div>;

  const TabBtn = ({ id, label, Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200
        ${activeTab === id
          ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
          : (isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50')}`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className={`flex flex-col h-full transition-colors ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      <div className={`flex items-center px-4 py-3 border-b flex-shrink-0 min-h-[56px] gap-2
        ${isDark ? 'bg-[#0a0a0a] border-white/[0.08]' : 'bg-white border-gray-100 shadow-sm shadow-gray-100/30'}`}>
        <TabBtn id="review" label="AI Review" Icon={Code2} />
        <TabBtn id="chat" label="Chat" Icon={MessageSquare} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'review' && (
          <div>
            {!review ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-60">
                <Code2 size={32} className={isDark ? 'text-gray-700 mb-4' : 'text-gray-300 mb-4'} />
                <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No code analyzed yet</h3>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Click "Review Code" to start</p>
              </div>
            ) : (
              <>
                <CodeQualitySummary review={review} />
                {SECTIONS.map(section => {
                  const value = review.ai_review[section.key];
                  const isEmpty = !value || (Array.isArray(value) && value.length === 0);
                  if (isEmpty) return null;
                  const items = section.key !== 'improved_code' ? (Array.isArray(value) ? value : [value]) : undefined;
                  return (
                    <ResultCard
                       key={section.key} sectionKey={section.key} title={section.title}
                       icon={section.icon} colorClass={section.colorClass} items={items}
                       code={section.key === 'improved_code' ? value : undefined}
                       language={language === 'cpp' ? 'cpp' : language}
                       isOpen={openSections[section.key]} onToggle={() => toggleSection(section.key)}
                       onIssueClick={onIssueClick} originalCode={originalCode} onReplaceCode={onReplaceCode}
                    />
                  );
                })}
              </>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className={`h-full flex flex-col border rounded-lg overflow-hidden ${isDark ? 'border-white/[0.08]' : 'border-gray-200'}`}>
            <ChatPanel
              code={originalCode} language={language} messages={chatMessages}
              isLoading={chatLoading} error={chatError}
              onSendMessage={onSendMessage} onClear={onClearChat} hideToolbar={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
