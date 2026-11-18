import React, { forwardRef, useEffect, useImperativeHandle, useId, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, Check, Keyboard, Mic, Pause, Play, Send, Square, Maximize2, ChevronDown } from 'lucide-react';
import type { TutorPhase } from '../../data/tutorTwoPhaseScript';
import { DEFAULT_QUESTION, type AISolveQuestion } from '../../data/aiSolveMockData';
import { getBoardLesson } from '../../data/tutorBoardLessons';
import { getTutorCharacter } from '../../data/tutorCharacterThemes';
import { useTutorLessonPlayback, type TeachingBeat } from '../../hooks/useTutorLessonPlayback';
import { useTutorSpeechInput } from '../../hooks/useTutorSpeechInput';
import { explainBoardLine, newTeachingProgress, recommendedQuestions, respondToStudent, teachingConditions, teachingPrompt, type TeachingProgress } from '../../services/tutorTeaching';
import { TutorOriginalPanel, TutorImageViewer, TutorFigurePreview, getTutorFigures } from './TutorMaterialReader';
import './TutorBoard.css';

interface Props { onClose: () => void; mockProblemComponent?: React.ReactNode; problemContent?: React.ReactNode; question?: AISolveQuestion | null; onPhaseChange?: (phase: TutorPhase) => void; enterFade?: boolean }
export interface AITutorLayerHandle { startGuide: () => void }
interface PartState { progress: TeachingProgress; pending?: TeachingProgress; lines: string[]; visible: string[]; draft: string; student: string; feedback: string; prompt: string; hold: boolean; summary: boolean; answeredQuestion?: boolean }

const writtenEquation = /^(.*?)[ ]*=[ ]*(\d+(?:\.\d+)?)(?:（([^）]+)）)?$/;

function boardBeats(line: string): TeachingBeat[] {
  const text = explainBoardLine(line);
  const equation = writtenEquation.exec(line);
  if (!equation) return [{ text, line }];
  const [, expression, number, unit = ''] = equation;
  return [
    { text: expression.replace(/×/g, '乘').replace(/÷/g, '除以').replace(/−/g, '减').replace(/\+/g, '加'), expression },
    { text: `等于${number}${unit}。`, line, expression, result: line.slice(expression.length) },
  ];
}

function wallBoardGroup(line: string) {
  if (/^(?:墙面：8|窗户：2|一面墙实际粉刷：|40面墙：)/.test(line)) return '粉刷面积';
  if (/^(?:涂料|一面墙涂料)：/.test(line)) return '涂料用量';
  if (/^(?:费用|一面墙费用|40面墙费用|答)：/.test(line)) return '粉刷费用';
  return '';
}

function AppleBags({ showSold, showRemaining }: { showSold: boolean; showRemaining: boolean }) {
  return <figure className="tb-bag-model" aria-label={showSold ? "苹果平均装成六袋，其中两袋已卖出" : "苹果平均装成六袋"}>
    <div className="tb-bag-strip" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => <span key={index} className={showSold && index >= 4 ? 'tb-bag-sold' : undefined} />)}
    </div>
    {showSold && <figcaption><span>{showRemaining ? "剩下的袋" : ""}</span><span>卖出 2 袋</span></figcaption>}
  </figure>;
}

function Writing({ text, spoken }: { text: string; spoken: string }) {
  const duration = Math.max(450, Math.min(2200, spoken.replace(/\s/g, '').length * 110));
  return <span className="tb-writing-segment" style={{ animationDuration: `${duration}ms` }}><span className="tb-ink">{text}</span><i className="tb-pen" aria-hidden="true" /></span>;
}

export const AITutorLayer = forwardRef<AITutorLayerHandle, Props>(function AITutorLayer(props, ref) {
  const question = props.question || DEFAULT_QUESTION;
  return <TutorBoardSession key={question.id} {...props} question={question} ref={ref} />;
});

