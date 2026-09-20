export interface BiologyVideo {
  id: string;
  title: string;
}

export interface BiologyPeriod {
  id: string;
  title: string;
  videos: BiologyVideo[];
}

export interface BiologySection {
  id: string;
  title: string;
  videos?: BiologyVideo[];
  periods?: BiologyPeriod[];
}

export interface BiologyChapter {
  id: string;
  title: string;
  sections: BiologySection[];
}

export interface BiologyUnit {
  id: string;
  title: string;
  chapters: BiologyChapter[];
}

const videos = (id: string, titles: string[]): BiologyVideo[] =>
  titles.map((title, index) => ({ id: `${id}-v${index + 1}`, title }));

const topicOf = (title: string) => title.replace(/^第[一二三四五六七八九十\d]+(节|课时)\s*/, '');

const lectureSet = (id: string, title: string): BiologyVideo[] => {
  const topic = topicOf(title);
  return videos(id, [
    `${topic}_知识精讲`,
    `${topic}_重难点练习`,
    `${topic}_易错误区辨析`,
    `${topic}_综合提升`,
  ]);
};

const section = (id: string, title: string, titles?: string[]): BiologySection => ({
  id,
  title,
  videos: titles ? videos(id, titles) : lectureSet(id, title),
});

const period = (id: string, title: string, titles?: string[]): BiologyPeriod => ({
  id,
  title,
  videos: titles ? videos(id, titles) : lectureSet(id, title),
});

const sectionWithPeriods = (id: string, title: string, periods: BiologyPeriod[]): BiologySection => ({
  id,
  title,
  periods,
});

/** 人教版七年级上册生物：单元 → 章 → 节/课时 → 视频入口 */
export const JUNIOR_BIOLOGY_SYNC_G7A: BiologyUnit[] = [
  {
    id: 'u1',
    title: '第一单元 生物和细胞',
    chapters: [
      {
        id: 'u1-c1',
        title: '第一章 认识生物',
        sections: [
          section('u1-c1-s1', '第一节 观察周边环境中的生物', [
            '科学方法—观察_知识精讲',
            '调查周边环境中的生物_知识精讲',
            '调查周边环境中的生物_易错误区辨析',
            '调查周边环境中的生物_综合提升',
            '认识生物_整理与复习_知识精讲',
          ]),
          section('u1-c1-s2', '第二节 生物的特征', [
            '生物的共同特征_知识精讲',
            '生物的特征_重难点练习',
            '生物的特征_易错误区辨析',
            '生物的特征_综合提升',
          ]),
        ],
      },
      {
        id: 'u1-c2',
        title: '第二章 认识细胞',
        sections: [
          section('u1-c2-s1', '第一节 学习使用显微镜', [
            '显微镜的构造_知识精讲',
            '显微镜的使用_知识精讲',
            '双目显微镜_知识精讲',
            '练习使用显微镜_重难点练习',
            '练习使用显微镜_易错误区辨析',
            '练习使用显微镜_综合提升',
            '人类探索微观世界不可缺少的工具—显微镜_知识精讲',
          ]),
          sectionWithPeriods('u1-c2-s2', '第二节 植物细胞', [
            period('u1-c2-s2-p1', '第1课时 制作并观察植物细胞临时装片'),
            period('u1-c2-s2-p2', '第2课时 植物细胞的基本结构'),
          ]),
          section('u1-c2-s3', '第三节 动物细胞'),
          sectionWithPeriods('u1-c2-s4', '第四节 细胞的生活', [
            period('u1-c2-s4-p1', '第1课时 细胞的生活需要物质和能量'),
            period('u1-c2-s4-p2', '第2课时 细胞核是细胞的控制中心'),
          ]),
        ],
      },
      {
        id: 'u1-c3',
        title: '第三章 从细胞到生物体',
        sections: [
          section('u1-c3-s1', '第一节 细胞通过分裂产生新细胞'),
          section('u1-c3-s2', '第二节 动物体的结构层次'),
          section('u1-c3-s3', '第三节 植物体的结构层次'),
        ],
      },
    ],
  },
  {
    id: 'u2',
    title: '第二单元 多种多样的生物',
    chapters: [
      {
        id: 'u2-c1',
        title: '第一章 植物的类群',
        sections: [
          sectionWithPeriods('u2-c1-s1', '第一节 藻类、苔藓和蕨类', [
            period('u2-c1-s1-p1', '第1课时 藻类'),
            period('u2-c1-s1-p2', '第2课时 苔藓、蕨类'),
          ]),
          sectionWithPeriods('u2-c1-s2', '第二节 种子植物', [
            period('u2-c1-s2-p1', '第1课时 种子的结构'),
            period('u2-c1-s2-p2', '第2课时 种子植物'),
          ]),
        ],
      },
      {
        id: 'u2-c2',
        title: '第二章 动物的类群',
        sections: [
          section('u2-c2-s1', '第一节 无脊椎动物'),
          section('u2-c2-s2', '第二节 脊椎动物—鱼'),
          sectionWithPeriods('u2-c2-s3', '第三节 两栖动物和爬行动物', [
            period('u2-c2-s3-p1', '第1课时 两栖动物'),
            period('u2-c2-s3-p2', '第2课时 爬行动物'),
          ]),
          section('u2-c2-s4', '第四节 鸟和哺乳动物'),
        ],
      },
      {
        id: 'u2-c3',
        title: '第三章 微生物',
        sections: [
          section('u2-c3-s1', '第一节 微生物的分布'),
          section('u2-c3-s2', '第二节 细菌'),
          section('u2-c3-s3', '第三节 真菌'),
          section('u2-c3-s4', '第四节 病毒'),
        ],
      },
      {
        id: 'u2-c4',
        title: '第四章 生物分类的方法',
        sections: [
          section('u2-c4-s1', '第一节 尝试对生物进行分类'),
          section('u2-c4-s2', '第二节 从种到界'),
        ],
      },
    ],
  },
];
