import type { UiSchoolSystem } from './juniorDemoCatalog';
import type { SelfTestTreeNode } from './juniorSyncAssessment';
import { appendShortageDemosToLastChapter } from './practiceShortageDemo';
import jyeooJuniorBooks from './jyeooJuniorBooks.json';

export interface JyeooPoint {
  id: string;
  title: string;
}

export interface JyeooNode {
  id: string;
  title: string;
  points?: JyeooPoint[];
  children?: JyeooNode[];
}

export interface JyeooBook {
  subject: string;
  edition: string;
  grade: string;
  term: string;
  title: string;
  chapters: JyeooNode[];
}

const BOOKS = (jyeooJuniorBooks as { books: JyeooBook[] }).books;

const EDITION_ALIASES: Record<string, string[]> = {
  人教版: ['人教版', '统编版', '人教版（2024）', '统编版（2024）', '人教版（一年级起点）', '人教版（三年级起点/PEP）'],
  统编版: ['统编版', '人教版', '统编版（2024）'],
  北师大版: ['北师大版', '北师大版（2024）', '北师大版（一年级起点）', '北师大版（三年级起点）'],
  沪教版: ['沪教版（2024）', '沪教版', '沪教牛津版', '牛津上海版', '沪教版（上海版）'],
  浙教版: ['浙教版', '浙教版（2024）'],
  人教五四制版: ['人教五四版', '人教五四版（2024）', '统编版五四制', '统编版五四制（2024）'],
  鲁教五四制版: ['鲁教五四版', '鲁教五四版（2024）', '鲁教版五四制', '鲁教版五四制（2024）', '鲁教版'],
  沪教五四制版: ['沪教版五四制（2024）', '沪教五四版', '沪教五四版（2024）', '沪教版（五四学制）', '沪教版五四制（牛津上海版）'],
};

function isWusiEdition(edition: string) {
  return /五四/.test(edition);
}

function editionCandidates(version: string) {
  if (EDITION_ALIASES[version]) return EDITION_ALIASES[version];
  const stripped = version.replace(/（2024）/g, '').replace(/五四制版/g, '五四版').replace(/五四制/g, '五四');
  return [...new Set([version, stripped, `${stripped}（2024）`])];
}

function termCandidates(term: string) {
  if (term === '上册' || term === '下册') return [term, '全一册', '全册'];
  if (term === '全一册') return ['全一册', '全册', '上册'];
  return [term];
}

export function findJyeooBook(
  subject: string,
  grade: string,
  term: string,
  version: string,
  schoolSystem: UiSchoolSystem = '六三制',
): JyeooBook | null {
  const preferWusi = schoolSystem === '五四制';
  for (const candidateTerm of termCandidates(term)) {
    const pool = BOOKS.filter((book) => book.subject === subject && book.grade === grade && book.term === candidateTerm);
    if (!pool.length) continue;

    const ranked = pool
      .map((book) => {
        const wusi = isWusiEdition(book.edition);
        if (preferWusi !== wusi) return { book, score: -1 };
        const aliases = editionCandidates(version);
        const aliasIndex = aliases.indexOf(book.edition);
        if (aliasIndex >= 0) return { book, score: 100 - aliasIndex };
        if (book.edition.replace(/（2024）/g, '') === version.replace(/五四制版/g, '五四版')) {
          return { book, score: 10 };
        }
        return { book, score: 0 };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (ranked[0]) return ranked[0].book;

    const fallbackPool = preferWusi
      ? pool.filter((book) => isWusiEdition(book.edition))
      : pool.filter((book) => !isWusiEdition(book.edition));
    if (fallbackPool[0] ?? pool[0]) return fallbackPool[0] ?? pool[0];
  }
  return null;
}

function nextLevel(level: SelfTestTreeNode['level']): SelfTestTreeNode['level'] {
  if (level === 'chapter') return 'section';
  if (level === 'section') return 'knowledge';
  return 'subKnowledge';
}

function convertNode(node: JyeooNode, level: SelfTestTreeNode['level']): SelfTestTreeNode {
  const childLevel = nextLevel(level);
  const nested = (node.children ?? []).map((child) => convertNode(child, childLevel));
  if (nested.length) {
    return { id: node.id, title: node.title, level, kind: 'catalog', children: nested };
  }
  const points = node.points ?? [];
  if (points.length) {
    return {
      id: node.id,
      title: node.title,
      level,
      kind: 'catalog',
      children: points.map((point) => ({
        id: `${node.id}::${point.id}`,
        title: point.title,
        level: childLevel,
        kind: 'knowledge' as const,
        available: true,
      })),
    };
  }
  return { id: node.id, title: node.title, level, kind: 'catalog', available: true };
}

export function buildJyeooSelfTestTree(
  subject: string,
  grade: string,
  term: string,
  version: string,
  schoolSystem: UiSchoolSystem = '六三制',
): SelfTestTreeNode[] {
  const book = findJyeooBook(subject, grade, term, version, schoolSystem);
  if (!book) return [];
  return appendShortageDemosToLastChapter(book.chapters.map((chapter) => convertNode(chapter, 'chapter')));
}
