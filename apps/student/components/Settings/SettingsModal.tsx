import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Eye, Moon, Clock, ChevronRight, Sun, Battery, BellOff, Mail, 
  Lock, RefreshCw, School, Hash, Shield, LogOut, Bell, CheckCircle2 
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { APP_CONFIG } from '../../config/appConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEyeCareMode: boolean;
  onToggleEyeCare: () => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isEyeCareMode,
  onToggleEyeCare,
  isFocusMode,
  onToggleFocus,
}) => {
  // Mock Stats State
  const [dailyLimit, setDailyLimit] = useState(120); // Minutes
  const [todayUsage, setTodayUsage] = useState(45); // Minutes
  const [breakInterval, setBreakInterval] = useState(20);

  // Mock Student Info
  const studentInfo = {
    name: "李华",
    school: "北京市第三中学",
    id: "20240901001",
    grade: "八年级 (2) 班"
  };

  // Notification Settings
  const [notifications, setNotifications] = useState({
    study: true,
    system: false
  });

  // Update State
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'latest'>('idle');

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const usagePercentage = Math.min(100, (todayUsage / dailyLimit) * 100);
  const usageColor = usagePercentage > 80 ? '#EF4444' : usagePercentage > 50 ? '#F59E0B' : '#10B981';

  // Render Portal
  const portalRoot =
    document.getElementById('app-viewport') ||
    document.getElementById('modal-root') ||
    document.body;

  const handleCheckUpdate = () => {
    if (updateStatus === 'checking') return;
    setUpdateStatus('checking');
    setTimeout(() => {
      setUpdateStatus('latest');
    }, 2000);
  };

  const PasswordChangeModal = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[102] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={() => setShowPasswordModal(false)}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-slate-900">修改密码</h3>
          <button type="button" onClick={() => setShowPasswordModal(false)} aria-label="关闭修改密码" className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">当前密码</label>
            <input type="password" placeholder="请输入当前密码" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">新密码</label>
            <input type="password" placeholder="8位以上字符" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">确认新密码</label>
            <input type="password" placeholder="再次输入新密码" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
        </div>
        <div className="pt-4 flex gap-3">
          <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">取消</button>
          <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20 transition-all">确认修改</button>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container - iOS Control Center Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute inset-0 z-[101] bg-[#F2F2F7] flex flex-col pointer-events-auto"
          >
            {/* Header - iOS Navigation Bar Style */}
            <div className="px-6 pt-12 pb-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex justify-between items-center shrink-0 sticky top-0 z-10">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">控制中心</h2>
              <button 
                type="button"
                onClick={onClose}
                aria-label="关闭控制中心"
                className="w-9 h-9 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:bg-slate-300/50 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-[#F2F2F7] relative">
              
              {/* Password Modal Overlay */}
              <AnimatePresence>
                {showPasswordModal && <PasswordChangeModal />}
              </AnimatePresence>

              {/* 1. Student Identity Card (New) */}
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{studentInfo.name}</h3>
                      <p className="text-sm text-slate-500 font-medium">{studentInfo.grade}</p>
                    </div>
                    <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase tracking-wider">
                      学生账户
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                        <School size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">学校</div>
                        <div className="text-sm font-bold text-slate-700">{studentInfo.school}</div>
                      </div>
                      <Lock size={14} className="text-slate-300" />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                        <Hash size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">学号</div>
                        <div className="text-sm font-bold text-slate-700 font-mono tracking-wide">{studentInfo.id}</div>
                      </div>
                      <Lock size={14} className="text-slate-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Feature Grid (Eye/Focus) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">显示与专注</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Eye Care Tile */}
                  <motion.button
                    type="button"
                    role="switch"
                    aria-checked={isEyeCareMode}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleEyeCare();
                    }}
                    className={`col-span-1 p-5 rounded-[24px] flex flex-col justify-between h-36 transition-all relative overflow-hidden group border cursor-pointer ${
                      isEyeCareMode 
                        ? 'bg-white border-amber-200 shadow-lg shadow-amber-500/10' 
                        : 'bg-white border-transparent shadow-sm'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isEyeCareMode ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isEyeCareMode ? <Sun size={22} /> : <Eye size={22} />}
                    </div>
                    <div className="text-left z-10">
                      <div className={`font-bold text-base ${isEyeCareMode ? 'text-amber-900' : 'text-slate-900'}`}>护眼模式</div>
                      <div className={`text-xs font-medium mt-0.5 ${isEyeCareMode ? 'text-amber-600' : 'text-slate-400'}`}>
                        {isEyeCareMode ? '已开启暖光' : '过滤蓝光'}
                      </div>
                    </div>
                    {isEyeCareMode && (
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse" />
                    )}
                  </motion.button>

                  {/* Focus Mode Tile */}
                  <motion.button
                    type="button"
                    role="switch"
                    aria-checked={isFocusMode}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFocus();
                    }}
                    className={`col-span-1 p-5 rounded-[24px] flex flex-col justify-between h-36 transition-all relative overflow-hidden group border cursor-pointer ${
                      isFocusMode 
                        ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/30' 
                        : 'bg-white border-transparent shadow-sm'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isFocusMode ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isFocusMode ? <Moon size={22} fill="currentColor" /> : <BellOff size={22} />}
                    </div>
                    <div className="text-left z-10">
                      <div className={`font-bold text-base ${isFocusMode ? 'text-white' : 'text-slate-900'}`}>深度专注</div>
                      <div className={`text-xs font-medium mt-0.5 ${isFocusMode ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {isFocusMode ? '通知已暂停' : '减少干扰'}
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* 3. Preferences (New) */}
              <div className="space-y-3">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">应用设置</h3>
                 <div className="bg-white rounded-[24px] overflow-hidden shadow-sm">
                    {/* Notifications */}
                    <div className="p-4 border-b border-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Bell size={18} />
                            </div>
                            <span className="font-bold text-slate-900">消息通知</span>
                        </div>
                        <div className="space-y-3 pl-11">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-600">学习提醒 (作业/计划)</span>
                                <button 
                                    type="button"
                                    onClick={() => setNotifications(prev => ({...prev, study: !prev.study}))}
                                    role="switch"
                                    aria-checked={notifications.study}
                                    aria-label="学习提醒"
                                    className={`w-11 h-6 rounded-full transition-colors relative ${notifications.study ? 'bg-indigo-500' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.study ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-600">系统消息 (更新/公告)</span>
                                <button 
                                    type="button"
                                    onClick={() => setNotifications(prev => ({...prev, system: !prev.system}))}
                                    role="switch"
                                    aria-checked={notifications.system}
                                    aria-label="系统消息"
                                    className={`w-11 h-6 rounded-full transition-colors relative ${notifications.system ? 'bg-indigo-500' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.system ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Software Update */}
                    <div 
                        onClick={handleCheckUpdate}
                        className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <RefreshCw size={18} className={updateStatus === 'checking' ? 'animate-spin' : ''} />
                            </div>
                            <div>
                                <div className="font-bold text-slate-900">软件更新</div>
                                <div className="text-xs text-slate-500 font-medium">当前版本 v{APP_CONFIG.version}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {updateStatus === 'latest' ? (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">已是最新</span>
                            ) : updateStatus === 'checking' ? (
                                <span className="text-xs font-bold text-slate-400">检查中...</span>
                            ) : (
                                <ChevronRight size={18} className="text-slate-300" />
                            )}
                        </div>
                    </div>
                 </div>
              </div>

              {/* 4. Digital Health */}
              <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">数字健康</h3>
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-[24px] p-6 shadow-sm border border-transparent relative overflow-hidden"
                  >
                      {/* Decorative bg */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 blur-[60px] rounded-full pointer-events-none -mr-20 -mt-20" />
                      
                      <div className="flex justify-between items-start mb-6 relative z-10">
                          <div>
                              <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold uppercase tracking-wider mb-2">
                                  <Battery size={14} /> 能量守护
                              </div>
                              <h3 className="text-3xl font-black tracking-tight text-slate-900">{Math.floor(dailyLimit - todayUsage)}<span className="text-base font-bold text-slate-400 ml-1.5">分钟剩余</span></h3>
                          </div>
                          
                          {/* Ring Chart Large */}
                          <div className="w-14 h-14 relative">
                              <svg className="w-full h-full -rotate-90">
                                  <circle cx="28" cy="28" r="24" stroke="#F1F5F9" strokeWidth="5" fill="none" />
                                  <circle 
                                    cx="28" cy="28" r="24" 
                                    stroke={usageColor} 
                                    strokeWidth="5" 
                                    fill="none" 
                                    strokeDasharray={150}
                                    strokeDashoffset={150 - (150 * usagePercentage / 100)}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                  />
                              </svg>
                          </div>
                      </div>

                      {/* Reminder Setting */}
                      <div className="pt-4 border-t border-slate-100 relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock size={16} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-700">休息提醒间隔</span>
                          </div>
                          <div className="flex bg-slate-100 p-1 rounded-xl">
                              {[20, 30, 45].map(min => (
                                  <button 
                                    key={min}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBreakInterval(min);
                                    }}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                        breakInterval === min 
                                        ? 'bg-white text-slate-900 shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                  >
                                      {min}m
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>

              {/* 5. Account Security (New) */}
              <div className="space-y-3">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">账户安全</h3>
                 <div className="bg-white rounded-[24px] overflow-hidden shadow-sm">
                    <button 
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                                <Shield size={18} />
                            </div>
                            <span className="font-bold text-slate-900">修改密码</span>
                        </div>
                        <ChevronRight size={18} className="text-slate-300" />
                    </button>
                    
                    <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add logout logic here
                        }}
                        className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center group-hover:bg-red-200 group-hover:text-red-600 transition-colors">
                                <LogOut size={18} />
                            </div>
                            <span className="font-bold text-red-500 group-hover:text-red-600">退出登录</span>
                        </div>
                    </button>
                 </div>
              </div>

              {/* Support & Feedback (Keep) */}
              <div className="space-y-3">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">支持</h3>
                 <div 
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-[24px] p-2 shadow-sm overflow-hidden"
                 >
                    <button 
                        onClick={() => alert("用户信箱：感谢您的反馈！功能开发中...")}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded-[16px] transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Mail size={20} />
                            </div>
                            <div className="text-left">
                                <div className="text-base font-bold text-slate-900">用户信箱</div>
                                <div className="text-xs font-medium text-slate-500">发送意见与反馈</div>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                    </button>
                 </div>
              </div>
              
              <div className="h-8" /> {/* Bottom spacer */}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
};
