export interface EnglishSpeakingLesson {
  id: string;
  title: string;
}

export interface EnglishSpeakingUnit {
  id: string;
  title: string;
  lessons: EnglishSpeakingLesson[];
}

/** 人教新教材七年级上册同步外教口语：Unit → 视频课 */
export const JUNIOR_ENGLISH_SYNC_SPEAKING_G7A: EnglishSpeakingUnit[] = [
  {
    id: 'starter-1',
    title: 'Starter Unit 1 Hello!',
    lessons: [{ id: 's1', title: 'Talk about greeting each other' }],
  },
  {
    id: 'starter-2',
    title: 'Starter Unit 2 Keep Tidy!',
    lessons: [{ id: 's2', title: 'Talk about the housework' }],
  },
  {
    id: 'starter-3',
    title: 'Starter Unit 3 Welcome!',
    lessons: [{ id: 's3', title: 'Talk about animals' }],
  },
  {
    id: 'unit-1',
    title: 'Unit 1 You and Me',
    lessons: [{ id: 'u1', title: 'Introduce yourself' }],
  },
  {
    id: 'unit-2',
    title: "Unit 2 We're Family!",
    lessons: [{ id: 'u2', title: 'Introduce family members' }],
  },
  {
    id: 'unit-3',
    title: 'Unit 3 My School',
    lessons: [
      { id: 'u3', title: 'Talk about the school' },
      { id: 'u3b', title: 'Talk about school facilities' },
    ],
  },
  {
    id: 'unit-4',
    title: 'Unit 4 My Favourite Subject',
    lessons: [{ id: 'u4', title: 'Talk about subjects' }],
  },
  {
    id: 'unit-5',
    title: 'Unit 5 Fun Clubs',
    lessons: [
      { id: 'u5', title: 'Talk about after-school activities' },
      { id: 'u5b', title: 'Talk about joining a club' },
      { id: 'u5c', title: 'Talk about club members' },
    ],
  },
  {
    id: 'unit-6',
    title: 'Unit 6 A Day in the Life',
    lessons: [{ id: 'u6', title: 'Talk about daily routine' }],
  },
  {
    id: 'unit-7',
    title: 'Unit 7 Happy Birthday!',
    lessons: [{ id: 'u7', title: 'Talk about shopping' }],
  },
];
