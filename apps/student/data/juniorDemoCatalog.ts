import { JUNIOR_PHYSICS_SYNC_G8A } from './juniorPhysicsSyncG8A';
import { JUNIOR_GEOGRAPHY_SYNC_G7A } from './juniorGeographySyncG7A';
import { JUNIOR_HISTORY_SYNC_G7A } from './juniorHistorySyncG7A';
import { JUNIOR_MORALITY_SYNC_G7A } from './juniorMoralitySyncG7A';
import { JUNIOR_MORALITY_SYNC_G8A } from './juniorMoralitySyncG8A';
import { JUNIOR_BIOLOGY_SYNC_G7A } from './juniorBiologySyncG7A';
import { getJuniorMathSyncTopics, type JuniorMathSyncTopic } from './juniorMathSyncVideos';
import { getJuniorEnglishSyncTopics, attachEnglishSyncSections, type JuniorEnglishSyncTopic } from './juniorEnglishSyncVideos';
import { JUNIOR_TEXTBOOK_CHAPTERS, type SchoolSystemType } from './juniorTextbookChapters';
import { pepSections } from './juniorPepSectionBank';
import { ALL_PRACTICE_DEMOS, SHORTAGE_DEMO_CHAPTER_ID, SHORTAGE_DEMO_CHAPTER_TITLE, EMPTY_STATE_DEMO_CHAPTER_ID, EMPTY_STATE_DEMO_CHAPTER_TITLE, isShortageDemoChapter, matchShortageDemo } from './practiceShortageDemo';
import {
  PLAYBACK_ERROR_DEMO_CHAPTER_ID,
  PLAYBACK_ERROR_DEMO_CHAPTER_TITLE,
  PLAYBACK_ERROR_DEMO_LESSON_TITLE,
  PLAYBACK_ERROR_DEMOS,
  isPlaybackErrorDemoChapter,
} from './playbackErrorDemo';

export type CatalogLayout = 'unit-lessons' | 'chapter-sections' | 'unit-chapters';

export interface DemoVideo {
  id: string;
  title: string;
}

export interface DemoSection {
  id: string;
  title: string;
  videos: DemoVideo[];
}

export interface DemoLesson {
  id: string;
  title: string;
  sections: DemoSection[];
}

export interface DemoUnit {
  id: string;
  title: string;
  lessons: DemoLesson[];
}

export interface DemoCatalogBook {
  layout: CatalogLayout;
  units: DemoUnit[];
}

export type UiSchoolSystem = '六三制' | '五四制';

const MATH_VIDEO_TYPES = ['知识精讲', '经典题型', '拓展提升', '新课标新考法'];
const ENGLISH_SKILLS = ['单元目标', '巧记单词', '阅读练兵', '词汇应用', '语法讲堂', '口语交际', '写作指南'];
const PHYSICS_CATEGORIES = ['知识点', '题型', '易错', '中考链接'] as const;

export const toDataSystem = (system: UiSchoolSystem): SchoolSystemType =>
  system === '五四制' ? '五四学制' : '六三学制';

export const isJuniorGrade = (grade: string, system: UiSchoolSystem) =>
  system === '五四制'
    ? ['六年级', '七年级', '八年级', '九年级'].includes(grade)
    : ['七年级', '八年级', '九年级'].includes(grade);

const slug = (text: string) => text.replace(/\s+/g, '');

const topicOf = (title: string) =>
  title.replace(/^第[一二三四五六七八九十百\d]+(单元|章|节|课|课时|课题)\s*/, '').replace(/^[Uu]nit\s+\d+\s*/, '');

const videos = (id: string, titles: string[]): DemoVideo[] =>
  titles.map((title, index) => ({ id: `${id}-v${index + 1}`, title }));

