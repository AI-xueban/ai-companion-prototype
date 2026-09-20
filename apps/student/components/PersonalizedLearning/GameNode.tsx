import React from 'react';
import {
  Lock, Play, Gift, Crown, Brain, PenTool, Check,
  Lightbulb, Stethoscope, Target, Shield, Puzzle, Circle,
} from 'lucide-react';
import { MapNode } from '../../types';

const getLinearIcon = (type?: string, size: number = 24) => {
  const iconMap: Record<string, React.ReactNode> = {
    intuition: <Lightbulb size={size} />,
    clinic: <Stethoscope size={size} />,
    practice: <Target size={size} />,
    gatekeeper: <Shield size={size} />,
    application: <Puzzle size={size} />,
  };
  return type ? iconMap[type] || <Circle size={size} /> : null;
};

/** 荒芜星球：未解锁 / 未知知识 — 冷灰插画风 */
const BarrenPlanet: React.FC<{ size?: 'md' | 'lg' }> = ({ size = 'md' }) => {
  const uid = React.useId().replace(/:/g, '');
  const dim = size === 'lg' ? 'w-28 h-28' : 'w-[4.25rem] h-[4.25rem]';
  const lockSize = size === 'lg' ? 22 : 16;
  return (
    <div className={`${dim} relative shrink-0`}>
      <div className="absolute -inset-1 rounded-full bg-slate-400/15 blur-md" />
      <svg viewBox="0 0 80 80" className="relative w-full h-full drop-shadow-[0_10px_20px_rgba(15,23,42,0.28)]">
        <defs>
          <radialGradient id={`barrenBody-${uid}`} cx="32%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#C4CBD4" />
            <stop offset="45%" stopColor="#8B95A3" />
            <stop offset="100%" stopColor="#5A6574" />
          </radialGradient>
          <radialGradient id={`barrenShade-${uid}`} cx="70%" cy="78%" r="55%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.45" />
          </radialGradient>
          <clipPath id={`barrenClip-${uid}`}>
            <circle cx="40" cy="40" r="36" />
          </clipPath>
        </defs>
        <circle cx="40" cy="40" r="36" fill={`url(#barrenBody-${uid})`} />
        <g clipPath={`url(#barrenClip-${uid})`}>
          <ellipse cx="28" cy="26" rx="9" ry="7.5" fill="#64748B" opacity="0.45" />
          <ellipse cx="27" cy="25" rx="5.5" ry="4.5" fill="#475569" opacity="0.35" />
          <ellipse cx="54" cy="42" rx="7" ry="6" fill="#64748B" opacity="0.4" />
          <ellipse cx="53" cy="41" rx="4" ry="3.5" fill="#475569" opacity="0.3" />
          <ellipse cx="36" cy="56" rx="6" ry="5" fill="#64748B" opacity="0.38" />
          <circle cx="58" cy="24" r="3.2" fill="#64748B" opacity="0.35" />
          <path
            d="M8 38 Q24 44 40 36 T72 40"
            fill="none"
            stroke="#475569"
            strokeWidth="2.2"
            strokeOpacity="0.25"
            strokeLinecap="round"
          />
          <path
            d="M12 50 Q30 56 48 48 T70 52"
            fill="none"
            stroke="#475569"
            strokeWidth="1.6"
            strokeOpacity="0.2"
            strokeLinecap="round"
          />
          <circle cx="40" cy="40" r="36" fill={`url(#barrenShade-${uid})`} />
          <ellipse cx="28" cy="22" rx="14" ry="9" fill="white" opacity="0.18" />
        </g>
        <circle cx="40" cy="40" r="35.5" fill="none" stroke="white" strokeOpacity="0.22" strokeWidth="1.5" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-slate-900/25 backdrop-blur-[2px] flex items-center justify-center">
          <Lock size={lockSize} className="text-white/90" strokeWidth={2.25} />
        </div>
      </div>
    </div>
  );
};

