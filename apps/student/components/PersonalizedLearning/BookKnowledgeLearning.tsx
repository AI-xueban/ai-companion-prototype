import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ChevronLeft, Compass, ArrowUpRight, BookOpen, Sparkles, History } from 'lucide-react';
import { SubjectMap as ThemeLearning, type ExpeditionScreen } from './SubjectMap';
import { loadAcademicContext } from '../../services/academicContextStore';
import { getAvailableTextbookVersions, resolveTextbookVersion } from '../../services/textbookVersionStore';
import './bookKnowledgeLearning.css';
import { KnowledgeTracePage } from './KnowledgeTracePage';
import { PointLearningCard } from './PointLearningCard';
import { ChapterTrainingPanel, chapterTrainingId, pointTrainingLabels, type TextTrainingDifficulty } from './ChapterTrainingPanel';
import { KnowledgeVideoListPage, knowledgeVideoProgressId } from './KnowledgeVideoListPage';
import { buildBookPointIntersection, hasPointPredecessor, type PointTree } from './pointTrace';
import { BookBranchGraph } from './BookBranchGraph';
import { BookChapterPicker } from './BookChapterPicker';
import type { PointKnowledgeDetails } from './pointKnowledgeDetails';
import { buildBookGraph, type Point, type Catalog } from './bookLearningGraph';
import { VideoLesson } from '../Learning/VideoLesson';
import { QuizPage } from '../Quiz/QuizPage';
import { DailyConquerModal } from '../MistakeVault/DailyConquerModal';
import { getMistakeVaultData } from '../../services/geminiService';
import { selectPointMistakes, recordPointCorrections, registerPointMistakes } from '../../services/knowledgePointMistakes';
import type { MistakeItem } from '../../types';
import { getBookPointResource, getBookPointPractice, getBookPointVideos, getBookTextVideos, type KnowledgeVideo } from '../../data/bookKnowledgeResources';
import { knowledgeVideoItemId, getKnowledgeVideoWatch } from './knowledgeVideoProgress';
import { readBookPointProgress, writeBookPointProgress, applyPointPractice, recommendSectionPoint, prototypeChapterId, resetPrototypeChapter } from '../../services/bookKnowledgeProgress';
import { subscribeSyncLessonProgress, getSyncLessonProgressVersion } from '../../services/syncMicroLessonProgress';
import { getPrototypePointHealth } from './prototypePointHealth';
import { KG_SCOPE_MICRO_LESSON, sectionPracticeQuizFields } from '../../utils/kgMicroLesson';
import type { Task } from '../../types';
import type { RewardGrantResult } from '../../types/reward';

export type { ExpeditionScreen };
type Book = { id: string; name: string; edition: string; grade: string; term: string; children: Catalog[] };
type Props = React.ComponentProps<typeof ThemeLearning> & {
  onKnowledgeReward?: (result: RewardGrantResult) => void;
  learningView?: 'map' | 'theme';
  onLearningViewChange?: (view: 'map' | 'theme') => void;
};
const loaders = import.meta.glob(['../../data/learning-books/*.json', '../../data/learning-books/grade7-first-term/*.json']);
const pointTreeLoaders = import.meta.glob('../../data/learning-books/point-trees/*.json');
const pointDetailLoaders = import.meta.glob('../../data/learning-books/point-details/*.json');
const codes: Record<string, string> = { 数学: 'math', 语文: 'chinese', 英语: 'english', 物理: 'physics', 化学: 'chemistry', 生物: 'bio', 地理: 'geography', 历史: 'history', 道德与法治: 'politics', 科学: 'science' };
const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
const tracePracticeFields = { practiceDifficulty: 2 as const, practiceDifficultyLabel: '基础' };
const firstLeaf = (nodes: Catalog[]): Catalog | undefined => {
  for (const node of nodes) {
    if (node.children.length) return node.children[0];
    return node;
  }
};

