import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Edit2, ScanLine, Keyboard } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

// 极简状态定义：单胶囊原位变形
type CapsuleState = 
  | 'idle'       // [ 🎤 | 📷 ]
  | 'listening'  // [ 🌊 实时文字... ]
  | 'review'     // [ 📝 最终文字 (倒计时) ]
  | 'editing'    // [ 输入框 + 发送 ]
  | 'sending';   // [ 发送动画 ]

interface Props {
  onSend?: (text: string) => void;
  onCameraPress?: () => void;
  className?: string;
}

// 模拟数据
const mockTranscriptions = [
  "你好", "你好小", "你好小晤", "你好小晤，帮我", "你好小晤，帮我制定", "你好小晤，帮我制定今天的计划"
];

// 触觉反馈
const hapticFeedback = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(25),
  heavy: () => navigator.vibrate?.(50),
};

export const VoiceTranscriptionBubble: React.FC<Props> = ({ onSend, onCameraPress, className = "" }) => {
  const [state, setState] = useState<CapsuleState>('idle');
  const [text, setText] = useState('');
  const [editText, setEditText] = useState('');
  
  const timerRef = useRef<number | undefined>(undefined);
  const listenIntervalRef = useRef<number | undefined>(undefined);

  // 模拟听写过程
  const startListening = () => {
    setState('listening');
    setText('');
    hapticFeedback.medium();
    let i = 0;
    
    if (listenIntervalRef.current) clearInterval(listenIntervalRef.current);

    listenIntervalRef.current = window.setInterval(() => {
      setText(mockTranscriptions[i]);
      i++;
      if (i >= mockTranscriptions.length) {
        if (listenIntervalRef.current) clearInterval(listenIntervalRef.current);
        // 听写完毕，进入 Review 状态
        window.setTimeout(() => enterReviewState(mockTranscriptions[mockTranscriptions.length - 1]), 500);
      }
    }, 400);
  };

  // 进入 Review (倒计时发送) 状态
  const enterReviewState = (finalText: string) => {
    setState('review');
    setText(finalText);
    hapticFeedback.light();
    
    // 3秒后自动发送
    timerRef.current = window.setTimeout(() => {
      handleSend(finalText);
    }, 3000);
  };

  // 发送处理
  const handleSend = (content: string) => {
    setState('sending');
    hapticFeedback.medium();
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // 模拟发送请求
    setTimeout(() => {
      onSend?.(content);
      // 发送完成后重置
      setTimeout(() => {
        setState('idle');
        setText('');
        setEditText('');
      }, 600);
    }, 800);
  };

  // 点击 Review 状态 -> 进入编辑
  const handleReviewClick = () => {
    if (state === 'review') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setEditText(text);
      setState('editing');
      hapticFeedback.light();
    }
  };

  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (listenIntervalRef.current) clearInterval(listenIntervalRef.current);
    };
  }, []);

  return (
    <div className={`flex justify-center items-end ${className}`}>
      <motion.div
        layout
        className={`
          relative flex items-center justify-center overflow-hidden
          backdrop-blur-2xl shadow-2xl transition-colors duration-300
          ${state === 'idle' ? 'bg-slate-900/60 border border-white/10 rounded-full' : ''}
          ${state === 'listening' ? 'bg-slate-900/80 border border-cyan-400/30 rounded-[32px]' : ''}
          ${state === 'review' ? 'bg-white/95 border border-white/50 rounded-[24px] cursor-pointer' : ''}
          ${state === 'editing' ? 'bg-white border border-slate-200 rounded-[24px]' : ''}
          ${state === 'sending' ? 'bg-cyan-500 rounded-full' : ''}
        `}
        initial={{ width: 200, height: 64 }}
        animate={{
          width: state === 'idle' ? 260 : (state === 'sending' ? 200 : 320),
          height: state === 'editing' ? 'auto' : 64, // 编辑时高度自适应
        }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        style={{
          boxShadow: state === 'listening' 
            ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 20px rgba(34,211,238,0.2)' 
            : '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
        onClick={state === 'review' ? handleReviewClick : undefined}
        role={state === 'review' ? 'button' : undefined}
        tabIndex={state === 'review' ? 0 : undefined}
        aria-label={state === 'review' ? '编辑识别结果' : undefined}
        onKeyDown={state === 'review' ? (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleReviewClick();
          }
        } : undefined}
      >
        {/* Apple Intelligence 流光 (仅 Listening) */}
        <AnimatePresence>
          {state === 'listening' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0 pointer-events-none"
            >
               <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(34,211,238,0.5)_360deg)] animate-[spin_3s_linear_infinite]" />
               <div className="absolute inset-[1px] bg-slate-900/90 rounded-[31px]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 内容层 */}
        <div className="relative z-10 w-full px-2">
          <AnimatePresence mode="wait">
            
            {/* 1. IDLE: Magic Bar (键盘 | 麦克风 | 相机) */}
            {state === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-between w-full px-1"
              >
                 <button 
                    type="button"
                    aria-label="键盘输入"
                    onClick={() => {
                        setState('editing');
                        setEditText('');
                        hapticFeedback.light();
                    }}
                    className="w-12 h-12 flex items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                 >
                    <Keyboard size={20} />
                 </button>

                 <button 
                    type="button"
                    aria-label="语音输入"
                    onClick={startListening} 
                    className="flex-1 h-[48px] max-w-[100px] flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95 border border-white/5 mx-2"
                 >
                    <Mic size={24} />
                 </button>

                 <button 
                    type="button"
                    aria-label="拍照识题"
                    onClick={onCameraPress} 
                    className="w-12 h-12 flex items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                 >
                    <ScanLine size={20} />
                 </button>
              </motion.div>
            )}

            {/* 2. LISTENING: 波形+文字 */}
            {state === 'listening' && (
              <motion.div 
                key="listening"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-3 w-full h-full text-cyan-100"
              >
                <div className="flex gap-1 h-4 items-end">
                   {[1,2,3,4].map(i => (
                     <motion.div key={i} className="w-1 bg-cyan-400 rounded-full" 
                       animate={{ height: [4, 16, 4] }} 
                       transition={{ repeat: Infinity, duration: 0.8, delay: i*0.1 }} 
                     />
                   ))}
                </div>
                <span className="text-sm font-medium truncate">{text || "聆听中..."}</span>
              </motion.div>
            )}

            {/* 3. REVIEW: 确认文字 (带倒计时) */}
            {state === 'review' && (
              <motion.div 
                key="review"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="w-full flex items-center justify-between px-4 py-2"
              >
                <span className="text-slate-800 text-sm font-medium truncate flex-1 text-left mr-2">{text}</span>
                <div className="flex items-center gap-2 text-slate-400 shrink-0">
                  <span className="text-[10px] font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 group-hover:hidden">3s发送</span>
                  <Edit2 size={14} className="text-cyan-500 animate-pulse" />
                </div>
                {/* 底部进度条 */}
                <motion.div 
                   className="absolute bottom-0 left-0 h-[3px] bg-cyan-500"
                   initial={{ width: "0%" }}
                   animate={{ width: "100%" }}
                   transition={{ duration: 3, ease: "linear" }}
                />
              </motion.div>
            )}

            {/* 4. EDITING: 输入框 */}
            {state === 'editing' && (
              <motion.div 
                key="editing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full p-2 flex items-end gap-2"
              >
                <div className="flex-1 bg-slate-50 rounded-[16px] border border-slate-200 focus-within:ring-2 focus-within:ring-cyan-500/20 px-3 py-2 transition-all">
                    <TextareaAutosize 
                    value={editText} 
                    onChange={e => setEditText(e.target.value)}
                    aria-label="编辑输入内容"
                    className="w-full bg-transparent text-sm text-slate-800 resize-none outline-none placeholder:text-slate-400"
                    minRows={1} maxRows={3}
                    autoFocus
                    placeholder="编辑你的消息..."
                    />
                </div>
                <button 
                    type="button"
                    aria-label="发送"
                    onClick={() => handleSend(editText)} 
                    disabled={!editText.trim()}
                    className={`p-2.5 rounded-full text-white shadow-lg transition-all active:scale-95 flex items-center justify-center shrink-0
                        ${editText.trim() ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-slate-300'}`}
                >
                  <Send size={18} className="ml-0.5" />
                </button>
              </motion.div>
            )}

            {/* 5. SENDING: 发送反馈 */}
            {state === 'sending' && (
              <motion.div 
                 key="sending"
                 initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                 className="flex items-center justify-center w-full h-full text-white"
              >
                 <Send size={24} className="animate-ping absolute opacity-50" />
                 <Send size={24} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
        
        {/* 底部 AI 标签 (仅 idle 时显示) */}
        <AnimatePresence>
            {state === 'idle' && (
                <motion.span 
                layoutId="ai-label"
                className="absolute -bottom-6 text-white/40 text-[10px] font-black tracking-[0.2em] uppercase pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                >
                AI Assistant
                </motion.span>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