function chapterRows(subject: string, grade: string, term: string, version: string, system: SchoolSystemType) {
  return JUNIOR_TEXTBOOK_CHAPTERS.filter((row) =>
    row.subject === subject
    && row.grade === grade
    && row.term === term
    && row.version === version
    && row.system === system,
  );
}

function fallbackSections(chapter: string): string[] {
  const topic = topicOf(chapter) || chapter;
  return [`第1节 ${topic}的认识`, `第2节 ${topic}的规律`, `第3节 ${topic}的应用`];
}

function lessonTitles(subject: string, grade: string, term: string, chapter: string, version: string): string[] {
  if (version === '人教版') {
    const pep = pepSections(subject, grade, term, chapter);
    if (pep?.length) return pep;
  }
  const topic = topicOf(chapter) || chapter;
  if (subject === '化学') return [`课题1 ${topic}的认识`, `课题2 ${topic}的变化`, `课题3 ${topic}的应用`];
  if (subject === '历史') return [`第1课 ${topic}（上）`, `第2课 ${topic}（中）`, `第3课 ${topic}（下）`];
  if (subject === '道德与法治') return [`第一课 ${topic}与生活`, `第二课 ${topic}与成长`];
  if (subject === '生物') return [`第1节 ${topic}概述`, `第2节 ${topic}的结构`, `第3节 ${topic}与环境`];
  if (subject === '地理' || subject === '科学') return [`第1节 ${topic}概况`, `第2节 ${topic}特征`, `第3节 ${topic}与发展`];
  return fallbackSections(chapter);
}

function physicsSections(id: string, title: string): DemoSection[] {
  const topic = topicOf(title) || title;
  return PHYSICS_CATEGORIES.map((category) => ({
    id: `${id}-${category}`,
    title: category,
    videos: videos(`${id}-${category}`, {
      知识点: [`${topic}的概念`, `${topic}的规律`],
      题型: [`${topic}的计算与应用`, `${topic}实验探究`],
      易错: [`${topic}常见错误辨析`],
      中考链接: [`${topic}中考典型题`],
    }[category]),
  }));
}

function chemistrySections(id: string, title: string): DemoSection[] {
  const topic = topicOf(title) || title;
  return [
    { id: `${id}-know`, title: '知识精讲', videos: videos(`${id}-know`, [`${topic}_知识精讲`, `${topic}_实验探究`]) },
    { id: `${id}-err`, title: '易错辨析', videos: videos(`${id}-err`, [`${topic}_易错误区辨析`]) },
    { id: `${id}-exam`, title: '中考链接', videos: videos(`${id}-exam`, [`${topic}_中考链接`]) },
  ];
}

function historySections(id: string, title: string): DemoSection[] {
  const topic = topicOf(title) || title;
  return [{
    id: `${id}-videos`,
    title,
    videos: videos(id, [topic, `${topic}的背景与影响`, `${topic}_综合提升训练`]),
  }];
}

function moralitySections(id: string, title: string): DemoSection[] {
  const topic = topicOf(title) || title;
  return [
    {
      id: `${id}-p1`,
      title: `第1课时 ${topic}`,
      videos: videos(`${id}-p1`, [topic, `${topic}_综合提升训练`]),
    },
    {
      id: `${id}-p2`,
      title: `第2课时 ${topic}的实践`,
      videos: videos(`${id}-p2`, [`${topic}的实践`, `${topic}的实践_综合提升训练`]),
    },
  ];
}

function geographySections(id: string, title: string): DemoSection[] {
  return [{
    id: `${id}-videos`,
    title,
    videos: videos(id, ['第一课时', '第二课时']),
  }];
}

function biologySections(id: string, title: string): DemoSection[] {
  const topic = topicOf(title) || title;
  return [{
    id: `${id}-videos`,
    title,
    videos: videos(id, [`${topic}_知识精讲`, `${topic}_重难点练习`, `${topic}_易错误区辨析`, `${topic}_综合提升`]),
  }];
}

