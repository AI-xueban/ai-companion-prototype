import { useEffect, useRef } from 'react';
import { grantWrongReviewReward } from '../../services/rewardService';
import { useRewardGranted } from './RewardGrantContext';

/** 放在解析末尾：已标注错因且实际浏览到末尾，才领取复盘奖励。 */
export function WrongReviewRewardMarker({ questionId, hasReason }: { questionId: string; hasReason: boolean }) {
  const marker = useRef<HTMLSpanElement>(null);
  const onRewardGranted = useRewardGranted();
  useEffect(() => {
    if (!hasReason || !marker.current || !onRewardGranted) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (timer) clearTimeout(timer);
      if (entry.isIntersecting) timer = setTimeout(() => {
        const reward = grantWrongReviewReward(questionId);
        if (reward) onRewardGranted(reward);
        observer.disconnect();
      }, 1000);
    });
    observer.observe(marker.current);
    return () => { observer.disconnect(); if (timer) clearTimeout(timer); };
  }, [questionId, hasReason, onRewardGranted]);
  return <span ref={marker} aria-hidden="true" className="block h-px" />;
}
