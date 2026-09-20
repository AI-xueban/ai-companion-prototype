import React from 'react';
import { motion } from 'framer-motion';
import { Zap, BookA } from 'lucide-react';
import { MapMode } from '../../types';

interface ModeSwitchRailProps {
  mapMode: MapMode;
  onModeChange: (mode: MapMode) => void;
  variant?: 'dark' | 'light';
}

const MODES = [
  { id: 'pro' as MapMode, label: '课本同步学', icon: Zap },
  { id: 'sync' as MapMode, label: '个性化学习', icon: BookA },
];

/** 左侧模式切换按钮组（外层由 TopStatusBar 提供通栏底） */
export const ModeSwitchRail: React.FC<ModeSwitchRailProps> = ({
  mapMode,
  onModeChange,
  variant = 'light',
}) => {
  const isDark = variant === 'dark';

  return (
    <div className="pointer-events-auto flex flex-col w-full">
      {MODES.map(({ id, label, icon: Icon }, index) => {
        const isActive = mapMode === id;
        return (
          <React.Fragment key={id}>
            {index > 0 && (
              <div className={`h-px shrink-0 mx-2 ${isDark ? 'bg-white/8' : 'bg-transparent'}`} />
            )}
            <button
              type="button"
              onClick={() => onModeChange(id)}
              className={`relative flex flex-col items-center justify-center gap-1 py-3 px-1 w-full transition-colors ${
                isActive
                  ? isDark
                    ? 'bg-white/12 text-white'
                    : 'bg-indigo-50/70 text-indigo-600'
                  : isDark
                    ? 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-indigo-50/40'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mode-rail-edge-bar"
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-indigo-500"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <Icon
                size={16}
                strokeWidth={2.25}
                fill={isActive && id === 'pro' && !isDark ? 'currentColor' : 'none'}
                className={isActive && !isDark ? 'text-indigo-500' : undefined}
              />
              <span
                className="text-[10px] font-black leading-[1.15] tracking-tight text-center"
                style={{ writingMode: 'vertical-rl' }}
              >
                {label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
