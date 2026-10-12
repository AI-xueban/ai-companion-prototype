import { useCallback, useEffect, useRef, useState } from 'react';

export const TUTOR_VOICE_KEY = 'ai_friend_tutor_auto_voice';

/** Text rendering never depends on speech progress. */
export function useTutorVoice(text: string, enabled: boolean, recording: boolean, revision = 0) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [replayCount, setReplayCount] = useState(0);
  const generation = useRef(0);
  const recordingRef = useRef(recording);
  recordingRef.current = recording;

  const stop = useCallback(() => {
    generation.current += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlaying(false);
  }, []);

  useEffect(() => {
    stop();
    setError('');
    if (!enabled || !text.trim() || recordingRef.current) return;
    if (!('speechSynthesis' in window)) {
      setError('当前浏览器不支持语音播报，请阅读文字');
      return;
    }
    const id = generation.current;
    // Keep each utterance short; some browsers truncate long utterances.
    const chunks = text.match(/[^。！？\n]+[。！？\n]?/g) ?? [text];
    let index = 0;
    const next = () => {
      if (generation.current !== id) return;
      if (index >= chunks.length) { setPlaying(false); return; }
      const utterance = new SpeechSynthesisUtterance(chunks[index++]);
      utterance.lang = 'zh-CN';
      utterance.onstart = () => { if (generation.current === id) setPlaying(true); };
      utterance.onend = next;
      utterance.onerror = () => {
        if (generation.current !== id) return;
        setPlaying(false);
        setError('语音未能播放，可关闭后重新开启播报');
      };
      window.speechSynthesis.speak(utterance);
    };
    next();
    return stop;
  }, [text, enabled, revision, replayCount, stop]);

  const replay = useCallback(() => setReplayCount(value => value + 1), []);
  return { playing, error, stop, replay };
}
