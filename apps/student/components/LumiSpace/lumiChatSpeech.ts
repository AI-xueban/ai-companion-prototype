const AUTO_VOICE_KEY = 'lumi-space-auto-voice';

export const loadAutoPlayVoice = (): boolean => {
  try {
    return localStorage.getItem(AUTO_VOICE_KEY) === '1';
  } catch {
    return false;
  }
};

export const saveAutoPlayVoice = (enabled: boolean) => {
  try {
    localStorage.setItem(AUTO_VOICE_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
};

let activeUtterance: SpeechSynthesisUtterance | null = null;

export const stopLumiSpeech = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  activeUtterance = null;
};

export const speakLumiText = (
  text: string,
  handlers?: { onStart?: () => void; onEnd?: () => void; onError?: () => void },
): boolean => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    handlers?.onError?.();
    return false;
  }

  stopLumiSpeech();

  const utterance = new SpeechSynthesisUtterance(text.replace(/\n+/g, '，'));
  utterance.lang = 'zh-CN';
  utterance.rate = 1;
  utterance.pitch = 1.05;
  utterance.onstart = () => handlers?.onStart?.();
  utterance.onend = () => {
    activeUtterance = null;
    handlers?.onEnd?.();
  };
  utterance.onerror = () => {
    activeUtterance = null;
    handlers?.onError?.();
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return true;
};

export const STREAM_CHAR_MS = 32;
