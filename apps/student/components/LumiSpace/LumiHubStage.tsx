import React, { useRef, useState } from 'react';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import {
  HUB_SPARKS,
  HUB_SPARKS_DIVIDER,
  KIND_TAG,
  type HubCuriosityCard,
  type HubCuriosityPack,
  type HubSpark,
} from './lumiHubData';

interface LumiHubStageProps {
  pack: HubCuriosityPack;
  continueTitle?: string | null;
  onOpenCuriosity: (card: HubCuriosityCard) => void;
  onOpenSpark: (spark: HubSpark) => void;
  onOpenFreeChat: () => void;
  onContinue?: () => void;
  onRefreshInvites?: () => void;
}

/**
 * L1 三卡环绕中心人物（头顶主气泡 + 左右侧次卡，不挡脸/胸口）；
 * L2/L3 沉底弱化。舞台高度对齐底栏上方可见区，一屏不滚动。
 */
export const LumiHubStage: React.FC<LumiHubStageProps> = ({
  pack,
  continueTitle,
  onOpenCuriosity,
  onOpenSpark,
  onOpenFreeChat,
  onContinue,
  onRefreshInvites,
}) => {
  const pullStartY = useRef<number | null>(null);
  const [pullHint, setPullHint] = useState(false);
  const left = pack.secondary[0];
  const right = pack.secondary[1];
  const cardTag = (card: HubCuriosityCard) => card.tag || KIND_TAG[card.kind];

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
      <div className="absolute left-3 right-3 top-[4.25rem] z-30 flex items-center pointer-events-auto">
          <button
            type="button"
            onClick={onContinue}
            className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full bg-black/20 px-3 py-1.5 text-[10px] font-medium text-white/90 backdrop-blur-sm"
          >
            <span className="truncate">继续：{continueTitle}</span>
            <ArrowRight size={11} className="shrink-0" />
          </button>
      </div>
      ) : null}

      {pullHint ? (
        <p className="absolute left-0 right-0 top-[6.25rem] z-30 text-center text-[10px] font-medium text-white/90 drop-shadow pointer-events-none">
          松开，换今日邀约
        </p>
      ) : null}

      {/* Center clear zone for Chang'e */}
      <button
        type="button"
        onClick={onOpenFreeChat}
        className="absolute left-1/2 top-[40%] z-10 h-[30%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-[42%] pointer-events-auto"
        aria-label="点小晤，直接聊天"
      />

      {/* 主推：角色头顶上方，尖角朝下 */}
      <div className="absolute left-1/2 top-[12%] z-20 w-[min(70%,280px)] -translate-x-1/2 pointer-events-auto">
        <button
          type="button"
          onClick={() => onOpenCuriosity(pack.hero)}
          className="relative w-full rounded-[22px] bg-white px-3.5 py-2.5 text-left shadow-[0_10px_28px_rgba(15,23,42,0.18)] transition active:scale-[0.99]"
        >
          <p className="mb-0.5 text-[10px] font-semibold tracking-wide text-sky-600">{cardTag(pack.hero)}</p>
          <p className="text-[13px] font-semibold leading-snug text-slate-800 line-clamp-2">
            {pack.hero.text}
          </p>
          <span
            className="absolute bottom-0 left-1/2 h-0 w-0 translate-y-full -translate-x-1/2 border-x-[9px] border-t-[10px] border-x-transparent border-t-white drop-shadow-sm"
            aria-hidden
          />
        </button>
      </div>

      {/* 次推：左右肩侧迷你对话气泡（弱于主推，尖角朝向人物） */}
      {left ? (
        <button
          type="button"
          onClick={() => onOpenCuriosity(left)}
          className="absolute left-[3%] top-[39%] z-20 w-[min(32%,138px)] -translate-y-1/2 rounded-[18px] bg-white/95 px-3 py-2 text-left shadow-[0_6px_20px_rgba(15,23,42,0.12)] transition hover:bg-white hover:shadow-[0_8px_24px_rgba(15,23,42,0.16)] active:scale-[0.98] pointer-events-auto"
        >
          <p className="mb-1 text-[9px] font-medium text-sky-500/80">{cardTag(left)}</p>
          <p className="text-[11px] font-medium leading-snug text-slate-700 line-clamp-3">{left.text}</p>
          <span
            className="absolute right-0 top-[42%] h-0 w-0 translate-x-[6px] -translate-y-1/2 border-y-[6px] border-l-[7px] border-y-transparent border-l-white"
            aria-hidden
          />
        </button>
      ) : null}

      {right ? (
        <button
          type="button"
          onClick={() => onOpenCuriosity(right)}
          className="absolute right-[3%] top-[43%] z-20 w-[min(32%,138px)] -translate-y-1/2 rounded-[18px] bg-white/95 px-3 py-2 text-left shadow-[0_6px_20px_rgba(15,23,42,0.12)] transition hover:bg-white hover:shadow-[0_8px_24px_rgba(15,23,42,0.16)] active:scale-[0.98] pointer-events-auto"
        >
          <p className="mb-1 text-[9px] font-medium text-sky-500/80">{cardTag(right)}</p>
          <p className="text-[11px] font-medium leading-snug text-slate-700 line-clamp-3">{right.text}</p>
          <span
            className="absolute left-0 top-[42%] h-0 w-0 -translate-x-[6px] -translate-y-1/2 border-y-[6px] border-r-[7px] border-y-transparent border-r-white"
            aria-hidden
          />
        </button>
      ) : null}

      {/* 底栏：随便聊主入口 + 其他推荐（轻推荐条，不高占脸） */}
      <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={onOpenFreeChat}
          className="relative mx-auto flex min-h-[44px] min-w-[160px] items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-[14px] font-bold text-slate-800 shadow-[0_10px_28px_rgba(15,23,42,0.28)] ring-2 ring-brand/25 transition hover:ring-brand/40 hover:shadow-[0_12px_32px_rgba(15,23,42,0.32)] active:scale-[0.98]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white shadow-sm">
            <MessageCircle size={14} strokeWidth={2.5} />
          </span>
          随便聊
          <Sparkles size={13} className="text-brand" strokeWidth={2.4} />
        </button>

        <div className="mt-1.5 flex items-center gap-2">
          <span className="shrink-0 text-[10px] font-medium tracking-wide text-white/70">
            {HUB_SPARKS_DIVIDER}
          </span>
          <div className="grid min-w-0 flex-1 grid-cols-6 gap-1.5">
            {HUB_SPARKS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenSpark(item)}
                className="min-w-0 rounded-xl bg-black/35 px-1 py-1.5 text-center text-[10px] font-semibold leading-tight text-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.2)] backdrop-blur-[4px] transition hover:bg-black/45 hover:text-white active:scale-[0.98]"
              >
                <span className="line-clamp-2">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
