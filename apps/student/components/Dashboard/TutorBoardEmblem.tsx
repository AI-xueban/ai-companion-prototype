import React from 'react';
import { Atom, Flame, Moon, Search, Sparkles, Users } from 'lucide-react';
import { TutorCharacterId, TutorCharacterTheme } from '../../data/tutorCharacterThemes';

const CHARACTER_EMBLEMS: Record<
  TutorCharacterId,
  { icons: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>[] }
> = {
  change: { icons: [Moon, Sparkles] },
  nezha: { icons: [Flame] },
  holmes: { icons: [Search] },
  einstein: { icons: [Atom] },
};

export interface TutorBoardEmblemProps {
  theme: TutorCharacterTheme;
  variant?: 'skeleton' | 'guide';
}

/** 板书区角标：用图标体现角色/场景，不展示「广寒板书」等文案 */
export const TutorBoardEmblem: React.FC<TutorBoardEmblemProps> = ({ theme, variant = 'skeleton' }) => {
  if (variant === 'guide') {
    return (
      <div
        className={`flex items-center justify-center w-7 h-7 rounded-full border ${theme.boardPhaseBadge}`}
        aria-label="1对1讲题"
        title="1对1讲题"
      >
        <Users size={13} className={theme.accentText} strokeWidth={2.25} />
      </div>
    );
  }

  const { icons } = CHARACTER_EMBLEMS[theme.id];

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-full border ${theme.boardPhaseBadge}`}
      aria-label={`${theme.name}板书`}
      title={theme.name}
    >
      <span className="text-[11px] leading-none select-none" aria-hidden>
        {theme.badge}
      </span>
      {icons.map((Icon, i) => (
        <Icon
          key={`${theme.id}-emblem-${i}`}
          size={11}
          strokeWidth={2.25}
          className={`${theme.accentText} opacity-70`}
          aria-hidden
        />
      ))}
    </div>
  );
};
