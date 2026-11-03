import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Check,
  AlertCircle,
  Bell, UserRound, LogOut
} from 'lucide-react';
import { PORTAL_CLASSES, TeacherPortalUser } from '../data/teacherAccess';

export const TeacherHeader: React.FC<{
  unreadMessageCount?: number;
  onOpenInbox?: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  user: TeacherPortalUser;
  currentClassId: string;
  onClassChange: (classId: string) => void;
  showClassSelector?: boolean;
  showMessages?: boolean;
}> = ({
  unreadMessageCount = 0,
  onOpenInbox,
  onOpenProfile,
  onLogout,
  user,
  currentClassId,
  onClassChange,
  showClassSelector = true,
  showMessages = true,
}) => {
  const allowedClasses = PORTAL_CLASSES.filter((item) => user.classIds.includes(item.id));
  const currentClass = allowedClasses.find((item) => item.id === currentClassId) ?? allowedClasses[0];
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!accountMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
        accountMenuRef.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [accountMenuOpen]);

  // 点击外部关闭菜单的简单处理 (实际项目中通常封装为 hook)
  useEffect(() => {
    const handleClickOutside = () => setIsClassMenuOpen(false);
    if (isClassMenuOpen) window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isClassMenuOpen]);

  return (
    <>
      {/* 主导航栏 */}
      <div className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-20 relative">
        
        {/* 左侧：增强型班级切换器 (Rich Popover) */}
        <div className="flex items-center gap-2 text-sm font-bold select-none">
          <span className="text-slate-500">{user.schoolName}</span><span className={showClassSelector ? "text-slate-300" : "hidden"}>/</span>
          <div className={showClassSelector ? "relative" : "hidden"}>
            <button 
              disabled={allowedClasses.length < 2}
              onClick={(e) => {
                e.stopPropagation();
                setIsClassMenuOpen(!isClassMenuOpen);
              }}
              className="flex items-center gap-2 hover:bg-slate-100 py-1 px-2 rounded-md transition-colors cursor-pointer text-slate-900"
            >
              <span>{currentClass?.name ?? '未分配班级'}</span>
              {/* 如果当前班级有预警，显示红点 */}
              {(currentClass?.alertCount ?? 0) > 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              )}
              <ChevronDown 
                size={14} 
                className={`text-slate-400 transition-transform duration-200 ${isClassMenuOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* 下拉面板内容 */}
            {isClassMenuOpen && (
              <div 
                className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-100 p-2 animate-in fade-in zoom-in-95 duration-100 origin-top-left z-50"
                onClick={(e) => e.stopPropagation()} // 防止点击内部关闭
              >
                <div className="text-xs font-medium text-slate-400 px-2 py-1 mb-1">{user.role === 'school-admin' ? '选择查看班级' : '切换教学班级'}</div>
                {allowedClasses.map((cls) => (
                  <div 
                    key={cls.id}
                    onClick={() => {
                      onClassChange(cls.id);
                      setIsClassMenuOpen(false);
                    }}
                    className={`
                      flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer text-sm
                      ${currentClass?.id === cls.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span>{cls.name}</span>
                      {cls.alertCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded-full font-medium flex items-center gap-1">
                          <AlertCircle size={8} /> {cls.alertCount}
                        </span>
                      )}
                    </div>
                    {currentClass?.id === cls.id && <Check size={14} />}
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-slate-100 px-2">
                   <button className="text-xs text-slate-400 hover:text-indigo-600 w-full text-left py-1">
                     + 关联新班级
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          {/* 消息按钮 */}
          {showMessages && <button
            onClick={onOpenInbox}
            className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors group"
          >
            <Bell size={20} className="text-slate-600 group-hover:text-indigo-600 transition-colors" />
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
              </span>
            )}
          </button>}
          <div ref={accountMenuRef} className="relative">
            <button type="button" aria-label="账号菜单" aria-expanded={accountMenuOpen} aria-controls="teacher-account-menu" onClick={() => { setAccountMenuOpen((open) => !open); setIsClassMenuOpen(false); }} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-100">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 font-bold text-white">{user.name.slice(0, 1)}</span>
              <span className="max-w-36 truncate font-semibold text-slate-800">{user.name}</span>
              <ChevronDown size={14} className={accountMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'}/>
            </button>
            {accountMenuOpen && <div id="teacher-account-menu" className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="mb-1 border-b border-slate-100 px-3 py-2 text-xs leading-5 text-slate-500">{user.name !== user.roleLabel && <p>{user.roleLabel}</p>}<p>{user.schoolName}</p></div>
              <button type="button" onClick={() => { setAccountMenuOpen(false); onOpenProfile(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><UserRound size={16}/>个人中心</button>
              <button type="button" onClick={() => { setAccountMenuOpen(false); onLogout(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-500 hover:bg-red-50"><LogOut size={16}/>退出登录</button>
            </div>}
          </div>
        </div>
      </div>
    </>
  )
}
