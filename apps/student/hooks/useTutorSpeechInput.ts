import { useCallback, useEffect, useRef, useState } from 'react';

/** Recognition ends with one submission; cancel never submits, including late callbacks. */
export function useTutorSpeechInput(onTranscript: (text: string) => void) {
  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const active = useRef<(SpeechRecognition & { onstart: (() => void) | null }) | null>(null);
  const generation = useRef(0);
  const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callback = useRef(onTranscript); callback.current = onTranscript;
  const stop = useCallback(() => {
    generation.current++; clearTimeout(deadline.current);
    const r = active.current; active.current = null;
    if (r) { r.onstart = null; r.onresult = null; r.onerror = null; r.onend = null; try { r.stop(); } catch { /* stopped */ } }
    setRecording(false); setStarting(false); setTranscript('');
  }, []);
  const finish = useCallback(() => { try { active.current?.stop(); } catch { stop(); } }, [stop]);
  const start = useCallback(() => {
    stop(); setError('');
    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) { setError('当前浏览器不支持语音输入，请切换打字。'); return; }
    const r = new Constructor() as SpeechRecognition & { onstart: (() => void) | null };
    active.current = r; const id = generation.current; let finalText = ''; let sent = false;
    r.lang = 'zh-CN'; r.interimResults = true; r.continuous = false;
    setStarting(true);
    deadline.current = setTimeout(() => { if (id === generation.current) { stop(); setError('麦克风没有启动，请检查权限或切换打字。'); } }, 10000);
    r.onstart = () => {
      if (id !== generation.current) return;
      setStarting(false); setRecording(true); clearTimeout(deadline.current);
      deadline.current = setTimeout(() => { if (id === generation.current) r.stop(); }, 60000);
    };
    r.onresult = event => {
      if (id !== generation.current) return;
      const results = Array.from(event.results);
      setTranscript(results.map(result => result[0]?.transcript || '').join(''));
      finalText = results.filter(result => result.isFinal).map(result => result[0]?.transcript || '').join('').trim();
    };
    r.onerror = () => { if (id === generation.current) { stop(); setError('没有识别成功，请重试或切换打字。'); } };
    r.onend = () => {
      if (id !== generation.current || sent) return;
      sent = true; stop();
      if (finalText) callback.current(finalText); else setError('没有听清完整内容，请重试或切换打字。');
    };
    try { r.start(); } catch { stop(); setError('麦克风暂时不可用，请切换打字。'); }
  }, [stop]);
  useEffect(() => stop, [stop]);
  return { recording, starting, transcript, error, start, finish, stop, clearError: () => setError('') };
}
