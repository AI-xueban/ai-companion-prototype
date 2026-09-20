export interface EnglishVocabSection {
  id: string;
  title: string;
  words: string[];
}

export interface EnglishVocabUnit {
  id: string;
  title: string;
  sections: EnglishVocabSection[];
}

/** 人教新教材七年级上册同步词汇，按截图层级：Unit → Section → words */
export const JUNIOR_ENGLISH_SYNC_VOCAB_G7A: EnglishVocabUnit[] = [
  {
    id: 'starter-1',
    title: 'Starter Unit 1 Hello!',
    sections: [
      { id: 's1a', title: 'Section A', words: ['each', 'other', 'each other', 'oh', 'everyone', 'Brown', 'WHO'] },
      { id: 's1b', title: 'Section B', words: ['start', 'spell', 'bell'] },
    ],
  },
  {
    id: 'starter-2',
    title: 'Starter Unit 2 Keep Tidy!',
    sections: [
      { id: 's2a', title: 'Section A', words: ['eraser', 'key'] },
      { id: 's2b', title: 'Section B', words: ['thing', 'need', "You're welcome."] },
    ],
  },
  {
    id: 'starter-2-whats',
    title: "Starter Unit 2 What's this in English?",
    sections: [
      {
        id: 's2w',
        title: 'Section A',
        words: ['what', 'is', 'this', 'in', 'English', 'in English', 'map', 'cup', 'ruler', 'pen', 'orange', 'jacket', 'key', 'quilt', 'it', 'a', 'that', 'spell'],
      },
    ],
  },
  {
    id: 'starter-3',
    title: 'Starter Unit 3 Welcome!',
    sections: [
      { id: 's3a', title: 'Section A', words: ['fun', 'yard', 'carrot'] },
      { id: 's3b', title: 'Section B', words: ['count', 'another', 'else', 'circle', 'look at'] },
    ],
  },
  {
    id: 'unit-1',
    title: 'Unit 1 You and Me',
    sections: [
      { id: 'u1a', title: 'Section A', words: [] },
      { id: 'u1b', title: 'Section B', words: [] },
    ],
  },
  {
    id: 'unit-2',
    title: "Unit 2 We're Family!",
    sections: [
      { id: 'u2a', title: 'Section A', words: [] },
      { id: 'u2b', title: 'Section B', words: [] },
    ],
  },
  {
    id: 'unit-3',
    title: 'Unit 3 My School',
    sections: [
      { id: 'u3a', title: 'Section A', words: [] },
      { id: 'u3b', title: 'Section B', words: [] },
    ],
  },
  {
    id: 'unit-4',
    title: 'Unit 4 My Favourite Subject',
    sections: [
      { id: 'u4a', title: 'Section A', words: [] },
      { id: 'u4b', title: 'Section B', words: [] },
    ],
  },
  {
    id: 'unit-5',
    title: 'Unit 5 Fun Clubs',
    sections: [
      { id: 'u5a', title: 'Section A', words: [] },
      { id: 'u5b', title: 'Section B', words: [] },
    ],
  },
  {
    id: 'unit-6',
    title: 'Unit 6 A Day in the Life',
    sections: [
      { id: 'u6a', title: 'Section A', words: [] },
      { id: 'u6b', title: 'Section B', words: [] },
    ],
  },
  {
    id: 'unit-7',
    title: 'Unit 7 Happy Birthday!',
    sections: [
      { id: 'u7a', title: 'Section A', words: [] },
      { id: 'u7b', title: 'Section B', words: [] },
    ],
  },
];
