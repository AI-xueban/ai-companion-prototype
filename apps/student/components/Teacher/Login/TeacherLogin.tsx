import React, { useState } from 'react';
import { Hexagon } from 'lucide-react';

interface TeacherLoginProps {
  onLogin: () => void;
  onBack?: () => void;
}

const MOCK_ACCOUNTS = [
  { account: '13800000000', password: '12345678' },
  { account: 'demo@turing.com', password: '12345678' },
];

export const TeacherLogin: React.FC<TeacherLoginProps> = ({ onLogin, onBack }) => {
  const [account, setAccount] = useState('13800000000');
  const [password, setPassword] = useState('12345678');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetAccount, setResetAccount] = useState('13800000000');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPwd, setResetNewPwd] = useState('');
  const [resetConfirmPwd, setResetConfirmPwd] = useState('');
  const [resetError, setResetError] = useState('');
  const [mockCode, setMockCode] = useState('123456');
  const [codeSent, setCodeSent] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    const matched = MOCK_ACCOUNTS.some(
      (item) => item.account === account.trim() && item.password === password
    );
    setTimeout(() => {
      setLoading(false);
      if (matched) {
        localStorage.setItem('mockTeacherToken', 'true');
        onLogin();
      } else {
        setError('账号或密码错误（原型校验）');
      }
    }, 500);
  };

  const sendMockCode = () => {
    if (codeCountdown > 0) return;
    if (!resetAccount.trim()) {
      setResetError('请输入手机号或邮箱');
      return;
    }
    setResetError('');
    const code = '123456';
    setMockCode(code);
    setCodeSent(true);
    setCodeCountdown(30);
    const timer = setInterval(() => {
      setCodeCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResetNext = () => {
    if (resetStep === 1) {
      if (!resetAccount.trim()) {
        setResetError('请输入手机号或邮箱');
        return;
      }
      if (resetCode.trim() !== mockCode) {
        setResetError('验证码错误（Mock: 123456）');
        return;
      }
      setResetError('');
      setResetStep(2);
      return;
    }
    // step 2 submit
    if (resetNewPwd.length < 8 || !/[A-Za-z]/.test(resetNewPwd) || !/\d/.test(resetNewPwd)) {
      setResetError('新密码至少8位，需包含字母和数字');
      return;
    }
    if (resetNewPwd !== resetConfirmPwd) {
      setResetError('两次密码不一致');
      return;
    }
    // mock success
    setResetError('');
    setPassword(resetNewPwd);
    setAccount(resetAccount);
    setIsResetOpen(false);
    setResetStep(1);
    setResetCode('');
    setResetNewPwd('');
    setResetConfirmPwd('');
    setCodeSent(false);
    setCodeCountdown(0);
    alert('密码已重置（Mock），已填入登录框，可直接登录');
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8F9FC] flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <Hexagon size={18} fill="currentColor" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 tracking-[0.2em]">AI伴学</p>
            <h1 className="text-xl font-black text-slate-900">教师端</h1>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-900">欢迎登录教师端</h2>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">账号</label>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="工号或手机号或邮箱"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="请输入密码"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-xl text-sm font-bold text-white transition-colors ${
              loading ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {loading ? '登录中...' : '登录'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsResetOpen(true);
              setResetStep(1);
              setResetError('');
              setResetCode('');
              setResetNewPwd('');
              setResetConfirmPwd('');
              setResetAccount(account);
            }}
            className="w-full py-2 rounded-xl text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            忘记/修改密码
          </button>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-full py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700"
            >
              返回演示入口
            </button>
          )}
        </form>

        {isResetOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">忘记/修改密码</h3>
                <button onClick={() => setIsResetOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">关闭</button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">手机号或邮箱</label>
                  <input
                    value={resetAccount}
                    onChange={(e) => setResetAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="请输入手机号或邮箱"
                  />
                </div>
                {resetStep === 1 && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">验证码</label>
                      <div className="flex gap-2">
                        <input
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          placeholder="请输入6位验证码（Mock: 123456）"
                        />
                        <button
                          type="button"
                          onClick={sendMockCode}
                          disabled={codeCountdown > 0}
                          className={`px-3 py-2 rounded-xl text-sm font-bold border border-slate-200 ${
                            codeCountdown > 0 ? 'text-slate-400' : 'text-indigo-600 hover:text-indigo-700'
                          }`}
                        >
                          {codeCountdown > 0 ? `重新发送(${codeCountdown}s)` : '发送验证码'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {resetStep === 2 && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">新密码</label>
                      <input
                        type="password"
                        value={resetNewPwd}
                        onChange={(e) => setResetNewPwd(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        placeholder="至少8位，包含字母和数字"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">确认新密码</label>
                      <input
                        type="password"
                        value={resetConfirmPwd}
                        onChange={(e) => setResetConfirmPwd(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        placeholder="再次输入新密码"
                      />
                    </div>
                  </>
                )}
                {resetError && <p className="text-xs text-red-500">{resetError}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsResetOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
                >
                  取消
                </button>
                <button
                  onClick={handleResetNext}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500"
                >
                  {resetStep === 1 ? '下一步' : '提交'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">验证码为 Mock：123456，无需真实发送。</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
