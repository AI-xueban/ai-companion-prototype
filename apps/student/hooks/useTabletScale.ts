import { useEffect, useState, type RefObject } from 'react';

export function useTabletScale(
  hostRef: RefObject<HTMLElement | null>,
  stageWidth: number,
  stageHeight: number,
  reservedWidth = 0,
) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const updateScale = () => {
      const { width, height } = host.getBoundingClientRect();
      const availableWidth = Math.max(0, width - reservedWidth);
      const nextScale = Math.min(availableWidth / stageWidth, height / stageHeight);
      setScale(Math.max(0.1, nextScale));
    };

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(host);
    window.addEventListener('resize', updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [hostRef, reservedWidth, stageHeight, stageWidth]);

  return scale;
}