function layoutOf(subject: string): CatalogLayout {
  if (subject === '物理' || subject === '地理' || subject === '科学') return 'chapter-sections';
  return 'unit-lessons';
}

function existingBook(subject: string, grade: string, term: string, version: string, system: SchoolSystemType): DemoCatalogBook | null {
  if (system !== '六三学制' || version !== '人教版') return null;
  if (subject === '物理' && grade === '八年级' && term === '上册') {
    return {
      layout: 'chapter-sections',
      units: JUNIOR_PHYSICS_SYNC_G8A.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        lessons: chapter.sections.map((item) => ({
          id: item.id,
          title: item.title,
          sections: item.categories,
        })),
      })),
    };
  }
  if (subject === '地理' && grade === '七年级' && term === '上册') {
    return {
      layout: 'chapter-sections',
      units: JUNIOR_GEOGRAPHY_SYNC_G7A.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        lessons: chapter.sections.map((item) => ({
          id: item.id,
          title: item.title,
          sections: [{ id: `${item.id}-videos`, title: item.title, videos: item.videos }],
        })),
      })),
    };
  }
  if (subject === '历史' && grade === '七年级' && term === '上册') {
    return {
      layout: 'unit-lessons',
      units: JUNIOR_HISTORY_SYNC_G7A.map((unit) => ({
        id: unit.id,
        title: unit.title,
        lessons: unit.lessons.map((item) => ({
          id: item.id,
          title: item.title,
          sections: [{ id: `${item.id}-videos`, title: item.title, videos: item.videos }],
        })),
      })),
    };
  }
  if (subject === '道德与法治' && grade === '七年级' && term === '上册') {
    return {
      layout: 'unit-lessons',
      units: JUNIOR_MORALITY_SYNC_G7A.map((unit) => ({
        id: unit.id,
        title: unit.title,
        lessons: unit.lessons.map((item) => ({
          id: item.id,
          title: item.title,
          sections: item.periods,
        })),
      })),
    };
  }
  if (subject === '道德与法治' && grade === '八年级' && term === '上册') {
    return {
      layout: 'unit-lessons',
      units: JUNIOR_MORALITY_SYNC_G8A.map((unit) => ({
        id: unit.id,
        title: unit.title,
        lessons: unit.lessons.map((item) => ({
          id: item.id,
          title: item.title,
          sections: item.periods,
        })),
      })),
    };
  }
  if (subject === '生物' && grade === '七年级' && term === '上册') {
    return {
      layout: 'unit-chapters',
      units: JUNIOR_BIOLOGY_SYNC_G7A.map((unit) => ({
        id: unit.id,
        title: unit.title,
        lessons: unit.chapters.map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          sections: chapter.sections.flatMap((item) => (
            item.periods?.length
              ? item.periods.map((periodItem) => ({
                  id: periodItem.id,
                  title: `${item.title} · ${periodItem.title}`,
                  videos: periodItem.videos,
                }))
              : [{ id: item.id, title: item.title, videos: item.videos ?? [] }]
          )),
        })),
      })),
    };
  }
  return null;
}

export function getPlaceholderChapterTitles(subject: string): string[] {
  if (subject === '英语') return ['Unit 1', 'Unit 2', 'Unit 3'];
  if (subject === '数学' || subject === '物理' || subject === '地理' || subject === '科学') {
    return ['第一章', '第二章', '第三章'];
  }
  return ['第一单元', '第二单元', '第三单元'];
}