const TutorBoardSession = forwardRef<AITutorLayerHandle, Props & { question: AISolveQuestion }>(function TutorBoardSession(
  { question, onClose, mockProblemComponent, problemContent, onPhaseChange, enterFade = true }, ref,
) {
  const parts = useMemo(() => question.subQuestions?.length ? question.subQuestions : [{ id: question.id, label: '当前题目', text: question.text }], [question]);
  const [partId, setPartId] = useState(parts[0].id);
  const part = parts.find(p => p.id === partId)!;
  const fresh = (id: string): PartState => ({ progress: newTeachingProgress(), lines: teachingConditions(question, id), visible: [], draft: '', student: '', feedback: '', prompt: '', hold: false, summary: false });
  const [states, setStates] = useState<Record<string, PartState>>(() => ({ [parts[0].id]: fresh(parts[0].id) }));
  const current = states[partId] || fresh(partId);
  const stateRef = useRef(current); stateRef.current = current;
  const update = (patch: Partial<PartState>) => setStates(old => ({ ...old, [partId]: { ...(old[partId] || fresh(partId)), ...patch } }));
  const [originalOpen, setOriginalOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  const originalPanelId = useId();
  const originalToggle = useRef<HTMLButtonElement>(null);
  const imageOpener = useRef<HTMLElement | null>(null);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [nod, setNod] = useState(0);
  const [following, setFollowing] = useState(true);
  const followRef = useRef(true);
  const board = useRef<HTMLDivElement>(null);
  const originalScroll = useRef(0);
  const boardPositions = useRef<Record<string, number>>({});
  const previousAnswer = useRef<Record<string, PartState | undefined>>({});
  const queuePart = useRef<string | null>(null);
  const reduceMotion = useReducedMotion();
  const character = getTutorCharacter('change');
  const lesson = getBoardLesson(question, partId, current.progress.perWall);
  const figures = getTutorFigures(question);
  const neededFigures = figures.filter(f => !part.imageIds?.length || part.imageIds.includes(f.id));
  const isPaintProblem = question.id === 'q27';
  const hasBagCount = current.visible.some(line => line.startsWith('剩下的袋数：'));
  const showSoldBags = hasBagCount || current.visible.some(line => line.startsWith('卖出：'));
  const showBoardFigures = !isPaintProblem || current.visible.some(line => line.startsWith('墙面：长'));
  const completedParts = parts.filter(p => states[p.id]?.summary).map(p => p.id);
  const scrollToCurrent = () => { followRef.current = true; setFollowing(true); requestAnimationFrame(() => board.current?.scrollTo({ top: board.current.scrollHeight, behavior: 'instant' })); };
  const playback = useTutorLessonPlayback(beat => {
    beat.enter?.();
    if (beat.line) {
      setStates(old => { const s = old[partId] || fresh(partId); return { ...old, [partId]: { ...s, visible: s.visible.includes(beat.line!) ? s.visible : [...s.visible, beat.line!] } }; });
    }
    requestAnimationFrame(() => {
      if (followRef.current) board.current?.scrollTo({ top: board.current.scrollHeight, behavior: 'instant' });
    });
  });
  const playState = (s: PartState, feedback = '', wait = false) => {
    queuePart.current = partId;
    update({ prompt: '' });
    const target = !wait && s.pending ? s.pending : s.progress;
    const nextPrompt = teachingPrompt(question, partId, target);
    const beats: TeachingBeat[] = [
      ...(feedback ? [{ text: feedback }] : []),
      ...s.lines.filter(line => !s.visible.includes(line)).flatMap(boardBeats),
      ...(!wait ? [{
        text: target.finished ? getBoardLesson(question, partId, target.perWall).summary : nextPrompt,
        question: !target.finished,
        enter: () => update({ progress: target, pending: undefined }),
      }] : []),
    ];
    playback.start(beats, () => {
      update({ prompt: nextPrompt, summary: target.finished, hold: wait });
      if (wait) playback.pause();
    });
  };
  const submit = (raw: string) => {
    const value = raw.trim(); if (!value || imageIndex !== null) return;
    playback.discard(); speech.stop();
    let before = stateRef.current;
    const correction = /^(不对|我说错了|说错了|更正|改成|应该是)[，,:：\s]*/;
    if (correction.test(value) && previousAnswer.current[partId]) before = previousAnswer.current[partId]!;
    if (before.pending && /^(继续|继续吧|懂了|明白了|知道了|好|好的|嗯)[，,。！!]*(继续)?$/.test(value)) before = { ...before, progress: before.pending, pending: undefined };
    const result = respondToStudent(question, partId, before.progress, value.replace(correction, ''));
    const base = result.restart ? fresh(partId) : before;
    const next: PartState = { ...base, progress: result.accepted ? base.progress : result.progress, pending: result.accepted ? result.progress : base.pending, lines: [...new Set([...base.lines, ...result.lines])], draft: '', student: value, feedback: result.feedback, hold: result.hold, summary: base.summary && result.progress.finished };
    next.answeredQuestion = result.answeredQuestion;
    if (result.restart || next.progress.windowHelp !== base.progress.windowHelp) {
      next.prompt = teachingPrompt(question, partId, next.progress);
      next.visible = [...new Set([...next.visible, ...result.lines])];
    }
    if (result.accepted) { previousAnswer.current[partId] = before; setNod(n => n + 1); }
    if (result.restart) { previousAnswer.current[partId] = undefined; scrollToCurrent(); }
    stateRef.current = next; update(next);
    playState(next, result.feedback, result.hold);
  };
  const speech = useTutorSpeechInput(text => submit(text));
  const pause = () => { playback.pause(); speech.stop(); setNod(0); };
  const resume = () => {
    if (current.hold || queuePart.current !== partId) { update({ hold: false, answeredQuestion: false, feedback: '' }); playState(current, '', false); }
    else playback.resume();
  };
  const openImage = (index: number) => {
    if (!figures[index]) return;
    imageOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    pause();
    setImageIndex(index);
  };
  const closeImage = () => {
    setImageIndex(null);
    requestAnimationFrame(() => imageOpener.current?.focus({ preventScroll: true }));
  };
  const toggleOriginal = () => {
    setOriginalOpen(open => !open);
    requestAnimationFrame(() => { if (followRef.current) board.current?.scrollTo({ top: board.current.scrollHeight, behavior: 'instant' }); });
  };
  const switchPart = (id: string) => {
    if (id === partId) { setOriginalOpen(false); originalToggle.current?.focus(); return; }
    pause(); playback.discard(); queuePart.current = null;
    if (board.current) boardPositions.current[partId] = board.current.scrollTop;
    setPartId(id); setOriginalOpen(false); speech.clearError();
  };
  useEffect(() => {
    const saved = states[partId];
    if (!saved) { const s = fresh(partId); update(s); playState(s); }
    else if (!saved.visible.length) playState(saved);
    else {
      playback.pause();
      if (board.current) board.current.scrollTop = boardPositions.current[partId] || 0;
    }
    const viewport = board.current;
    followRef.current = !saved?.visible.length || !viewport || viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= 8;
    setFollowing(followRef.current);
    return playback.discard;
    // A part switch restores its own work; typing must never restart the introduction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partId]);
  useEffect(() => { onPhaseChange?.(completedParts.length === parts.length ? 'guide_done' : 'guide'); }, [completedParts.length, parts.length, onPhaseChange]);
  useImperativeHandle(ref, () => ({ startGuide: () => { setOriginalOpen(false); setImageIndex(null); resume(); } }));
  useEffect(() => {
    const hidden = () => { if (document.hidden) { playback.pause(); speech.stop(); } };
    document.addEventListener('visibilitychange', hidden);
    return () => document.removeEventListener('visibilitychange', hidden);
  }, [playback.pause, speech.stop]);
  const handleBoardScroll = ({ currentTarget }: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = currentTarget;
    const previousTop = boardPositions.current[partId] ?? 0;
    boardPositions.current[partId] = scrollTop;
    const atLatest = scrollHeight - clientHeight - scrollTop <= 8;
    if (atLatest || scrollTop < previousTop) {
      followRef.current = atLatest;
      setFollowing(atLatest);
    }
  };
  const close = () => { playback.discard(); speech.stop(); onClose(); };
  const writing = playback.activeBeat;
  const showPen = playback.playing && !reduceMotion;
  const reviewingReply = current.answeredQuestion && current.hold && playback.paused && !!current.prompt;
  const displayedPrompt = reviewingReply ? '' : current.prompt;
  const caption = reviewingReply ? current.feedback : playback.activeBeat?.question ? '' : playback.activeBeat?.text || current.feedback;
  const showCaption = reviewingReply || (!displayedPrompt && (!playback.playing || playback.silent) && caption && !current.visible.includes(caption));

  return <motion.section className="tutor-board" aria-label="灵境解题" initial={enterFade && !reduceMotion ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: .15 }}>
    <div className="tb-main" inert={imageIndex !== null ? true : undefined} onKeyDown={event => {
      if (event.key === 'Escape' && originalOpen) { event.stopPropagation(); toggleOriginal(); originalToggle.current?.focus(); }
    }}>
      <header className="tb-header">
        <button className="tb-icon" aria-label="退出讲题" onClick={close}><ChevronLeft size={21} /></button><h1>灵境解题</h1>
        {parts.length > 1 && <nav className="tb-parts" aria-label="小问切换">{parts.map(p => <button key={p.id} className="tb-button" aria-pressed={p.id === partId} onClick={() => switchPart(p.id)}>{completedParts.includes(p.id) && <Check size={13} />}{p.label}</button>)}</nav>}
      </header>
      <div className="tb-stem">
        <span className="tb-subject">{parts.length > 1 ? part.label : question.subject}</span>
        <p title={part.text} hidden={originalOpen}>{isPaintProblem ? '粉刷 40 面墙要花多少钱？（窗户不刷）' : part.text}</p>
        <button type="button" className="tb-button tb-original-link" ref={originalToggle} aria-expanded={originalOpen} aria-controls={originalOpen ? originalPanelId : undefined} onClick={toggleOriginal}>
          {originalOpen ? '收起原题' : '完整原题'}<ChevronDown size={15} aria-hidden="true" />
        </button>
      </div>
      {originalOpen && <TutorOriginalPanel id={originalPanelId} question={question} active={partId} completed={completedParts} scrollPosition={originalScroll}
        customContent={problemContent || mockProblemComponent} onOpenImage={openImage} onSelect={switchPart} />}
      <main className="tb-board" ref={board} aria-label="解题板书" tabIndex={0} onScroll={handleBoardScroll}>
        <div className="tb-paper">
          {showBoardFigures && neededFigures.length > 0 && <div className="tb-source-links">{neededFigures.map(f => <button key={f.id} className={isPaintProblem ? 'tb-source-link tb-wall-figure' : 'tb-source-link'} aria-label={`放大${f.caption}`} onClick={() => openImage(figures.findIndex(item => item.id === f.id))}>
            <div className="tb-figure-content">
              <TutorFigurePreview figure={f} region={f.id === 'original' ? (isPaintProblem ? { left: 54, top: 28, width: 42, height: 71 } : question.region) : undefined} />
            </div>
            <span><Maximize2 size={12} />{isPaintProblem ? '墙面与窗户' : f.caption}</span>
          </button>)}</div>}
          <div className={isPaintProblem ? 'tb-lesson-lines tb-wall-lines' : 'tb-lesson-lines'}>
            {current.visible.map((line, index) => {
              const evidence = question.id === 'tutor-umbrella' ? /^(动作|结果)：(.+)$/.exec(line) : null;
              if (evidence) return null;
              if (question.id === 'tutor-umbrella' && line.startsWith('小林把伞')) {
                const phrases = /^(小林)(把伞往同学那边挪)(，)(自己的半边肩膀却湿透了)(。)$/.exec(line);
                if (phrases) return <p key={line} className="tb-equation tb-board-note tb-reading-quote">
                  {phrases[1]}{current.visible.includes('动作：' + phrases[2]) ? <mark title="动作">{phrases[2]}</mark> : phrases[2]}
                  {phrases[3]}{current.visible.includes('结果：' + phrases[4]) ? <mark title="结果">{phrases[4]}</mark> : phrases[4]}{phrases[5]}
                </p>;
              }
              const group = isPaintProblem ? wallBoardGroup(line) : '';
              const beginsGroup = group && group !== wallBoardGroup(current.visible[index - 1] ?? '');
              return <React.Fragment key={line}>
                {beginsGroup && <h2 className="tb-board-group">{group}</h2>}
                <p className={writtenEquation.test(line) ? 'tb-equation' : 'tb-equation tb-board-note'}>
                  {showPen && writing?.line === line && writing.result
                    ? <>{writing.expression}<Writing key={line} text={writing.result} spoken={writing.text} /></>
                    : line}
                </p>
                {question.id === 'tutor-apples' && line.startsWith('平均装成') && <AppleBags showSold={showSoldBags} showRemaining={hasBagCount} />}
              </React.Fragment>;
            })}
            {writing?.expression && !writing.line && <>
              {isPaintProblem && wallBoardGroup(writing.expression) &&
                wallBoardGroup(writing.expression) !== wallBoardGroup(current.visible.at(-1) ?? '') &&
                <h2 className="tb-board-group">{wallBoardGroup(writing.expression)}</h2>}
              <p className="tb-equation">
                {showPen ? <Writing key={writing.expression} text={writing.expression} spoken={writing.text} /> : writing.expression}
              </p>
            </>}
          </div>
          {!current.visible.length && <p className="tb-muted">先一起读懂条件，再一步步列式。</p>}
          {current.summary && <section className="tb-summary"><div className="tb-kicker">这一问的小结</div><p>{lesson.summary}</p><div className="tb-recommendations">{recommendedQuestions(question).map(text => <button key={text} onClick={() => submit(text)}>{text}</button>)}</div>{parts.some(p => !completedParts.includes(p.id)) && <button className="tb-button" onClick={() => switchPart(parts.find(p => !completedParts.includes(p.id))!.id)}>继续下一问</button>}</section>}
        </div>
      </main>
      <footer className="tb-dock">
        <div className="tb-dock-question">
          <div className="tb-dock-context">
            {(displayedPrompt || !following) && <div className="tb-question-row">{displayedPrompt && <strong aria-label="当前问题">{displayedPrompt}</strong>}{!following && <button onClick={scrollToCurrent}>回到最新板书</button>}</div>}
            {playback.error ? (
              <div className="tb-playback-error" role="alert"><span>{playback.error}</span><button onClick={playback.resume}>重试语音</button><button onClick={playback.continueSilently}>静音继续</button></div>
            ) : showCaption ? (
              <div className="tb-caption" aria-live="polite">{caption}</div>
            ) : null}
          </div>
          <button
            type="button"
            className="tb-button tb-playback-toggle"
            aria-label={playback.paused ? '继续' : '暂停'}
            title={playback.paused ? '继续' : '暂停'}
            onClick={playback.paused ? resume : pause}
          >
            {playback.paused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}
          </button>
        </div>
        <div className="tb-compose-line">
          <motion.img className="tb-avatar" key={nod} src={character.avatar} alt={`${character.name}老师`} animate={nod && !playback.paused && !reduceMotion ? { y: [0, 2, 0] } : { y: 0 }} transition={{ duration: .45, repeat: 0 }} />
          <div className="tb-compose">
            <div className="tb-input-row">
              <button className="tb-icon" aria-label={inputMode === 'voice' ? '切换打字' : '切换语音'} onClick={() => { pause(); setInputMode(inputMode === 'voice' ? 'text' : 'voice'); }}>{inputMode === 'voice' ? <Keyboard size={18} /> : <Mic size={18} />}</button>
              {inputMode === 'text' ? <><textarea aria-label="输入你的思路" value={current.draft} rows={1} placeholder={current.prompt ? "说说思路，也可以直接提问…" : "输入问题，打断讲解…"} onFocus={playback.pause} onChange={e => { playback.pause(); update({ draft: e.target.value }); }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); submit(current.draft); } }} /><button className="tb-send" aria-label="发送回答" disabled={!current.draft.trim()} onClick={() => submit(current.draft)}><Send size={18} /></button></> : <button className="tb-record" onClick={() => { if (speech.recording) speech.finish(); else if (speech.starting) speech.stop(); else { playback.pause(); speech.start(); } }}>{speech.recording ? <Square size={15} /> : <Mic size={16} />}{speech.starting ? '正在开启麦克风，点击取消' : speech.recording ? speech.transcript || '正在听，点击说完' : current.prompt ? '点击说话' : '打断提问'}</button>}
            </div>
          </div>
        </div>
        {(speech.error || speech.recording) && <div className="tb-input-status" role="status">{speech.error || '说完后自动发送，也可以点击结束'}</div>}
      </footer>
    </div>
    {imageIndex !== null && <TutorImageViewer question={question} imageIndex={imageIndex} onClose={closeImage} />}
  </motion.section>;
});
