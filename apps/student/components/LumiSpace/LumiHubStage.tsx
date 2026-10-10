import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, Mic } from 'lucide-react';
import {
  KIND_TAG,
  type HubCuriosityCard,
  type HubCuriosityPack,
} from './lumiHubData';

interface LumiHubStageProps {
  pack: HubCuriosityPack;
  continueTitle?: string | null;
  isExiting?: boolean;
  onOpenCuriosity: (card: HubCuriosityCard) => void;
  onOpenFreeChat: () => void;
  onOpenTextChat: () => void;
  onOpenCamera: () => void;
  onOpenVoice: () => void;
  onContinue?: () => void;
  onRefreshInvites?: () => void;
}

/** 伙伴式会面页：人物负责在场感，话题负责降低开口门槛，输入入口承接所有真实意图。 */
export const LumiHubStage: React.FC<LumiHubStageProps> = ({
  pack,
  continueTitle,
  isExiting = false,
  onOpenCuriosity,
  onOpenFreeChat,
  onOpenTextChat,
  onOpenCamera,
  onOpenVoice,
  onContinue,
  onRefreshInvites,
}) => {
  const pullStartY = useRef<number | null>(null);
  const [pullHint, setPullHint] = useState(false);
  const left = pack.secondary[0];
  const right = pack.secondary[1];
  const cardTag = (card: HubCuriosityCard) => card.tag || KIND_TAG[card.kind];
  const exitTransition = { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };

  const onTouchStart = (e: React.TouchEvent) => {
    pullStartY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current == null) return;
    setPullHint(e.touches[0].clientY - pullStartY.current > 48);
  };

  const onTouchEnd = () => {
    if (pullHint && onRefreshInvites) onRefreshInvites();
    pullStartY.current = null;
    setPullHint(false);
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="absolute inset-x-0 top-0 bottom-16 z-10 overflow-hidden pointer-events-none"
    >
      {/* 继续条单独一行；换一换已收到顶栏与菜单同一行 */}
      {continueTitle ? (
      <motion.div
          animate={isExiting ? { opacity: 0, y: 42 } : { opacity: 1, y: 0 }}
          transition={exitTransition}
          className="absolute left-3 right-3 top-[4.25rem] z-30 flex items-center pointer-events-auto"
      >
          <button
            type="button"
            onClick={onContinue}
            className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full bg-black/20 px-3 py-1.5 text-[10px] font-medium text-white/90 backdrop-blur-sm"
          >
            <span className="truncate">继续：{continueTitle}</span>
            <ArrowRight size={11} className="shrink-0" />
          </button>
      </motion.div>
      ) : null}

      {pullHint ? (
        <p className="absolute left-0 right-0 top-[6.25rem] z-30 text-center text-[10px] font-medium text-white/90 drop-shadow pointer-events-none">
          松开，换今日邀约
        </p>
      ) : null}

      {/* 人物仍是首页视觉中心，点击人物等价于进入自由聊天。 */}
      <button
        type="button"
        onClick={onOpenFreeChat}
        className="absolute left-1/2 top-[40%] z-10 h-[30%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-[42%] pointer-events-auto"
        aria-label="点小晤，直接聊天"
      />

      <motion.section
        animate={isExiting ? { opacity: 0, x: -150, y: 64 } : { opacity: 1, x: 0, y: 0 }}
        transition={exitTransition}
        className="absolute left-[5%] top-[18%] z-20 w-[34%] max-w-[290px] pointer-events-auto"
      >
        <p className="text-[11px] font-semibold tracking-[0.18em] text-white/75">小晤同学</p>
        <h2 className="mt-1 text-[24px] font-black leading-tight text-white drop-shadow-md">
          嗨，我在。
          <br />
          今天想聊点什么？
        </h2>
        <p className="mt-2 max-w-[250px] text-[11px] font-medium leading-relaxed text-white/80 drop-shadow-sm">
          不用想好怎么说。聊心情、问问题，或者一起解决一件事都可以。
        </p>
      </motion.section>

      {/* 一条主邀约：它是聊天引子，不是能力入口。 */}
      <motion.div
        animate={isExiting ? { opacity: 0, x: 150, y: 54 } : { opacity: 1, x: 0, y: 0 }}
        transition={exitTransition}
        className="absolute right-[5%] top-[17%] z-20 w-[36%] max-w-[300px] pointer-events-auto"
      >
        <button
          type="button"
          onClick={() => onOpenCuriosity(pack.hero)}
          className="relative w-full rounded-[24px] border border-white/70 bg-white/95 px-4 py-3 text-left shadow-[0_12px_32px_rgba(15,23,42,0.18)] backdrop-blur-md transition hover:-translate-y-0.5 active:scale-[0.99]"
        >
          <p className="mb-0.5 text-[10px] font-semibold tracking-wide text-sky-600">{cardTag(pack.hero)}</p>
          <p className="text-[14px] font-bold leading-snug text-slate-800 line-clamp-2">
            {pack.hero.text}
          </p>
        </button>
      </motion.div>

      {/* 两条次邀约：与主邀约平行，不出现生成试卷、讲题等常驻工具。 */}
      <motion.div
        animate={isExiting ? { opacity: 0, x: 170, y: 72 } : { opacity: 1, x: 0, y: 0 }}
        transition={{ ...exitTransition, delay: isExiting ? 0.025 : 0 }}
        className="absolute right-[5%] top-[37%] z-20 flex w-[36%] max-w-[300px] flex-col gap-2 pointer-events-auto"
      >
        {[left, right].filter(Boolean).map((card) => card ? (
          <button
            key={card.id}
            type="button"
            onClick={() => onOpenCuriosity(card)}
            className="rounded-[18px] border border-white/60 bg-white/80 px-3 py-2 text-left shadow-[0_6px_20px_rgba(15,23,42,0.10)] backdrop-blur-md transition hover:bg-white active:scale-[0.98]"
          >
            <span className="mr-2 text-[9px] font-semibold text-sky-600">{cardTag(card)}</span>
            <span className="text-[11px] font-semibold leading-snug text-slate-700 line-clamp-2">{card.text}</span>
          </button>
        ) : null)}
      </motion.div>

      {/* 统一表达入口：三个操作保持真实语义，输入区进入会话并直接聚焦。 */}
      <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-auto">
        <motion.div
          layoutId="lumi-composer"
          transition={{ layout: { type: 'spring', stiffness: 190, damping: 28, mass: 0.9 } }}
          className="mx-auto flex min-h-[52px] w-full max-w-[620px] items-center gap-3 rounded-[26px] border border-white/75 bg-white/95 px-4 text-left shadow-[0_12px_34px_rgba(15,23,42,0.26)] backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={onOpenCamera}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-brand transition hover:bg-sky-100 active:scale-95"
            aria-label="拍照问小晤"
          >
            <Camera size={17} strokeWidth={2.2} />
          </button>
          <motion.button
            type="button"
            onClick={onOpenTextChat}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.12 }}
            className="min-w-0 flex-1 self-stretch text-left text-[13px] font-semibold text-slate-400"
          >
            跟小晤说说，想到什么都可以……
          </motion.button>
          <button
            type="button"
            onClick={onOpenVoice}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm transition hover:brightness-105 active:scale-95"
            aria-label="语音输入"
          >
            <Mic size={17} strokeWidth={2.4} />
          </button>
        </motion.div>

      </div>
    </div>
  );
};
