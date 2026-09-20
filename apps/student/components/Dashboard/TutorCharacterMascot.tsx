import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorCharacterTheme, TUTOR_CHARACTERS } from '../../data/tutorCharacterThemes';

const PICKER_WIDTH = 400;
const PICKER_GAP = 14;

export interface TutorCharacterMascotProps {
  character: TutorCharacterTheme;
  onSelect: (id: TutorCharacterTheme['id']) => void;
  isSpeaking?: boolean;
  isWriting?: boolean;
  isRecording?: boolean;
  compact?: boolean;
  /** 嵌入提示框内时关闭上下浮动，避免裁切 */
  embedded?: boolean;
}

export const TutorCharacterMascot: React.FC<TutorCharacterMascotProps> = ({
  character,
  onSelect,
  isSpeaking = false,
  isWriting = false,
  isRecording = false,
  compact = false,
  embedded = false,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const [pickerReady, setPickerReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const active = isSpeaking || isWriting || isRecording;

  const updatePickerPos = useCallback(() => {
    const anchor = anchorRef.current;
    const panel = pickerRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const panelW = panel?.offsetWidth ?? PICKER_WIDTH;
    const panelH = panel?.offsetHeight ?? 360;
    const pad = 16;

    let left = rect.left + rect.width / 2 - panelW / 2;
    let top = rect.top - panelH - PICKER_GAP;

    left = Math.max(pad, Math.min(left, window.innerWidth - panelW - pad));
    if (top < pad) {
      top = rect.bottom + PICKER_GAP;
    }

    setPickerPos({ top, left });
  }, []);

  useEffect(() => {
    if (!pickerOpen) {
      setPickerReady(false);
      return;
    }
    updatePickerPos();
    const raf = requestAnimationFrame(() => {
      updatePickerPos();
      setPickerReady(true);
    });
    window.addEventListener('resize', updatePickerPos);
    window.addEventListener('scroll', updatePickerPos, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePickerPos);
      window.removeEventListener('scroll', updatePickerPos, true);
    };
  }, [pickerOpen, updatePickerPos]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || pickerRef.current?.contains(target)) return;
      setPickerOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [pickerOpen]);

  const idleBorder = character.accentBorder.replace('-400', '-200');

  const pickerPortal =
    typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            {pickerOpen && (
              <>
                <motion.button
                  type="button"
                  aria-label="关闭角色选择"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[120] bg-slate-900/20 backdrop-blur-[1px]"
                  onClick={() => setPickerOpen(false)}
                />
                <motion.div
                  ref={pickerRef}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: pickerReady ? 1 : 0, y: pickerReady ? 0 : 10, scale: pickerReady ? 1 : 0.96 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  style={{ top: pickerPos.top, left: pickerPos.left }}
                  className="fixed z-[121] w-[min(calc(100vw-32px),400px)] p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xl"
                >
                  <div className="mb-4 px-0.5">
                    <p className="text-base font-black text-slate-800">切换讲题伙伴</p>
                    <p className="text-sm text-slate-500 mt-1">选一位伙伴，陪你一起讲题</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {TUTOR_CHARACTERS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onSelect(c.id);
                          setPickerOpen(false);
                        }}
                        className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                          c.id === character.id
                            ? `${c.accentBorder} bg-slate-50 ring-2 ring-offset-2 ring-offset-white shadow-sm`
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/80'
                        }`}
                        title={c.name}
                      >
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-24 h-24 rounded-2xl object-cover shadow-md border border-white"
                        />
                        <span className="text-sm font-bold text-slate-800 leading-none">{c.name}</span>
                        <span className="absolute top-3 right-3 text-xl leading-none drop-shadow-sm">
                          {c.badge}
                        </span>
                        {c.id === character.id && (
                          <span className="text-[11px] font-bold text-emerald-600 leading-none">当前</span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative shrink-0 ${compact ? 'self-center' : 'self-end mb-0.5'}`}>
      {pickerPortal}

      <motion.div
        className={`flex flex-col items-center ${compact ? 'gap-0' : 'gap-1'}`}
        animate={
          embedded
            ? { y: 0 }
            : { y: isWriting ? [0, -3, 1, -2, 0] : [0, -4, 0] }
        }
        transition={
          embedded
            ? undefined
            : { repeat: Infinity, duration: isWriting ? 1.4 : 3.2, ease: 'easeInOut' }
        }
      >
        <button
          ref={anchorRef}
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className="relative cursor-pointer active:scale-95 transition-transform"
          aria-label={`当前：${character.name}，点击切换角色`}
          aria-expanded={pickerOpen}
          title="点击切换讲题角色"
        >
          {isSpeaking && !isRecording && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`absolute inset-0 rounded-xl border ${character.accentBorder}/40`}
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5 + i * 0.12, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.45, ease: 'easeOut' }}
                />
              ))}
            </>
          )}

          {isRecording && (
            <motion.div
              className="absolute -inset-1 rounded-xl border border-rose-400/50"
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
          )}

          <motion.div
            className={`absolute -inset-1 rounded-xl transition-colors duration-500 ${
              isRecording ? 'bg-rose-200/50' : active ? character.accentGlow : 'bg-white/70'
            }`}
            animate={active ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.5 }}
            transition={{ repeat: active ? Infinity : 0, duration: 2, ease: 'easeInOut' }}
          />

          <motion.img
            src={character.avatar}
            alt={character.name}
            className={`relative rounded-xl object-cover border-2 shadow-md ${
              compact ? 'w-9 h-9' : 'w-11 h-11'
            } ${
              isRecording
                ? 'border-rose-400'
                : active
                  ? character.accentBorder
                  : idleBorder
            }`}
            animate={
              isWriting
                ? { rotate: [0, -2, 1.5, 0], scale: [1, 1.03, 1] }
                : isSpeaking
                  ? { scale: [1, 1.05, 1] }
                  : { scale: 1 }
            }
            transition={{ repeat: Infinity, duration: isWriting ? 1.4 : 2.2, ease: 'easeInOut' }}
          />

          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[8px] leading-none shadow-sm">
            {character.badge}
          </span>

          {isWriting && !embedded && (
            <motion.div
              className="absolute -right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              animate={{ x: [0, 3, -1, 2, 0], rotate: [-12, -6, -10, -8, -12] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={character.accentBrush}>
                <path d="M3 21l3.5-1 9.5-9.5a2.1 2.1 0 0 0-3-3L3.5 17 2 21l1 0z" fill="currentColor" />
              </svg>
            </motion.div>
          )}

          {isSpeaking && !isWriting && !isRecording && !embedded && (
            <div className="absolute -right-5 top-1/2 -translate-y-1/2 flex gap-0.5 items-end h-4 pointer-events-none">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className={`w-0.5 rounded-full ${character.accentWave} origin-bottom`}
                  animate={{ height: [3, 10, 4, 12, 3] }}
                  transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.08, ease: 'easeInOut' }}
                />
              ))}
            </div>
          )}
        </button>

        {!compact && (
          <motion.span
            className={`text-[8px] font-bold ${character.accentText} tracking-wide whitespace-nowrap`}
            animate={{ opacity: active ? [0.45, 0.75, 0.45] : 0.35 }}
            transition={{ repeat: active ? Infinity : 0, duration: 2 }}
          >
            {isRecording ? '聆听' : isWriting ? '书写' : isSpeaking ? '讲解' : character.name}
          </motion.span>
        )}
      </motion.div>
    </div>
  );
};
