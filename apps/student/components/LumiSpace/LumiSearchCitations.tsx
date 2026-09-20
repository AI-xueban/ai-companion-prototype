import React from 'react';
import type { SearchSource } from './lumiWebSearch';

/** 将正文中的 [1][2] 渲染为来源角标 */
export const CitedSearchText: React.FC<{
  text: string;
  sources?: SearchSource[];
  showCursor?: boolean;
}> = ({ text, sources, showCursor = false }) => {
  const parts = text.split(/(\[\d+\])/g);

  return (
    <span className="whitespace-pre-line">
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (!match) return <React.Fragment key={i}>{part}</React.Fragment>;

        const index = Number(match[1]);
        const source = sources?.find((s) => s.index === index);
        return (
          <sup
            key={i}
            title={source ? `${source.site} · ${source.title}` : `来源 ${index}`}
            className="mx-0.5 inline-flex items-center justify-center min-w-[1.1rem] h-4 px-1 rounded-full bg-brand/10 text-brand text-[10px] font-black align-super cursor-default"
          >
            {index}
          </sup>
        );
      })}
      {showCursor ? (
        <span className="inline-block w-[2px] h-[1em] ml-0.5 bg-brand/70 align-middle animate-pulse" />
      ) : null}
    </span>
  );
};
