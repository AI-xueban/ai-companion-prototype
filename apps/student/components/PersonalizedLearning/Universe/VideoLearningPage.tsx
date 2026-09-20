import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookMarked,
  ChevronDown,
  ChevronRight,
  List,
  Play,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SubjectType, Task } from '../../../types';
import { SUBJECT_CONFIGS } from '../../../services/subjectConfig';
import { VideoLesson as VideoPlayer } from '../../Learning/VideoLesson';
import teacherThumb from '@/assets/Avatar-爱因斯坦.jpg';

export interface VideoLessonItem {
  id: string;
  title: string;
  /** 所属知识点名（用于分组展示） */
  kpName?: string;
  /** 同知识点内序号，从 1 起 */
  index?: number;
}

interface RawDirNode {
  name: string;
  level?: string;
  children?: RawDirNode[];
}

interface LessonGroup {
  kpName: string;
  lessons: VideoLessonItem[];
}

interface ChapterNode {
  id: string;
  title: string;
  level: number;
  children?: ChapterNode[];
  lessonGroups?: LessonGroup[];
}

interface FavoriteCourse {
  id: string;
  title: string;
  favoritedAt: 'today' | 'yesterday' | 'threeDaysAgo';
}

interface VideoLearningPageProps {
  subject: SubjectType;
  onBack: () => void;
}

type PageView = 'catalog' | 'favorites' | 'player';

/** 与图谱外层目录一致：最多三级 */
const MAX_DIR_LEVEL = 3;

function makeNodeId(name: string, parentId?: string) {
  if (!parentId || parentId === 'root') return name;
  return `${parentId}-${name}`;
}

function hashCount(seed: string, min: number, max: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return min + (Math.abs(h) % (max - min + 1));
}

function hashAbs(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

/** 同一知识点可挂多个视频：标题为「知识点名 + 序号」 */
function kpVideos(kpName: string, count: number, idPrefix: string): VideoLessonItem[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => ({
    id: `${idPrefix}-${i + 1}`,
    title: `${kpName}${i + 1}`,
    kpName,
    index: i + 1,
  }));
}

/**
 * 三级目录节点下的 L4+ 作为知识点。
 * 演示缺省：约 1/7 整节无视频；其余节内约 1/5 知识点无视频。
 */
function buildLessonGroupsFromRaw(raw: RawDirNode, scopeId: string): LessonGroup[] {
  const kps =
    Array.isArray(raw.children) && raw.children.length > 0
      ? raw.children
      : [{ name: raw.name }];

  const chapterEmpty = hashAbs(scopeId) % 7 === 0;

  return kps.map((kp) => {
    if (chapterEmpty) {
      return { kpName: kp.name, lessons: [] };
    }
    const seed = `${scopeId}-${kp.name}`;
    const kpEmpty = hashAbs(seed) % 5 === 0;
    const count = kpEmpty ? 0 : hashCount(seed, 1, 3);
    return {
      kpName: kp.name,
      lessons: kpVideos(kp.name, count, `v-${seed}`),
    };
  });
}

function flattenGroups(groups?: LessonGroup[]): VideoLessonItem[] {
  return (groups || []).flatMap((g) => g.lessons);
}

function buildVideoTree(rawList: RawDirNode[], parentId: string, level: number): ChapterNode[] {
  if (level > MAX_DIR_LEVEL) return [];
  return (rawList || []).map((raw) => {
    const id = makeNodeId(raw.name, parentId);

    if (level === MAX_DIR_LEVEL) {
      return {
        id,
        title: raw.name,
        level,
        lessonGroups: buildLessonGroupsFromRaw(raw, id),
      };
    }

    const children =
      Array.isArray(raw.children) && raw.children.length > 0
        ? buildVideoTree(raw.children, id, level + 1)
        : [];

    if (children.length === 0) {
      const chapterEmpty = hashAbs(id) % 7 === 0;
      return {
        id,
        title: raw.name,
        level,
        lessonGroups: [
          {
            kpName: raw.name,
            lessons: chapterEmpty ? [] : kpVideos(raw.name, hashCount(id, 1, 2), `v-${id}`),
          },
        ],
      };
    }

    return { id, title: raw.name, level, children };
  });
}

