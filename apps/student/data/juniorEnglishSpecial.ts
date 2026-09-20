import { getDemoEnglishTopics, type UiSchoolSystem } from './juniorDemoCatalog';
import { JUNIOR_ENGLISH_SYNC_GRAMMAR_G7A, type EnglishGrammarUnit } from './juniorEnglishSyncGrammarG7A';
import { JUNIOR_ENGLISH_SYNC_SPEAKING_G7A, type EnglishSpeakingUnit } from './juniorEnglishSyncSpeakingG7A';
import { JUNIOR_ENGLISH_SYNC_VOCAB_G7A, type EnglishVocabUnit } from './juniorEnglishSyncVocabG7A';
import type { JuniorEnglishSyncTopic, JuniorEnglishSyncVideo } from './juniorEnglishSyncVideos';

const ENGLISH_SPECIAL_VERSIONS_63 = [
  '北师大版',
  '北课改',
  '沪教版',
  '冀教版',
  '教课本eec',
  '牛津上海（试用本）',
  '牛津上海版',
  '人教五四制版',
  '人教版',
  '仁爱版',
  '上海新世纪版',
  '外研新标准版',
];

const ENGLISH_SPECIAL_VERSIONS_54 = ['鲁教五四制版'];

const CATALOG_VERSION_ALIAS: Record<string, string> = {
  '牛津上海（试用本）': '牛津上海版',
};

export function getEnglishSpecialVersions(schoolSystem: UiSchoolSystem): string[] {
  return schoolSystem === '五四制' ? ENGLISH_SPECIAL_VERSIONS_54 : ENGLISH_SPECIAL_VERSIONS_63;
}

export function defaultEnglishSpecialVersion(schoolSystem: UiSchoolSystem): string {
  return schoolSystem === '五四制' ? '鲁教五四制版' : '沪教版';
}

function catalogVersionOf(version: string) {
  return CATALOG_VERSION_ALIAS[version] ?? version;
}

const VOCAB_BANK = [
  ['hello', 'name', 'nice', 'meet', 'friend'],
  ['school', 'class', 'teacher', 'student', 'book'],
  ['family', 'mother', 'father', 'sister', 'home'],
  ['hobby', 'music', 'sport', 'club', 'weekend'],
  ['food', 'like', 'apple', 'water', 'lunch'],
  ['time', 'morning', 'today', 'always', 'often'],
];

function hashText(text: string) {
  return Math.abs([...text].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) | 0, 0));
}

function slug(text: string) {
  return text.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '') || 'unit';
}

function topicOf(title: string) {
  return title
    .replace(/^预备篇\s*/, '')
    .replace(/^Starter\s+Unit\s+\d+\s*/i, '')
    .replace(/^Unit\s+\d+\s*/i, '')
    .replace(/^第[一二三四五六七八九十百\d]+单元\s*/, '')
    .trim() || title;
}

function isPepGrade7A(grade: string, term: string, version: string) {
  return grade === '七年级' && term === '上册' && version === '人教版';
}

function matchVideos(videos: JuniorEnglishSyncVideo[], pattern: RegExp) {
  return videos.filter((video) => pattern.test(`${video.skill} ${video.label} ${video.name}`));
}

function buildSpeakingUnits(topics: JuniorEnglishSyncTopic[]): EnglishSpeakingUnit[] {
  return topics.map((topic, index) => {
    const id = slug(topic.catalog) || `unit-${index + 1}`;
    const oral = matchVideos(topic.videos, /口语|交际/);
    const count = oral.length ? Math.min(3, oral.length) : 1 + (hashText(topic.catalog) % 3);
    const fallback = [
      `Talk about ${topicOf(topic.catalog)}`,
      `Ask and answer about ${topicOf(topic.catalog)}`,
      `Role-play: ${topicOf(topic.catalog)}`,
    ];
    const lessons = (oral.length ? oral.slice(0, count) : fallback.slice(0, count)).map((item, lessonIndex) => ({
      id: `${id}-l${lessonIndex + 1}`,
      title: typeof item === 'string' ? item : (item.label || item.skill || item.name),
    }));
    return { id, title: topic.catalog, lessons };
  });
}

