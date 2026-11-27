export const knowledgePracticeCounts = {
  基础: [2, 3, 1, 0, 0],
  进阶: [0, 1, 4, 1, 0],
  拓展: [0, 0, 1, 3, 2],
} as const;

export type KnowledgePracticeDifficulty = keyof typeof knowledgePracticeCounts;

export function knowledgePracticeLevels(difficulty: KnowledgePracticeDifficulty) {
  return knowledgePracticeCounts[difficulty].flatMap((count, index) => Array.from({ length: count }, () => index + 1));
}