function findSection(tree: ChapterNode[], id: string): ChapterNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findSection(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function findFirstLeaf(tree: ChapterNode[]): ChapterNode | null {
  for (const node of tree) {
    if (node.lessonGroups) return node;
    if (node.children) {
      const found = findFirstLeaf(node.children);
      if (found) return found;
    }
  }
  return null;
}

function collectLessons(tree: ChapterNode[], out: VideoLessonItem[] = []): VideoLessonItem[] {
  for (const node of tree) {
    if (node.lessonGroups) out.push(...flattenGroups(node.lessonGroups));
    if (node.children) collectLessons(node.children, out);
  }
  return out;
}

const FAVORITE_SECTIONS: Array<{ key: FavoriteCourse['favoritedAt']; label: string }> = [
  { key: 'today', label: '今天' },
  { key: 'yesterday', label: '昨天' },
  { key: 'threeDaysAgo', label: '三天前' },
];

function LessonCard({
  lesson,
  onClick,
}: {
  lesson: { id: string; title: string };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="overflow-hidden rounded-xl bg-white border border-slate-100 shadow-[0_4px_12px_rgba(80,100,180,0.08)] text-left active:scale-[0.99] transition-transform"
    >
      <div className="relative aspect-video bg-[#1F6B4A] overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        <img
          src={teacherThumb}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, black 35%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 28%, black 100%)',
          }}
        />
        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/45 text-white flex items-center justify-center backdrop-blur-sm">
          <Play size={9} fill="currentColor" className="ml-px" />
        </span>
      </div>
      <div className="px-2 py-1.5">
        <div className="text-[12px] font-bold text-slate-800 line-clamp-2 leading-snug">
          {lesson.title}
        </div>
      </div>
    </button>
  );
}

/** 单个知识点无视频 */
function EmptyKpBlock() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 flex items-center justify-center text-center">
      <p className="text-[13px] font-bold text-slate-500">该知识点暂无视频</p>
    </div>
  );
}

/** 整个章节/小节无视频 */
function EmptyChapterBlock() {
  return (
    <div className="flex-1 min-h-[280px] flex flex-col items-center justify-center text-center px-6 py-12">
      <p className="text-[15px] font-black text-slate-700">本章节暂无视频</p>
    </div>
  );
}

