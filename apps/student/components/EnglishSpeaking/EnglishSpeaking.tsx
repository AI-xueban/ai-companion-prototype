import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, AudioLines, Award, CheckCircle2, MessageCircle, Sparkles, CalendarDays, ChevronDown, Coffee, GraduationCap, Headphones, Lightbulb, Mic, Music2, Settings, Square, User, Languages, Eye, RefreshCw, X, History, ChevronLeft, Home, Users, Plane, Utensils, Leaf, Compass } from 'lucide-react';
import './englishSpeaking.css';
import { speakingScenes } from './speakingScenes';
import { SPEAKING_ROUND_LIMIT } from './speakingFollowUps';
import { SentenceAssessment } from './SentenceAssessment';
import { createSpeakingSession, loadSpeakingHistory, saveSpeakingHistory, type Turn, type Session } from './speakingHistory';
import companionAvatar from '../../assets/ChangE-Avatar.jpg';
import learnerAvatar from '../../assets/girl_v0.1-head.png';

const topics = [
  { title: '校园生活', en: 'School life', icon: GraduationCap, color: '#dceaff' },
  { title: '兴趣爱好', en: 'Hobbies', icon: Music2, color: '#ffeecf' },
  { title: '周末计划', en: 'Weekend plans', icon: CalendarDays, color: '#e5dcff' },
  { title: '日常生活', en: 'Everyday life', icon: Coffee, color: '#ffe2e4' },
  { title: '家庭时光', en: 'Family time', icon: Home, color: '#ffeecf' },
  { title: '朋友相处', en: 'Friendship', icon: Users, color: '#dceaff' },
  { title: '旅行见闻', en: 'Travel', icon: Plane, color: '#e5dcff' },
  { title: '美食厨房', en: 'Food and cooking', icon: Utensils, color: '#ffe2e4' },
  { title: '自然世界', en: 'Nature', icon: Leaf, color: '#dcf5e9' },
  { title: '未来梦想', en: 'Dreams', icon: Compass, color: '#e5dcff' },
];
const dictionary: Record<string, [string, string]> = {
  usually: ['/ˈjuːʒuəli/', '通常'], practice: ['/ˈpræktɪs/', '练习'], favorite: ['/ˈfeɪvərɪt/', '最喜欢的'], weekend: ['/ˌwiːkˈend/', '周末'],
  plans: ['/plænz/', '计划'], drink: ['/drɪŋk/', '喝；饮品'], yesterday: ['/ˈjestərdeɪ/', '昨天'], school: ['/skuːl/', '学校'], eat: ['/iːt/', '吃'], hobby: ['/ˈhɑːbi/', '爱好'],
};

