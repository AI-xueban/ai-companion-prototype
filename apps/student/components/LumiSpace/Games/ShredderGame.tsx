
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Send, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface ShredderGameProps {
  onComplete: () => void;
}

export const ShredderGame: React.FC<ShredderGameProps> = ({ onComplete }) => {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'write' | 'shredding' | 'done'>('write');

  const handleShred = () => {
    if (!text.trim()) return;
    setPhase('shredding');
    // Animation duration + delay
    setTimeout(() => {
        setPhase('done');
    }, 2500);
  };

  const handleReset = () => {
      setText('');
      setPhase('write');
  };

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto p-6 items-center justify-center">
        
        {/* Header */}
        <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-gray-800 mb-2">情绪碎纸机</h2>
            <p className="text-gray-500 text-sm font-medium">写下你的烦恼，我们一起把它粉碎掉。</p>
        </div>

        <div className="relative w-full aspect-[4/3] mb-8">
            <AnimatePresence mode="wait">
                {phase === 'write' && (
                    <motion.div 
                        key="paper"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ y: 200, opacity: 0, transition: { duration: 0.5 } }}
                        className="absolute inset-0 bg-[#fff9c4] shadow-lg rounded-sm p-6 transform rotate-1"
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-black/10 blur-md -translate-y-4 rounded-full"></div>
                        <textarea 
                            className="w-full h-full bg-transparent border-none resize-none outline-none text-gray-700 font-handwriting text-lg leading-loose placeholder:text-gray-400/70"
                            placeholder="在这里写下那些让你不开心的事情..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}
                        />
                    </motion.div>
                )}

                {phase === 'shredding' && (
                    <motion.div 
                        key="shreds"
                        className="absolute inset-0 flex gap-1"
                    >
                        {/* Simulate Shredding Strips */}
                        {[...Array(10)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ y: 0, opacity: 1 }}
                                animate={{ 
                                    y: 600, 
                                    opacity: 0,
                                    rotate: Math.random() * 90 - 45,
                                    x: Math.random() * 100 - 50 
                                }}
                                transition={{ 
                                    duration: 1.5, 
                                    delay: i * 0.05,
                                    ease: "easeIn" 
                                }}
                                className="flex-1 bg-[#fff9c4] shadow-sm relative overflow-hidden"
                            >
                                {/* Keep some text texture */}
                                <div className="absolute top-0 left-0 w-[400px] p-6 text-gray-700 opacity-50 font-handwriting" style={{ transform: `translateX(-${i * 10}%)` }}>
                                    {text}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {phase === 'done' && (
                    <motion.div 
                        key="done"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center text-center"
                    >
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 size={48} className="text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">烦恼已清空！</h3>
                        <p className="text-gray-500 text-sm mt-2">是不是感觉轻松了一点？</p>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* The Shredder Machine Visual (Bottom) */}
            {phase === 'shredding' && (
                <motion.div 
                    className="absolute -bottom-8 left-[-10%] right-[-10%] h-16 bg-gray-800 rounded-t-lg z-20 flex justify-center items-center gap-2"
                    initial={{ y: 100 }} animate={{ y: 0 }}
                >
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-white/50 text-xs font-mono font-bold">PROCESSING...</span>
                </motion.div>
            )}
        </div>

        {/* Controls */}
        <div className="w-full flex gap-4">
            {phase === 'write' ? (
                <button 
                    onClick={handleShred}
                    disabled={!text.trim()}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-all active:scale-95"
                >
                    <Trash2 size={20} /> 粉碎烦恼
                </button>
            ) : phase === 'done' ? (
                <div className="flex gap-3 w-full">
                    <button 
                        onClick={handleReset}
                        className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw size={20} /> 再写一张
                    </button>
                    <button 
                        onClick={onComplete}
                        className="flex-1 bg-brand text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand/20 hover:bg-brand-dark transition-colors"
                    >
                        <Send size={20} /> 返回聊天
                    </button>
                </div>
            ) : null}
        </div>
    </div>
  );
};
