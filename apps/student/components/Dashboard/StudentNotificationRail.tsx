import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, BellRing, BookOpenCheck, ChevronRight, ShieldAlert, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  StudentNotification,
  StudentNotificationAction,
  StudentNotificationGroup,
} from '../../data/studentNotifications';

interface StudentNotificationRailProps {
  isOpen: boolean;
  items: StudentNotification[];
  onClose: () => void;
  onAction?: (action: StudentNotificationAction) => void;
}

const GROUP_CONFIG: Record<StudentNotificationGroup, {
  icon: LucideIcon;
  iconClassName: string;
}> = {
  learning: {
    icon: BookOpenCheck,
    iconClassName: 'bg-violet-100 text-violet-600',
  },
  record: {
    icon: BarChart3,
    iconClassName: 'bg-sky-100 text-sky-600',
  },
  rule: {
    icon: ShieldCheck,
    iconClassName: 'bg-blue-100 text-blue-600',
  },
  growth: {
    icon: Sparkles,
    iconClassName: 'bg-amber-100 text-amber-600',
  },
};

export function StudentNotificationRail({ isOpen, items, onClose, onAction }: StudentNotificationRailProps) {
  const unreadCount = items.filter(
    (item) => (item.isUnread && Boolean(item.action)) || item.isPersistentRisk,
  ).length;
  const pinnedItems = items.filter((item) => item.priority === 'pinned');
  const regularItems = items.filter((item) => item.priority !== 'pinned');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="关闭消息通知"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-[39] cursor-default bg-slate-900/35 backdrop-blur-[1px]"
          />
          <motion.aside
            id="student-notification-rail"
            aria-label="学生消息通知"
            aria-live="polite"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-0 bottom-0 z-40 flex w-[352px] flex-col overflow-hidden border-l border-slate-100 bg-[#f8f8ff]/95 shadow-[-18px_0_44px_rgba(48,56,102,0.18)] backdrop-blur-xl"
          >
          <div className="flex items-center justify-between px-5 pb-3 pt-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-500">
                <BellRing size={17} />
              </span>
              <div>
                <p className="text-[15px] font-bold text-slate-800">消息通知</p>
              </div>
              {unreadCount > 0 && (
                <span className="rounded-full bg-violet-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label="关闭消息通知"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={17} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            {pinnedItems.length > 0 ? (
            <div className="mb-3 shrink-0">
              {pinnedItems.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  config={GROUP_CONFIG[item.group]}
                  onAction={onAction}
                  variant="pinned-risk"
                />
              ))}
            </div>
            ) : null}

            <div className="overflow-hidden rounded-xl bg-transparent">
              {regularItems.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  config={GROUP_CONFIG[item.group]}
                  onAction={onAction}
                />
              ))}
            </div>
          </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function NotificationRow({
  item,
  config,
  onAction,
  variant = 'normal',
}: {
  item: StudentNotification;
  config: (typeof GROUP_CONFIG)[StudentNotificationGroup];
  onAction?: (action: StudentNotificationAction) => void;
  variant?: 'normal' | 'pinned-risk';
}) {
  const isPinnedRisk = variant === 'pinned-risk';
  const ItemIcon = isPinnedRisk ? ShieldAlert : config.icon;
  const isActionable = Boolean(item.action && onAction);
  const iconClassName = isPinnedRisk ? 'bg-sky-100 text-sky-600' : config.iconClassName;

  const content = (
    <>
      <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
        <ItemIcon size={18} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 break-words text-[12px] font-bold leading-[1.35] text-slate-700">{item.title}</span>
          <span className="shrink-0 text-[10px] font-medium text-slate-400">{item.timeLabel}</span>
          {item.isUnread && isActionable && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" aria-label="未读" />
          )}
        </span>
        <span className="mt-1 block break-words text-[11px] font-medium leading-[1.5] text-slate-500">{item.summary}</span>
      </span>
      {isActionable && <ChevronRight size={15} className="mt-[30px] shrink-0 text-slate-300" />}
    </>
  );

  const className = `flex w-full items-start gap-3 rounded-xl px-3.5 py-3.5 text-left transition-colors ${
    isPinnedRisk
      ? 'border border-sky-100 bg-white shadow-[0_4px_14px_rgba(59,130,246,0.08)]'
      : 'mb-2 border border-slate-100 bg-white shadow-[0_3px_12px_rgba(55,65,120,0.04)]'
  } ${isActionable ? 'hover:bg-slate-50 active:bg-slate-100' : 'cursor-default'}`;
  if (!isActionable) return <div className={className}>{content}</div>;

  return (
    <button type="button" className={className} onClick={() => onAction?.(item.action!)}>
      {content}
    </button>
  );
}
