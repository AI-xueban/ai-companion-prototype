import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Key, 
  Users,
  ChevronRight,
  ExternalLink,
  Edit3
} from 'lucide-react';

export const TeacherProfile: React.FC = () => {
  const [classOpen, setClassOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<{ name: string; type: string; students: number; homeroom: string; alerts: number; completion: number } | null>(null);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', fresh: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneStep, setPhoneStep] = useState<1 | 2>(1);
  const [phoneForm, setPhoneForm] = useState({ oldCode: '', newPhone: '', newCode: '' });
  const [phoneError, setPhoneError] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<1 | 2>(1);
  const [emailForm, setEmailForm] = useState({ oldCode: '', newEmail: '', newCode: '' });
  const [emailError, setEmailError] = useState('');
  const [emailMockCode] = useState('123456');
  const [emailCountdown, setEmailCountdown] = useState(0);

  const teacherInfo = {
    name: '张雨薇',
    role: '数学教研组长',
    employeeId: 'T202308001',
    email: 'zhangyuwei@turing-edu.com',
    phone: '138****8888',
    department: '初中数学组',
    avatar: 'Z'
  };
  const [emailDisplay, setEmailDisplay] = useState(teacherInfo.email);

  const managementScope = [
    { name: '初二(3)班', type: '重点班', students: 46, homeroom: '李老师', alerts: 3, completion: 94 },
    { name: '初二(8)班', type: '实验班', students: 42, homeroom: '王老师', alerts: 1, completion: 90 },
  ];

  const passwordValid = (value: string) => value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

  const handlePwdSubmit = () => {
    if (!pwdForm.old || !pwdForm.fresh || !pwdForm.confirm) {
      setPwdError('请完整填写所有字段');
      return;
    }
    if (!passwordValid(pwdForm.fresh)) {
      setPwdError('新密码至少8位，需包含字母和数字');
      return;
    }
    if (pwdForm.fresh !== pwdForm.confirm) {
      setPwdError('两次输入的新密码不一致');
      return;
    }
    setPwdError('');
    alert('密码已更新（模拟）');
    setPwdForm({ old: '', fresh: '', confirm: '' });
    setPwdOpen(false);
  };

  const handlePhoneNext = () => {
    if (phoneStep === 1) {
      if (phoneForm.oldCode.length !== 6) {
        setPhoneError('请输入6位旧手机验证码');
        return;
      }
      setPhoneError('');
      setPhoneStep(2);
      return;
    }
    // step 2 submit
    if (!/^1\d{10}$/.test(phoneForm.newPhone)) {
      setPhoneError('请输入合法的11位手机号码');
      return;
    }
    if (phoneForm.newCode.length !== 6) {
      setPhoneError('请输入6位新手机验证码');
      return;
    }
    setPhoneError('');
    alert('手机号已更新（模拟）');
    setPhoneForm({ oldCode: '', newPhone: '', newCode: '' });
    setPhoneStep(1);
    setPhoneOpen(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F8F9FC] p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* header */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
          
          <div className="relative flex flex-col md:flex-row gap-8 items-start">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-indigo-200 shrink-0">
              {teacherInfo.avatar}
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">{teacherInfo.name}</h1>
                  <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600 font-bold">{teacherInfo.role}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-sm">{teacherInfo.department}</span>
                  </p>
                </div>
                
              </div>
              
              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail size={14} className="text-slate-400" />
                  <span className="text-sm font-medium">{emailDisplay}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone size={14} className="text-slate-400" />
                  <span className="text-sm font-medium">{teacherInfo.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <User size={14} className="text-slate-400" />
                  <span className="text-sm font-medium">工号: {teacherInfo.employeeId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* management scope */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900 flex items-center gap-2">
                  <Shield size={18} className="text-indigo-500" />
                  管理职能与范围
                </h3>
                <button 
                  onClick={() => {
                    setSelectedClass(managementScope[0]);
                    setClassOpen(true);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  查看详情 <ChevronRight size={14} />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {managementScope.map((klass, i) => (
                  <div key={i} className="space-y-2">
                    <div 
                      onClick={() => {
                        setSelectedClass(klass);
                        setClassOpen(true);
                      }}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">{klass.name}</p>
                        <p className="text-[11px] font-medium text-slate-500">{klass.type} · {klass.students}人 · 班主任 {klass.homeroom}</p>
                      </div>
                      <ExternalLink size={14} className="text-slate-300 group-hover:text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* safety & settings */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-black text-slate-900">账号安全</h3>
              </div>
              <div className="p-4 space-y-1">
                {[
                  { icon: Key, label: '修改登录密码', sub: '上次修改: 3个月前' },
                  { icon: Phone, label: '修改绑定手机', sub: '138****8888' },
                  { icon: Mail, label: '修改绑定邮箱', sub: emailDisplay },
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      if (item.label === '修改登录密码') setPwdOpen(true);
                      if (item.label === '修改绑定手机') setPhoneOpen(true);
                      if (item.label === '修改绑定邮箱') setEmailOpen(true);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                      <item.icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{item.label}</p>
                      <p className="text-[11px] font-medium text-slate-400">{item.sub}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      

      {/* 班级详情 Drawer */}
      {classOpen && selectedClass && (
        <div className="fixed inset-0 flex justify-end z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setClassOpen(false)}></div>
          <div className="relative w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">班级详情</h3>
              <button onClick={() => setClassOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">关闭</button>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400">班级</p>
                <p className="font-bold text-slate-900">{selectedClass.name}（{selectedClass.type}）</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-400">学生数</p>
                  <p className="font-bold text-slate-900">{selectedClass.students} 人</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-400">班主任</p>
                  <p className="font-bold text-slate-900">{selectedClass.homeroom}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-400">最近预警</p>
                  <p className="font-bold text-slate-900">{selectedClass.alerts} 条</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-400">作业完成率</p>
                  <p className="font-bold text-slate-900">{selectedClass.completion}%</p>
                </div>
              </div>
              <p className="text-[12px] text-slate-500">该区域仅展示您负责的班级概要，详细学情请前往班级看板。</p>
            </div>
          </div>
        </div>
      )}

      {/* 修改密码 Modal */}
      {pwdOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">修改登录密码</h3>
              <button onClick={() => setPwdOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">关闭</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">旧密码</p>
                <input
                  type="password"
                  value={pwdForm.old}
                  onChange={(e) => setPwdForm({ ...pwdForm, old: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="请输入旧密码"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">新密码</p>
                <input
                  type="password"
                  value={pwdForm.fresh}
                  onChange={(e) => setPwdForm({ ...pwdForm, fresh: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="至少8位，包含字母和数字"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">确认新密码</p>
                <input
                  type="password"
                  value={pwdForm.confirm}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="再次输入新密码"
                />
              </div>
              {pwdError && <p className="text-xs text-red-500">{pwdError}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPwdOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">取消</button>
              <button onClick={handlePwdSubmit} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500">提交</button>
            </div>
          </div>
        </div>
      )}

      {/* 修改绑定手机 Modal */}
      {phoneOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">修改绑定手机</h3>
              <button onClick={() => { setPhoneOpen(false); setPhoneStep(1); setPhoneForm({ oldCode: '', newPhone: '', newCode: '' }); setPhoneError(''); }} className="text-slate-400 hover:text-slate-600 text-sm font-bold">关闭</button>
            </div>
            <div className="space-y-3">
              {phoneStep === 1 && (
                <>
                  <p className="text-sm text-slate-600">已绑定手机号：{teacherInfo.phone}</p>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">旧手机验证码</p>
                    <input
                      type="text"
                      value={phoneForm.oldCode}
                      onChange={(e) => setPhoneForm({ ...phoneForm, oldCode: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      placeholder="输入6位验证码"
                    />
                  </div>
                </>
              )}
              {phoneStep === 2 && (
                <>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">新手机号</p>
                    <input
                      type="text"
                      value={phoneForm.newPhone}
                      onChange={(e) => setPhoneForm({ ...phoneForm, newPhone: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      placeholder="请输入11位手机号"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">新手机验证码</p>
                    <input
                      type="text"
                      value={phoneForm.newCode}
                      onChange={(e) => setPhoneForm({ ...phoneForm, newCode: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      placeholder="输入6位验证码"
                    />
                  </div>
                </>
              )}
              {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setPhoneOpen(false); setPhoneStep(1); setPhoneForm({ oldCode: '', newPhone: '', newCode: '' }); setPhoneError(''); }} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">取消</button>
              <button onClick={handlePhoneNext} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500">{phoneStep === 1 ? '下一步' : '提交'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 修改绑定邮箱 Modal */}
      {emailOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">修改绑定邮箱</h3>
              <button onClick={() => { setEmailOpen(false); setEmailStep(1); setEmailForm({ oldCode: '', newEmail: '', newCode: '' }); setEmailError(''); setEmailCountdown(0); }} className="text-slate-400 hover:text-slate-600 text-sm font-bold">关闭</button>
            </div>
            <div className="space-y-3">
              {emailStep === 1 && (
                <>
                  <p className="text-sm text-slate-600">已绑定邮箱：{emailDisplay}</p>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 mb-1">验证码</p>
                    <div className="flex gap-2">
                      <input
                        value={emailForm.oldCode}
                        onChange={(e) => setEmailForm({ ...emailForm, oldCode: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        placeholder="输入6位验证码（Mock: 123456）"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (emailCountdown > 0) return;
                          setEmailError('');
                          setEmailCountdown(30);
                          const timer = setInterval(() => {
                            setEmailCountdown((prev) => {
                              if (prev <= 1) {
                                clearInterval(timer);
                                return 0;
                              }
                              return prev - 1;
                            });
                          }, 1000);
                        }}
                        disabled={emailCountdown > 0}
                        className={`px-3 py-2 rounded-xl text-sm font-bold border border-slate-200 ${
                          emailCountdown > 0 ? 'text-slate-400' : 'text-indigo-600 hover:text-indigo-700'
                        }`}
                      >
                        {emailCountdown > 0 ? `重新发送(${emailCountdown}s)` : '发送验证码'}
                      </button>
                    </div>
                  </div>
                </>
              )}
              {emailStep === 2 && (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 mb-1">新邮箱</p>
                    <input
                      type="email"
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      placeholder="请输入新邮箱"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 mb-1">新邮箱验证码</p>
                    <input
                      type="text"
                      value={emailForm.newCode}
                      onChange={(e) => setEmailForm({ ...emailForm, newCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      placeholder="输入6位验证码（Mock: 123456）"
                    />
                  </div>
                </>
              )}
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEmailOpen(false); setEmailStep(1); setEmailForm({ oldCode: '', newEmail: '', newCode: '' }); setEmailError(''); setEmailCountdown(0); }} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">取消</button>
              <button
                onClick={() => {
                  if (emailStep === 1) {
                    if (emailForm.oldCode.trim() !== emailMockCode) {
                      setEmailError('验证码错误（Mock: 123456）');
                      return;
                    }
                    setEmailError('');
                    setEmailStep(2);
                    return;
                  }
                  // step 2 submit
                  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.newEmail);
                  if (!emailValid) {
                    setEmailError('请输入合法邮箱');
                    return;
                  }
                  if (emailForm.newCode.trim() !== emailMockCode) {
                    setEmailError('验证码错误（Mock: 123456）');
                    return;
                  }
                  setEmailDisplay(emailForm.newEmail);
                  setEmailOpen(false);
                  setEmailStep(1);
                  setEmailForm({ oldCode: '', newEmail: '', newCode: '' });
                  setEmailError('');
                  setEmailCountdown(0);
                  alert('邮箱已更新（Mock）');
                }}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500"
              >
                {emailStep === 1 ? '下一步' : '提交'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">验证码为 Mock：123456，无需真实发送。</p>
          </div>
        </div>
      )}
    </div>
  );
};
