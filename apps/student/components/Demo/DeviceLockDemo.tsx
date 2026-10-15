import React, { useEffect, useState } from 'react';
import {
  BatteryLow,
  Clock3,
  LockKeyhole,
  LogOut,
  RotateCcw,
  Wifi,
  Mail,
} from 'lucide-react';

export type DemoLockType = 'low-battery' | 'teacher';

interface DeviceLockDemoProps {
  type: DemoLockType;
  onExit: () => void;
}

const lockContent = {
  'low-battery': {
    eyebrow: '设备保护 · 低电量锁屏',
    title: '设备电量过低，已自动锁屏',
    description: '请连接充电器，电量恢复后再继续使用设备。',
    detailTitle: '当前电量 8%',
    detailText: '为避免设备断电，请尽快充电或归还设备。',
    icon: BatteryLow,
    accent: 'text-amber-600',
    iconBackground: 'bg-amber-100',
    noticeClass: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  teacher: {
    eyebrow: '学习守护 · 教师端手动锁屏',
    title: '设备已被老师锁定',
    description: '当前暂时无法使用设备，请等待老师解除锁屏。',
    detailTitle: '教师端管控中',
    detailText: '锁屏不影响设备归还，如有疑问请联系老师。',
    icon: LockKeyhole,
    accent: 'text-indigo-600',
    iconBackground: 'bg-indigo-100',
    noticeClass: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  },
} as const;

export const DeviceLockDemo: React.FC<DeviceLockDemoProps> = ({ type, onExit }) => {
  const [now, setNow] = useState(() => new Date());
  const content = lockContent[type];
  const Icon = content.icon;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-[180] overflow-hidden bg-gradient-to-br from-[#e9e5ff] via-[#edf3ff] to-[#d9edff] text-slate-800">
      <div className="absolute -left-10 -top-24 h-64 w-64 rounded-full bg-violet-300/35 blur-2xl" />
      <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[24px] border-white/25" />
      <div className="absolute bottom-10 right-12 h-16 w-16 rotate-12 rounded-[22px] bg-amber-300/80 shadow-[0_12px_36px_rgba(245,158,11,0.24)]" />

      <header className="relative z-10 flex h-24 items-center justify-between px-12">
        <div className="flex items-center gap-3 text-lg font-semibold text-slate-700">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${content.iconBackground} ${content.accent}`}>
            <Icon size={24} strokeWidth={2.3} />
          </span>
          <span>{content.eyebrow}</span>
        </div>
        <div className="flex items-center gap-3">
          {[Wifi, Mail].map((StatusIcon, index) => (
            <span key={index} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm">
              <StatusIcon size={23} />
            </span>
          ))}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-[850px] flex-col items-center">
        <div className="mb-5 flex items-center gap-5">
          <div className={`flex h-24 w-24 items-center justify-center rounded-[30px] ${content.iconBackground} ${content.accent} shadow-lg shadow-indigo-200/40`}>
            <Icon size={48} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-[32px] font-black tracking-tight text-slate-800">{content.title}</h1>
            <p className="mt-2 text-base text-slate-500">{content.description}</p>
          </div>
        </div>

        <section className="w-full rounded-[46px] border border-white/80 bg-white/75 px-20 py-10 text-center shadow-[0_24px_70px_rgba(76,81,143,0.15)] backdrop-blur-xl">
          <div className="text-[88px] font-black leading-none tracking-[-0.06em] text-slate-700">
            {now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div className="mt-3 text-sm font-medium text-slate-400">当前系统时间</div>

          <div className="mx-auto my-7 h-px w-80 bg-slate-200/80" />

          <div className="flex items-center justify-center gap-4">
            <span className={`flex h-14 w-14 items-center justify-center rounded-full ${content.iconBackground} ${content.accent}`}>
              {type === 'low-battery' ? <BatteryLow size={30} /> : <Clock3 size={29} />}
            </span>
            <div className="text-left">
              <div className="text-[27px] font-black text-slate-700">{content.detailTitle}</div>
              <div className="mt-1 text-sm text-slate-400">{content.detailText}</div>
            </div>
          </div>

          <div className={`mx-auto mt-7 max-w-xl rounded-xl border px-5 py-3 text-sm font-semibold ${content.noticeClass}`}>
            {type === 'low-battery'
              ? '充电达到安全电量后自动解除；教师手动锁屏仍需老师解除。'
              : '仅老师可以解除本次锁屏，学生端无法自行解锁。'}
          </div>
        </section>

        <div className="mt-8 grid w-[470px] grid-cols-2 overflow-hidden rounded-full bg-white shadow-[0_12px_35px_rgba(83,76,150,0.2)]">
          <button type="button" onClick={onExit} className="flex h-16 items-center justify-center gap-2 font-bold text-indigo-500 transition-colors hover:bg-indigo-50 active:bg-indigo-100">
            <LogOut size={20} />退出登录
          </button>
          <button type="button" onClick={onExit} className="flex h-16 items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 font-bold text-white transition hover:brightness-105 active:brightness-95">
            <RotateCcw size={20} />归还设备
          </button>
        </div>
      </main>
    </div>
  );
};
