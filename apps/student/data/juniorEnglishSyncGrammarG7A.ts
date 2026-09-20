export interface EnglishGrammarTopic {
  id: string;
  title: string;
}

export interface EnglishGrammarSection {
  id: string;
  title: string;
  topics: EnglishGrammarTopic[];
}

export interface EnglishGrammarUnit {
  id: string;
  title: string;
  sections: EnglishGrammarSection[];
}

/** 人教新教材七年级上册同步语法精讲：Unit → Section → 视频知识点 */
export const JUNIOR_ENGLISH_SYNC_GRAMMAR_G7A: EnglishGrammarUnit[] = [
  {
    id: 'starter-1',
    title: 'Starter Unit 1 Hello!',
    sections: [
      {
        id: 's1b',
        title: 'Section B',
        topics: [
          { id: 's1b-1', title: 'let的用法' },
          { id: 's1b-2', title: "It's time for sth. for sb. to do sth" },
        ],
      },
    ],
  },
  {
    id: 'starter-2',
    title: 'Starter Unit 2 Keep Tidy!',
    sections: [
      {
        id: 's2a',
        title: 'Section A',
        topics: [
          { id: 's2a-1', title: 'what引导的特殊疑问句' },
          { id: 's2a-2', title: 'have的用法' },
          { id: 's2a-3', title: '询问物体颜色' },
          { id: 's2a-4', title: '元音字母a在单词中的发音' },
          { id: 's2a-5', title: '元音字母e在单词中的发音' },
          { id: 's2a-6', title: '元音字母i在单词中的发音' },
          { id: 's2a-7', title: '元音字母o在单词中的发音' },
          { id: 's2a-8', title: '元音字母u在单词中的发音' },
        ],
      },
      {
        id: 's2b',
        title: 'Section B',
        topics: [
          { id: 's2b-1', title: '方位介词' },
          { id: 's2b-2', title: '辨析-below和under' },
          { id: 's2b-3', title: 'where引导的特殊疑问句' },
          { id: 's2b-4', title: '情态动词can的含义' },
          { id: 's2b-5', title: '情态动词can的句型' },
          { id: 's2b-6', title: '询问物体颜色' },
        ],
      },
    ],
  },
  {
    id: 'starter-3',
    title: 'Starter Unit 3 Welcome!',
    sections: [
      { id: 's3a', title: 'Section A', topics: [] },
      { id: 's3b', title: 'Section B', topics: [] },
    ],
  },
  {
    id: 'unit-1',
    title: 'Unit 1 You and Me',
    sections: [
      { id: 'u1a', title: 'Section A', topics: [] },
      { id: 'u1b', title: 'Section B', topics: [] },
    ],
  },
  {
    id: 'unit-2',
    title: "Unit 2 We're Family!",
    sections: [
      { id: 'u2a', title: 'Section A', topics: [] },
    ],
  },
  {
    id: 'unit-3',
    title: 'Unit 3 My School',
    sections: [
      { id: 'u3a', title: 'Section A', topics: [] },
      { id: 'u3b', title: 'Section B', topics: [] },
    ],
  },
  {
    id: 'unit-4',
    title: 'Unit 4 My Favourite Subject',
    sections: [
      { id: 'u4a', title: 'Section A', topics: [] },
      { id: 'u4b', title: 'Section B', topics: [] },
    ],
  },
  {
    id: 'unit-5',
    title: 'Unit 5 Fun Clubs',
    sections: [
      { id: 'u5a', title: 'Section A', topics: [] },
      { id: 'u5b', title: 'Section B', topics: [] },
    ],
  },
  {
    id: 'unit-6',
    title: 'Unit 6 A Day in the Life',
    sections: [
      { id: 'u6a', title: 'Section A', topics: [] },
      { id: 'u6b', title: 'Section B', topics: [] },
    ],
  },
  {
    id: 'unit-7',
    title: 'Unit 7 Happy Birthday!',
    sections: [
      { id: 'u7a', title: 'Section A', topics: [] },
      { id: 'u7b', title: 'Section B', topics: [] },
    ],
  },
];
