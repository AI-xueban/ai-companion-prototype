import { useCallback, useEffect, useRef, useState } from 'react';

export interface TeachingBeat {
  text: string;
  line?: string;
  expression?: string;
  result?: string;

  question?: boolean;
  enter?: () => void;
}
/** One queue drives speech and board. Interruptions invalidate every old callback. */
export function useTutorLessonPlayback(onBeat: (beat: TeachingBeat) => void) {
  const callback = useRef(onBeat); callback.current = onBeat;
  const queue = useRef<TeachingBeat[]>([]);
  const cursor = useRef(0);
  const done = useRef<(() => void) | undefined>(undefined);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState<TeachingBeat | null>(null);
  const [error, setError] = useState('');
  const [silent, setSilent] = useState(false);
  const silentRef = useRef(false);
  const [explanation, setExplanation] = useState('');
  const cancel = useCallback(() => {
    generation.current++; clearTimeout(timer.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlaying(false);
  }, []);
  const run = useCallback(() => {
    cancel(); setPaused(false); setError('');
    const id = generation.current;
    const next = () => {
      if (id !== generation.current) return;
      const beat = queue.current[cursor.current];
      if (!beat) { setPlaying(false); setActiveBeat(null); const complete = done.current; done.current = undefined; complete?.(); return; }
      const begin = () => {
        setActiveBeat(beat);
        callback.current(beat);
        setPlaying(true);
      };
      setExplanation(beat.text);
      const advance = () => { if (id !== generation.current) return; clearTimeout(timer.current); cursor.current++; next(); };
      const fail = () => { if (id !== generation.current) return; cancel(); setPaused(true); setError('语音未能播放，讲解已暂停。'); };
      if (silentRef.current) {
        begin();
        timer.current = setTimeout(advance, Math.max(650, Math.min(1800, beat.text.length * 35)));
        return;
      }
      if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') { fail(); return; }
      const utterance = new SpeechSynthesisUtterance(beat.text); utterance.lang = 'zh-CN';
      utterance.onstart = () => {
        if (id !== generation.current) return;
        clearTimeout(timer.current); begin();
        timer.current = setTimeout(fail, Math.max(15000, beat.text.length * 700));
      };
      utterance.onend = advance;
      utterance.onerror = fail;
      timer.current = setTimeout(fail, 3500);
      try { window.speechSynthesis.speak(utterance); } catch { fail(); }
    };
    next();
  }, [cancel]);
  const start = useCallback((beats: TeachingBeat[], complete?: () => void) => {
    setActiveBeat(null);
    queue.current = beats; cursor.current = 0; done.current = complete; run();
  }, [run]);
  const pause = useCallback(() => { cancel(); setPaused(true); }, [cancel]);
  const discard = useCallback(() => { cancel(); setActiveBeat(null); queue.current = []; cursor.current = 0; done.current = undefined; setError(''); }, [cancel]);
  const resume = useCallback(() => run(), [run]);
  const continueSilently = useCallback(() => { silentRef.current = true; setSilent(true); run(); }, [run]);
  useEffect(() => cancel, [cancel]);
  return { start, pause, discard, resume, continueSilently, paused, playing, activeBeat, error, silent, explanation };
}
