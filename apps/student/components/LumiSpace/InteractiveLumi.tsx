
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Music, Star, Zap } from 'lucide-react';
import { LumiAccessory } from '../../types';

// Avatar Assets
import avatarNezha from '@/assets/Avatar-哪吒.jpg';
import avatarHolmes from '@/assets/Avatar-福尔摩斯.jpg';
import avatarChangE from '@/assets/Avatar-嫦娥.jpg';
import avatarEinstein from '@/assets/Avatar-爱因斯坦.jpg';

interface InteractiveLumiProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  emotion?: 'idle' | 'happy' | 'listening' | 'speaking' | 'shredding' | 'breathing' | 'analyzing' | 'thinking' | 'curious' | 'excited' | 'blush' | 'dizzy' | 'focus' | 'sparkle';
  accessory?: LumiAccessory;
  variant?: 'hero' | 'standard' | 'micro';
  showShadow?: boolean;
  style?: React.CSSProperties;
}

export const InteractiveLumi: React.FC<InteractiveLumiProps> = ({ 
  size = 'md', 
  className = '',
  onClick, 
  emotion: externalEmotion = 'idle',
  accessory = 'none',
  variant = 'standard',
  showShadow = true,
  style
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [internalEmotion, setInternalEmotion] = useState<string | null>(null);

  // 眩晕触发逻辑：快速点击会覆盖外部表情
  useEffect(() => {
    if (clickCount >= 5) {
      setInternalEmotion('dizzy');
      const timer = setTimeout(() => {
        setClickCount(0);
        setInternalEmotion(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  const currentEmotion = internalEmotion || externalEmotion;

  const handleClick = (e: React.MouseEvent) => {
    setClickCount(prev => prev + 1);
    // 重置点击计数的计时器
    setTimeout(() => setClickCount(c => Math.max(0, c - 1)), 2000);
    if (onClick) onClick(e);
  };

  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64'
  };

  const currentDimensions = className.includes('w-') && className.includes('h-') ? '' : sizeMap[size];
  const isMicro = variant === 'micro';
  const isHero = variant === 'hero';

  // --- 动画配置 ---
  const floatAnim = isHero ? {
      y: currentEmotion === 'breathing' ? [0, -12, 0] : [0, -8, 0],
      rotate: currentEmotion === 'shredding' ? [0, -5, 5, 0] : (currentEmotion === 'dizzy' ? [0, -2, 2, -2, 0] : 0),
      x: currentEmotion === 'dizzy' ? [-2, 2, -2, 2, 0] : 0,
      scaleX: currentEmotion === 'breathing' ? [1, 1.02, 1] : 1
  } : {};

  const floatTransition: any = isHero ? {
      y: { duration: currentEmotion === 'breathing' ? 4 : 3, repeat: Infinity, ease: "easeInOut" },
      rotate: { duration: currentEmotion === 'shredding' ? 0.2 : (currentEmotion === 'dizzy' ? 0.1 : 3), repeat: Infinity },
      x: { duration: 0.1, repeat: currentEmotion === 'dizzy' ? Infinity : 0 }
  } : {};

  const bodyGradient = isMicro 
      ? 'bg-gradient-to-br from-white to-blue-100 border border-blue-200'
      : 'bg-gradient-to-br from-white via-[#F0F9FF] to-[#E0F2FE] border-4 border-white shadow-[inset_-10px_-10px_20px_rgba(108,93,211,0.1),0_10px_25px_rgba(108,93,211,0.15)]';

  const faceColor = isMicro ? 'bg-slate-700' : 'bg-[#2D3748]';
  const eyeColor = isMicro ? 'bg-cyan-300' : 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]';

  return (
    <div 
      className={`relative flex items-center justify-center select-none ${currentDimensions} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* 1. 地面阴影 */}
      {isHero && showShadow && (
        <motion.div 
          animate={{ 
            scale: currentEmotion === 'breathing' ? [1, 1.2, 1] : [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15] 
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -bottom-4 w-2/3 h-4 bg-black/10 rounded-full blur-md z-0"
        />
      )}

      {/* 2. 主体容器 */}
      <motion.div
        animate={floatAnim}
        transition={floatTransition}
        whileTap={{ scale: 0.95 }} // 物理点击回弹（保持圆形）
        className="relative w-full h-full z-10"
      >
        {/* 光环特效 */}
        {!isMicro && (
            <div className={`absolute inset-0 bg-gradient-to-t from-brand/10 to-cyan-300/10 rounded-full blur-xl transform scale-90 transition-opacity duration-1000 ${currentEmotion === 'sparkle' ? 'opacity-100' : 'opacity-40'}`}></div>
        )}

        {/* 球体外壳（与悬浮球 AvatarCircle 保持一致的圆形框样式：overflow-hidden） */}
        <div className={`relative w-full h-full rounded-full flex items-center justify-center overflow-hidden ${bodyGradient}`}>
           
           {accessory !== 'none' ? (
               <motion.img 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   key={accessory}
                   src={
                       accessory === 'scarf' ? avatarChangE :
                       accessory === 'glasses' ? avatarEinstein :
                       accessory === 'headphones' ? avatarNezha :
                       avatarHolmes
                   } 
                   alt="Character" 
                   className="w-full h-full object-cover"
               />
           ) : (
               <>
                   {/* 脸部屏幕区 (黑色药丸) */}
                   <div className={`relative z-10 w-[60%] h-[50%] ${faceColor} rounded-[40%] flex items-center justify-center overflow-hidden ${!isMicro ? 'shadow-inner border-2 border-gray-700/50' : ''}`}>
                       
                       {/* --- 屏幕内叠加层 (Internal Overlays) --- */}
                       
                       {/* A. 害羞腮红 */}
                       {currentEmotion === 'blush' && (
                         <div className="absolute inset-0 flex justify-around items-end pb-[15%] px-[15%] pointer-events-none">
                            <motion.div 
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="w-[20%] h-[15%] bg-rose-500/40 rounded-full blur-[4px]" 
                            />
                            <motion.div 
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="w-[20%] h-[15%] bg-rose-500/40 rounded-full blur-[4px]" 
                            />
                         </div>
                       )}

                       {/* B. 扫描光条 (Focus) */}
                       {currentEmotion === 'focus' && (
                         <motion.div 
                           animate={{ left: ['-100%', '200%'] }}
                           transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                           className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-12 pointer-events-none"
                         />
                       )}

                       {/* C. 闪耀边缘 (Sparkle) */}
                       {currentEmotion === 'sparkle' && (
                         <div className="absolute inset-0 border border-yellow-400/20 rounded-[40%] shadow-[inset_0_0_15px_rgba(250,204,21,0.2)]" />
                       )}

                       {/* 眼睛容器 */}
                       <div className="flex gap-[18%] items-center justify-center w-full h-full relative z-20">
                           {/* 左眼渲染逻辑 */}
                           <EyeComponent type={currentEmotion} side="left" isMicro={isMicro} color={eyeColor} />
                           {/* 右眼渲染逻辑 */}
                           <EyeComponent type={currentEmotion} side="right" isMicro={isMicro} color={eyeColor} />
                       </div>
                   </div>
               </>
           )}

           {/* 交互粒子特效 */}
           <AnimatePresence>
               {isHovered && !isMicro && (
                   <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-4 -right-4 text-pink-400 drop-shadow-sm"
                   >
                       <Heart size={size === 'xs' ? 12 : 24} fill="currentColor" />
                   </motion.div>
               )}
               {currentEmotion === 'listening' && !isMicro && (
                   <motion.div
                      className="absolute -top-6 right-0 text-brand"
                      animate={{ y: [-5, -15, -5], opacity: [0,1,0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                   >
                       <Music size={24} />
                   </motion.div>
               )}
           </AnimatePresence>
        </div>

        {/* 轨道光点 (Hero Only) */}
        {isHero && (
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute inset-[-15%] border border-dashed border-brand/20 rounded-full pointer-events-none"
            >
                <div className="absolute top-0 left-1/2 w-3 h-3 bg-brand/30 rounded-full -translate-x-1/2 -translate-y-1/2 blur-sm"></div>
            </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// --- 表情组件：负责渲染不同形态的眼睛 ---
const EyeComponent: React.FC<{ type: string, side: 'left' | 'right', isMicro: boolean, color: string }> = ({ type, side, isMicro, color }) => {
  const isLeft = side === 'left';
  
  // 1. 开心表情 (V型)
  if (type === 'happy') {
    return (
      <motion.div 
        layout
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} 
        className={`w-[20%] h-[20%] border-t-[3px] ${isLeft ? 'border-r-[3px] rotate-45' : 'border-l-[3px] -rotate-45'} border-cyan-400 rounded-sm`} 
      />
    );
  }

  // 2. 害羞表情 (闭眼圆弧)
  if (type === 'blush') {
    return (
      <motion.div 
        layout
        className="w-[22%] h-[15%] border-b-[3px] border-cyan-400 rounded-[50%]"
      />
    );
  }

  // 3. 眩晕表情 (螺旋线)
  if (type === 'dizzy') {
    return (
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-[22%] h-[22%] border-2 border-cyan-400 border-t-transparent rounded-full flex items-center justify-center"
      >
        <div className="w-1 h-1 bg-cyan-400 rounded-full" />
      </motion.div>
    );
  }

  // 4. 专注/分析表情 (窄视)
  if (type === 'focus' || type === 'analyzing') {
    return (
      <motion.div 
        layout
        animate={{ height: ['8%', '12%', '8%'] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`w-[28%] h-[10%] ${color} rounded-full`}
      />
    );
  }

  // 5. 闪耀表情 (星星)
  if (type === 'sparkle') {
    return (
      <motion.div 
        layout
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="relative w-[25%] h-[25%] flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-cyan-400 rounded-sm rotate-45 shadow-[0_0_15px_#22d3ee]" />
        <div className="absolute inset-[20%] bg-cyan-400 rounded-sm shadow-[0_0_15px_#22d3ee]" />
      </motion.div>
    );
  }

  // 6. 默认/呼吸表情
  return (
    <motion.div 
      layout
      animate={!isMicro ? { height: type === 'breathing' ? ["10%", "10%"] : ["25%", "5%", "25%"] } : {}} 
      transition={{ repeat: Infinity, duration: 0.2, repeatDelay: 3 }}
      className={`w-[20%] h-[25%] ${color} rounded-full`}
    />
  );
};
