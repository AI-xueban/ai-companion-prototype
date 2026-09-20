import React from 'react';

export type CognitiveState = 
  | 'GAP'       // 🔴 断口环 (需攻克)
  | 'MASTERED'  // 🟢 实心环 (已掌握)
  | 'FADED';    // 🟡 双层环 (需复习)

interface StatusRingProps {
  state: CognitiveState;
  size?: number;
  className?: string;
  progress?: number; // 0-100, for legacy support if needed
}

export const StatusRing: React.FC<StatusRingProps> = ({ 
  state, 
  size = 24, 
  className = "",
  progress = 60 // Default progress for visual mock
}) => {
  const strokeWidth = 2.5;
  const radius = size / 2 - strokeWidth;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Render different SVG content based on state
  const renderContent = () => {
    switch (state) {
      case 'GAP':
        // 🔴 断口环 (需攻克) - Red Gap Ring with Exclamation
        // Gap is created by a large dash and a gap
        const gapSize = circumference * 0.25;
        const dashSize = circumference - gapSize;
        return (
          <g className="text-rose-500">
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashSize} ${gapSize}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
            {/* Exclamation point in the gap (top right ish) or center? 
                Let's put a small dot at the top right gap area or just leave the gap as the metaphor */}
             <circle 
                cx={center + radius * 0.7} 
                cy={center - radius * 0.7} 
                r={strokeWidth * 1.2} 
                fill="currentColor" 
                className="animate-pulse"
             />
          </g>
        );

      case 'MASTERED':
        // 🟢 实心环 (已掌握) - Solid Green Circle with Star/Check
        return (
          <g className="text-emerald-500">
            <circle
              cx={center}
              cy={center}
              r={radius + strokeWidth/2} // Slightly larger to feel full
              fill="currentColor"
            />
            {/* Star Icon in center */}
            <path
              d={`M${center} ${center-radius*0.5} L${center+radius*0.15} ${center-radius*0.15} L${center+radius*0.5} ${center-radius*0.15} L${center+radius*0.2} ${center+radius*0.1} L${center+radius*0.3} ${center+radius*0.5} L${center} ${center+radius*0.25} L${center-radius*0.3} ${center+radius*0.5} L${center-radius*0.2} ${center+radius*0.1} L${center-radius*0.5} ${center-radius*0.15} L${center-radius*0.15} ${center-radius*0.15} Z`}
              fill="rgba(0,0,0,0.3)"
              transform="scale(0.8)"
              style={{ transformOrigin: `${center}px ${center}px` }}
            />
          </g>
        );

      case 'FADED':
        // 🟡 双层环 (需复习) - Double Opacity Ring (Fading)
        return (
          <g className="text-amber-400">
             {/* Outer Fading Ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              opacity={0.3}
            />
             {/* Inner Core */}
            <circle
              cx={center}
              cy={center}
              r={radius * 0.6}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              opacity={0.8}
            />
          </g>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {renderContent()}
      </svg>
    </div>
  );
};
