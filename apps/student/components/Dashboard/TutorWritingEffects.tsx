import React from 'react';
import { motion } from 'framer-motion';
import { TutorCharacterId } from '../../data/tutorCharacterThemes';
import { TutorBoardPen } from './TutorBoardPen';

export interface WritingCharProps {
  char: string;
  fresh?: boolean;
}

/** 1对1填数行：纯文本逐字，避免 motion 导致写完后字符消失 */
export const WritingChar: React.FC<WritingCharProps> = ({ char }) => {
  if (char === '\n') {
    return <span>{'\n'}</span>;
  }

  const display = char === ' ' ? '\u00A0' : char;
  return <span className="inline">{display}</span>;
};

export interface WritingCursorProps {
  characterId: TutorCharacterId;
  penClassName: string;
  strokeKey: number;
  active: boolean;
  /** 标题行用笔略大一点，更易看见 */
  prominent?: boolean;
}

/** 不占行高的笔光标：绝对定位 + 缩小，避免 44px 笔图标撑大行距 */
export const WritingCursor: React.FC<WritingCursorProps> = ({
  characterId,
  penClassName,
  strokeKey,
  active,
  prominent = false,
}) => {
  if (!active) return null;

  const scale = prominent ? 0.3 : 0.26;

  return (
    <span
      className="inline-block w-0 h-[1em] overflow-visible align-baseline relative"
      aria-hidden
    >
      <motion.span
        key={strokeKey}
        className="absolute left-0 bottom-0 pointer-events-none"
        style={{ transform: `scale(${scale})`, transformOrigin: 'bottom left' }}
        initial={{ y: -2, opacity: 0.9 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.08, ease: 'easeOut' }}
      >
        <TutorBoardPen
          characterId={characterId}
          writing
          className={penClassName}
          strokeKey={strokeKey}
        />
      </motion.span>
    </span>
  );
};

export function renderWritingText(
  visible: string,
  keyPrefix: string,
  _options: { isActiveLine: boolean; isWriting: boolean },
) {
  const chars = visible.split('');
  return chars.map((char, i) => (
    <WritingChar key={`${keyPrefix}-${i}`} char={char} />
  ));
}