/** 生机星球：已通关 — 青绿地球插画风 */
const LushPlanet: React.FC<{ size?: 'md' | 'lg'; level?: number; stars?: number }> = ({
  size = 'md',
  level,
  stars = 0,
}) => {
  const uid = React.useId().replace(/:/g, '');
  const dim = size === 'lg' ? 'w-28 h-28' : 'w-[4.25rem] h-[4.25rem]';
  const levelCls = size === 'lg' ? 'text-[22px]' : 'text-[17px]';
  return (
    <div className={`${dim} relative shrink-0 group-hover:scale-110 transition-transform duration-300`}>
      <div className="absolute -inset-1.5 rounded-full bg-emerald-400/25 blur-lg" />
      <svg viewBox="0 0 80 80" className="relative w-full h-full drop-shadow-[0_12px_24px_rgba(16,185,129,0.32)]">
        <defs>
          <radialGradient id={`lushOcean-${uid}`} cx="34%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="40%" stopColor="#38BDF8" />
            <stop offset="78%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0C4A6E" />
          </radialGradient>
          <radialGradient id={`lushShade-${uid}`} cx="72%" cy="78%" r="50%">
            <stop offset="0%" stopColor="#0C4A6E" stopOpacity="0" />
            <stop offset="100%" stopColor="#082F49" stopOpacity="0.4" />
          </radialGradient>
          <clipPath id={`lushClip-${uid}`}>
            <circle cx="40" cy="40" r="36" />
          </clipPath>
        </defs>
        <circle cx="40" cy="40" r="36" fill={`url(#lushOcean-${uid})`} />
        <g clipPath={`url(#lushClip-${uid})`}>
          <path
            d="M18 30 C22 22 34 20 40 26 C46 20 58 24 60 34 C64 42 56 50 48 48 C42 54 30 52 26 44 C20 40 16 36 18 30Z"
            fill="#34D399"
            opacity="0.92"
          />
          <path
            d="M48 52 C54 50 66 54 68 62 C66 70 54 72 46 66 C42 62 44 54 48 52Z"
            fill="#10B981"
            opacity="0.88"
          />
          <path
            d="M14 52 C20 48 28 52 30 58 C26 64 16 64 12 58 C12 54 12 53 14 52Z"
            fill="#22C55E"
            opacity="0.75"
          />
          <ellipse cx="30" cy="34" rx="10" ry="3.5" fill="white" opacity="0.35" />
          <ellipse cx="52" cy="48" rx="8" ry="2.8" fill="white" opacity="0.28" />
          <ellipse cx="44" cy="22" rx="6" ry="2.2" fill="white" opacity="0.22" />
          <circle cx="40" cy="40" r="36" fill={`url(#lushShade-${uid})`} />
          <ellipse cx="28" cy="22" rx="15" ry="10" fill="white" opacity="0.2" />
        </g>
        <circle cx="40" cy="40" r="35.5" fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <span className={`${levelCls} font-black text-white tabular-nums leading-none drop-shadow-[0_2px_6px_rgba(12,74,110,0.55)]`}>
          {level}
        </span>
        {size === 'md' && stars > 0 && (
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i <= stars ? 'bg-amber-300 shadow-[0_0_4px_rgba(252,211,77,0.8)]' : 'bg-white/25'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const GameNodeComponent: React.FC<{
  node: MapNode;
  onClick: () => void;
  variant?: 'standard' | 'planet';
}> = ({ node, onClick, variant = 'standard' }) => {
  const isCompleted = node.status === 'completed';
  const isCurrent = node.status === 'current';
  const isLocked = node.status === 'locked';
  const isPractice = node.nodeType === 'practice';
  const isPlanet = variant === 'planet';

  if (isPlanet) {
    const isSun = node.nodeType === 'boss' || node.id === 'pboss';
    return (
      <div className="flex flex-col items-center group cursor-pointer relative" onClick={onClick}>
        {!isLocked && !isSun && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
            <div
              className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border backdrop-blur-md shadow-lg transition-all ${
                isCurrent
                  ? 'bg-white text-indigo-600 border-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110'
                  : 'bg-slate-800/80 text-slate-300 border-white/20'
              }`}
            >
              {node.abilityType || node.title}
            </div>
          </div>
        )}
        <div
          className={`relative transition-all duration-700 flex items-center justify-center rounded-full ${
            isSun ? 'w-32 h-32' : isCurrent ? 'w-20 h-20 scale-110' : 'w-16 h-16 opacity-80 hover:opacity-100 hover:scale-110'
          }`}
        >
          {isLocked ? (
            <BarrenPlanet size="md" />
          ) : isCompleted && !isSun ? (
            <LushPlanet size="md" level={node.level} stars={node.stars} />
          ) : (
            <div
              className={`relative w-full h-full rounded-full flex items-center justify-center overflow-hidden border shadow-inner ${
                isSun
                  ? 'bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 border-orange-400/50'
                  : isCurrent
                    ? 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-300/50'
                    : 'bg-slate-700 border-slate-600'
              }`}
            >
              {isSun ? (
                <Brain size={40} className="text-white drop-shadow-lg" />
              ) : (
                <div className="text-white font-black text-xl">{node.level}</div>
              )}
            </div>
          )}
        </div>
        {isLocked && (
          <div className="mt-3 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest text-stone-400 bg-stone-900/50 border border-stone-600/40 backdrop-blur-sm">
            未知知识
          </div>
        )}
      </div>
    );
  }

  if (node.nodeType === 'chest') {
    return (
      <div className="group cursor-pointer flex flex-col items-center" onClick={onClick}>
        <div
          className={`w-20 h-20 rounded-[32px] flex items-center justify-center relative transition-transform hover:scale-105 active:scale-95 duration-300 ${
            isLocked
              ? 'bg-white/40 backdrop-blur-md border border-white/60'
              : isCompleted
                ? 'bg-amber-50/80 backdrop-blur-md border border-amber-200 shadow-sm'
                : 'bg-gradient-to-br from-amber-300 to-yellow-500 shadow-[0_12px_24px_rgba(245,158,11,0.3)] border border-white/40'
          }`}
        >
          {isLocked ? (
            <Lock size={22} className="text-slate-300" />
          ) : isCompleted ? (
            <Check size={28} className="text-amber-600" strokeWidth={3} />
          ) : (
            <Gift size={32} className="text-white drop-shadow-md animate-bounce" />
          )}
        </div>
      </div>
    );
  }

  if (node.nodeType === 'boss') {
    return (
      <div className="group cursor-pointer flex flex-col items-center" onClick={onClick}>
        <div className="relative">
          {!isLocked && !isCompleted && (
            <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping duration-[2000ms]" />
          )}
          {isLocked ? (
            <BarrenPlanet size="lg" />
          ) : isCompleted ? (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-400/25 blur-xl scale-110" />
              <LushPlanet size="lg" level={node.level} stars={node.stars ?? 3} />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[8px] font-black tracking-wider shadow-md">
                CLEARED
              </div>
            </div>
          ) : (
            <div className="w-28 h-28 rounded-full flex items-center justify-center relative overflow-hidden transition-transform hover:scale-105 active:scale-95 duration-300 border-[6px] bg-gradient-to-br from-rose-500 to-red-600 border-white/30 shadow-[0_20px_50px_rgba(225,29,72,0.3)]">
              <Crown size={48} className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]" />
              <div className="absolute bottom-4 bg-white/90 backdrop-blur text-rose-600 px-3 py-1 rounded-full text-[9px] font-black tracking-[0.2em] uppercase">
                FINAL
              </div>
            </div>
          )}
        </div>
        {isLocked ? (
          <div className="mt-4 px-3 py-1.5 rounded-2xl text-[10px] font-black text-center text-stone-400 bg-stone-900/45 border border-stone-500/35 backdrop-blur-md tracking-widest">
            未知知识
          </div>
        ) : (
          <div className="mt-5 px-4 py-2 rounded-2xl text-[10px] font-black text-center bg-white/60 text-slate-500 border border-white/60">
            {node.taskTitle || node.title}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center group cursor-pointer relative" onClick={onClick}>
      <div
        className={`relative transition-all duration-500 z-10 flex items-center justify-center ${
          isCurrent ? 'w-24 h-24' : 'w-[4.5rem] h-[4.5rem]'
        }`}
      >
        {isLocked && <BarrenPlanet size="md" />}
        {isCompleted && (
          <LushPlanet size="md" level={node.level} stars={node.stars} />
        )}
        {isCurrent && (
          <div className="relative w-full h-full">
            <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] rounded-full bg-indigo-400/30 blur-xl animate-glow-breathe" />
            <div
              className="absolute top-1/2 left-1/2 w-[148%] h-[148%] rounded-full border-[2.5px] border-dashed border-indigo-400/70 animate-orbit-spin"
              style={{ borderTopColor: 'rgba(167,139,250,0.95)', borderRightColor: 'transparent' }}
            />
            <div className="absolute top-1/2 left-1/2 w-[148%] h-[148%] animate-orbit-spin">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]" />
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sky-300 shadow-[0_0_6px_rgba(125,211,252,0.9)]" />
            </div>
            <div
              className={`absolute inset-0 rounded-full flex items-center justify-center shadow-[0_16px_32px_rgba(99,102,241,0.35)] ${
                isPractice
                  ? 'bg-gradient-to-br from-blue-400 to-indigo-600'
                  : 'bg-gradient-to-br from-indigo-500 to-violet-700'
              } animate-breath-light border-2 border-white/60`}
            >
              <div className="flex flex-col items-center z-10 text-white drop-shadow-md">
                {node.chapterNodeType ? (
                  getLinearIcon(node.chapterNodeType, 32)
                ) : isPractice ? (
                  <PenTool size={24} />
                ) : (
                  <Play size={32} fill="white" className="ml-1" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {isLocked ? (
        <div className="mt-3 px-3 py-1.5 rounded-2xl text-[10px] font-black text-center text-stone-400 bg-stone-900/45 border border-stone-500/35 backdrop-blur-md tracking-widest whitespace-nowrap">
          未知知识
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-1.5 max-w-28">
          <div
            className={`px-4 py-2 rounded-2xl text-[10px] font-black text-center backdrop-blur-md border transition-all shadow-sm ${
              isCurrent
                ? 'bg-white text-indigo-600 border-indigo-100 shadow-indigo-100 scale-105 translate-y-2'
                : 'bg-emerald-50/80 text-emerald-700 border-emerald-100/80 hover:bg-white'
            }`}
          >
            {node.taskTitle || node.title}
          </div>
        </div>
      )}
    </div>
  );
};