function generatedBook(subject: string, grade: string, term: string, version: string, system: SchoolSystemType): DemoCatalogBook {
  const rows = chapterRows(subject, grade, term, version, system);
  if (!rows.length) {
    return {
      layout: layoutOf(subject),
      units: getPlaceholderChapterTitles(subject).map((title, index) => ({
        id: `u${index + 1}`,
        title,
        lessons: [],
      })),
    };
  }
  const sectionBuilder = subject === '物理' ? physicsSections
    : subject === '化学' ? chemistrySections
    : subject === '历史' ? historySections
    : subject === '道德与法治' ? moralitySections
    : subject === '地理' ? geographySections
    : subject === '科学' ? biologySections
    : biologySections;
  return {
    layout: layoutOf(subject),
    units: rows.map((row, index) => {
      const id = `u${index + 1}`;
      const titles = lessonTitles(subject, grade, term, row.chapter, version);
      return {
        id,
        title: row.chapter,
        lessons: titles.map((title, lessonIndex) => {
          const lessonId = `${id}-l${lessonIndex + 1}`;
          return {
            id: lessonId,
            title,
            sections: sectionBuilder(lessonId, title),
          };
        }),
      };
    }),
  };
}

function appendShortageDemosToLastUnit(units: DemoUnit[]): DemoUnit[] {
  if (!units.length) return units;
  const existingIndex = units.findIndex(
    (unit) => isShortageDemoChapter(unit.id) || isShortageDemoChapter(unit.title),
  );
  const makeDemo = (item: (typeof ALL_PRACTICE_DEMOS)[number]): DemoLesson => ({
    id: `${SHORTAGE_DEMO_CHAPTER_ID}::${item.idSuffix}`,
    title: item.title,
    sections: [{
      id: `${SHORTAGE_DEMO_CHAPTER_ID}::${item.idSuffix}-sec`,
      title: item.title,
      videos: [],
    }],
  });
  if (existingIndex >= 0) {
    const unit = units[existingIndex];
    let renamed = false;
    const syncedLessons = unit.lessons.map((lesson) => {
      const kind = matchShortageDemo(lesson.id) ?? matchShortageDemo(lesson.title);
      const canonical = kind ? ALL_PRACTICE_DEMOS.find((item) => 'kind' in item && item.kind === kind) : null;
      if (!canonical || lesson.title === canonical.title) return lesson;
      renamed = true;
      return {
        ...lesson,
        title: canonical.title,
        sections: lesson.sections.map((section) => (
          section.title === lesson.title || matchShortageDemo(section.title) === kind
            ? { ...section, title: canonical.title }
            : section
        )),
      };
    });
    const missing = ALL_PRACTICE_DEMOS.filter((item) => !syncedLessons.some((lesson) => lesson.id.includes(item.idSuffix) || lesson.title === item.title));
    if (!missing.length && !renamed) return units;
    return units.map((item, index) => (
      index === existingIndex
        ? { ...item, lessons: [...syncedLessons, ...missing.map(makeDemo)] }
        : item
    ));
  }
  return [
    ...units,
    {
      id: SHORTAGE_DEMO_CHAPTER_ID,
      title: SHORTAGE_DEMO_CHAPTER_TITLE,
      lessons: ALL_PRACTICE_DEMOS.map(makeDemo),
    },
  ];
}

function appendEmptyStateDemoToLastUnit(units: DemoUnit[]): DemoUnit[] {
  if (!units.length) return units;
  if (units.some((unit) => unit.id === EMPTY_STATE_DEMO_CHAPTER_ID || unit.title === EMPTY_STATE_DEMO_CHAPTER_TITLE)) {
    return units;
  }
  return [
    ...units,
    {
      id: EMPTY_STATE_DEMO_CHAPTER_ID,
      title: EMPTY_STATE_DEMO_CHAPTER_TITLE,
      lessons: [],
    },
  ];
}