export function SubjectMap(props: Props) {
  const chapterTrainingMode = props.activeSubject === '语文' || props.activeSubject === '英语';
  const [localView, setView] = useState<'map' | 'theme'>('map');
  const view = chapterTrainingMode ? 'map' : props.learningView ?? localView;
  const [themeVisited, setThemeVisited] = useState(false);
  const [themeHistorySignal, openThemeHistory] = useState(0);
  const [book, setBook] = useState<Book | null>(null);
  const [leaf, setLeaf] = useState<Catalog | null>(null);
  const [selectedPoint, setPoint] = useState<Point | null>(null);
  const [learningPoint, setLearningPoint] = useState<Point | null>(null);
  const [vaultItems, setVaultItems] = useState<MistakeItem[]>([]);
  const [correction, setCorrection] = useState<{ point: Point; context: string; items: MistakeItem[] } | null>(null);
  const [traceOrigin, setTraceOrigin] = useState<Point | null>(null);
  const [traceSelection, setTraceSelection] = useState<Point | null>(null);
  const [pointTree, setPointTree] = useState<{ code: string; roots: PointTree[] }>({ code: '', roots: [] });
  const [commonTypes, setCommonTypes] = useState<Record<string, string[]>>({});
  const [pointDetails, setPointDetails] = useState<{ code: string; records: Record<string, PointKnowledgeDetails> }>({ code: '', records: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [progressRevision, updateProgress] = useState(0);
  useSyncExternalStore(subscribeSyncLessonProgress, getSyncLessonProgressVersion, getSyncLessonProgressVersion);
  const [session, setSession] = useState<{ point: Point; context: string; resource: NonNullable<ReturnType<typeof getBookPointResource>>; phase: 'video' | 'quiz'; task: Task; chapterVideo?: boolean; chapterTraining?: boolean } | null>(null);
  const [videoList, setVideoList] = useState<{ textId: string; title: string; context: string; videos: KnowledgeVideo[]; point?: Point } | null>(null);
  const lastSignal = useRef(props.learningSessionSignal);
  const academic = loadAcademicContext();
  const traceSubjectCode = codes[props.activeSubject] + (grades.includes(academic.grade) && !(academic.grade === '六年级' && academic.schoolSystem === '五四制') ? '3' : '');
  useEffect(() => {
    let cancelled = false;
    const loader = pointTreeLoaders[`../../data/learning-books/point-trees/${traceSubjectCode}.json`];
    (loader ? loader() : Promise.resolve({ default: [] })).then(module => {
      if (!cancelled) setPointTree({ code: traceSubjectCode, roots: (module as { default: PointTree[] }).default });
    }).catch(() => { if (!cancelled) setPointTree({ code: traceSubjectCode, roots: [] }); });
    return () => { cancelled = true; };
  }, [traceSubjectCode]);
  const bookIntersection = useMemo(() => buildBookPointIntersection(book?.children ?? [], pointTree.code === traceSubjectCode ? pointTree.roots : []), [book, pointTree, traceSubjectCode]);
  useEffect(() => {
    let cancelled = false;
    const loader = pointDetailLoaders[`../../data/learning-books/point-details/${traceSubjectCode}.json`];
    (loader ? loader() : Promise.resolve({ default: {} })).then(module => {
      if (!cancelled) setPointDetails({ code: traceSubjectCode, records: (module as { default: Record<string, PointKnowledgeDetails> }).default });
    }).catch(() => { if (!cancelled) setPointDetails({ code: traceSubjectCode, records: {} }); });
    return () => { cancelled = true; };
  }, [traceSubjectCode]);
  const version = resolveTextbookVersion(props.activeSubject, getAvailableTextbookVersions(props.activeSubject, academic.grade, academic.term, academic.schoolSystem), academic.schoolSystem);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setBook(null); setLeaf(null); setPoint(null); setTraceOrigin(null); setTraceSelection(null); setCommonTypes({}); setError('');
    const code = codes[props.activeSubject];
    const elementary = grades.includes(academic.grade) && !(academic.grade === '六年级' && academic.schoolSystem === '五四制');
    const key = `${code}${elementary ? '3' : ''}`;
    const grade7FirstTerm = academic.grade === '七年级' && academic.term === '上册';
    const loader = (grade7FirstTerm ? loaders[`../../data/learning-books/grade7-first-term/${key}.json`] : undefined)
      ?? loaders[`../../data/learning-books/${key}.json`];
    (async () => {
      if (!loader) return;
      const [bookModule, typeModule] = await Promise.all([loader(), import('../../data/learning-books/common-question-types.json')]);
      const { default: books } = bookModule as { default: Book[] };
      const allTypes = typeModule.default as Record<string, Record<string, string[]>>;
      if (cancelled) return;
      const term = academic.term.includes('下') ? '下' : '上';
      const publisher = (edition: string) => edition.replace(/[（(]\d{4}[）)]/g, '').replace(/^部编版/, '统编版');
      // These unified textbooks are labeled 人教版 in the shared settings.
      const unifiedSubject = ['语文', '历史', '道德与法治'].includes(props.activeSubject);
      const graphPublisher = unifiedSubject && version === '人教版' ? '统编版' : publisher(version);
      const candidates = books.filter(b => b.grade === academic.grade && b.term.includes(term) && (
        grade7FirstTerm ? publisher(b.edition) === graphPublisher : b.edition.replace(/（.*?）|\(.*?\)/g, '') === version
      ));
      // The shared textbook setting identifies the publisher; use its 2024 edition for this graph preview.
      const match = candidates.find(b => b.edition === version && /2024/.test(version))
        ?? ((version === '北师大版' || (grade7FirstTerm && props.activeSubject === '语文'))
          ? candidates.find(b => /[（(]2024[）)]/.test(b.edition)) : undefined)
        ?? candidates[0];
      setBook(match ?? null); setCommonTypes(allTypes[key] ?? {});
      const firstMappedSection = !chapterTrainingMode && grade7FirstTerm && match
        ? match.children.flatMap(chapter => chapter.children.length ? chapter.children : [chapter])
          .find(section => buildBookGraph(section).length > 0)
        : undefined;
      const initial = firstMappedSection ?? (match ? firstLeaf(match.children) : undefined);
      setLeaf(initial ?? null); setPoint(null);
    })().catch(() => { if (!cancelled) setError('教材目录加载失败，请重试'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [props.activeSubject, academic.grade, academic.term, academic.schoolSystem, version, retry]);

  useEffect(() => {
    if (props.learningSessionSignal !== lastSignal.current) {
      lastSignal.current = props.learningSessionSignal;
      if (chapterTrainingMode) return;
      setView('theme'); setThemeVisited(true);
      props.onLearningViewChange?.('theme');
    }
  }, [props.learningSessionSignal, chapterTrainingMode]);

  useEffect(() => {
    if (view === 'theme') setThemeVisited(true);
    else props.onExpeditionScreenChange?.('main');
  }, [view, props.onExpeditionScreenChange]);
  const onThemeScreenChange = useCallback((screen: ExpeditionScreen) => {
    if (view === 'theme') props.onExpeditionScreenChange?.(screen);
  }, [view, props.onExpeditionScreenChange]);
  const groups = leaf ? buildBookGraph(leaf) : [];
  const selectSection = (section: Catalog | undefined) => {
    if (!section || loading || error) return;
    setLeaf(section); setPoint(null);
  };
  const points = groups.flatMap(g => g.points);
  const textbookContext = `${props.activeSubject}|${academic.schoolSystem}|${book?.id}|${version}|${academic.grade}|${academic.term}`;
  const activeChapter = book?.children.find(chapter => chapter.id === leaf?.id || chapter.children.some(section => section.id === leaf?.id));
  const prototypeRevision = activeChapter ? readBookPointProgress(textbookContext, prototypeChapterId(activeChapter.id)).prototypeRevision ?? 0 : 0;
  const chapterDemo = !chapterTrainingMode && prototypeRevision > 0;
  const context = chapterDemo ? `${textbookContext}|chapter-demo:${activeChapter?.id}:${prototypeRevision}` : textbookContext;
  const clearChapter = (chapter: Catalog) => {
    resetPrototypeChapter(textbookContext, chapter.id);
    if (activeChapter?.id !== chapter.id) setLeaf(chapter.children[0] ?? chapter);
    setPoint(null); updateProgress(value => value + 1);
  };
  const traceBookLabel = `${book?.grade ?? academic.grade} · ${(book?.term ?? academic.term).replace('上学期', '上册').replace('下学期', '下册')}`;
  const health = Object.fromEntries(points.map(p => [p.id, getPrototypePointHealth(context, p.id, chapterDemo)]));
  const traceHealth = traceOrigin && activeChapter
    ? Object.fromEntries(buildBookGraph(activeChapter).flatMap(group => group.points).map(p => [p.id, getPrototypePointHealth(context, p.id, chapterDemo)]))
    : health;
  const recommended = recommendSectionPoint(points, health);
  const point = points.find(p => p.id === selectedPoint?.id) ?? (recommended ?? null);
  useEffect(() => {
    let cancelled = false;
    const activePoint = traceSelection ?? point;
    if (activePoint) {
      const resource = getBookPointResource(props.activeSubject, activePoint);
      if (!resource.simulated) registerPointMistakes(props.activeSubject, activePoint.name, resource.questions, readBookPointProgress(context, activePoint.id).questionStates);
    }
    getMistakeVaultData().then(data => { if (!cancelled) setVaultItems(data.groups.flatMap(group => group.items)); });
    return () => { cancelled = true; };
  }, [context, point?.id, traceSelection?.id, progressRevision]);
  const masteredCount = points.filter(p => health[p.id].status === 'mastered').length;
  const statuses = Object.fromEntries(points.map(p => [p.id, health[p.id].status]));
  const selectedHealth = point ? health[point.id] : undefined;
  const canTrace = (id: string) => hasPointPredecessor(bookIntersection.index, id);
  const openPoint = (p: Point, mode: 'video' | 'trace' = 'video') => {
    if (mode === 'trace') {
      const index = bookIntersection.index;
      const previousId = index[p.id]?.previousId;
      const previous = previousId ? index[previousId] : undefined;
      if (!previous) return;
      setTraceOrigin(p); setTraceSelection(previous); return;
    }
    if (!traceOrigin) setPoint(p);
    setLearningPoint(p);
  };
  const startPointTraining = (p: Point, selectedDifficulty: TextTrainingDifficulty) => {
    const difficulty = traceOrigin ? '基础' : selectedDifficulty;
    const resource = getBookPointPractice(props.activeSubject, p, difficulty);
    const id = `book-knowledge-${book?.id}-${p.id}`;
    setSession({ point: p, context, resource, phase: 'quiz', task: {
      ...sectionPracticeQuizFields(), id, title: `${p.name} · ${pointTrainingLabels[difficulty]}`, subject: props.activeSubject, completed: false,
      ...(traceOrigin ? tracePracticeFields : { practiceDifficulty: difficulty === '基础' ? 2 as const : difficulty === '进阶' ? 3 as const : 4 as const, practiceDifficultyLabel: difficulty }),
    } });
  };
  const openChapterVideo = () => {
    if (!chapterTrainingMode || !book || !leaf) return;
    setVideoList({ textId: leaf.id, title: leaf.name, context, videos: getBookTextVideos(props.activeSubject, leaf.id, leaf.name) });
  };
  const openTextTraining = (difficulty: TextTrainingDifficulty) => {
    if (!chapterTrainingMode || !book || !leaf) return;
    const id = chapterTrainingId(leaf.id, difficulty);
    setSession({ point: { id, name: leaf.name }, context, phase: 'quiz', chapterTraining: true,
      resource: { steps: [], questions: [], simulated: true }, task: {
        ...sectionPracticeQuizFields(),
        id: `book-knowledge-training-${book.id}-${id}`,
        title: `${leaf.name} · ${difficulty}训练（流程模拟）`, subject: props.activeSubject, completed: false,
        questionCount: 6, practiceDifficulty: difficulty === '基础' ? 2 : difficulty === '进阶' ? 3 : 4,
        practiceDifficultyLabel: difficulty,
      },
    });
  };
  const playKnowledgeVideo = (video: KnowledgeVideo, source = videoList) => {
    if (!source) return;
    const id = `book-knowledge-video-${video.id}`;
    const p = source.point;
    const resource = p ? getBookPointResource(props.activeSubject, p) : { steps: video.steps, questions: [], simulated: video.simulated };
    setSession({ point: p ?? { id: knowledgeVideoProgressId(source.textId, video.id), name: video.title }, context: source.context, resource: { ...resource, steps: video.steps }, phase: 'video', chapterVideo: !p, task: {
      id, title: video.title, subject: props.activeSubject, durationMinutes: Math.ceil(video.durationSec / 60), completed: false, aiReasoning: KG_SCOPE_MICRO_LESSON,
      sectionVideoPlaylist: { items: source.videos.map(item => ({ ...item, id: knowledgeVideoItemId(source.context, item.id) })), currentIndex: source.videos.findIndex(item => item.id === video.id), scopeLabel: source.title },
    } });
  };
  const openPointVideo = (p: Point) => {
    const videos = getBookPointVideos(props.activeSubject, p);
    const watches = videos.map((video, index) => getKnowledgeVideoWatch(context, p.id, video, index));
    const unfinished = watches.findIndex(watch => watch.ratio > 0 && watch.status !== '已学完');
    const next = unfinished >= 0 ? unfinished : watches.findIndex(watch => watch.status !== '已学完');
    const video = videos[Math.max(0, next)];
    if (video) playKnowledgeVideo(video, { textId: p.id, title: p.name, context, videos, point: p });
  };
  const closeSession = () => { setSession(null); setCorrection(null); props.onExpeditionScreenChange?.(traceOrigin || videoList || learningPoint ? 'textbook-video' : 'main'); };
  const returnResultToGraph = () => {
    setSession(null); setLearningPoint(null); setVideoList(null); setTraceOrigin(null); setTraceSelection(null);
    props.onExpeditionScreenChange?.('main');
  };
  useEffect(() => {
    if (session || correction || traceOrigin || videoList || learningPoint) props.onExpeditionScreenChange?.('textbook-video');
  }, [Boolean(session || correction || traceOrigin || videoList || learningPoint), props.onExpeditionScreenChange]);
  const themeFullScreen = view === 'theme' && themeVisited;
  if (chapterTrainingMode) return <div className="bkl-shell">
    <main className="bkl-coming-soon" aria-label={`${props.activeSubject}知识精准学暂未开放`}>
      <section className="bkl-coming-soon-card">
        <div className="bkl-coming-soon-art" aria-hidden="true"><span /><i /><div><BookOpen size={43} strokeWidth={1.7} /></div><Sparkles size={23} /></div>
        <span className="bkl-coming-soon-subject">{props.activeSubject} · 知识精准学</span>
        <h1>暂未开放，正在筹备中</h1>
        <p>这一科还在准备，先去其他科目练练吧。</p>
      </section>
    </main>
  </div>;
  if (correction) return <DailyConquerModal items={correction.items} maxQuestions={correction.items.length} mode="batch" subjectLabel={props.activeSubject} onClose={closeSession} onComplete={() => {}} onRewardGranted={props.onKnowledgeReward} onSessionResult={result => {
    setVaultItems(recordPointCorrections(vaultItems, result.questions, result.sessionId));
    const previous = readBookPointProgress(correction.context, correction.point.id);
    writeBookPointProgress(correction.context, correction.point.id, applyPointPractice(previous, result));
    updateProgress(n => n + 1);
  }} />;
  if (session?.chapterTraining) return <div className="bkl-session bkl-text-training-session">
    <header><span>{session.point.name} · {session.task.practiceDifficultyLabel}训练</span><small>演示题不计入课文健康分</small></header>
    <div className="bkl-text-training-body"><QuizPage key={session.task.id} task={session.task} onExit={closeSession} onRewardGranted={props.onKnowledgeReward} /></div>
  </div>;
  if (session) return <div className="bkl-session">
    {session.phase === 'video' ? <VideoLesson key={session.task.id} task={session.task}
      knowledgePreview={{ title: session.chapterVideo ? session.task.sectionVideoPlaylist?.scopeLabel ?? session.point.name : session.point.name, steps: session.resource.steps, playlistSteps: (session.chapterVideo ? videoList?.videos : getBookPointVideos(props.activeSubject, session.point))?.map(video => video.steps) }}
      onWatched={() => { if (!session.chapterVideo) writeBookPointProgress(session.context, session.point.id, { watched: true }); updateProgress(n => n + 1); }}
      onRewardGranted={props.onKnowledgeReward}
      onExit={closeSession} onComplete={closeSession} /> :
      <QuizPage key={`${session.task.id}-quiz`} task={{ ...sectionPracticeQuizFields(), ...session.task, aiReasoning: sectionPracticeQuizFields().aiReasoning, title: `${session.task.title}${session.resource.simulated ? '（流程模拟）' : ''}`, questionCount: session.resource.questions.length }}
        overrideQuestions={session.resource.questions} onExit={closeSession} onResultExit={returnResultToGraph} onRewardGranted={props.onKnowledgeReward}
        onSessionResult={result => {
          if (result.grantResult?.invalidLearning) return;
          const previous = readBookPointProgress(session.context, session.point.id);
          writeBookPointProgress(session.context, session.point.id, applyPointPractice(previous, result, session.resource.simulated));
          updateProgress(n => n + 1);
        }} />}
  </div>;
  if (videoList) return <KnowledgeVideoListPage title={videoList.title} textId={videoList.textId} context={videoList.context} videos={videoList.videos} backLabel={learningPoint ? '返回知识点学练' : '返回知识精准学'} onPlay={playKnowledgeVideo} onBack={() => { setVideoList(null); props.onExpeditionScreenChange?.(learningPoint || traceOrigin ? 'textbook-video' : 'main'); }} />;
  if (learningPoint) return <section className="bkl-point-learning-page" aria-label="知识点学练">
    <header className="bkl-personalized-header"><button type="button" aria-label={traceOrigin ? '返回知识点溯源' : '返回知识精准学'} onClick={() => { setLearningPoint(null); props.onExpeditionScreenChange?.(traceOrigin ? 'textbook-video' : 'main'); }}><ChevronLeft size={21} /><span>{traceOrigin ? '返回溯源' : '返回知识精准学'}</span></button><div className="bkl-learning-heading"><h1>知识点学练</h1><span>{learningPoint.name}</span></div><span aria-hidden="true" /></header>
    <main className="bkl-point-learning-body"><ChapterTrainingPanel context={context} chapterId={learningPoint.id} subject={props.activeSubject} videos={getBookPointVideos(props.activeSubject, learningPoint)} fixedDifficulty={traceOrigin ? '基础' : undefined} pointStatus={(health[learningPoint.id] ?? traceHealth[learningPoint.id] ?? getPrototypePointHealth(context, learningPoint.id, chapterDemo)).status}
      onVideo={() => openPointVideo(learningPoint)}
      onTraining={difficulty => startPointTraining(learningPoint, difficulty)} /></main>
  </section>;
  if (traceOrigin) return <KnowledgeTracePage origin={traceOrigin} selected={traceSelection ?? traceOrigin} onSelect={setTraceSelection} context={context} subject={props.activeSubject} index={bookIntersection.index} bookLabel={traceBookLabel} commonTypes={commonTypes} healthOverrides={{ ...traceHealth, ...health }} mistakes={vaultItems} onLearn={openPoint} onCorrect={p => {
    const items = selectPointMistakes(vaultItems, props.activeSubject, p.name);
    if (items.length) setCorrection({ point: p, context, items });
  }} onBack={() => { setTraceOrigin(null); setTraceSelection(null); props.onExpeditionScreenChange?.('main'); }} />;
  return <div className={`bkl-shell${themeFullScreen ? ' bkl-personalized-subpage' : ''}`}>
    <div className={`bkl-workspace ${chapterTrainingMode ? 'bkl-chapter-workspace' : 'bkl-graph-workspace'}`} hidden={view !== 'map'}>
        <div className="bkl-breadcrumb bkl-section-toolbar">
          {loading ? <span>正在加载章节…</span> : error ? <span>教材目录加载失败</span> : book ?
            <BookChapterPicker chapters={book.children} selectedId={leaf?.id} onSelect={selectSection} onClearChapter={chapterTrainingMode ? undefined : clearChapter} /> : <span>暂无教材目录</span>}
        </div>
      {!chapterTrainingMode && <button type="button" className="bkl-personalized-entry" onClick={() => { setView('theme'); setThemeVisited(true); props.onLearningViewChange?.('theme'); }}>
        <span className="bkl-personalized-entry-art" aria-hidden="true"><Compass size={30} strokeWidth={1.7} /></span>
        <span className="bkl-personalized-entry-copy"><strong>个性化学习</strong><small>选择学习主题，开启专属计划</small></span>
        <ArrowUpRight className="bkl-personalized-entry-arrow" size={18} aria-hidden="true" />
      </button>}
      {!chapterTrainingMode && <aside className="bkl-sidebar">
        {!point && points.length > 0 && masteredCount === points.length && !loading && !error && <section className="bkl-mastery bkl-all-mastered" aria-label="本节已掌握"><Sparkles size={36} /><h3>本节知识点已掌握</h3><p>可以选择知识点继续巩固，也可以切换章节学习。</p><div className="bkl-detail-actions"><button className="bkl-selected-learn" onClick={() => setPoint(points[0])}>查看知识点</button></div></section>}
        {point && !error && <PointLearningCard point={point} recommended={point.id === recommended?.id} health={selectedHealth!} commonTypes={commonTypes[point.id]} details={pointDetails.code === traceSubjectCode ? pointDetails.records[point.id] : undefined} onLearn={() => openPoint(point)} onTrace={canTrace(point.id) ? () => openPoint(point, 'trace') : undefined} />}
      </aside>}
      <main className={`bkl-canvas ${chapterTrainingMode ? 'bkl-chapter-canvas' : ''}`} onClick={event => {
        if (!chapterTrainingMode && !(event.target as HTMLElement).closest('button,dialog,.bkl-branch-viewport')) setPoint(null);
      }}>

        {!chapterTrainingMode && <div className="bkl-canvas-heading">{leaf && <p>共 {points.length} 个知识点 · 已掌握 {masteredCount} 个</p>}</div>}
        {loading ? <div className="bkl-graph-empty">{chapterTrainingMode ? '正在加载课文…' : '正在加载知识点…'}</div> : error ? <div className="bkl-graph-empty" role="alert"><h3>教材数据加载失败</h3><p>请检查本地预览服务是否运行，然后重试</p><button onClick={() => setRetry(n => n + 1)}>重新加载</button></div> : !book ? <div className="bkl-graph-empty">暂无与当前教材匹配的目录，请在「我的课本」核对教材信息</div> : chapterTrainingMode ? (leaf ? <ChapterTrainingPanel key={`${context}|${leaf.id}`} context={context} chapterId={leaf.id} subject={props.activeSubject} videos={getBookTextVideos(props.activeSubject, leaf.id, leaf.name)} onVideo={openChapterVideo} onTraining={openTextTraining} /> : <div className="bkl-graph-empty">暂无可训练的课文</div>) : !points.length ? <div className="bkl-graph-empty">本节暂无教材关联的知识点</div> :
          <BookBranchGraph key={leaf?.id} groups={groups} selected={point?.id} onSelect={setPoint} onBackgroundClick={() => setPoint(null)} statuses={statuses} recommendedId={recommended?.id} />}
        {!chapterTrainingMode && <div className="bkl-canvas-footer"><span className="bkl-status-legend" aria-label="知识点状态图例">{[
          { label: '未知', color: '#a2a7b7' }, { label: '探索中', color: '#6d9ee8' }, { label: '待攻克', color: '#ed6b75' }, { label: '待复习', color: '#e4b342' }, { label: '已掌握', color: '#42b7ad' },
        ].map(item => <span key={item.label} style={{ color: item.color }}><i aria-hidden="true" />{item.label}</span>)}</span></div>}
      </main>
    </div>
    {themeVisited && !chapterTrainingMode && <section className="bkl-theme bkl-personalized-page" hidden={!themeFullScreen} aria-label="个性化学习子页面">
      <header className="bkl-personalized-header"><button type="button" aria-label="返回知识精准学" onClick={() => { setView('map'); props.onLearningViewChange?.('map'); props.onExpeditionScreenChange?.('main'); }}><ChevronLeft size={21} /><span>返回知识精准学</span></button><h1>个性化学习</h1><div className="bkl-personalized-tools"><span className="bkl-personalized-grade">{academic.grade} · {academic.term.replace('上学期', '上册').replace('下学期', '下册')}</span><button type="button" aria-label="历史记录" title="历史记录" onClick={() => openThemeHistory(value => value + 1)}><History size={20} /></button></div></header>
      <div className="bkl-personalized-content"><ThemeLearning {...props} historyOpenSignal={(props.historyOpenSignal ?? 0) + themeHistorySignal} onExpeditionScreenChange={onThemeScreenChange} /></div>
    </section>}
  </div>;
}
