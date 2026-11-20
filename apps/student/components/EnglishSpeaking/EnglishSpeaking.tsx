import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, AudioLines, Award, CheckCircle2, MessageCircle, Sparkles, CalendarDays, ChevronDown, Coffee, GraduationCap, Headphones, Lightbulb, Mic, Music2, Settings, Square, User, Languages, Eye, RefreshCw, X, History, ChevronLeft, Home, Users, Plane, Utensils, Leaf, Compass } from 'lucide-react';
import './englishSpeaking.css';
import { speakingScenes } from './speakingScenes';
import { SentenceAssessment } from './SentenceAssessment';
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

type Turn = { question: string; translation: string; answer: string; grammar: number; pronunciation: number; usedHint: boolean; answerZh?: string; textOnly?: boolean; hintAnswer?: string; hintTranslation?: string };
type Session = { topic: number; scene?: number; turns: Turn[] };

export function EnglishSpeaking({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<'topics' | 'chat' | 'report' | 'history'>('topics');
  const [session, setSession] = useState<Session>({ topic: 0, turns: [] });
  const [selectedTopic, setSelectedTopic] = useState(0);
  const tabDrag = useRef({ active: false, moved: false, x: 0, left: 0 });
  const themeTabs = useRef<HTMLDivElement>(null);
  const sceneList = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<Session[]>([]);
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
  const playbackVersion = useRef(0);
  const playbackStartTimer = useRef<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [translateStage, setTranslateStage] = useState<'closed' | 'ready' | 'recording' | 'result' | 'reading'>('closed');
  const [ended, setEnded] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<Session[]>([]);
  const chatViewport = useRef<HTMLDivElement>(null);
  const reportBody = useRef<HTMLDivElement>(null);
  const topic = topics[session.topic];
  const activeScene = speakingScenes[session.topic][session.scene ?? 0];
  const turns = session.turns;
  const [baseQuestion, baseTranslation, answer, answerTranslation] = activeScene.prompts[turns.length % activeScene.prompts.length];
  const question = questionLevel === '挑战' ? baseQuestion.replace(/\?$/, ' and why?') : questionLevel === '简单' ? baseQuestion.replace(/\busually\s/g, '').replace('What are your plans for', 'What will you do on') : baseQuestion;
  const translation = questionLevel === '挑战' ? baseTranslation + '为什么？' : questionLevel === '简单' ? baseTranslation.replace('通常', '') : baseTranslation;
  const replyWords = question.split(/\s+/);
  const replyBusy = replyPhase !== 'ready' && !ended;
  const hintReady = replyPhase === 'ready' && (!hearing || replyAudioDone);
  const spokenTurns = turns.filter(turn => !turn.textOnly);
  const words = spokenTurns.reduce((total, turn) => total + turn.answer.split(/\s+/).length, 0);
  const average = (key: 'grammar' | 'pronunciation') => {
    const evaluated = key === 'pronunciation' ? turns.filter(turn => !turn.textOnly) : turns;
    return evaluated.length ? Math.round(evaluated.reduce((total, turn) => total + turn[key], 0) / evaluated.length) : 0;
  };

  useEffect(() => {
    if (screen !== 'chat') return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [screen]);
  useEffect(() => {
    if (screen !== 'chat' || ended || replyBusy || recordedAt !== null || now - lastClick <= 180000) return;
    stopPlayback();
    if (session.turns.length) setHistory(items => [session, ...items]);
    setEnded(true);
    setLookup('');
    setTranslateStage('closed');
  }, [screen, ended, replyBusy, recordedAt, now, lastClick, session]);
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
    if (screen !== 'chat') return;
    const frame = window.requestAnimationFrame(() => {
      const viewport = chatViewport.current;
      viewport?.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [screen, turns.length, ended, showHint, hearing, hintReady, visibleWords, translated.includes('hint-current'), translated.includes('current')]);
  useEffect(() => { reportBody.current?.scrollTo(0, 0); }, [review, screen]);

  function stopPlayback() {
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
    stopPlayback();
    setVisibleWords(0);
    setReplyPhase('typing');
    setReplyAudioDone(false);
    setSelectedTopic(index);
    setSession({ topic: index, scene, turns: [] });
    setEnded(false); setPreviousSessions([]);
    setLastClick(Date.now());
    setRecordedAt(null);
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
    if (turns.length && !ended) setHistory(items => [session, ...items]);
    setRecordedAt(null);
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
  function send(textOnly = false) {
    if (replyBusy) return;
    stopPlayback();
    setVisibleWords(0);
    setReplyPhase('thinking');
    setReplyAudioDone(false);
    const activeTurns = ended ? [] : session.turns;
    if (ended) setPreviousSessions(items => [...items, session]);
    setSession({ topic: session.topic, scene: session.scene, turns: [...activeTurns, { question, translation, answer, grammar: 8 + activeTurns.length % 2, pronunciation: 86 + activeTurns.length % 5, usedHint, answerZh: answerTranslation, textOnly, hintAnswer: answer, hintTranslation: answerTranslation }] });
    setEnded(false);
    setRecordedAt(null);
    setTranslateStage('closed');
    setRevealed(false);
    setTranslated(previous => [
      ...previous.filter(key => key !== 'current' && key !== 'hint-current'),
      ...(previous.includes('current') ? ['ai-current-' + activeTurns.length] : []),
      ...(previous.includes('hint-current') ? ['hint-current-' + activeTurns.length] : []),
      'current', 'hint-current', 'user-current-' + activeTurns.length,
    ]);
    setLastClick(Date.now());
    setUsedHint(false);
    setQuestionLevel(level);
    setQuestionRate(rate);
  }
  function listen(value: string, speed = 1, key = value) {
    const playing = playingKey === key;
    return <button type="button" className={'es-icon es-audio-button' + (playing ? ' is-playing' : '')} aria-label={(playing ? '停止播放 ' : '回听 ') + value} aria-pressed={playing} onClick={() => play(value, speed, key)} disabled={recordedAt !== null || (key === 'audio-current' && replyBusy)}>
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
  function actions(key: string) {
    return <div className="es-message-actions">{translationButton(key, '消息')}</div>;
  }
  function assistant(text: string, zh: string, current = false, key = 'current') {
    const masked = current && hearing && !revealed;
    const streaming = current && replyPhase === 'typing' && !ended;
    const displayedText = streaming ? replyWords.slice(0, visibleWords).join(' ') : text;
    return <div className="es-ai"><img className="es-avatar" src={companionAvatar} alt="小晤" /><div className="es-ai-content"><div className="es-bubble">
      {masked ? <div className="es-listening"><Headphones size={27} /><span>{streaming ? '小晤正在组织回答' : '听听小晤说了什么'}</span><div className="es-message-actions"><button type="button" disabled={recordedAt !== null || replyBusy} onClick={() => play(text, questionRate, 'audio-current')}><RefreshCw size={16} />再听一遍</button><button type="button" onClick={() => setRevealed(true)}><Eye size={16} />查看原句</button></div></div> : <>
      <div className="es-spoken-line">{listen(text, current ? questionRate : 1, 'audio-' + key)}<strong lang="en" aria-busy={streaming}>{displayedText.split(' ').map((token, index) => {
        const word = token.toLowerCase().replace(/[^a-z]/g, '');
        const entry = current && !streaming && dictionary[word];
        return <React.Fragment key={index}>{index > 0 && ' '}{entry ? <span className="es-word"><button type="button" aria-expanded={lookup === word} onClick={() => setLookup(lookup === word ? '' : word)}>{token}</button>{lookup === word && <span className="es-wordcard"><b>{word}</b><small>{entry[0]}</small><span>{entry[1]}</span></span>}</span> : <span className={streaming ? 'es-generated-word' : undefined}>{token}</span>}</React.Fragment>;
      })}</strong></div>
      {translated.includes(key) && !streaming && <small className="es-translation">{zh}</small>}

      </>}
    </div>{!masked && !streaming && actions(key)}</div></div>;
  }
  function renderTurns(items: Turn[], prefix: string) {
    return <>{items.map((turn, index) => <React.Fragment key={prefix + index}>
            {assistant(turn.question, turn.translation, false, 'ai-' + prefix + index)}
            {showHint && turn.hintAnswer && <div className="es-inline-hint es-past-hint"><small className="es-hint-label">你可以这样说</small><div className="es-spoken-line">{listen(turn.hintAnswer, 1, 'audio-hint-' + prefix + index)}<strong lang="en">{turn.hintAnswer}</strong></div>{translated.includes('hint-' + prefix + index) && <small className="es-translation">{turn.hintTranslation}</small>}<div className="es-hint-actions">{translationButton('hint-' + prefix + index, '历史回答提示')}</div></div>}
            <div className="es-user"><div className="es-user-content"><div className="es-bubble">
              <div className="es-spoken-line">{listen(turn.answer, 1, 'audio-user-' + prefix + index)}<strong lang="en">{turn.answer}</strong></div>
              {translated.includes('user-' + prefix + index) && <small className="es-translation">{turn.answerZh}</small>}
            </div>
              <button type="button" className="es-assessment" aria-label="查看本句详细测评" aria-haspopup="dialog" onClick={() => { stopPlayback(); setAssessmentTurn(turn); }}><span>{turn.textOnly ? '文字消息' : '发音 ' + turn.pronunciation} · 语法 {turn.grammar}.0</span><ChevronLeft className="es-score-chevron" size={14} /></button>
            </div><img className="es-avatar" src={learnerAvatar} alt="我" /></div>
          </React.Fragment>)}</>;
  }
  const seconds = Math.max(0, Math.floor((now - (recordedAt ?? now)) / 1000));
  return <section className={screen === 'chat' ? 'es-shell es-conversation' : screen === 'topics' ? 'es-shell es-scene-selection' : 'es-shell'} aria-label="英语听说">
    <header className="es-header">
      <button type="button" className="es-link" onClick={() => { if (screen === 'topics') onClose(); else if (screen === 'chat') { stopPlayback(); setExitOpen(true); } else setScreen('topics'); }}><ChevronLeft size={19} />返回</button>
      <div className="es-brand">口语陪练</div>
      <div className="es-title">{screen === 'chat' ? <>{activeScene.title}</> : screen === 'report' ? '本次练习报告' : ''}</div>
      {screen === 'topics' && <button type="button" className="es-link es-records-button" aria-label="练习记录" title="练习记录" onClick={() => setScreen('history')}><History size={21} /></button>}

      {screen === 'chat' && <button type="button" className="es-link es-header-settings" aria-label="设置" title="设置" onClick={() => setSettingsOpen(true)}><Settings size={21} /></button>}
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
    </div>}    {screen === 'history' && <div className="es-report-body"><h1>练习记录</h1>{history.length ? history.map((item, index) => <button type="button" className="es-history-row" key={index} onClick={() => { setSession(item); setReview(false); setScreen('report'); }}>{topics[item.topic].title} · {speakingScenes[item.topic][item.scene ?? 0].title}<span>{item.turns.length} 轮 · 查看报告 <ArrowRight size={16} /></span></button>) : <p>还没有练习记录，选个主题开始吧。</p>}</div>}
    {screen === 'chat' && <>
      <div className="es-chat-layout">
        <div className="es-chat" aria-label="对话记录" ref={chatViewport}>
          {previousSessions.map((item, index) => <React.Fragment key={index}>{renderTurns(item.turns, 'past-' + index + '-')}<div className="es-session-divider">上一段对话已结束 · 以下为新对话</div></React.Fragment>)}
          {renderTurns(turns, 'current-')}
          {replyPhase === 'thinking' && !ended ? <div className="es-ai es-thinking" role="status"><img className="es-avatar" src={companionAvatar} alt="小晤" /><div className="es-bubble"><span>小晤正在思考</span><span className="es-thinking-dots" aria-hidden="true"><i /><i /><i /></span></div></div> : assistant(question, translation, true)}
          {showHint && hintReady && !ended && <div className="es-inline-hint">
            <small className="es-hint-label">你可以这样说</small>
            <div className="es-spoken-line">{listen(answer, 1, 'audio-hint-current')}<strong lang="en">{answer}</strong></div>
            {translated.includes('hint-current') && <small className="es-translation">{answerTranslation}</small>}
            <div className="es-hint-actions">{translationButton('hint-current', '回答提示')}</div>
          </div>}
          {ended && <div className="es-session-ended" role="status"><span>你太长时间没有跟学伴聊天啦，再次发送将开启新对话</span></div>}

        </div>
      </div>
      <footer className="es-chat-dock">
        {audioError && <div className="es-audio-error" role="status">{audioError}</div>}
        <div className="es-utility">
          <button type="button" aria-pressed={showHint} disabled={recordedAt !== null} onClick={() => { setShowHint(!showHint); setUsedHint(true); }}><Lightbulb size={21} />提示</button>
          <button type="button" aria-pressed={hearing} disabled={recordedAt !== null} onClick={() => { const next = !hearing; setHearing(next); setReplyAudioDone(false); setRevealed(false); setLookup(''); if (!next) stopPlayback();  }}><Headphones size={21} />听力</button>
          <button type="button" disabled={recordedAt !== null || replyBusy} onClick={() => { stopPlayback(); setTranslateStage('ready'); }}><Languages size={21} />中译英</button>
        </div>
        {recordedAt === null ? <button type="button" className="es-mic" onClick={record} disabled={replyBusy}><Mic size={24} />{replyBusy ? '小晤正在回应' : '点击说话'}</button> : <button type="button" className="es-mic" onClick={() => send()}><Square size={20} />结束并发送 · {seconds}s</button>}
      </footer>
      {assessmentTurn && <SentenceAssessment turn={assessmentTurn} onClose={() => { stopPlayback(); setAssessmentTurn(null); }} renderAudio={text => listen(text, 1, 'assessment-audio')} />}
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
      {translateStage !== 'closed' && <div className="es-overlay"><div className="es-dialog" role="dialog" aria-modal="true" aria-label="中译英"><div className="es-line"><h2>{translateStage === 'reading' ? '跟读这句话' : '中译英'}</h2><button type="button" aria-label="关闭中译英" onClick={() => { stopPlayback(); setTranslateStage('closed'); setRecordedAt(null); setLastClick(Date.now()); }}><X /></button></div>
        {(translateStage === 'ready' || translateStage === 'recording') ? <div className="es-translate-input"><p>说一句中文，小晤帮你译成英语</p><small>语音与翻译演示</small><button type="button" className="es-mic" onClick={() => { if (translateStage === 'ready') { record(); setTranslateStage('recording'); } else { setRecordedAt(null); setLastClick(Date.now()); setTranslateStage('result'); } }}><Mic />{translateStage === 'ready' ? '点击说中文' : '结束并翻译'}</button></div> : <>
          <p>{answerTranslation}</p><div className="es-translation-result"><strong lang="en">{answer}</strong>{listen(answer)}</div>
          {translateStage === 'result' ? <div className="es-dialog-actions"><button type="button" className="es-secondary" onClick={() => send(true)}>直接发送译文</button><button type="button" className="es-primary" onClick={() => { record(); setTranslateStage('reading'); }}>跟读这句话</button></div> : <><p>正在跟读 · {seconds}s</p><div className="es-dialog-actions"><button type="button" className="es-secondary" onClick={record}>重新录制</button><button type="button" className="es-primary" onClick={() => send()}>结束并发送录音</button></div></>}
          {translateStage === 'result' && <button type="button" className="es-link" onClick={() => setTranslateStage('ready')}>重新说中文</button>}
        </>}
      </div></div>}
    </>}    {screen === 'report' && <>
      <div className="es-report-body" ref={reportBody}>
        <div className="es-report-head"><div className="es-report-intro"><CheckCircle2 size={34} /><div><h1>{turns.length ? '今天，你勇敢开口了！' : '这次还没有完成回答'}</h1><p>{topic.title} · {activeScene.title} · 示例测评</p></div></div><div className="es-tabs">{['总览', '逐句复盘'].map((label, index) => <button type="button" key={label} aria-pressed={review === Boolean(index)} onClick={() => setReview(Boolean(index))}>{label}</button>)}</div></div>
        {!turns.length ? <div className="es-card">完成一轮对话后，这里会显示练习表现。</div> : review ? <>
          <div className="es-card"><h2>逐句测评</h2><table><thead><tr><th>轮次</th><th>我的表达</th><th>语法</th><th>发音</th><th>回听</th></tr></thead><tbody>{turns.map((turn, index) => <tr key={index}><td>{index + 1}</td><td lang="en">{turn.answer}{turn.usedHint && <small> · 使用过回答提示</small>}</td><td>{turn.grammar}/10</td><td>{turn.textOnly ? '—' : turn.pronunciation + '/100'}</td><td>{listen(turn.answer)}</td></tr>)}</tbody></table></div>
          <div className="es-card es-amber"><h2>下次只改这一处</h2>先说主要信息，再补一句原因，例如 “because …”。</div>
          <div className="es-card"><h2>下次热身词</h2><div className="es-warmup">{activeScene.words.map(word => <span key={word}>{word}{listen(word)}</span>)}</div></div>
        </> : <>
          <div className="es-card es-score"><div><span><Award size={18} /> 综合分</span><strong>{Math.round((average('grammar') * 10 + average('pronunciation')) / 2)}</strong><small>示例评分，仅供参考</small></div><div>{[['发音', average('pronunciation')], ['流利度', 85], ['语调', 78], ['语法词汇', average('grammar') * 10], ['内容逻辑', 87]].map(([label, score]) => <div className="es-meter" key={label}><span>{label}</span><progress max={100} value={Number(score)} /><span>{score}</span></div>)}</div></div>
          <div className="es-card es-stats"><span><MessageCircle size={23} /><b>{turns.length} 轮</b>对话</span><span><Mic size={23} /><b>{words} 词</b>累计开口</span><span><AudioLines size={23} /><b>{spokenTurns.length ? Math.round(words / spokenTurns.length) : 0} 词</b>平均句长</span></div>
          <div className="es-card es-green"><h2><Sparkles size={18} />聊得好的句子</h2><div className="es-line"><strong lang="en">{turns[0].answer}</strong>{listen(turns[0].answer)}</div><small>回答直接，意思清楚。</small></div>
          <div className="es-card es-amber"><h2><Lightbulb size={18} />可以这样说</h2>在原来的回答后补一句 “because it makes me happy.”，把原因说完整。</div>
        </>}
      </div>
      <footer className="es-footer"><button type="button" className="es-secondary" onClick={() => setScreen('topics')}>换个主题</button><button type="button" className="es-primary" onClick={() => selectTopic(session.topic, session.scene ?? 0)}>再聊一次</button></footer>
    </>}
  </section>;
}
