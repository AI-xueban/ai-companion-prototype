
import React from 'react';
import { Home, Map, BookX, User, Sparkles } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'today', icon: Home, label: '首页' },
    { id: 'subject', icon: Map, label: '学科远征' },
    { id: 'mistake', icon: BookX, label: '克漏空间' },
    { id: 'partner', icon: Sparkles, label: '小晤同学' },
    { id: 'me', icon: User, label: '我的星迹' },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-1.5 pb-3 z-[600] rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center max-w-2xl mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <button 
              type="button"
              key={item.id}
              id={`guide-nav-${item.id}`} // Tagging for guide
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex h-11 w-12 flex-col items-center justify-center gap-0.5 transition-colors duration-300 ${isActive ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition-colors duration-300 ${isActive ? 'bg-brand/10 text-brand' : ''}`}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`h-3.5 text-[10px] font-bold leading-none transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                  {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  );
};
