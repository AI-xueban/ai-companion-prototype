import React, { useEffect, useRef, useState } from 'react';
import {
  formatMistakeReasonsDisplay,
  MistakeReasonKey,
} from '../../../data/mistakeReasons';
import { MistakeReasonSheet } from './MistakeReasonSheet';

interface MistakeReasonTriggerProps {
  selectedReasons?: MistakeReasonKey[];
  onClick: () => void;
  className?: string;
}

export const MistakeReasonTrigger: React.FC<MistakeReasonTriggerProps> = ({
  selectedReasons = [],
  onClick,
  className = '',
}) => {
  const display = formatMistakeReasonsDisplay(selectedReasons);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors text-left min-w-0 ${className}`}
    >
      {display ? (
        <>
          错因：<span className="text-indigo-600 font-semibold">{display}</span>
          <span className="text-slate-300 ml-1">· 修改</span>
        </>
      ) : (
        <>
          标记<span className="text-rose-500/80 font-semibold">错因</span>
        </>
      )}
    </button>
  );
};

interface MistakeReasonPickerProps {
  selectedReasons?: MistakeReasonKey[];
  onSelect: (reasons: MistakeReasonKey[]) => void;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onBeforeOpen?: () => void;
  successMessage?: string | ((reasons: MistakeReasonKey[]) => string);
  showTrigger?: boolean;
}

/** 轻量入口：默认只占一行，点开 Sheet 多选错因（最多 3 项） */
export const MistakeReasonPicker: React.FC<MistakeReasonPickerProps> = ({
  selectedReasons = [],
  onSelect,
  className = '',
  open: openProp,
  onOpenChange,
  onBeforeOpen,
  successMessage = '错因已标记',
  showTrigger = true,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const isControlled = onOpenChange != null;
  const open = isControlled ? Boolean(openProp) : internalOpen;

  const setOpen = (next: boolean) => {
    if (isControlled) onOpenChange?.(next);
    else setInternalOpen(next);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2400);
  };

  const handleOpen = () => {
    onBeforeOpen?.();
    setOpen(true);
  };

  const handleConfirm = (reasons: MistakeReasonKey[]) => {
    onSelect(reasons);
    const message =
      typeof successMessage === 'function' ? successMessage(reasons) : successMessage;
    showToast(message);
    setOpen(false);
  };

  return (
    <>
      {showTrigger && (
        <MistakeReasonTrigger
          selectedReasons={selectedReasons}
          onClick={handleOpen}
          className={className}
        />
      )}

      <MistakeReasonSheet
        open={open}
        selectedReasons={selectedReasons}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
      />

      {toast && (
        <div className="fixed left-1/2 bottom-24 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-sm font-bold shadow-lg pointer-events-none">
          {toast}
        </div>
      )}
    </>
  );
};
