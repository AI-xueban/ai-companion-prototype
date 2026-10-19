import React from 'react';
import { AlertTriangle, Atom, BarChart3, Box, Building2, ClipboardList, GraduationCap, Hexagon, LayoutDashboard, LogOut, MonitorSmartphone, ScanFace, Search, TabletSmartphone, Users } from 'lucide-react';
import { TeacherPortalUser } from '../data/teacherAccess';

interface TeacherSidebarProps { activePage: string; onNavigate: (page: string) => void; onLogout?: () => void; onSwitchToBoard?: () => void; user: TeacherPortalUser }
const schoolItems = [{id:'classes',icon:GraduationCap,label:'班级管理'},{id:'teachers',icon:Users,label:'教师账号'},{id:'students',icon:Users,label:'学生账号'},{id:'school',icon:Building2,label:'学校信息'},{id:'face-library',icon:ScanFace,label:'人脸信息管理'}];
const deviceItems = [{id:'device-overview',icon:TabletSmartphone,label:'设备概览'},{id:'cabinet',icon:Box,label:'柜机管理'},{id:'tablet',icon:MonitorSmartphone,label:'平板设备'},{id:'device-usage',icon:ClipboardList,label:'使用记录'},{id:'device-alert',icon:AlertTriangle,label:'状态告警'}];

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ activePage, onNavigate, onLogout, onSwitchToBoard, user }) => {
  const hasClassWork = user.homeroomClassIds.length > 0 || user.teachingAssignments.length > 0;
  const classItems = [{id:'dashboard',icon:LayoutDashboard,label:'仪表盘'},{id:'analytics',icon:BarChart3,label:'学情分析'},{id:'profiles',icon:Users,label:'学生管理'},{id:'incentives',icon:Atom,label:'班级激励'}];
  const menuItem = (item: { id: string; icon: React.ComponentType<{ size?: number }>; label: string }) => <button key={item.id} type="button" onClick={() => onNavigate(item.id)} aria-current={activePage === item.id ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-bold ${activePage === item.id ? 'border-slate-200 bg-white text-slate-900 shadow-sm' : 'border-transparent text-slate-600 hover:bg-slate-100'}`}><item.icon size={17}/>{item.label}</button>;
  return <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full flex-shrink-0">
    <div className="h-14 flex items-center px-4 gap-2 mb-4"><div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white"><Hexagon size={16} fill="currentColor"/></div><span className="font-black text-sm text-slate-900 tracking-tight">AI伴学 · 教师端</span></div>
    <div className="px-4 mb-6"><div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-400"><Search size={14}/><span className="text-xs font-medium italic">快速跳转...</span><span className="ml-auto text-[10px] font-mono opacity-50">⌘K</span></div></div>
    <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
      {user.role==='school-admin'&&<div className="mb-5"><p className="px-3 text-[10px] font-black text-slate-400 tracking-widest mb-2">全校管理</p>{menuItem({id:'school-learning',icon:BarChart3,label:'全校学情'})}{menuItem({id:'school-device-usage',icon:TabletSmartphone,label:'全校设备使用'})}</div>}
      {hasClassWork&&<div className="mb-5"><p className="px-3 text-[10px] font-black text-slate-400 tracking-widest mb-2">我的班级</p>{classItems.map(menuItem)}</div>}
      {user.role==='school-admin'&&<>
        <div className="mb-5"><p className="px-3 text-[10px] font-black text-slate-400 tracking-widest mb-2">学校账号信息管理</p>{schoolItems.map(menuItem)}</div>
        <div className="mb-5"><p className="px-3 text-[10px] font-black text-slate-400 tracking-widest mb-2">柜机管理</p>{deviceItems.map(menuItem)}</div>
      </>}
    </div>
    <div className="p-4 border-t border-slate-200 space-y-2">{user.role==='school-admin'&&onSwitchToBoard&&<button type="button" onClick={onSwitchToBoard} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50"><BarChart3 size={16}/><span>切换到全校数据看板</span></button>}<button onClick={()=>onNavigate('profile')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all border ${activePage==='profile'?'bg-white border-slate-200 shadow-sm ring-2 ring-indigo-500/10':'hover:bg-slate-200/50 border-transparent'}`}><div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">{user.name.slice(0,1)}</div><div className="leading-tight text-left"><div className="text-sm font-bold text-slate-900">{user.name}</div><div className="text-[11px] font-medium text-slate-500">{user.roleLabel} · {user.schoolName}</div></div></button><button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-red-400 hover:bg-red-50 rounded-md text-sm font-bold transition-colors"><LogOut size={16}/><span>登出系统</span></button></div>
  </div>;
};
