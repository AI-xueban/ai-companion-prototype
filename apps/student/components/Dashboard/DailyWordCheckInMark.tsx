import React from 'react';

const CHECKED_IN_MARK_CLASS =
  'text-orange-500 border border-orange-400/80 bg-orange-50/55';
const UNCHECKED_MARK_CLASS =
  'text-sky-400/90 border border-sky-300/70 bg-sky-50/35';

/** 单词卡片背景浅色花体打卡状态 */
export const DailyWordCheckInBackgroundMark = ({
  checkedIn,
  tone = 'light',
  size = 'md',
  variant = 'default',
  className = '',
}: {
  checkedIn: boolean;
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'archive' | 'detail';
  className?: string;
}) => {
  const isArchive = variant === 'archive';
  const isDetail = variant === 'detail';
  const isBadge = isArchive || isDetail;

  const sizeClass = isArchive
    ? 'text-[14px]'
    : isDetail
      ? 'text-lg'
      : {
          sm: 'text-sm',
          md: 'text-base',
          lg: 'text-xl',
        }[size];

  const positionClass = isArchive
    ? 'top-auto bottom-3 right-2.5 -rotate-6'
    : isDetail
      ? 'top-4 right-4'
      : 'top-2 right-2';

  const paddingClass = isDetail
    ? 'px-2 py-1 rounded-lg'
    : isArchive
      ? 'px-1.5 py-0.5 rounded-md'
      : '';

  const colorClass = isBadge
    ? checkedIn
      ? CHECKED_IN_MARK_CLASS
      : UNCHECKED_MARK_CLASS
    : tone === 'dark'
      ? checkedIn
        ? 'text-orange-300/85 border border-orange-300/50 bg-orange-500/15 px-1.5 py-0.5 rounded-md'
        : 'text-sky-200/80 border border-sky-200/45 bg-sky-400/10 px-1.5 py-0.5 rounded-md'
      : checkedIn
        ? CHECKED_IN_MARK_CLASS
        : UNCHECKED_MARK_CLASS;

  return (
    <span
      className={`
        absolute z-0 pointer-events-none select-none leading-none
        font-serif italic tracking-wide
        ${sizeClass} ${colorClass} ${paddingClass} ${positionClass} ${className}
      `}
      aria-hidden
    >
      {checkedIn ? '已打卡√' : '未打卡'}
    </span>
  );
};