export function EnglishSpeaking({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<'topics' | 'chat' | 'report' | 'history'>('topics');
  const [session, setSession] = useState<Session>(createSpeakingSession);
  const [selectedTopic, setSelectedTopic] = useState(0);
  const tabDrag = useRef({ active: false, moved: false, x: 0, left: 0 });
  const themeTabs = useRef<HTMLDivElement>(null);
  const sceneList = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<Session[]>(loadSpeakingHistory);
  const [historyError, setHistoryError] = useState('');
  const [recordedAt, setRecordedAt] = useState<number | null>(null);
  const [lastClick, setLastClick] = useState(Date.now);
  const [now, setNow] = useState(Date.now);
  const [level, setLevel] = useState('标准');
  const [rate, setRate] = useState(1);
  const [questionLevel, setQuestionLevel] = useState('标准');
  const [questionRate, setQuestionRate] = useState(1);
  const [usedHint, setUsedHint] = useState(false);
  const [assessmentTurn, setAssessmentTurn] = useState<Turn | null>(null);
  const [lookup, setLookup] = useState('');
  const [review, setReview] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [hearing, setHearing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [translated, setTranslated] = useState<string[]>(['current', 'hint-current']);
  const [audioError, setAudioError] = useState('');
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [replyPhase, setReplyPhase] = useState<'thinking' | 'typing' | 'ready'>('ready');
  const [visibleWords, setVisibleWords] = useState(0);
  const [replyAudioDone, setReplyAudioDone] = useState(true);
  const [hintGenerated, setHintGenerated] = useState(false);
  const playbackVersion = useRef(0);
  const playbackStartTimer = useRef<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [translateStage, setTranslateStage] = useState<'closed' | 'ready' | 'recording' | 'result' | 'reading'>('closed');
  const [translationRecordedAt, setTranslationRecordedAt] = useState<number | null>(null);
  const [ended, setEnded] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<Session[]>([]);
  const chatViewport = useRef<HTMLDivElement>(null);
  const followChat = useRef(true);
  const lastScrollHeight = useRef(0);
  const reportBody = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const modalTrigger = useRef<HTMLButtonElement | null>(null);
  const assessmentTrigger = useRef<HTMLButtonElement | null>(null);
  const modalOpen = settingsOpen || exitOpen || translateStage !== 'closed' || assessmentTurn !== null;
  const recording = recordedAt !== null || translationRecordedAt !== null;
  const topic = topics[session.topic];
  const activeScene = speakingScenes[session.topic][session.scene ?? 0];
  const turns = session.turns;
  const promptIndex = ended ? 0 : Math.min(turns.length, SPEAKING_ROUND_LIMIT - 1);
  const [baseQuestion, baseTranslation, answer, answerTranslation] = activeScene.prompts[promptIndex];
  const question = questionLevel === '挑战' ? baseQuestion.replace(/\?$/, ' and why?') : questionLevel === '简单' ? baseQuestion.replace(/\busually\s/g, '').replace('What are your plans for', 'What will you do on') : baseQuestion;
  const translation = questionLevel === '挑战' ? baseTranslation + '为什么？' : questionLevel === '简单' ? baseTranslation.replace('通常', '') : baseTranslation;
  const replyWords = question.split(/\s+/);
  const replyBusy = replyPhase !== 'ready' && !ended;
  const hintReady = replyPhase === 'ready' && hintGenerated;
  const spokenTurns = turns.filter(turn => !turn.textOnly);
  const words = spokenTurns.reduce((total, turn) => total + turn.answer.split(/\s+/).length, 0);
  const average = (key: 'grammar' | 'pronunciation') => {
    const evaluated = key === 'pronunciation' ? turns.filter(turn => !turn.textOnly) : turns;
    return evaluated.length ? Math.round(evaluated.reduce((total, turn) => total + turn[key], 0) / evaluated.length) : 0;
  };
  const reportMeasures: [string, number | null][] = [
    ['发音', spokenTurns.length ? average('pronunciation') : null],
    ['流利度', spokenTurns.length ? 85 : null],
    ['语调', spokenTurns.length ? 78 : null],
    ['语法词汇', average('grammar') * 10], ['内容逻辑', 87],
  ];

  useEffect(() => {
    setHistoryError(saveSpeakingHistory(history) ? '' : '练习记录暂时无法保存，退出页面后可能丢失');
  }, [history]);
  useEffect(() => {
    if (screen === 'chat' && replyPhase === 'ready' && (!hearing || replyAudioDone)) setHintGenerated(true);
  }, [screen, replyPhase, hearing, replyAudioDone]);
  useEffect(() => {
    if (screen !== 'chat') return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [screen]);
  useEffect(() => {
    if (screen !== 'chat' || ended || replyBusy || recording || modalOpen || now - lastClick <= 180000) return;
    stopPlayback();
    archiveSession();
    setEnded(true);
    setLookup('');
    setTranslateStage('closed');
  }, [screen, ended, replyBusy, recording, modalOpen, now, lastClick, session]);
  useEffect(() => {
    if (screen !== 'chat' || ended || replyPhase !== 'thinking') return;
    const timer = window.setTimeout(() => setReplyPhase('typing'), 1100);
    return () => window.clearTimeout(timer);
  }, [screen, ended, replyPhase]);
  useEffect(() => {
    if (screen !== 'chat' || ended || replyPhase !== 'typing') return;
    if (visibleWords >= replyWords.length) {
      setReplyPhase('ready');
      return;
    }
    const previousWord = replyWords[visibleWords - 1] ?? '';
    const delay = /[.!?]$/.test(previousWord) ? 300 : /[,;:]$/.test(previousWord) ? 210 : 130;
    const timer = window.setTimeout(() => setVisibleWords(count => count + 1), delay / questionRate);
    return () => window.clearTimeout(timer);
  }, [screen, ended, replyPhase, visibleWords, question, questionRate]);
  useEffect(() => () => { playbackVersion.current += 1; if (playbackStartTimer.current !== null) window.clearTimeout(playbackStartTimer.current); window.speechSynthesis?.cancel(); }, []);
  useEffect(() => {
    if (screen === 'chat' && hearing && !ended && replyPhase === 'ready') play(question, questionRate, 'audio-current');
  }, [screen, hearing, turns.length, ended, replyPhase]);
  useEffect(() => {
    if (screen !== 'chat' || !followChat.current) return;
    const frame = window.requestAnimationFrame(() => {
      const viewport = chatViewport.current;
      if (viewport && viewport.scrollHeight !== lastScrollHeight.current) {
        lastScrollHeight.current = viewport.scrollHeight;
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [screen, turns.length, ended, showHint, hearing, hintReady, visibleWords, translated.includes('hint-current'), translated.includes('current')]);
  useEffect(() => {
    if (screen === 'chat' && showHint && hintReady && !ended) setUsedHint(true);
  }, [screen, showHint, hintReady, ended, turns.length]);
  useEffect(() => { reportBody.current?.scrollTo(0, 0); }, [review, screen]);
  useEffect(() => {
    if (!modalOpen || assessmentTurn) return;
    const previousFocus = modalTrigger.current;
    const dialog = root.current?.querySelector<HTMLElement>('[role="dialog"]');
    (dialog?.querySelector<HTMLElement>(exitOpen ? '.es-secondary' : 'button:not(:disabled)'))?.focus();
    return () => { window.requestAnimationFrame(() => { if (previousFocus?.isConnected && !previousFocus.closest('[inert]')) previousFocus.focus(); }); };
  }, [modalOpen, assessmentTurn]);

  function archiveSession(candidate = session) {
    if (candidate.turns.length) setHistory(items => [candidate, ...items.filter(item => item.id !== candidate.id)]);
  }
  function openAssessment(turn: Turn, trigger: HTMLButtonElement) {
    assessmentTrigger.current = trigger;
    stopPlayback();
    setAssessmentTurn(turn);
  }
  function closeTranslation() {
    stopPlayback();
    setTranslateStage('closed');
    setTranslationRecordedAt(null);
    setLastClick(Date.now());
  }
  function modalKeys(event: React.KeyboardEvent) {
    if (!modalOpen || assessmentTurn) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (translateStage !== 'closed') closeTranslation();
      else { stopPlayback(); setSettingsOpen(false); setExitOpen(false); }
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(root.current?.querySelectorAll<HTMLElement>('[role="dialog"] button:not(:disabled), [role="dialog"] select') ?? []);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  function stopPlayback() {
    setAudioError('');
    if (playbackStartTimer.current !== null) window.clearTimeout(playbackStartTimer.current);
    playbackStartTimer.current = null;
    playbackVersion.current += 1;
    window.speechSynthesis?.cancel();
    setPlayingKey(null);
    setReplyAudioDone(true);
  }
  function play(value: string, speed = 1, key = value) {
    setAudioError('');
    const wasPlaying = playingKey === key;
    stopPlayback();
    if (wasPlaying) return;
    if (!window.speechSynthesis) {
      setAudioError('当前浏览器暂不支持语音播放');
      return;
    }
    if (key === 'audio-current') setReplyAudioDone(false);
    setPlayingKey(key);
    const version = playbackVersion.current;
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = 'en-US';
    utterance.rate = speed;
    utterance.onstart = () => {
      if (playbackVersion.current !== version) return;
      if (playbackStartTimer.current !== null) window.clearTimeout(playbackStartTimer.current);
      playbackStartTimer.current = null;
      if (playbackVersion.current === version) setPlayingKey(key);
    };
    const complete = () => {
      if (playbackVersion.current !== version) return;
      if (playbackStartTimer.current !== null) window.clearTimeout(playbackStartTimer.current);
      playbackStartTimer.current = null;
      if (playbackVersion.current === version) setPlayingKey(null);
      if (key === 'audio-current') setReplyAudioDone(true);
    };
    utterance.onend = complete;
    utterance.onerror = () => {
      if (playbackVersion.current !== version) return;
      complete();
      setAudioError('语音暂时无法播放，请重试');
    };
    playbackStartTimer.current = window.setTimeout(() => {
      if (playbackVersion.current !== version) return;
      stopPlayback();
      setAudioError('语音暂时无法播放，请重试');
    }, 5000);
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      stopPlayback();
      setAudioError('语音暂时无法播放，请重试');
    }
  }
  function selectTopic(index: number, scene = 0) {
    followChat.current = true;
    lastScrollHeight.current = 0;
    stopPlayback();
    setVisibleWords(0);
    setReplyPhase('typing');
    setReplyAudioDone(false);
    setHintGenerated(false);
    setSelectedTopic(index);
    setSession(createSpeakingSession(index, scene));
    setEnded(false); setPreviousSessions([]);
    setLastClick(Date.now());
    setRecordedAt(null);
    setTranslationRecordedAt(null);
    setQuestionLevel(level);
    setQuestionRate(rate);
    setUsedHint(false);
    setLookup('');
    setAssessmentTurn(null);
    setHearing(false);
    setRevealed(false);
    setTranslated(['current', 'hint-current']);
    setAudioError('');
    setSettingsOpen(false);
    setExitOpen(false);
    setTranslateStage('closed');
    setScreen('chat');
  }
  function finish(next: 'report' | 'topics') {
    setExitOpen(false);
    stopPlayback();
    if (!ended) archiveSession();
    setRecordedAt(null);
    setTranslationRecordedAt(null);
    setReview(false);
    setScreen(next);
  }
  function record() {
    if (replyBusy) return;
    stopPlayback();
    const start = Date.now();
    setLastClick(start);
    setNow(start);
    setRecordedAt(start);
    setLookup('');
  }
  function recordTranslation(stage: 'recording' | 'reading') {
    stopPlayback();
    const start = Date.now();
    setLastClick(start);
    setNow(start);
    setTranslationRecordedAt(start);
    setTranslateStage(stage);
  }
  function send(textOnly = false) {
    if (replyBusy) return;
    const activeTurns = ended ? [] : session.turns;
    if (activeTurns.length >= SPEAKING_ROUND_LIMIT) return;
    followChat.current = true;
    lastScrollHeight.current = 0;
    stopPlayback();
    setVisibleWords(0);
    setReplyPhase('thinking');
    setReplyAudioDone(false);
    setHintGenerated(false);
    const nextSession = ended ? createSpeakingSession(session.topic, session.scene) : session;
    if (ended) setPreviousSessions(items => [...items, session]);
    const completedSession: Session = { ...nextSession, turns: [...activeTurns, { question, translation, answer, grammar: 8 + activeTurns.length % 2, pronunciation: 86 + activeTurns.length % 5, usedHint, answerZh: answerTranslation, textOnly, hintAnswer: usedHint ? answer : undefined, hintTranslation: usedHint ? answerTranslation : undefined }] };
    setSession(completedSession);
    setEnded(false);
    setRecordedAt(null);
    setTranslationRecordedAt(null);
    setTranslateStage('closed');
    setRevealed(false);
    setTranslated(previous => [
      ...previous.filter(key => key !== 'current' && key !== 'hint-current'),
      ...(previous.includes('current') ? ['ai-' + nextSession.id + '-' + activeTurns.length] : []),
      ...(previous.includes('hint-current') ? ['hint-' + nextSession.id + '-' + activeTurns.length] : []),
      'current', 'hint-current', 'user-' + nextSession.id + '-' + activeTurns.length,
    ]);
    setLastClick(Date.now());
    setUsedHint(false);
    setQuestionLevel(level);
    setQuestionRate(rate);
    if (completedSession.turns.length === SPEAKING_ROUND_LIMIT) {
      archiveSession(completedSession);
      setEnded(true);
      setReplyPhase('ready');
      setReview(false);
      setScreen('report');
    }
  }
  function listen(value: string, speed = 1, key = value) {
    const playing = playingKey === key;
    return <button type="button" className={'es-icon es-audio-button' + (playing ? ' is-playing' : '')} aria-label={(playing ? '停止播放 ' : '朗读 ') + value} aria-pressed={playing} onClick={() => play(value, speed, key)} disabled={recording || (key === 'audio-current' && replyBusy)}>
      <span className="es-audio-glyph" aria-hidden="true"><i /><i /><i /><i /><i /></span>
    </button>;
  }
  function toggleTranslation(key: string) {
    setTranslated(items => items.includes(key) ? items.filter(item => item !== key) : [...items, key]);
  }
  function translationButton(key: string, label: string) {
    const enabled = translated.includes(key);
    const action = enabled ? '关闭翻译' : '开启翻译';
    return <button type="button" className="es-translation-toggle" aria-label={action + label} title={action} aria-pressed={enabled} onClick={() => toggleTranslation(key)}>
      <Languages size={16} />

    </button>;
  }
  function actions(key: string, label = '小晤消息', zh?: string) {
    return <div className="es-message-actions es-message-footer">{translationButton(key, label)}{translated.includes(key) && zh && <small className="es-translation">{zh}</small>}</div>;
  }
  function assistant(text: string, zh: string, current = false, key = 'current') {
    const masked = current && hearing && !revealed;
    const streaming = current && replyPhase === 'typing' && !ended;
    const displayedText = streaming ? replyWords.slice(0, visibleWords).join(' ') : text;
    return <div className="es-ai"><img className="es-avatar" src={companionAvatar} alt="小晤" /><div className="es-ai-content"><div className="es-bubble">
      {masked ? <div className="es-listening"><Headphones size={27} /><span>{streaming ? '小晤正在组织回答' : '听听小晤说了什么'}</span><div className="es-message-actions"><button type="button" className={playingKey === 'audio-current' ? 'is-playing' : undefined} aria-pressed={playingKey === 'audio-current'} disabled={recording || replyBusy} onClick={() => play(text, questionRate, 'audio-current')}><RefreshCw className="es-replay-icon" size={16} />{playingKey === 'audio-current' ? '停止播放' : '再听一遍'}</button><button type="button" onClick={() => setRevealed(true)}><Eye size={16} />查看原句</button></div></div> : <>
      <div className="es-spoken-line">{listen(text, current ? questionRate : 1, 'audio-' + key)}<strong lang="en" aria-busy={streaming}>{displayedText.split(' ').map((token, index) => {
        const word = token.toLowerCase().replace(/[^a-z]/g, '');
        const entry = current && !streaming && dictionary[word];
        return <React.Fragment key={index}>{index > 0 && ' '}{entry ? <span className="es-word"><button type="button" aria-expanded={lookup === word} onClick={() => setLookup(lookup === word ? '' : word)}>{token}</button>{lookup === word && <span className="es-wordcard"><b>{word}</b><small>{entry[0]}</small><span>{entry[1]}</span></span>}</span> : <span className={streaming ? 'es-generated-word' : undefined}>{token}</span>}</React.Fragment>;
      })}</strong></div>
      </>}
    {!masked && !streaming && actions(key, '小晤消息', zh)}</div></div></div>;
  }
  function renderTurns(items: Turn[], prefix: string) {
    return <>{items.map((turn, index) => <React.Fragment key={prefix + index}>
            {assistant(turn.question, turn.translation, false, 'ai-' + prefix + index)}
            {turn.hintAnswer && <div className="es-inline-hint es-past-hint"><small className="es-hint-label">你可以这样说</small><div className="es-spoken-line">{listen(turn.hintAnswer, 1, 'audio-hint-' + prefix + index)}<strong lang="en">{turn.hintAnswer}</strong></div>{actions('hint-' + prefix + index, '历史回答提示', turn.hintTranslation)}</div>}
            <div className="es-user"><div className="es-user-content"><div className="es-bubble">
              <div className="es-spoken-line">{listen(turn.answer, 1, 'audio-user-' + prefix + index)}<strong lang="en">{turn.answer}</strong></div>
              {turn.answerZh && actions('user-' + prefix + index, '我的消息', turn.answerZh)}
            </div>
              <button type="button" className="es-assessment" disabled={recording} aria-label="查看本句详细测评" aria-haspopup="dialog" onClick={event => openAssessment(turn, event.currentTarget)}><span>{turn.textOnly ? '文字消息' : '发音 ' + turn.pronunciation} · 语法 {turn.grammar}.0</span><ChevronLeft className="es-score-chevron" size={14} /></button>
            </div><img className="es-avatar" src={learnerAvatar} alt="我" /></div>
          </React.Fragment>)}</>;
  }
  const seconds = Math.max(0, Math.floor((now - (recordedAt ?? now)) / 1000));
  const translationSeconds = Math.max(0, Math.floor((now - (translationRecordedAt ?? now)) / 1000));
  return <section ref={root} onKeyDown={modalKeys} className={screen === 'chat' ? 'es-shell es-conversation' : screen === 'topics' ? 'es-shell es-scene-selection' : 'es-shell'} aria-label="英语听说">
    <header className="es-header" inert={modalOpen}>
      <button type="button" className="es-link" onClick={event => { stopPlayback(); if (screen === 'topics') onClose(); else if (screen === 'chat') { modalTrigger.current = event.currentTarget; setExitOpen(true); } else setScreen('topics'); }}><ChevronLeft size={19} />返回</button>
      <div className="es-brand">口语陪练</div>
      <div className="es-title">{screen === 'chat' ? <>{activeScene.title}<span className="es-round-progress">第 {promptIndex + 1}/{SPEAKING_ROUND_LIMIT} 轮</span></> : screen === 'report' ? '本次练习报告' : ''}</div>
      {screen === 'topics' && <button type="button" className="es-link es-records-button" aria-label="练习记录" title="练习记录" onClick={() => setScreen('history')}><History size={21} /></button>}

      {screen === 'chat' && <button type="button" className="es-link es-header-settings" disabled={recording} aria-label="设置" title="设置" onClick={event => { modalTrigger.current = event.currentTarget; stopPlayback(); setSettingsOpen(true); }}><Settings size={21} /></button>}
    </header>
    {screen === 'topics' && <div className="es-topic-browser">
      <div className="es-scene-toolbar"><div className="es-theme-nav">
      <div className="es-theme-tabs" ref={themeTabs}
        onPointerDown={event => {
          tabDrag.current.active = false;
          tabDrag.current.moved = false;
          if (event.pointerType !== 'mouse' || event.button !== 0) return;
          tabDrag.current = { active: true, moved: false, x: event.clientX, left: event.currentTarget.scrollLeft };
        }}
        onPointerMove={event => {
          const drag = tabDrag.current;
          if (!drag.active) return;
          const offset = event.clientX - drag.x;
          if (!drag.moved && Math.abs(offset) > 6) {
            drag.moved = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          if (drag.moved) event.currentTarget.scrollLeft = drag.left - offset;
        }}
        onPointerUp={() => { tabDrag.current.active = false; }}
        onPointerCancel={() => { tabDrag.current.active = false; }}
        onLostPointerCapture={() => { tabDrag.current.active = false; }}
        onClickCapture={event => { if (tabDrag.current.moved) { event.preventDefault(); event.stopPropagation(); } }}
        role="tablist" aria-label="练习主题">{topics.map((item, index) => <button type="button" role="tab" id={'es-theme-' + index} aria-selected={selectedTopic === index} aria-controls="es-scene-list" key={item.en} onClick={() => { setSelectedTopic(index); sceneList.current?.scrollTo(0, 0); }}><item.icon size={16} />{item.title}</button>)}</div></div></div>
      <div className="es-scene-list" ref={sceneList} id="es-scene-list" role="tabpanel" aria-labelledby={'es-theme-' + selectedTopic}>
        <div className="es-scene-grid">{speakingScenes[selectedTopic].map((item, index) => <button type="button" className="es-scene-card" key={item.en} onClick={() => selectTopic(selectedTopic, index)}>
          <span className={'es-art es-art-' + selectedTopic % 4} style={{ backgroundColor: topics[selectedTopic].color }} />
          <strong>{item.title}</strong><span className="es-scene-en">{item.en}</span><span className="es-scene-description">{item.description}</span>
        </button>)}</div>
        <p className="es-note">原型演示 · 使用示例对话和测评</p>
      </div>
    </div>}    {screen === 'history' && <div className="es-report-body"><h1>练习记录</h1>{historyError && <p role="status">{historyError}</p>}{history.length ? history.map(item => <button type="button" className="es-history-row" key={item.id} onClick={() => { setSession(item); setReview(false); setScreen('report'); }}>{topics[item.topic].title} · {speakingScenes[item.topic][item.scene ?? 0].title}<span>{item.turns.length} 轮 · 查看报告 <ArrowRight size={16} /></span></button>) : <p>还没有练习记录，选个主题开始吧。</p>}</div>}
    {screen === 'chat' && <>
      <div className="es-chat-layout" inert={modalOpen}>
        <div className="es-chat" aria-label="对话记录" tabIndex={0} ref={chatViewport}
          onWheel={event => { if (event.deltaY < 0) followChat.current = false; }}
          onTouchMove={() => { followChat.current = false; }}
          onPointerDown={() => { followChat.current = false; }}
          onKeyDown={event => { if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) followChat.current = false; }}
          onScroll={event => { const viewport = event.currentTarget; if (viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 24) followChat.current = true; }}>
          {previousSessions.map(item => <React.Fragment key={item.id}>{renderTurns(item.turns, item.id + '-')}<div className="es-session-divider">上一段对话已结束 · 以下为新对话</div></React.Fragment>)}
          {renderTurns(turns, session.id + '-')}
          {replyPhase === 'thinking' && !ended ? <div className="es-ai es-thinking" role="status"><img className="es-avatar" src={companionAvatar} alt="小晤" /><div className="es-bubble"><span>小晤正在思考</span><span className="es-thinking-dots" aria-hidden="true"><i /><i /><i /></span></div></div> : assistant(question, translation, true)}
          {showHint && hintReady && !ended && <div className="es-inline-hint">
            <small className="es-hint-label">你可以这样说</small>
            <div className="es-spoken-line">{listen(answer, 1, 'audio-hint-current')}<strong lang="en">{answer}</strong></div>
            {actions('hint-current', '回答提示', answerTranslation)}
          </div>}
          {ended && <div className="es-session-ended" role="status"><span>你太长时间没有跟学伴聊天啦，再次发送将开启新对话</span></div>}

        </div>
      </div>
      <footer className="es-chat-dock" inert={modalOpen}>
        {audioError && <div className="es-audio-error" role="status">{audioError}</div>}
        <div className="es-utility">
          <button type="button" aria-pressed={showHint} disabled={recordedAt !== null} onClick={() => { if (!showHint) { followChat.current = true; lastScrollHeight.current = 0; } setShowHint(!showHint); }}><Lightbulb size={21} />提示</button>
          <button type="button" aria-pressed={hearing} disabled={recordedAt !== null} onClick={() => { const next = !hearing; setHearing(next); setReplyAudioDone(false); setRevealed(false); setLookup(''); if (!next) stopPlayback();  }}><Headphones size={21} />听力</button>
          <button type="button" disabled={recordedAt !== null || replyBusy} onClick={event => { modalTrigger.current = event.currentTarget; stopPlayback(); setTranslateStage('ready'); }}><Languages size={21} />中译英</button>
        </div>
        {recordedAt === null ? <button type="button" className="es-mic" onClick={record} disabled={replyBusy}><Mic size={24} />{replyBusy ? '小晤正在回应' : '点击说话'}</button> : <button type="button" className="es-mic" onClick={() => send()}><Square size={20} />结束并发送 · {seconds}s</button>}
      </footer>
      {exitOpen && <div className="es-overlay" onClick={() => setExitOpen(false)}>
        <div className="es-dialog es-exit-dialog" role="dialog" aria-modal="true" aria-labelledby="es-exit-title" onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') setExitOpen(false); }}>
          <h2 id="es-exit-title">要结束这次对话吗？</h2>
          <div className="es-exit-actions">
            <button type="button" className="es-primary" onClick={() => finish('report')}>查看报告</button>
            <button type="button" className="es-secondary" autoFocus onClick={() => setExitOpen(false)}>继续对话</button>
            <button type="button" className="es-exit-direct" onClick={() => finish('topics')}>直接结束</button>
          </div>
        </div>
      </div>}
      {settingsOpen && <div className="es-overlay" onClick={() => setSettingsOpen(false)}><div className="es-dialog es-settings" role="dialog" aria-modal="true" aria-label="AI陪练设置" onClick={event => event.stopPropagation()}><div className="es-line"><h2>AI 陪练设置</h2><button type="button" aria-label="关闭设置" onClick={() => setSettingsOpen(false)}><X /></button></div><label>AI 表达难度<select value={level} onChange={event => setLevel(event.target.value)}>{['简单', '标准', '挑战'].map(item => <option key={item}>{item}</option>)}</select></label><label>AI 语速<select value={rate} onChange={event => setRate(Number(event.target.value))}>{[0.8, 1, 1.2].map(item => <option key={item} value={item}>{item.toFixed(1)}×</option>)}</select></label><small>从小晤的下一句话生效</small></div></div>}
      {translateStage !== 'closed' && <div className="es-overlay"><div className="es-dialog" role="dialog" aria-modal="true" aria-label="中译英"><div className="es-line"><h2>{translateStage === 'reading' ? '跟读这句话' : '中译英'}</h2><button type="button" aria-label="关闭中译英" onClick={closeTranslation}><X /></button></div>
        {(translateStage === 'ready' || translateStage === 'recording') ? <div className="es-translate-input"><p>说一句中文，小晤帮你译成英语</p><small>语音与翻译演示</small><button type="button" className="es-mic" onClick={() => { if (translateStage === 'ready') { recordTranslation('recording'); } else { setTranslationRecordedAt(null); setLastClick(Date.now()); setTranslateStage('result'); } }}><Mic />{translateStage === 'ready' ? '点击说中文' : '结束并翻译'}</button></div> : <>
          <p>{answerTranslation}</p><div className="es-translation-result"><strong lang="en">{answer}</strong>{listen(answer)}</div>
          {translateStage === 'result' ? <div className="es-dialog-actions"><button type="button" className="es-secondary" onClick={() => send(true)}>直接发送译文</button><button type="button" className="es-primary" onClick={() => recordTranslation('reading')}>跟读这句话</button></div> : <><p>正在跟读 · {translationSeconds}s</p><div className="es-dialog-actions"><button type="button" className="es-secondary" onClick={() => recordTranslation('reading')}>重新录制</button><button type="button" className="es-primary" onClick={() => send()}>结束并发送录音</button></div></>}
          {translateStage === 'result' && <button type="button" className="es-link" onClick={() => { stopPlayback(); setTranslateStage('ready'); }}>重新说中文</button>}
        </>}
        {audioError && <p className="es-audio-error" role="status">{audioError}</p>}
      </div></div>}
    </>}    {screen === 'report' && <>
      <div className="es-report-body" ref={reportBody} inert={modalOpen}>
        <div className="es-report-head"><div className="es-report-intro"><CheckCircle2 size={34} /><div><h1>{spokenTurns.length ? '今天，你勇敢开口了！' : turns.length ? '这次完成了文字对话' : '这次还没有完成回答'}</h1><p>{topic.title} · {activeScene.title} · 示例测评</p></div></div><div className="es-tabs">{['总览', '逐句复盘'].map((label, index) => <button type="button" key={label} aria-pressed={review === Boolean(index)} onClick={() => setReview(Boolean(index))}>{label}</button>)}</div></div>
        {!turns.length ? <div className="es-card">完成一轮对话后，这里会显示练习表现。</div> : review ? <>
          <div className="es-card"><h2>逐句测评</h2><table><thead><tr><th>轮次</th><th>我的表达</th><th>语法</th><th>发音</th><th>朗读</th></tr></thead><tbody>{turns.map((turn, index) => <tr key={index}><td>{index + 1}</td><td lang="en">{turn.answer}{turn.usedHint && <small> · 使用过回答提示</small>}</td><td><button type="button" className="es-review-score" aria-label={'查看第' + (index + 1) + '句语法测评'} onClick={event => openAssessment(turn, event.currentTarget)}>{turn.grammar}/10</button></td><td>{turn.textOnly ? '—' : <button type="button" className="es-review-score" aria-label={'查看第' + (index + 1) + '句发音测评'} onClick={event => openAssessment(turn, event.currentTarget)}>{turn.pronunciation}/100</button>}</td><td>{listen(turn.answer)}</td></tr>)}</tbody></table></div>
          <div className="es-card es-amber"><h2>下次只改这一处</h2>先说主要信息，再补一句原因，例如 “because …”。</div>
          <div className="es-card"><h2>下次热身词</h2><div className="es-warmup">{activeScene.words.map(word => <span key={word}>{word}{listen(word)}</span>)}</div></div>
        </> : <>
          <div className="es-card es-score"><div><span><Award size={18} /> 综合分</span><strong>{spokenTurns.length ? Math.round((average('grammar') * 10 + average('pronunciation')) / 2) : '—'}</strong><small>{spokenTurns.length ? '示例评分，仅供参考' : '无录音，暂无口语综合分'}</small></div><div>{reportMeasures.map(([label, score]) => <div className="es-meter" key={label}><span>{label}</span>{score === null ? <span className="es-meter-empty" /> : <progress max={100} value={score} />}<span>{score ?? '—'}</span></div>)}</div></div>
          <div className="es-card es-stats"><span><MessageCircle size={23} /><b>{turns.length} 轮</b>对话</span><span><Mic size={23} /><b>{words} 词</b>累计开口</span><span><AudioLines size={23} /><b>{spokenTurns.length ? Math.round(words / spokenTurns.length) : 0} 词</b>平均句长</span></div>
          <div className="es-card es-green"><h2><Sparkles size={18} />聊得好的句子</h2><div className="es-line"><strong lang="en">{turns[0].answer}</strong>{listen(turns[0].answer)}</div><small>回答直接，意思清楚。</small></div>
          <div className="es-card es-amber"><h2><Lightbulb size={18} />可以这样说</h2>在原来的回答后补一句 “because it makes me happy.”，把原因说完整。</div>
        </>}
      </div>
      <footer className="es-footer" inert={modalOpen}><button type="button" className="es-secondary" onClick={() => { stopPlayback(); setScreen('topics'); }}>换个主题</button><button type="button" className="es-primary" onClick={() => selectTopic(session.topic, session.scene ?? 0)}>再聊一次</button></footer>
    </>}
    {assessmentTurn && <SentenceAssessment turn={assessmentTurn} returnFocusTo={assessmentTrigger.current} audioError={audioError} onClose={() => { stopPlayback(); setAssessmentTurn(null); }} renderAudio={text => listen(text, 1, 'assessment-audio')} />}
  </section>;
}