function buildVocabUnits(topics: JuniorEnglishSyncTopic[]): EnglishVocabUnit[] {
  return topics.map((topic, index) => {
    const id = slug(topic.catalog) || `unit-${index + 1}`;
    const bank = VOCAB_BANK[hashText(`${topic.version}-${topic.catalog}`) % VOCAB_BANK.length];
    const extra = topicOf(topic.catalog).split(/\s+/).filter((word) => /^[A-Za-z]+$/.test(word)).slice(0, 3);
    const words = [...new Set([...extra.map((word) => word.toLowerCase()), ...bank])];
    const mid = Math.max(2, Math.ceil(words.length / 2));
    return {
      id,
      title: topic.catalog,
      sections: [
        { id: `${id}-a`, title: 'Section A', words: words.slice(0, mid) },
        { id: `${id}-b`, title: 'Section B', words: words.slice(mid) },
      ],
    };
  });
}

function buildGrammarUnits(topics: JuniorEnglishSyncTopic[]): EnglishGrammarUnit[] {
  return topics.map((topic, index) => {
    const id = slug(topic.catalog) || `unit-${index + 1}`;
    const grammar = matchVideos(topic.videos, /语法/);
    const fallback = ['重点句型', `${topicOf(topic.catalog)} 语法讲解`, '易错辨析'];
    const count = grammar.length ? Math.min(3, grammar.length) : 1 + (hashText(`${topic.catalog}-g`) % 3);
    const titles = grammar.length
      ? grammar.slice(0, count).map((video) => video.label || video.skill || video.name)
      : fallback.slice(0, count);
    return {
      id,
      title: topic.catalog,
      sections: [
        {
          id: `${id}-grammar`,
          title: '语法精讲',
          topics: titles.map((title, topicIndex) => ({ id: `${id}-t${topicIndex + 1}`, title })),
        },
      ],
    };
  });
}

function placeholderTopics(grade: string, term: string, version: string): JuniorEnglishSyncTopic[] {
  return Array.from({ length: 8 }, (_, index) => ({
    version,
    grade,
    term,
    catalog: `Unit ${index + 1}`,
    videos: [],
  }));
}

function topicsForSpecial(
  grade: string,
  term: string,
  version: string,
  schoolSystem: UiSchoolSystem,
): JuniorEnglishSyncTopic[] {
  const catalogVersion = catalogVersionOf(version);
  const topics = getDemoEnglishTopics(grade, term, catalogVersion, schoolSystem);
  if (topics.length) {
    return topics.map((topic) => ({ ...topic, version }));
  }
  return placeholderTopics(grade, term, version);
}

export function getEnglishSpeakingUnits(
  grade: string,
  term: string,
  version: string,
  schoolSystem: UiSchoolSystem,
): EnglishSpeakingUnit[] {
  if (isPepGrade7A(grade, term, version)) return JUNIOR_ENGLISH_SYNC_SPEAKING_G7A;
  return buildSpeakingUnits(topicsForSpecial(grade, term, version, schoolSystem));
}

export function getEnglishVocabUnits(
  grade: string,
  term: string,
  version: string,
  schoolSystem: UiSchoolSystem,
): EnglishVocabUnit[] {
  if (isPepGrade7A(grade, term, version)) return JUNIOR_ENGLISH_SYNC_VOCAB_G7A;
  return buildVocabUnits(topicsForSpecial(grade, term, version, schoolSystem));
}

export function getEnglishGrammarUnits(
  grade: string,
  term: string,
  version: string,
  schoolSystem: UiSchoolSystem,
): EnglishGrammarUnit[] {
  if (isPepGrade7A(grade, term, version)) return JUNIOR_ENGLISH_SYNC_GRAMMAR_G7A;
  return buildGrammarUnits(topicsForSpecial(grade, term, version, schoolSystem));
}
