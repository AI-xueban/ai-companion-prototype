export interface JuniorEnglishSyncVideo {
  label: string;
  skill: string;
  name: string;
}

export interface JuniorEnglishSyncSection {
  id: string;
  title: string;
  videos: JuniorEnglishSyncVideo[];
}

export interface JuniorEnglishSyncTopic {
  version: string;
  grade: string;
  term: string;
  catalog: string;
  videos: JuniorEnglishSyncVideo[];
  /** 七 / 八年级沪教：Unit → Section → 视频；九年级上册沪教不挂 sections */
  sections?: JuniorEnglishSyncSection[];
}

const ENGLISH_SYNC_SECTION_DEFS = [
  { id: 's1', title: 'Section 1 Experiencing and understanding language', match: /单元目标|巧记单词|阅读练兵|词汇应用/ },
  { id: 's2', title: 'Section 2 Exploring and applying rules', match: /语法/ },
  { id: 's3', title: 'Section 3 Expressing and communicating ideas', match: /听力|写作|口语/ },
  { id: 's4', title: 'Section 4 Extending and developing competencies', match: /文化拓展|跨学科|项目式/ },
] as const;

export function usesEnglishSectionTree(grade: string, version = '沪教版') {
  return version === '沪教版' && (grade === '七年级' || grade === '八年级');
}

export function buildEnglishSyncSections(videos: JuniorEnglishSyncVideo[]): JuniorEnglishSyncSection[] {
  const buckets = ENGLISH_SYNC_SECTION_DEFS.map((def) => ({
    id: def.id,
    title: def.title,
    videos: [] as JuniorEnglishSyncVideo[],
  }));
  videos.forEach((video) => {
    const text = `${video.skill} ${video.label}`;
    const index = ENGLISH_SYNC_SECTION_DEFS.findIndex((def) => def.match.test(text));
    buckets[index >= 0 ? index : 0].videos.push(video);
  });
  return buckets.filter((section) => section.videos.length > 0);
}

export function attachEnglishSyncSections(topic: JuniorEnglishSyncTopic): JuniorEnglishSyncTopic {
  if (!usesEnglishSectionTree(topic.grade, topic.version) || topic.sections?.length) return topic;
  return { ...topic, sections: buildEnglishSyncSections(topic.videos) };
}

