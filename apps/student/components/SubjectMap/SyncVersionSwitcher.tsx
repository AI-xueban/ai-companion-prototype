import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SyncVersionSwitcherProps {
  version: string;
  versions: string[];
  onChange: (version: string) => void;
  placement?: 'bottom' | 'top';
}

export const SyncVersionSwitcher: React.FC<SyncVersionSwitcherProps> = ({
  version,
  versions,
  onChange,
  placement = 'bottom',
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [version]);

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="切换教材版本"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={`flex max-w-[11rem] items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium transition ${
          open ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        <span className="truncate">{version}</span>
        <ChevronDown size={12} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="教材版本"
          onClick={(event) => event.stopPropagation()}
          className={`absolute right-0 z-30 w-64 max-h-72 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_16px_40px_rgba(15,23,42,0.12)] ${
            placement === 'top' ? 'bottom-[38px]' : 'top-[38px]'
          }`}
        >
          <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400">教材版本</div>
          <div className="grid grid-cols-2 gap-1.5">
            {versions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onChange(item);
                  setOpen(false);
                }}
                className={`rounded-xl px-2 py-2 text-left text-[11px] font-medium leading-4 transition ${
                  item === version
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
