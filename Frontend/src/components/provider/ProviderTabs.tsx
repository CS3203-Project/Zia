import type { ReactNode } from 'react';
import { User, DollarSign, Star, MessageCircle } from 'lucide-react';

export type ProviderTabId = 'overview' | 'services' | 'reviews' | 'about';

interface ProviderTab {
  id: ProviderTabId;
  label: string;
  icon: ReactNode;
}

const PROVIDER_TABS: ProviderTab[] = [
  { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
  { id: 'services', label: 'Services', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'reviews', label: 'Reviews', icon: <Star className="w-4 h-4" /> },
  { id: 'about', label: 'About', icon: <MessageCircle className="w-4 h-4" /> }
];

interface ProviderTabsProps {
  activeTab: string;
  onTabChange: (tabId: ProviderTabId) => void;
}

export default function ProviderTabs({ activeTab, onTabChange }: ProviderTabsProps) {
  return (
    <div className="mb-8">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap">
          {PROVIDER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center px-6 py-4 text-sm font-medium transition-all duration-300 border-b-2 ${
                activeTab === tab.id
                  ? "border-orange-600 text-orange-600 bg-orange-50"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
