export interface GeographyVideo {
  id: string;
  title: string;
}

export interface GeographySection {
  id: string;
  title: string;
  videos: GeographyVideo[];
}

export interface GeographyChapter {
  id: string;
  title: string;
  sections: GeographySection[];
}

const periods = (id: string, titles = ['第一课时', '第二课时']): GeographyVideo[] =>
  titles.map((title, index) => ({ id: `${id}-p${index + 1}`, title }));

const section = (id: string, title: string, titles?: string[]): GeographySection => ({
  id,
  title,
  videos: periods(id, titles),
});

/** 人教版七年级上册地理：章 → 节 → 课时视频入口 */
export const JUNIOR_GEOGRAPHY_SYNC_G7A: GeographyChapter[] = [
  {
    id: 'c1',
    title: '第一章 地球',
    sections: [
      section('c1-s1', '第一节 地球的宇宙环境'),
      section('c1-s2', '第二节 地球与地球仪', [
        '第1课时 地球的形状和大小 地球的模型——地球仪',
        '第2课时 经线和经度 纬线和纬度 利用经纬网定位',
      ]),
      section('c1-s3', '第三节 地球的运动', [
        '第1课时 地球的自转',
        '第2课时 地球的公转',
      ]),
    ],
  },
  {
    id: 'c2',
    title: '第二章 地图',
    sections: [
      section('c2-s1', '第一节 地图的阅读'),
      section('c2-s2', '第二节 地形图的判读'),
      section('c2-s3', '第三节 地图的选择和应用'),
    ],
  },
  {
    id: 'c3',
    title: '第三章 陆地和海洋',
    sections: [
      section('c3-s1', '第一节 大洲和大洋'),
      section('c3-s2', '第二节 世界的地形'),
      section('c3-s3', '第三节 海陆的变迁'),
    ],
  },
  {
    id: 'c4',
    title: '第四章 天气与气候',
    sections: [
      section('c4-s1', '第一节 多变的天气'),
      section('c4-s2', '第二节 气温的变化与分布'),
      section('c4-s3', '第三节 降水的变化与分布'),
    ],
  },
  {
    id: 'c5',
    title: '第五章 居民与文化',
    sections: [
      section('c5-s1', '第一节 人口与人种', ['第一课时', '第二课时', '第三课时', '第四课时']),
      section('c5-s2', '第二节 城镇与乡村'),
      section('c5-s3', '第三节 多样的文化'),
    ],
  },
  {
    id: 'c6',
    title: '第六章 发展与合作',
    sections: [
      section('c6-s1', '发展与合作'),
    ],
  },
];
