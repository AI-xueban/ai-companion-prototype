import React, { useEffect, useState } from 'react';
import { BatteryLow, Clock3, LockKeyhole, LogOut, Mail, RotateCcw, ShieldCheck, Wifi } from 'lucide-react';
import lockMascot from '../../assets/girl_v0.1-removebg-preview.png';

export type DemoLockType = 'teacher' | 'low-battery-reminder' | 'low-battery';

interface DeviceLockDemoProps {
  type: DemoLockType;
  onExit: () => void;
}

export const DeviceLockDemo: React.FC<DeviceLockDemoProps> = ({ type, onExit }) => {
  const [now, setNow] = useState(() => new Date());
  const isLowBattery = type === 'low-battery';
  const isLowBatteryReminder = type === 'low-battery-reminder';

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  if (isLowBatteryReminder) {
    return (
      <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-[2px]">
        <div role="alertdialog" aria-modal="true" aria-labelledby="low-battery-reminder-title" className="w-full max-w-[460px] rounded-[28px] border border-amber-100 bg-white p-7 text-center shadow-2xl shadow-slate-900/20">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <BatteryLow size={34} strokeWidth={2} />
          </span>
          <p className="mt-4 text-[44px] font-semibold leading-none tabular-nums text-amber-600">10<span className="ml-1 text-[24px]">%</span></p>
          <h1 id="low-battery-reminder-title" className="mt-3 text-[22px] font-bold text-slate-900">电量不足，请及时充电或归还</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">电量降至5%时将自动锁屏。</p>
          <button type="button" onClick={onExit} className="mt-6 h-11 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700">
            我知道了
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isLowBattery ? '电量过低，设备已锁屏' : '设备已被老师锁定'}
      className="absolute inset-0 z-[2000] flex flex-col overflow-hidden bg-[#f4f6ff] text-slate-800"
    >
      <header className="relative flex h-[104px] shrink-0 items-center justify-between overflow-hidden border-b border-indigo-100 bg-gradient-to-r from-[#eeeaff] via-[#e3e9ff] to-[#d9ebff] px-5">
        <div className="relative z-10 flex items-center gap-2 text-[13px] font-bold text-slate-600">
          <span className="flex items-center gap-1"><ShieldCheck size={17} />学习守护</span>
          <span className="h-4 w-px bg-slate-400/70" />
          <span className="flex items-center gap-1"><Clock3 size={17} />{isLowBattery ? '低电量锁屏' : '老师已锁屏'}</span>
        </div>

        <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-end">
          <img src={lockMascot} alt="小晤同学" className="h-[96px] w-auto object-contain object-bottom" />
          <div className="relative mb-5 ml-1 w-[300px] rounded-[22px] rounded-bl-md bg-indigo-500 px-5 py-3 text-white shadow-lg shadow-indigo-300/30">
            <p className="text-[17px] font-bold leading-snug">{isLowBattery ? '平板电量不足啦，请及时归还柜机，让它充充电吧～' : '老师开启了锁屏，先休息一下，等老师解锁后再继续吧～'}</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          {[Wifi, Mail].map((StatusIcon, index) => (
            <span key={index} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
              <StatusIcon size={20} />
            </span>
          ))}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
        <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isLowBattery ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
          {isLowBattery ? <BatteryLow size={30} strokeWidth={2} /> : <LockKeyhole size={30} strokeWidth={2} />}
        </span>
        <h1 className="mt-3 text-[24px] font-bold leading-tight">{isLowBattery ? '电量过低，设备已锁屏' : '设备已被老师锁定'}</h1>
        {!isLowBattery && <p className="mt-1.5 text-sm text-slate-600">当前暂时无法使用设备，请等待老师解除锁屏。</p>}
        <div className={`mt-5 text-[54px] font-semibold leading-none tabular-nums tracking-tight ${isLowBattery ? 'text-amber-600' : 'text-slate-800'}`}>
          {isLowBattery ? <>5<span className="ml-1 text-[28px]">%</span></> : now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
        <p className="mt-1 text-xs text-slate-500">{isLowBattery ? '当前电量' : '当前时间'}</p>
        <div className={`mt-5 w-full max-w-[500px] rounded-2xl bg-white px-5 py-3 shadow-sm ${isLowBattery ? 'border border-amber-200' : 'border border-indigo-100'}`}>
          <p className={`font-bold ${isLowBattery ? 'text-[17px] text-amber-700' : 'text-indigo-600'}`}>{isLowBattery ? '请及时充电或归还' : '管控中'}</p>
          {isLowBattery
            ? <p className="mt-1 text-xs text-slate-400">充电至10%后解除低电量限制</p>
            : <p className="mt-1 text-xs text-slate-600">锁屏不影响设备归还，如有疑问请联系老师。</p>}
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-[500px] shrink-0 gap-3 px-0 pb-6">
        {!isLowBattery && <button type="button" onClick={onExit} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700">
          <LogOut size={17} />退出登录
        </button>}
        <button type="button" onClick={onExit} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white">
          <RotateCcw size={17} />归还设备
        </button>
      </footer>
    </div>
  );
};