function appendPlaybackErrorDemoToLastUnit(units: DemoUnit[]): DemoUnit[] {
  if (!units.length) return units;
  if (units.some((unit) => isPlaybackErrorDemoChapter(unit.id) || isPlaybackErrorDemoChapter(unit.title))) {
    return units;
  }
  return [
    ...units,
    {
      id: PLAYBACK_ERROR_DEMO_CHAPTER_ID,
      title: PLAYBACK_ERROR_DEMO_CHAPTER_TITLE,
      lessons: [{
        id: `${PLAYBACK_ERROR_DEMO_CHAPTER_ID}::lesson`,
        title: PLAYBACK_ERROR_DEMO_LESSON_TITLE,
        sections: [{
          id: `${PLAYBACK_ERROR_DEMO_CHAPTER_ID}::sec`,
          title: PLAYBACK_ERROR_DEMO_LESSON_TITLE,
          videos: PLAYBACK_ERROR_DEMOS.map((item) => ({
            id: item.idSuffix,
            title: item.title,
          })),
        }],
      }],
    },
  ];
}

export function getDemoCatalogBook(
  subject: string,
  grade: string,
  term: string,
  version: string,
  uiSystem: UiSchoolSystem,
): DemoCatalogBook {
  const system = toDataSystem(uiSystem);
  const book = existingBook(subject, grade, term, version, system)
    ?? generatedBook(subject, grade, term, version, system);
  return {
    ...book,
    units: appendShortageDemosToLastUnit(
      appendEmptyStateDemoToLastUnit(
        appendPlaybackErrorDemoToLastUnit(book.units),
      ),
    ),
  };
}

export function getDemoTextbookVersions(
  subject: string,
  grade: string,
  term: string,
  uiSystem: UiSchoolSystem,
): string[] {
  const system = toDataSystem(uiSystem);
  if (subject === '数学') {
    const existing = uiSystem === '六三制' && getJuniorMathSyncTopics(grade, term === '全一册' ? '上册' : term, '北师大版').length
      ? ['北师大版']
      : [];
    const catalog = [...new Set(
      JUNIOR_TEXTBOOK_CHAPTERS
        .filter((row) => row.subject === subject && row.grade === grade && row.system === system && (row.term === term || row.term === '全一册'))
        .map((row) => row.version),
    )];
    return [...new Set([...existing, ...catalog])];
  }
  if (subject === '英语') {
    const existing = uiSystem === '六三制' && getJuniorEnglishSyncTopics(grade, term === '全一册' ? '上册' : term, '沪教版').length
      ? ['沪教版']
      : [];
    const catalog = [...new Set(
      JUNIOR_TEXTBOOK_CHAPTERS
        .filter((row) => row.subject === subject && row.grade === grade && row.system === system && (row.term === term || row.term === '全一册'))
        .map((row) => row.version),
    )];
    return [...new Set([...existing, ...catalog])];
  }
  if (subject === '语文') return [];
  return [...new Set(
    JUNIOR_TEXTBOOK_CHAPTERS
      .filter((row) => row.subject === subject && row.grade === grade && row.system === system && (row.term === term || row.term === '全一册'))
      .map((row) => row.version),
  )];
}

export function getDemoTerms(
  subject: string,
  grade: string,
  version: string,
  uiSystem: UiSchoolSystem,
): string[] {
  const system = toDataSystem(uiSystem);
  if (subject === '语文') return ['上册', '下册'];
  if (uiSystem === '六三制' && subject === '数学' && getJuniorMathSyncTopics(grade, '上册', version).length) return ['上册', '下册'];
  if (uiSystem === '六三制' && subject === '英语' && getJuniorEnglishSyncTopics(grade, '上册', version).length) return ['上册', '下册'];
  const terms = [...new Set(
    JUNIOR_TEXTBOOK_CHAPTERS
      .filter((row) => row.subject === subject && row.grade === grade && row.version === version && row.system === system)
      .map((row) => row.term),
  )];
  if (subject === '物理' && version === '人教版' && grade === '八年级' && system === '六三学制') {
    return ['上册', '下册'];
  }
  return terms.length ? terms : ['上册', '下册'];
}