/** 来源：初中-英语-视频样例.xlsx。单元/节为空，目录=Unit，学习步骤取视频名称后缀。 */
export const JUNIOR_ENGLISH_SYNC_TOPICS: JuniorEnglishSyncTopic[] = [
  {
    "version": "沪教版",
    "grade": "九年级",
    "term": "上册",
    "catalog": "Unit 1 Great people",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语九上新版_Unit1_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语九上新版_Unit1_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语九上新版_Unit1_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语九上新版_Unit1_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "词汇应用",
        "name": "沪教初中英语九上新版_Unit1_词汇应用"
      },
      {
        "label": "视频精讲6",
        "skill": "语法讲堂",
        "name": "沪教初中英语九上新版_Unit1_语法讲堂"
      },
      {
        "label": "视频精讲7",
        "skill": "口语交际",
        "name": "沪教初中英语九上新版_Unit1_口语交际"
      },
      {
        "label": "视频精讲8",
        "skill": "写作指南",
        "name": "沪教初中英语九上新版_Unit1_写作指南"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语九上新版_Unit1_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "跨学科学习",
        "name": "沪教初中英语九上新版_Unit1_跨学科学习"
      },
      {
        "label": "视频精讲11",
        "skill": "项目式学习",
        "name": "沪教初中英语九上新版_Unit1_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "下册",
    "catalog": "Unit 1 Helping those in need",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八下新版_Unit1_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八下新版_Unit1_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八下新版_Unit1_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八下新版_Unit1_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八下新版_Unit1_词汇应用"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八下新版_Unit1_听力精讲"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八下新版_Unit1_语法讲堂"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八下新版_Unit1_口语交际"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八下新版_Unit1_写作指南"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八下新版_Unit1_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八下新版_Unit1_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八下新版_Unit1_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "下册",
    "catalog": "Unit 2 Body language",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八下新版_Unit2_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八下新版_Unit2_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八下新版_Unit2_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八下新版_Unit2_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八下新版_Unit2_词汇应用"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八下新版_Unit2_听力精讲"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八下新版_Unit2_语法讲堂"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八下新版_Unit2_口语交际"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八下新版_Unit2_写作指南"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八下新版_Unit2_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八下新版_Unit2_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八下新版_Unit2_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "下册",
    "catalog": "Unit 3 Comics and animation",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八下新版_Unit3_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八下新版_Unit3_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八下新版_Unit3_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八下新版_Unit3_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八下新版_Unit3_词汇应用"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八下新版_Unit3_听力精讲"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八下新版_Unit3_语法讲堂"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八下新版_Unit3_口语交际"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八下新版_Unit3_写作指南"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八下新版_Unit3_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八下新版_Unit3_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八下新版_Unit3_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "下册",
    "catalog": "Unit 4 Arts and heritage",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八下新版_Unit4_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八下新版_Unit4_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八下新版_Unit4_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八下新版_Unit4_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八下新版_Unit4_词汇应用"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八下新版_Unit4_听力精讲"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八下新版_Unit4_语法讲堂"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八下新版_Unit4_口语交际"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八下新版_Unit4_写作指南"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八下新版_Unit4_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八下新版_Unit4_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八下新版_Unit4_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "下册",
    "catalog": "Unit 5 Saving animals in danger",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八下新版_Unit5_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八下新版_Unit5_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八下新版_Unit5_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八下新版_Unit5_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八下新版_Unit5_词汇应用"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八下新版_Unit5_听力精讲"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八下新版_Unit5_语法讲堂"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八下新版_Unit5_口语交际"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八下新版_Unit5_写作指南"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八下新版_Unit5_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八下新版_Unit5_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八下新版_Unit5_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "下册",
    "catalog": "Unit 6 Learning by doing",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八下新版_Unit6_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八下新版_Unit6_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八下新版_Unit6_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八下新版_Unit6_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八下新版_Unit6_词汇应用"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八下新版_Unit6_听力精讲"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八下新版_Unit6_语法讲堂"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八下新版_Unit6_口语交际"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八下新版_Unit6_写作指南"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八下新版_Unit6_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八下新版_Unit6_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八下新版_Unit6_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "下册",
    "catalog": "Unit 7 Space exploration",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八下新版_Unit7_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八下新版_Unit7_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八下新版_Unit7_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八下新版_Unit7_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八下新版_Unit7_词汇应用"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八下新版_Unit7_听力精讲"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八下新版_Unit7_语法讲堂"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八下新版_Unit7_口语交际"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八下新版_Unit7_写作指南"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八下新版_Unit7_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八下新版_Unit7_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八下新版_Unit7_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "下册",
    "catalog": "Unit 8 Imagine that!",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八下新版_Unit8_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八下新版_Unit8_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八下新版_Unit8_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八下新版_Unit8_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八下新版_Unit8_词汇应用"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八下新版_Unit8_听力精讲"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八下新版_Unit8_语法讲堂"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八下新版_Unit8_口语交际"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八下新版_Unit8_写作指南"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八下新版_Unit8_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八下新版_Unit8_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八下新版_Unit8_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "下册",
    "catalog": "Unit 1 People around us",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七下新版_Unit1_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七下新版_Unit1_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七下新版_Unit1_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七下新版_Unit1_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "语法讲堂",
        "name": "沪教初中英语七下新版_Unit1_语法讲堂"
      },
      {
        "label": "视频精讲6",
        "skill": "听力精讲",
        "name": "沪教初中英语七下新版_Unit1_听力精讲"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七下新版_Unit1_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "口语交际",
        "name": "沪教初中英语七下新版_Unit1_口语交际"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七下新版_Unit1_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "跨学科学习",
        "name": "沪教初中英语七下新版_Unit1_跨学科学习"
      },
      {
        "label": "视频精讲11",
        "skill": "项目式学习",
        "name": "沪教初中英语七下新版_Unit1_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "下册",
    "catalog": "Unit 2 Travelling around the world",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七下新版_Unit2_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七下新版_Unit2_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七下新版_Unit2_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七下新版_Unit2_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "语法讲堂",
        "name": "沪教初中英语七下新版_Unit2_语法讲堂"
      },
      {
        "label": "视频精讲6",
        "skill": "听力精讲",
        "name": "沪教初中英语七下新版_Unit2_听力精讲"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七下新版_Unit2_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "口语交际",
        "name": "沪教初中英语七下新版_Unit2_口语交际"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七下新版_Unit2_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "跨学科学习",
        "name": "沪教初中英语七下新版_Unit2_跨学科学习"
      },
      {
        "label": "视频精讲11",
        "skill": "项目式学习",
        "name": "沪教初中英语七下新版_Unit2_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "下册",
    "catalog": "Unit 3 Trees and us",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七下新版_Unit3_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七下新版_Unit3_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七下新版_Unit3_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七下新版_Unit3_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "语法讲堂",
        "name": "沪教初中英语七下新版_Unit3_语法讲堂"
      },
      {
        "label": "视频精讲6",
        "skill": "听力精讲",
        "name": "沪教初中英语七下新版_Unit3_听力精讲"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七下新版_Unit3_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "口语交际",
        "name": "沪教初中英语七下新版_Unit3_口语交际"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七下新版_Unit3_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "跨学科学习",
        "name": "沪教初中英语七下新版_Unit3_跨学科学习"
      },
      {
        "label": "视频精讲11",
        "skill": "项目式学习",
        "name": "沪教初中英语七下新版_Unit3_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "下册",
    "catalog": "Unit 4 Our animal friends",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七下新版_Unit4_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七下新版_Unit4_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七下新版_Unit4_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七下新版_Unit4_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "语法讲堂",
        "name": "沪教初中英语七下新版_Unit4_语法讲堂"
      },
      {
        "label": "视频精讲6",
        "skill": "听力精讲",
        "name": "沪教初中英语七下新版_Unit4_听力精讲"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七下新版_Unit4_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "口语交际",
        "name": "沪教初中英语七下新版_Unit4_口语交际"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七下新版_Unit4_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "跨学科学习",
        "name": "沪教初中英语七下新版_Unit4_跨学科学习"
      },
      {
        "label": "视频精讲11",
        "skill": "项目式学习",
        "name": "沪教初中英语七下新版_Unit4_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "下册",
    "catalog": "Unit 5 Water is life",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七下新版_Unit5_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七下新版_Unit5_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七下新版_Unit5_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七下新版_Unit5_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "语法讲堂",
        "name": "沪教初中英语七下新版_Unit5_语法讲堂"
      },
      {
        "label": "视频精讲6",
        "skill": "听力精讲",
        "name": "沪教初中英语七下新版_Unit5_听力精讲"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七下新版_Unit5_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "口语交际",
        "name": "沪教初中英语七下新版_Unit5_口语交际"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七下新版_Unit5_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "跨学科学习",
        "name": "沪教初中英语七下新版_Unit5_跨学科学习"
      },
      {
        "label": "视频精讲11",
        "skill": "项目式学习",
        "name": "沪教初中英语七下新版_Unit5_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "下册",
    "catalog": "Unit 6 Electricity everywhere",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七下新版_Unit6_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七下新版_Unit6_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七下新版_Unit6_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七下新版_Unit6_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "语法讲堂",
        "name": "沪教初中英语七下新版_Unit6_语法讲堂"
      },
      {
        "label": "视频精讲6",
        "skill": "听力精讲",
        "name": "沪教初中英语七下新版_Unit6_听力精讲"
      },
      {
        "label": "视频精讲7",
        "skill": "口语交际",
        "name": "沪教初中英语七下新版_Unit6_口语交际"
      },
      {
        "label": "视频精讲8",
        "skill": "写作指南",
        "name": "沪教初中英语七下新版_Unit6_写作指南"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七下新版_Unit6_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "跨学科学习",
        "name": "沪教初中英语七下新版_Unit6_跨学科学习"
      },
      {
        "label": "视频精讲11",
        "skill": "项目式学习",
        "name": "沪教初中英语七下新版_Unit6_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "下册",
    "catalog": "Unit 7 Role models of our time",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七下新版_Unit7_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七下新版_Unit7_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七下新版_Unit7_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七下新版_Unit7_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "语法讲堂",
        "name": "沪教初中英语七下新版_Unit7_语法讲堂"
      },
      {
        "label": "视频精讲6",
        "skill": "听力精讲",
        "name": "沪教初中英语七下新版_Unit7_听力精讲"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七下新版_Unit7_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "口语交际",
        "name": "沪教初中英语七下新版_Unit7_口语交际"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七下新版_Unit7_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "跨学科学习",
        "name": "沪教初中英语七下新版_Unit7_跨学科学习"
      },
      {
        "label": "视频精讲11",
        "skill": "项目式学习",
        "name": "沪教初中英语七下新版_Unit7_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "下册",
    "catalog": "Unit 8 Follow your interests",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七下新版_Unit8_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七下新版_Unit8_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七下新版_Unit8_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七下新版_Unit8_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "语法讲堂",
        "name": "沪教初中英语七下新版_Unit8_语法讲堂"
      },
      {
        "label": "视频精讲6",
        "skill": "听力精讲",
        "name": "沪教初中英语七下新版_Unit8_听力精讲"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七下新版_Unit8_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "口语交际",
        "name": "沪教初中英语七下新版_Unit8_口语交际"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七下新版_Unit8_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "跨学科学习",
        "name": "沪教初中英语七下新版_Unit8_跨学科学习"
      },
      {
        "label": "视频精讲11",
        "skill": "项目式学习",
        "name": "沪教初中英语七下新版_Unit8_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "上册",
    "catalog": "Unit 1 Friendship",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七上新版_Unit1_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七上新版_Unit1_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七上新版_Unit1_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七上新版_Unit1_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "听力精讲",
        "name": "沪教初中英语七上新版_Unit1_听力精讲"
      },
      {
        "label": "视频精讲6",
        "skill": "语法讲堂",
        "name": "沪教初中英语七上新版_Unit1_语法讲堂"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七上新版_Unit1_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "口语交际",
        "name": "沪教初中英语七上新版_Unit1_口语交际"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七上新版_Unit1_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "项目式学习",
        "name": "沪教初中英语七上新版_Unit1_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "上册",
    "catalog": "Unit 2 School life",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七上新版_Unit2_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七上新版_Unit2_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七上新版_Unit2_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七上新版_Unit2_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "听力精讲",
        "name": "沪教初中英语七上新版_Unit2_听力精讲"
      },
      {
        "label": "视频精讲6",
        "skill": "语法讲堂",
        "name": "沪教初中英语七上新版_Unit2_语法讲堂"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七上新版_Unit2_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "文化拓展",
        "name": "沪教初中英语七上新版_Unit2_文化拓展"
      },
      {
        "label": "视频精讲9",
        "skill": "项目式学习",
        "name": "沪教初中英语七上新版_Unit2_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "上册",
    "catalog": "Unit 3 The seasons",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七上新版_Unit3_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七上新版_Unit3_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七上新版_Unit3_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七上新版_Unit3_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "听力精讲",
        "name": "沪教初中英语七上新版_Unit3_听力精讲"
      },
      {
        "label": "视频精讲6",
        "skill": "语法讲堂",
        "name": "沪教初中英语七上新版_Unit3_语法讲堂"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七上新版_Unit3_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "口语交际",
        "name": "沪教初中英语七上新版_Unit3_口语交际"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七上新版_Unit3_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "项目式学习",
        "name": "沪教初中英语七上新版_Unit3_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "上册",
    "catalog": "Unit 4 The Earth",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七上新版_Unit4_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七上新版_Unit4_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七上新版_Unit4_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七上新版_Unit4_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "听力精讲",
        "name": "沪教初中英语七上新版_Unit4_听力精讲"
      },
      {
        "label": "视频精讲6",
        "skill": "语法讲堂",
        "name": "沪教初中英语七上新版_Unit4_语法讲堂"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七上新版_Unit4_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "口语交际",
        "name": "沪教初中英语七上新版_Unit4_口语交际"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七上新版_Unit4_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "项目式学习",
        "name": "沪教初中英语七上新版_Unit4_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "上册",
    "catalog": "Unit 5 Off to space",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七上新版_Unit5_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七上新版_Unit5_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七上新版_Unit5_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七上新版_Unit5_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "听力精讲",
        "name": "沪教初中英语七上新版_Unit5_听力精讲"
      },
      {
        "label": "视频精讲6",
        "skill": "语法讲堂",
        "name": "沪教初中英语七上新版_Unit5_语法讲堂"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七上新版_Unit5_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "口语交际",
        "name": "沪教初中英语七上新版_Unit5_口语交际"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七上新版_Unit5_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "项目式学习",
        "name": "沪教初中英语七上新版_Unit5_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "上册",
    "catalog": "Unit 6 Travelling around Asia",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七上新版_Unit6_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七上新版_Unit6_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七上新版_Unit6_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七上新版_Unit6_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "听力精讲",
        "name": "沪教初中英语七上新版_Unit6_听力精讲"
      },
      {
        "label": "视频精讲6",
        "skill": "语法讲堂",
        "name": "沪教初中英语七上新版_Unit6_语法讲堂"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七上新版_Unit6_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "口语交际",
        "name": "沪教初中英语七上新版_Unit6_口语交际"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七上新版_Unit6_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "项目式学习",
        "name": "沪教初中英语七上新版_Unit6_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "上册",
    "catalog": "Unit 7 Fun after school",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七上新版_Unit7_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七上新版_Unit7_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七上新版_Unit7_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七上新版_Unit7_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "听力精讲",
        "name": "沪教初中英语七上新版_Unit7_听力精讲"
      },
      {
        "label": "视频精讲6",
        "skill": "语法讲堂",
        "name": "沪教初中英语七上新版_Unit7_语法讲堂"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七上新版_Unit7_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "口语交际",
        "name": "沪教初中英语七上新版_Unit7_口语交际"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七上新版_Unit7_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "项目式学习",
        "name": "沪教初中英语七上新版_Unit7_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "七年级",
    "term": "上册",
    "catalog": "Unit 8 Collecting as a hobby",
    "videos": [
      {
        "label": "视频精讲1",
        "skill": "单元目标",
        "name": "沪教初中英语七上新版_Unit8_单元目标"
      },
      {
        "label": "视频精讲2",
        "skill": "巧记单词1",
        "name": "沪教初中英语七上新版_Unit8_巧记单词1"
      },
      {
        "label": "视频精讲3",
        "skill": "巧记单词2",
        "name": "沪教初中英语七上新版_Unit8_巧记单词2"
      },
      {
        "label": "视频精讲4",
        "skill": "阅读练兵",
        "name": "沪教初中英语七上新版_Unit8_阅读练兵"
      },
      {
        "label": "视频精讲5",
        "skill": "听力精讲",
        "name": "沪教初中英语七上新版_Unit8_听力精讲"
      },
      {
        "label": "视频精讲6",
        "skill": "语法讲堂",
        "name": "沪教初中英语七上新版_Unit8_语法讲堂"
      },
      {
        "label": "视频精讲7",
        "skill": "写作指南",
        "name": "沪教初中英语七上新版_Unit8_写作指南"
      },
      {
        "label": "视频精讲8",
        "skill": "口语交际",
        "name": "沪教初中英语七上新版_Unit8_口语交际"
      },
      {
        "label": "视频精讲9",
        "skill": "文化拓展",
        "name": "沪教初中英语七上新版_Unit8_文化拓展"
      },
      {
        "label": "视频精讲10",
        "skill": "项目式学习",
        "name": "沪教初中英语七上新版_Unit8_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "上册",
    "catalog": "Unit 1 Look it up!",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八上新版_Unit1_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八上新版_Unit1_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八上新版_Unit1_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八上新版_Unit1_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八上新版_Unit1_词汇应用"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八上新版_Unit1_语法讲堂"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八上新版_Unit1_听力精讲"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八上新版_Unit1_写作指南"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八上新版_Unit1_口语交际"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八上新版_Unit1_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八上新版_Unit1_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八上新版_Unit1_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "上册",
    "catalog": "Unit 2 Amazing numbers",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八上新版_Unit2_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八上新版_Unit2_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八上新版_Unit2_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八上新版_Unit2_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八上新版_Unit2_词汇应用"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八上新版_Unit2_语法讲堂"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八上新版_Unit2_听力精讲"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八上新版_Unit2_写作指南"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八上新版_Unit2_口语交际"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八上新版_Unit2_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八上新版_Unit2_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八上新版_Unit2_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "上册",
    "catalog": "Unit 3 Our digital lives",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八上新版_Unit3_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八上新版_Unit3_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八上新版_Unit3_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八上新版_Unit3_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八上新版_Unit3_词汇应用"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八上新版_Unit3_语法讲堂"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八上新版_Unit3_听力精讲"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八上新版_Unit3_写作指南"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八上新版_Unit3_口语交际"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八上新版_Unit3_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八上新版_Unit3_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八上新版_Unit3_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "上册",
    "catalog": "Unit 4 Inventions",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八上新版_Unit4_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八上新版_Unit4_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八上新版_Unit4_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八上新版_Unit4_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八上新版_Unit4_词汇应用"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八上新版_Unit4_语法讲堂"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八上新版_Unit4_听力精讲"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八上新版_Unit4_写作指南"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八上新版_Unit4_口语交际"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八上新版_Unit4_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八上新版_Unit4_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八上新版_Unit4_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "上册",
    "catalog": "Unit 5 Going on an exchange trip",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八上新版_Unit5_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八上新版_Unit5_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八上新版_Unit5_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八上新版_Unit5_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八上新版_Unit5_词汇应用"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八上新版_Unit5_语法讲堂"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八上新版_Unit5_听力精讲"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八上新版_Unit5_写作指南"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八上新版_Unit5_口语交际"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八上新版_Unit5_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八上新版_Unit5_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八上新版_Unit5_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "上册",
    "catalog": "Unit 6 Wisdom counts",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八上新版_Unit6_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八上新版_Unit6_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八上新版_Unit6_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八上新版_Unit6_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八上新版_Unit6_词汇应用"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八上新版_Unit6_语法讲堂"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八上新版_Unit6_听力精讲"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八上新版_Unit6_口语交际"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八上新版_Unit6_写作指南"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八上新版_Unit6_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八上新版_Unit6_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八上新版_Unit6_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "上册",
    "catalog": "Unit 7 The secret of memory",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八上新版_Unit7_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八上新版_Unit7_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八上新版_Unit7_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八上新版_Unit7_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八上新版_Unit7_词汇应用"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八上新版_Unit7_语法讲堂"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八上新版_Unit7_听力精讲"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八上新版_Unit7_写作指南"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八上新版_Unit7_口语交际"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八上新版_Unit7_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八上新版_Unit7_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八上新版_Unit7_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "八年级",
    "term": "上册",
    "catalog": "Unit 8 Pets and us",
    "videos": [
      {
        "label": "单元目标",
        "skill": "单元目标",
        "name": "沪教初中英语八上新版_Unit8_单元目标"
      },
      {
        "label": "巧记单词1",
        "skill": "巧记单词1",
        "name": "沪教初中英语八上新版_Unit8_巧记单词1"
      },
      {
        "label": "巧记单词2",
        "skill": "巧记单词2",
        "name": "沪教初中英语八上新版_Unit8_巧记单词2"
      },
      {
        "label": "阅读练兵",
        "skill": "阅读练兵",
        "name": "沪教初中英语八上新版_Unit8_阅读练兵"
      },
      {
        "label": "词汇应用",
        "skill": "词汇应用",
        "name": "沪教初中英语八上新版_Unit8_词汇应用"
      },
      {
        "label": "语法讲堂",
        "skill": "语法讲堂",
        "name": "沪教初中英语八上新版_Unit8_语法讲堂"
      },
      {
        "label": "听力精讲",
        "skill": "听力精讲",
        "name": "沪教初中英语八上新版_Unit8_听力精讲"
      },
      {
        "label": "写作指南",
        "skill": "写作指南",
        "name": "沪教初中英语八上新版_Unit8_写作指南"
      },
      {
        "label": "口语交际",
        "skill": "口语交际",
        "name": "沪教初中英语八上新版_Unit8_口语交际"
      },
      {
        "label": "新课标•文化拓展",
        "skill": "文化拓展",
        "name": "沪教初中英语八上新版_Unit8_文化拓展"
      },
      {
        "label": "新课标•跨学科学习",
        "skill": "跨学科学习",
        "name": "沪教初中英语八上新版_Unit8_跨学科学习"
      },
      {
        "label": "新课标•项目式学习",
        "skill": "项目式学习",
        "name": "沪教初中英语八上新版_Unit8_项目式学习"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "九年级",
    "term": "下册",
    "catalog": "Module 1 Explorations and exchanges Unit 1 Great explorations",
    "videos": [
      {
        "label": "单元学习目标",
        "skill": "单元学习目标",
        "name": "牛津上海初中英语九下_Unit1_单元学习目标"
      },
      {
        "label": "词汇乐学堂",
        "skill": "词汇乐学堂",
        "name": "牛津上海初中英语九下_Unit1_词汇乐学堂"
      },
      {
        "label": "课文一起学",
        "skill": "课文一起学",
        "name": "牛津上海初中英语九下_Unit1_课文一起学"
      },
      {
        "label": "语法大讲堂",
        "skill": "语法大讲堂",
        "name": "牛津上海初中英语九下_Unit1_语法大讲堂"
      },
      {
        "label": "阅读练兵场",
        "skill": "阅读练兵场",
        "name": "牛津上海初中英语九下_Unit1_阅读练兵场"
      },
      {
        "label": "写作指南针",
        "skill": "写作指南针",
        "name": "牛津上海初中英语九下_Unit1_写作指南针"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "九年级",
    "term": "下册",
    "catalog": "Module 1 Explorations and exchanges Unit 2 Culture shock",
    "videos": [
      {
        "label": "单元学习目标",
        "skill": "单元学习目标",
        "name": "牛津上海初中英语九下_Unit2_单元学习目标"
      },
      {
        "label": "词汇乐学堂",
        "skill": "词汇乐学堂",
        "name": "牛津上海初中英语九下_Unit2_词汇乐学堂"
      },
      {
        "label": "课文一起学",
        "skill": "课文一起学",
        "name": "牛津上海初中英语九下_Unit2_课文一起学"
      },
      {
        "label": "语法大讲堂",
        "skill": "语法大讲堂",
        "name": "牛津上海初中英语九下_Unit2_语法大讲堂"
      },
      {
        "label": "阅读练兵场",
        "skill": "阅读练兵场",
        "name": "牛津上海初中英语九下_Unit2_阅读练兵场"
      },
      {
        "label": "写作指南针",
        "skill": "写作指南针",
        "name": "牛津上海初中英语九下_Unit2_写作指南针"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "九年级",
    "term": "下册",
    "catalog": "Module 2 Environmental problems Unit 3 The environment",
    "videos": [
      {
        "label": "单元学习目标",
        "skill": "单元学习目标",
        "name": "牛津上海初中英语九下_Unit3_单元学习目标"
      },
      {
        "label": "词汇乐学堂",
        "skill": "词汇乐学堂",
        "name": "牛津上海初中英语九下_Unit3_词汇乐学堂"
      },
      {
        "label": "课文一起学",
        "skill": "课文一起学",
        "name": "牛津上海初中英语九下_Unit3_课文一起学"
      },
      {
        "label": "语法大讲堂",
        "skill": "语法大讲堂",
        "name": "牛津上海初中英语九下_Unit3_语法大讲堂"
      },
      {
        "label": "阅读练兵场",
        "skill": "阅读练兵场",
        "name": "牛津上海初中英语九下_Unit3_阅读练兵场"
      },
      {
        "label": "写作指南针",
        "skill": "写作指南针",
        "name": "牛津上海初中英语九下_Unit3_写作指南针"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "九年级",
    "term": "下册",
    "catalog": "Module 2 Environmental problems Unit 4 Natural disasters",
    "videos": [
      {
        "label": "单元学习目标",
        "skill": "单元学习目标",
        "name": "牛津上海初中英语九下_Unit4_单元学习目标"
      },
      {
        "label": "词汇乐学堂",
        "skill": "词汇乐学堂",
        "name": "牛津上海初中英语九下_Unit4_词汇乐学堂"
      },
      {
        "label": "课文一起学",
        "skill": "课文一起学",
        "name": "牛津上海初中英语九下_Unit4_课文一起学"
      },
      {
        "label": "语法大讲堂",
        "skill": "语法大讲堂",
        "name": "牛津上海初中英语九下_Unit4_语法大讲堂"
      },
      {
        "label": "阅读练兵场",
        "skill": "阅读练兵场",
        "name": "牛津上海初中英语九下_Unit4_阅读练兵场"
      },
      {
        "label": "写作指南针",
        "skill": "写作指南针",
        "name": "牛津上海初中英语九下_Unit4_写作指南针"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "九年级",
    "term": "下册",
    "catalog": "Module 3 Sport and health Unit 5 Sport",
    "videos": [
      {
        "label": "单元学习目标",
        "skill": "单元学习目标",
        "name": "牛津上海初中英语九下_Unit5_单元学习目标"
      },
      {
        "label": "词汇乐学堂",
        "skill": "词汇乐学堂",
        "name": "牛津上海初中英语九下_Unit5_词汇乐学堂"
      },
      {
        "label": "课文一起学",
        "skill": "课文一起学",
        "name": "牛津上海初中英语九下_Unit5_课文一起学"
      },
      {
        "label": "语法大讲堂",
        "skill": "语法大讲堂",
        "name": "牛津上海初中英语九下_Unit5_语法大讲堂"
      },
      {
        "label": "阅读练兵场",
        "skill": "阅读练兵场",
        "name": "牛津上海初中英语九下_Unit5_阅读练兵场"
      },
      {
        "label": "写作指南针",
        "skill": "写作指南针",
        "name": "牛津上海初中英语九下_Unit5_写作指南针"
      }
    ]
  },
  {
    "version": "沪教版",
    "grade": "九年级",
    "term": "下册",
    "catalog": "Module 3 Sport and health Unit 6 Caring for your health",
    "videos": [
      {
        "label": "单元学习目标",
        "skill": "单元学习目标",
        "name": "牛津上海初中英语九下_Unit6_单元学习目标"
      },
      {
        "label": "词汇乐学堂",
        "skill": "词汇乐学堂",
        "name": "牛津上海初中英语九下_Unit6_词汇乐学堂"
      },
      {
        "label": "课文一起学",
        "skill": "课文一起学",
        "name": "牛津上海初中英语九下_Unit6_课文一起学"
      },
      {
        "label": "语法大讲堂",
        "skill": "语法大讲堂",
        "name": "牛津上海初中英语九下_Unit6_语法大讲堂"
      },
      {
        "label": "阅读练兵场",
        "skill": "阅读练兵场",
        "name": "牛津上海初中英语九下_Unit6_阅读练兵场"
      },
      {
        "label": "写作指南针",
        "skill": "写作指南针",
        "name": "牛津上海初中英语九下_Unit6_写作指南针"
      }
    ]
  }
];

export function getJuniorEnglishSyncTopics(grade: string, term: string, version = '沪教版'): JuniorEnglishSyncTopic[] {
  return JUNIOR_ENGLISH_SYNC_TOPICS
    .filter((topic) => topic.grade === grade && topic.term === term && topic.version === version)
    .map(attachEnglishSyncSections);
}

export function getJuniorEnglishTextbookVersions(grade: string, term: string): string[] {
  return [...new Set(
    JUNIOR_ENGLISH_SYNC_TOPICS
      .filter((topic) => topic.grade === grade && topic.term === term)
      .map((topic) => topic.version),
  )];
}