const VideoLearningPage: React.FC<VideoLearningPageProps> = ({ subject, onBack }) => {
  const catalogTree = useMemo(() => {
    const raw = (SUBJECT_CONFIGS[subject]?.knowledgeTree || []) as RawDirNode[];
    return buildVideoTree(raw, 'root', 1);
  }, [subject]);

  const [view, setView] = useState<PageView>('catalog');
  const [returnView, setReturnView] = useState<'catalog' | 'favorites'>('catalog');
  const [dirPanelOpen, setDirPanelOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [activeSectionId, setActiveSectionId] = useState('');
  const [playingLesson, setPlayingLesson] = useState<VideoLessonItem | null>(null);

  useEffect(() => {
    const leaf = findFirstLeaf(catalogTree);
    setActiveSectionId(leaf?.id || '');
    // 目录树默认全部收起；侧栏默认关闭
    setExpandedIds(new Set());
    setDirPanelOpen(false);
    setView('catalog');
    setPlayingLesson(null);
  }, [catalogTree]);

  const activeSection = useMemo(
    () => (activeSectionId ? findSection(catalogTree, activeSectionId) : null),
    [catalogTree, activeSectionId]
  );
  const lessonGroups = activeSection?.lessonGroups || [];
  const totalVideos = flattenGroups(lessonGroups).length;
  const isChapterEmpty = !!activeSection && (lessonGroups.length === 0 || totalVideos === 0);

  const favorites = useMemo((): FavoriteCourse[] => {
    const all = collectLessons(catalogTree).slice(0, 6);
    const slots: FavoriteCourse['favoritedAt'][] = [
      'today',
      'today',
      'yesterday',
      'yesterday',
      'threeDaysAgo',
      'threeDaysAgo',
    ];
    return all.map((lesson, i) => ({
      id: `fav-${lesson.id}`,
      title: lesson.title,
      favoritedAt: slots[i] || 'threeDaysAgo',
    }));
  }, [catalogTree]);

  const videoTask: Task | null = playingLesson
    ? {
        id: playingLesson.id,
        title: playingLesson.title,
        subject,
        completed: false,
        durationMinutes: 15,
        levelType: 'level',
        quizType: 'mixed',
      }
    : null;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openPlayer = (lesson: VideoLessonItem) => {
    setReturnView(view === 'favorites' ? 'favorites' : 'catalog');
    setPlayingLesson(lesson);
    setView('player');
  };

  const closePlayer = () => {
    setPlayingLesson(null);
    setView(returnView);
  };

  const favoritesByGroup = useMemo(() => {
    return FAVORITE_SECTIONS.map((section) => ({
      ...section,
      items: favorites.filter((f) => f.favoritedAt === section.key),
    })).filter((g) => g.items.length > 0);
  }, [favorites]);

  const renderDirNode = (node: ChapterNode) => {
    const hasChildren = !!(node.children && node.children.length > 0);
    const isLeaf = !!node.lessonGroups;
    const expanded = expandedIds.has(node.id);
    const active = activeSectionId === node.id;
    const padLeft = 4 + (node.level - 1) * 10;

    if (isLeaf) {
      return (
        <button
          key={node.id}
          type="button"
          onClick={() => {
            setActiveSectionId(node.id);
            setDirPanelOpen(false);
          }}
          className={`w-full text-left rounded-full text-[12px] font-semibold leading-snug transition-colors py-2 pr-2 ${
            active ? 'bg-[#E8F1FF] text-[#2F6BFF]' : 'text-slate-600 hover:bg-slate-50'
          }`}
          style={{ paddingLeft: padLeft + 8 }}
        >
          <span className="line-clamp-2">{node.title}</span>
        </button>
      );
    }

    return (
      <div key={node.id} className="mb-0.5">
        <button
          type="button"
          onClick={() => toggleExpand(node.id)}
          className="w-full flex items-center gap-1 py-2 pr-2 rounded-xl text-left hover:bg-slate-50"
          style={{ paddingLeft: padLeft }}
        >
          <span
            className={`flex-1 leading-snug ${
              node.level === 1
                ? 'text-[13px] font-bold text-slate-800'
                : 'text-[12px] font-semibold text-slate-700'
            }`}
          >
            {node.title}
          </span>
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={14} className="text-slate-400 shrink-0" />
            ) : (
              <ChevronRight size={14} className="text-slate-400 shrink-0" />
            )
          ) : null}
        </button>
        {hasChildren && expanded && (
          <div className="space-y-0.5 pb-0.5">
            {node.children!.map((child) => renderDirNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="absolute inset-0 z-[90] flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #F2F5FF 0%, #E8EEFF 100%)',
      }}
    >
      {view !== 'player' && (
        <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (view === 'favorites') setView('catalog');
                else onBack();
              }}
              aria-label="返回"
              className="w-9 h-9 rounded-full bg-white/90 border border-white shadow-sm flex items-center justify-center text-slate-600 active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-[18px] font-black text-slate-900 truncate">
              {view === 'favorites' ? '我的收藏' : subject}
            </h1>
          </div>
          {view === 'catalog' && (
            <button
              type="button"
              onClick={() => setView('favorites')}
              className="flex items-center gap-1.5 text-[13px] font-bold text-[#F04343] active:scale-95"
            >
              <BookMarked size={16} className="text-[#F04343]" />
              我的收藏
            </button>
          )}
        </div>
      )}

      {view === 'catalog' && (
        <div className="flex-1 min-h-0 flex gap-3 px-4 pb-4 relative">
          <AnimatePresence initial={false}>
            {dirPanelOpen && (
              <motion.aside
                key="dir-panel"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 overflow-hidden rounded-[20px] bg-white shadow-[0_8px_24px_rgba(80,100,180,0.08)] flex flex-col"
                style={{ maxWidth: 300 }}
              >
                <div className="w-[280px] h-full flex flex-col">
                  <div className="shrink-0 flex items-center justify-between px-3 pt-3 pb-1.5">
                    <span className="text-[12px] font-black text-slate-500 tracking-wide">知识目录</span>
                    <button
                      type="button"
                      onClick={() => setDirPanelOpen(false)}
                      aria-label="收起目录"
                      className="w-7 h-7 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-2.5 pt-1">
                    {catalogTree.length === 0 ? (
                      <div className="py-10 text-center text-sm text-slate-400 font-semibold">暂无目录</div>
                    ) : (
                      catalogTree.map((node) => renderDirNode(node))
                    )}
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          <section className="flex-1 min-w-0 rounded-[20px] bg-white shadow-[0_8px_24px_rgba(80,100,180,0.08)] overflow-hidden flex flex-col">
            <div className="p-4 flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col">
              <div className="shrink-0 mb-4 flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setDirPanelOpen((v) => !v)}
                  aria-label="目录"
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors active:scale-[0.98] shrink-0 ${
                    dirPanelOpen
                      ? 'bg-[#E8F1FF] text-[#2F6BFF] border-[#C9DCFF]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                  }`}
                >
                  <List size={15} strokeWidth={2.5} />
                </button>
                {activeSection && (
                  <div className="text-[13px] font-bold text-slate-500 truncate min-w-0">
                    {activeSection.title}
                  </div>
                )}
              </div>

              {!activeSection ? (
                <div className="py-16 text-center text-sm text-slate-400 font-semibold">
                  请打开目录选择章节
                </div>
              ) : isChapterEmpty ? (
                <EmptyChapterBlock />
              ) : (
                <div className="space-y-5">
                  {lessonGroups.map((group) => (
                    <div key={group.kpName}>
                      <div className="mb-2.5 flex items-baseline gap-2">
                        <h3 className="text-[14px] font-black text-slate-800 truncate">
                          {group.kpName}
                        </h3>
                        <span className="text-[11px] font-bold text-slate-400 shrink-0">
                          {group.lessons.length > 0
                            ? `${group.lessons.length} 个视频`
                            : '暂无视频'}
                        </span>
                      </div>
                      {group.lessons.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2.5">
                          {group.lessons.map((lesson) => (
                            <LessonCard
                              key={lesson.id}
                              lesson={lesson}
                              onClick={() => openPlayer(lesson)}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyKpBlock />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {view === 'favorites' && (
        <div className="flex-1 min-h-0 px-4 pb-4 overflow-y-auto no-scrollbar">
          <div className="rounded-[20px] bg-white shadow-[0_8px_24px_rgba(80,100,180,0.08)] p-4 min-h-full">
            {favoritesByGroup.map((group) => (
              <div key={group.key} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[14px] font-black text-slate-800">{group.label}</span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {group.items.length} 个视频
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {group.items.map((item) => (
                    <LessonCard
                      key={item.id}
                      lesson={item}
                      onClick={() =>
                        openPlayer({
                          id: item.id,
                          title: item.title,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
            {favoritesByGroup.length === 0 && (
              <div className="py-20 text-center text-sm text-slate-400 font-semibold">
                还没有收藏视频
              </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {view === 'player' && videoTask && (
          <motion.div
            key={`video-player-${videoTask.id}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="absolute inset-0 z-[100] bg-white"
          >
            <VideoPlayer
              mode="learn"
              task={videoTask}
              onComplete={closePlayer}
              onExit={closePlayer}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoLearningPage;