export function preferredVersion(subject: string, versions: string[], uiSystem: UiSchoolSystem): string {
  const preferred = uiSystem === '五四制'
    ? (subject === '数学' ? ['人教五四制版', '鲁教五四制版', '鲁科五四制版']
      : subject === '英语' ? ['人教五四制版', '牛津上海版', '鲁教五四制版']
      : subject === '物理' ? ['鲁科五四制版', '人教五四制版']
      : subject === '化学' ? ['人教五四制版', '鲁教五四制版']
      : subject === '生物' ? ['鲁科五四制版', '人教版']
      : subject === '地理' ? ['鲁教五四制版', '人教版']
      : subject === '科学' ? ['沪教版', '浙教版']
      : ['人教版', '人教五四制版'])
    : (subject === '数学' ? ['北师大版', '人教版']
      : subject === '英语' ? ['沪教版', '人教版']
      : subject === '科学' ? ['浙教版', '沪教版']
      : ['人教版']);
  return preferred.find((item) => versions.includes(item)) ?? versions[0] ?? '人教版';
}

export function getDemoMathTopics(
  grade: string,
  term: string,
  version: string,
  uiSystem: UiSchoolSystem,
): JuniorMathSyncTopic[] {
  if (uiSystem === '六三制') {
    const existing = getJuniorMathSyncTopics(grade, term, version);
    if (existing.length) return existing;
  }
  const system = toDataSystem(uiSystem);
  const rows = chapterRows('数学', grade, term, version, system);
  if (!rows.length) {
    return getPlaceholderChapterTitles('数学').map((chapter) => ({
      version,
      grade,
      term,
      catalog: chapter,
      catalogLabel: chapter,
      unit: '',
      unitTitle: '',
      topic: '',
      videos: [],
    }));
  }
  return rows.flatMap((row) => {
    const catalogLabel = row.chapter.replace(/\s+/g, ' ').replace(/^第/, '第').replace(/章\s+/, '章 · ');
    const sections = fallbackSections(row.chapter);
    return sections.map((section) => {
      const topic = topicOf(section) || section;
      return {
        version,
        grade,
        term,
        catalog: row.chapter,
        catalogLabel,
        unit: section,
        unitTitle: topic,
        topic,
        videos: MATH_VIDEO_TYPES.map((label) => ({
          label: `${topic}-${label}`,
          name: `初中数学-${topic}-${label}`,
        })),
      };
    });
  });
}

export function getDemoEnglishTopics(
  grade: string,
  term: string,
  version: string,
  uiSystem: UiSchoolSystem,
): JuniorEnglishSyncTopic[] {
  if (uiSystem === '六三制') {
    const existing = getJuniorEnglishSyncTopics(grade, term, version);
    if (existing.length) return existing;
  }
  const system = toDataSystem(uiSystem);
  const lookupTerm = chapterRows('英语', grade, term, version, system).length
    ? term
    : chapterRows('英语', grade, '全一册', version, system).length ? '全一册' : term;
  const rows = chapterRows('英语', grade, lookupTerm, version, system);
  if (!rows.length) {
    return getPlaceholderChapterTitles('英语').map((catalog) => ({
      version,
      grade,
      term: lookupTerm,
      catalog,
      videos: [],
    }));
  }
  return rows.map((row) => attachEnglishSyncSections({
    version,
    grade,
    term: lookupTerm,
    catalog: row.chapter,
    videos: ENGLISH_SKILLS.map((skill, index) => ({
      label: `视频精讲${index + 1}`,
      skill,
      name: `${version}初中英语_${slug(row.chapter)}_${skill}`,
    })),
  }));
}

export function resolveCatalogTerm(
  subject: string,
  grade: string,
  term: string,
  version: string,
  uiSystem: UiSchoolSystem,
): string {
  const terms = getDemoTerms(subject, grade, version, uiSystem);
  if (terms.includes(term)) return term;
  if (terms.includes('全一册') && (term === '上册' || term === '下册')) return '全一册';
  if (term === '全一册' && terms.includes('上册')) return '上册';
  return terms[0] ?? term;
}
