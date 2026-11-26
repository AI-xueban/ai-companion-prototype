import { speakingScenes } from './speakingScenes';

export type Turn = { question: string; translation: string; answer: string; grammar: number; pronunciation: number; usedHint: boolean; answerZh?: string; textOnly?: boolean; hintAnswer?: string; hintTranslation?: string };
export type Session = { id: string; topic: number; scene?: number; turns: Turn[] };

const STORAGE_KEY = 'ai_friend_english_speaking_history_v1';

export function createSpeakingSession(topic = 0, scene = 0): Session {
  return { id: crypto.randomUUID(), topic, scene, turns: [] };
}

export function loadSpeakingHistory(): Session[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter((item): item is Session => (
      item && typeof item.id === 'string' && Number.isInteger(item.topic)
      && speakingScenes[item.topic]?.[item.scene ?? 0]
      && Array.isArray(item.turns) && item.turns.length > 0
      && item.turns.every((turn: Turn) => turn && typeof turn.question === 'string'
        && typeof turn.translation === 'string' && typeof turn.answer === 'string'
        && Number.isFinite(turn.grammar) && turn.grammar >= 0 && turn.grammar <= 10
        && Number.isFinite(turn.pronunciation) && turn.pronunciation >= 0 && turn.pronunciation <= 100
        && typeof turn.usedHint === 'boolean'
        && (turn.textOnly === undefined || typeof turn.textOnly === 'boolean')
        && [turn.answerZh, turn.hintAnswer, turn.hintTranslation].every(text => text === undefined || typeof text === 'string'))
    ));
  } catch {
    return [];
  }
}

export function saveSpeakingHistory(sessions: Session[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return true;
  } catch {
    return false;
  }
}
