import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, Send, Keyboard } from 'lucide-react';
import { TutorCharacterMascot } from './TutorCharacterMascot';
import { TutorCharacterTheme } from '../../data/tutorCharacterThemes';

const MAX_RECORD_SECONDS = 60;
const COUNTDOWN_THRESHOLD = 10;

const MOCK_LIVE_FRAGMENTS = [
  '为什么',
  '为什么是',
  '为什么是距离',
  '为什么是距离相等',
  '为什么是距离相等？',
];

export interface TutorInputBarProps {
  onSend: (text: string) => void;
  onRecordingChange?: (recording: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  isSpeaking?: boolean;
  isWriting?: boolean;
  compact?: boolean;
  theme: TutorCharacterTheme;
  onCharacterSelect: (id: TutorCharacterTheme['id']) => void;
  /** 1对1讲题阶段：麦克风更突出 */
  voiceFirst?: boolean;
  className?: string;
}

export const TutorInputBar: React.FC<TutorInputBarProps> = ({
  onSend,
  onRecordingChange,
  disabled = false,
  placeholder = '输入问题，或点击麦克风语音提问…',
  isSpeaking = false,
  isWriting = false,
  compact = false,
  theme,
  onCharacterSelect,
  voiceFirst = false,
  className = '',
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const timerRef = useRef<number | undefined>(undefined);
  const fragmentIndexRef = useRef(0);

  const remainingSec = MAX_RECORD_SECONDS - recordSec;
  const showCountdown = isRecording && remainingSec <= COUNTDOWN_THRESHOLD && remainingSec > 0;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const stopRecording = useCallback(() => {
    clearTimer();
    setIsRecording(false);
    onRecordingChange?.(false);
    const finalText = liveTranscript || MOCK_LIVE_FRAGMENTS[MOCK_LIVE_FRAGMENTS.length - 1];
    setText(finalText);
    setLiveTranscript('');
    setRecordSec(0);
    fragmentIndexRef.current = 0;
  }, [clearTimer, liveTranscript, onRecordingChange]);

  const startRecording = useCallback(() => {
    if (disabled) return;
    setIsRecording(true);
    setRecordSec(0);
    setLiveTranscript('');
    fragmentIndexRef.current = 0;
    onRecordingChange?.(true);

    timerRef.current = window.setInterval(() => {
      setRecordSec((prev) => {
        const next = prev + 1;
        if (next >= MAX_RECORD_SECONDS) {
          window.setTimeout(() => stopRecording(), 0);
          return MAX_RECORD_SECONDS;
        }
        return next;
      });

      fragmentIndexRef.current = Math.min(
        fragmentIndexRef.current + 1,
        MOCK_LIVE_FRAGMENTS.length - 1,
      );
      setLiveTranscript(MOCK_LIVE_FRAGMENTS[fragmentIndexRef.current]);
    }, 1000);
  }, [disabled, onRecordingChange, stopRecording]);

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  useEffect(() => () => clearTimer(), [clearTimer]);

  const handleSend = () => {
    const content = text.trim();
    if (!content || disabled || isRecording) return;
    onSend(content);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-end gap-1.5">
        <TutorCharacterMascot
          character={theme}
          onSelect={onCharacterSelect}
          isSpeaking={isSpeaking}
          isWriting={isWriting}
          isRecording={isRecording}
          compact={compact}
        />
        <div
          className={`flex-1 min-w-0 border rounded-xl shadow-sm transition-all duration-300 ${
            isRecording
              ? 'bg-rose-50 border-rose-200 ring-1 ring-rose-100'
              : `${theme.inputShell} ring-1`
          }`}
        >
          {isRecording ? (
            <div className={`flex items-center gap-2 ${compact ? 'p-2' : 'p-3'}`}>
              <button
                type="button"
                onClick={toggleRecording}
                className="shrink-0 w-11 h-11 rounded-full bg-rose-100 border border-rose-300/60 flex items-center justify-center text-rose-500 hover:bg-rose-200/80 transition-colors active:scale-95"
                aria-label="结束录音"
              >
                <Mic size={20} className="animate-pulse" />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 h-4 items-end shrink-0">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-rose-400/80 rounded-full"
                        animate={{ height: [4, 14, 6, 16, 4] }}
                        transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.08 }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 truncate font-medium flex-1 min-w-0">
                    {liveTranscript || '正在聆听…'}
                  </p>
                  {showCountdown ? (
                    <motion.span
                      key={remainingSec}
                      initial={{ scale: 1.2, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="shrink-0 text-lg font-black text-amber-500 tabular-nums"
                    >
                      {remainingSec}s
                    </motion.span>
                  ) : null}
                </div>
              </div>

              <p className="shrink-0 text-[10px] text-slate-400 font-medium hidden sm:block">
                再次点击结束
              </p>
            </div>
          ) : (
            <div className={`flex items-center gap-1.5 ${compact ? 'p-1.5' : 'p-2'}`}>
              {voiceFirst ? (
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={disabled}
                  className={`
                    shrink-0 rounded-xl border flex items-center justify-center transition-all active:scale-95
                    ${compact ? 'w-10 h-10' : 'w-12 h-12'}
                    ${disabled
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : `${theme.micBtn} text-slate-700 hover:text-slate-900 ring-2 ring-brand/15 shadow-sm`}
                  `}
                  aria-label="开始语音输入"
                  title="语音提问 · 点击开始录音"
                >
                  <Mic size={22} />
                </button>
              ) : null}

              <div
                className={`flex-1 min-w-0 rounded-lg border flex items-center min-h-9 ${theme.inputField} ${theme.inputFieldFocus} focus-within:bg-white focus-within:ring-2`}
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={disabled}
                  rows={1}
                  placeholder={placeholder}
                  className={`w-full bg-transparent text-slate-700 placeholder:text-slate-400 resize-none outline-none px-3 disabled:opacity-40 ${
                    compact
                      ? 'text-sm leading-5 py-1.5 max-h-16'
                      : 'text-sm leading-5 py-2 max-h-24'
                  }`}
                  style={{ fieldSizing: 'content' } as React.CSSProperties}
                />
              </div>

              {!voiceFirst ? (
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={disabled}
                  className={`
                    shrink-0 rounded-lg border flex items-center justify-center transition-all active:scale-95
                    ${compact ? 'w-9 h-9' : 'w-11 h-11 rounded-xl'}
                    ${disabled
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : `${theme.micBtn} text-slate-600 hover:text-slate-800`}
                  `}
                  aria-label="开始语音输入"
                  title="点击开始录音，再次点击结束"
                >
                  <Mic size={20} />
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleSend}
                disabled={disabled || !text.trim()}
                className={`
                  shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95
                  ${compact ? 'w-9 h-9' : 'w-11 h-11 rounded-xl'}
                  ${text.trim() && !disabled
                    ? 'bg-brand hover:bg-brand-light text-white shadow-md shadow-brand/25'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}
                `}
                aria-label="发送"
              >
                <Send size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {!isRecording && !compact && (
        <p className="mt-2 text-[10px] text-slate-500 text-center flex items-center justify-center gap-3">
          {voiceFirst ? (
            <>
              <span className="flex items-center gap-1 font-bold text-brand/80">
                <Mic size={10} />
                语音优先 · 也可键盘输入
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <Keyboard size={10} />
                键盘输入
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <Mic size={10} />
                点击录音 · 最长 60 秒
              </span>
            </>
          )}
        </p>
      )}
    </div>
  );
};
