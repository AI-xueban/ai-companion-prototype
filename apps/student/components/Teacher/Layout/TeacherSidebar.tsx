import React from 'react';
import { LayoutDashboard, Users, BarChart3, LogOut, Hexagon, Atom, Search } from 'lucide-react';

interface TeacherSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ activePage, onNavigate, onLogout }) => {
  const user = {
    name: '张雨薇',
    role: '数学教研组长',
    avatar: 'Z',
  };

  const menu = [
    { id: 'dashboard', icon: LayoutDashboard, label: '仪表盘' },
    { id: 'analytics', icon: BarChart3, label: '学情分析' },
    { id: 'profiles', icon: Users, label: '学生管理' },
    { id: 'incentives', icon: Atom, label: '班级激励' },
  ];

  return (
    <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full flex-shrink-0">
      {/* Brand */}
      <div className="h-14 flex items-center px-4 gap-2 mb-4">
        <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <Hexagon size={16} fill="currentColor" />
        </div>
        <span className="font-black text-sm text-slate-900 tracking-tight">AI伴学 · 教师端</span>
      </div>
      
      {/* Global Search Mock */}
      <div className="px-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-400">
              <Search size={14} />
              <span className="text-xs font-medium italic">快速跳转...</span>
              <span className="ml-auto text-[10px] font-mono opacity-50">⌘K</span>
          </div>
      </div>

      {/* Nav Section */}
      <div className="flex-1 px-3 space-y-0.5">
        <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">主视图</p>
        {menu.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
              activePage === item.id 
                ? 'bg-white text-slate-900 border border-slate-200 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <button 
          onClick={() => onNavigate('profile')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
            activePage === 'profile'
              ? 'bg-white border-slate-200 shadow-sm ring-2 ring-indigo-500/10'
              : 'hover:bg-slate-200/50 border-transparent'
          } border`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
            {user.avatar}
          </div>
          <div className="leading-tight text-left">
            <div className="text-sm font-bold text-slate-900">{user.name}</div>
            <div className="text-[11px] font-medium text-slate-500">{user.role}</div>
          </div>
        </button>
        <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-red-400 hover:bg-red-50 rounded-md text-sm font-bold transition-colors"
        >
            <LogOut size={16} /> 
            <span>登出系统</span>
        </button>
      </div>
    </div>
  );
};
