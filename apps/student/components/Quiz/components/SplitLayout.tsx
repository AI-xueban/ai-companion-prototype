import React, { useState, useRef, useEffect } from 'react';

interface SplitLayoutProps {
    left: React.ReactNode;
    right: React.ReactNode;
    defaultRatio?: number; // 0.3 to 0.7
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({ left, right, defaultRatio = 0.5 }) => {
    const [ratio, setRatio] = useState(defaultRatio);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = () => {
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const newRatio = (e.clientX - rect.left) / rect.width;
        
        // Clamp ratio
        if (newRatio >= 0.3 && newRatio <= 0.7) {
            setRatio(newRatio);
        }
    };

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousemove', handleMouseMove);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // Update ratio when default changes (e.g. new question type)
    useEffect(() => {
        setRatio(defaultRatio);
    }, [defaultRatio]);

    return (
        <div ref={containerRef} className="flex w-full h-full min-h-0 relative overflow-hidden">
            {/* Left Pane */}
            <div 
                className="h-full min-h-0 overflow-y-auto no-scrollbar relative z-0 transition-[width] duration-300 ease-out"
                style={{ width: `${ratio * 100}%` }}
            >
                {left}
            </div>

            {/* Handle */}
            <div 
                onMouseDown={handleMouseDown}
                className="w-4 h-full bg-transparent hover:bg-gray-100 cursor-col-resize absolute z-20 flex items-center justify-center group transition-colors"
                style={{ left: `calc(${ratio * 100}% - 8px)` }}
            >
                <div className="w-1 h-12 bg-gray-300 rounded-full group-hover:bg-[#007AFF] transition-colors" />
            </div>

            {/* Right Pane */}
            <div 
                className="h-full min-h-0 overflow-y-auto no-scrollbar bg-transparent relative z-0 transition-[width] duration-300 ease-out"
                style={{ width: `${(1 - ratio) * 100}%` }}
            >
                {right}
            </div>
        </div>
    );
};
