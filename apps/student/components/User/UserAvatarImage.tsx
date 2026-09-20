import React, { useState } from 'react';
import { motion } from 'framer-motion';
import girlHeadImage from '../../assets/girl_v0.1-head.png';
import girlFallbackImage from '../../assets/girl_v0.1-removebg-preview.png';

interface UserAvatarImageProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'full' | 'half';
  showShadow?: boolean;
  imageSrc?: string;
  fallbackImageSrc?: string;
  currentOutfit?: {
    headwear?: string;
    handheld?: string;
    outfit?: string;
  };
  // 正常状态下图片的垂直偏移（仅当需要时使用）
  verticalOffset?: string; // 例如 "4px", "-57px" 等
}

// Mock Asset Mapper (In real app, use image paths)
const getAssetIcon = (id: string) => {
  switch(id) {
      case 'hat_grad': return '🎓';
      case 'glasses_smart': return '👓';
      case 'ears_cat': return '🎧';
      case 'book_magic': return '📖';
      case 'pen_feather': return '✒️';
      case 'suit_space': return '👨‍🚀';
      default: return '';
  }
};

export const UserAvatarImage: React.FC<UserAvatarImageProps> = ({
  size = 'md',
  className = '',
  variant = 'full',
  showShadow = true,
  imageSrc = '/girl_v0.1-removebg-preview.png', // 默认使用透明背景的分身 PNG
  fallbackImageSrc,
  currentOutfit,
  verticalOffset
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const isHalf = variant === 'half';

  const sizeMap = {
    xs: 'w-8 h-8',
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-36 h-36',
    xl: 'w-48 h-48'
  };

  const currentDimensions = className.includes('w-') && className.includes('h-') ? '' : sizeMap[size];

  return (
    <div 
      className={`relative flex items-center justify-center select-none ${currentDimensions} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={imageSize && className.includes('w-auto') ? { width: imageSize.width, height: imageSize.height } : undefined}
    >
      {/* 地面阴影 */}
      {showShadow && (
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1] 
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -bottom-2 w-3/4 h-2 bg-black/10 rounded-full blur-sm z-0"
        />
      )}

      {/* 主体容器 */}
      <motion.div
        animate={{ 
          y: [0, -4, 0],
          scale: isHovered ? 1.05 : 1
        }}
        transition={{ 
          y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 0.3 }
        }}
        whileTap={{ scale: 0.95 }}
        className="relative w-full h-full z-10"
      >
        {/* 图片容器：去掉圆形边框和渐变背景，让 PNG 直接"站在"卡片上 */}
        <div
          className={`absolute w-full h-full flex ${
            isHalf ? 'items-start justify-center overflow-hidden' : 'items-end justify-center'
          }`}
          style={verticalOffset && variant === 'full' && !isHalf ? { 
            top: verticalOffset 
          } : undefined}
        >
          
          {/* 加载状态 */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl z-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full mb-2"
              />
              <span className="text-xs text-gray-600">加载中...</span>
            </div>
          )}

          {/* 错误状态 - 降级显示 */}
          {imageError && (
            <img
              src={fallbackImageSrc || girlHeadImage}
              alt="默认头像"
              className={`${
                className.includes('w-auto') 
                  ? 'w-auto h-auto max-w-full max-h-full' 
                  : 'w-full h-full'
              } ${
                isHalf
                  ? 'object-cover object-top scale-110 origin-top'
                  : 'object-contain'
              }`}
              onLoad={(e) => {
                const img = e.currentTarget;
                setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
              }}
              style={{
                backgroundColor: 'transparent'
              }}
            />
          )}

          {/* 分身图片 */}
          {!imageError && (
            <>
              <img
                src={imageSrc}
                alt="我的学习分身"
                className={`${
                  className.includes('w-auto') 
                    ? 'w-auto h-auto max-w-full max-h-full' 
                    : 'w-full h-full'
                } ${
                  isHalf
                    ? 'object-cover object-top scale-110 origin-top'
                    : 'object-contain'
                } ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setImageLoaded(true);
                  // 获取图片自然尺寸，让容器适应图片
                  if (className.includes('w-auto')) {
                    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
                  }
                }}
                onError={() => setImageError(true)}
                style={{
                  // 确保白底透明处理
                  backgroundColor: 'transparent',
                  position: 'absolute',
                  width: '359px',
                  height: '359px',
                  top: '-61px'
                }}
              />

              {/* Outfit Layers (Mock Overlay) */}
              {imageLoaded && currentOutfit && (
                <>
                  {currentOutfit.headwear && (
                    <div className={`absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-lg ${isHalf ? 'top-[-5%] text-2xl' : 'top-[2%] text-4xl'}`}>
                      {getAssetIcon(currentOutfit.headwear)}
                    </div>
                  )}
                  {currentOutfit.handheld && !isHalf && (
                    <div className="absolute bottom-[25%] -right-[5%] text-3xl drop-shadow-md z-20 pointer-events-none">
                      {getAssetIcon(currentOutfit.handheld)}
                    </div>
                  )}
                  {currentOutfit.outfit && currentOutfit.outfit !== 'uniform_school' && !isHalf && (
                    <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 text-6xl drop-shadow-xl z-20 pointer-events-none opacity-90">
                      {getAssetIcon(currentOutfit.outfit)}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* 交互光环效果 */}
          {isHovered && imageLoaded && !imageError && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: [0, 0.3, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 border-2 border-brand/30 rounded-3xl pointer-events-none"
            />
          )}

          {/* 装饰星星效果 */}
          {isHovered && imageLoaded && !imageError && (
            <>
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ 
                  scale: [0, 1, 0], 
                  rotate: [0, 180, 360],
                  x: [-10, 10, -10],
                  y: [-10, -20, -10]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                className="absolute -top-4 -right-2 text-yellow-400 text-lg pointer-events-none"
              >
                ✨
              </motion.div>
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ 
                  scale: [0, 1, 0], 
                  rotate: [0, -180, -360],
                  x: [10, -5, 10],
                  y: [-5, -15, -5]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="absolute -top-2 -left-4 text-pink-400 text-sm pointer-events-none"
              >
                💫
              </motion.div>
            </>
          )}
        </div>

        {/* 悬浮标签 */}
        {isHovered && imageLoaded && !imageError && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -8, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap z-20 shadow-lg"
          >
            我的学习分身 ✨
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
