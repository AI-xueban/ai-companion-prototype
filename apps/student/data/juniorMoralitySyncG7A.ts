export interface MoralityVideo {
  id: string;
  title: string;
}

export interface MoralityPeriod {
  id: string;
  title: string;
  videos: MoralityVideo[];
}

export interface MoralityLesson {
  id: string;
  title: string;
  periods: MoralityPeriod[];
}

export interface MoralityUnit {
  id: string;
  title: string;
  lessons: MoralityLesson[];
}

const periodVideos = (id: string, topic: string): MoralityVideo[] => [
  { id: `${id}-main`, title: topic },
  { id: `${id}-plus`, title: `${topic}_综合提升训练` },
];

const period = (id: string, title: string, topic = title.replace(/^第\d+课时\s*/, '')): MoralityPeriod => ({
  id,
  title,
  videos: periodVideos(id, topic),
});

const summaryLesson = (id: string, title: string): MoralityLesson => ({
  id,
  title,
  periods: [{
    id: `${id}-p1`,
    title,
    videos: periodVideos(`${id}-p1`, title),
  }],
});

/** 七年级上册道德与法治：单元 → 课 → 课时 → 视频入口 */
export const JUNIOR_MORALITY_SYNC_G7A: MoralityUnit[] = [
  {
    id: 'u1',
    title: '第一单元 少年有梦',
    lessons: [
      {
        id: 'u1-l1',
        title: '第一课 开启初中生活',
        periods: [
          period('u1-l1-p1', '第1课时 奏响中学序曲'),
          period('u1-l1-p2', '第2课时 规划初中生活'),
        ],
      },
      {
        id: 'u1-l2',
        title: '第二课 正确认识自我',
        periods: [
          period('u1-l2-p1', '第1课时 认识自己'),
          period('u1-l2-p2', '第2课时 做更好的自己'),
        ],
      },
      {
        id: 'u1-l3',
        title: '第三课 梦想始于当下',
        periods: [
          period('u1-l3-p1', '第1课时 做有梦想的少年'),
          period('u1-l3-p2', '第2课时 学习成就梦想'),
        ],
      },
      summaryLesson('u1-sum', '单元思考与行动（一）'),
    ],
  },
  {
    id: 'u2',
    title: '第二单元 成长的时空',
    lessons: [
      {
        id: 'u2-l4',
        title: '第四课 幸福和睦的家庭',
        periods: [
          period('u2-l4-p1', '第1课时 家的意味'),
          period('u2-l4-p2', '第2课时 让家更美好'),
        ],
      },
      {
        id: 'u2-l5',
        title: '第五课 和谐的师生关系',
        periods: [
          period('u2-l5-p1', '第1课时 走近老师'),
          period('u2-l5-p2', '第2课时 珍惜师生情谊'),
        ],
      },
      {
        id: 'u2-l6',
        title: '第六课 友谊之树常青',
        periods: [
          period('u2-l6-p1', '第1课时 友谊的真谛'),
          period('u2-l6-p2', '第2课时 交友的智慧'),
        ],
      },
      {
        id: 'u2-l7',
        title: '第七课 在集体中成长',
        periods: [
          period('u2-l7-p1', '第1课时 集体生活成就我'),
          period('u2-l7-p2', '第2课时 共建美好集体'),
        ],
      },
      summaryLesson('u2-sum', '单元思考与行动（二）'),
    ],
  },
  {
    id: 'u3',
    title: '第三单元 珍爱我们的生命',
    lessons: [
      {
        id: 'u3-l8',
        title: '第八课 生命可贵',
        periods: [
          period('u3-l8-p1', '第1课时 认识生命'),
          period('u3-l8-p2', '第2课时 敬畏生命'),
        ],
      },
      {
        id: 'u3-l9',
        title: '第九课 守护生命安全',
        periods: [
          period('u3-l9-p1', '第1课时 增强安全意识'),
          period('u3-l9-p2', '第2课时 提高防护能力'),
        ],
      },
      {
        id: 'u3-l10',
        title: '第十课 保持身心健康',
        periods: [
          period('u3-l10-p1', '第1课时 爱护身体'),
          period('u3-l10-p2', '第2课时 滋养心灵'),
        ],
      },
      summaryLesson('u3-sum', '单元思考与行动（三）'),
    ],
  },
  {
    id: 'u4',
    title: '第四单元 追求美好人生',
    lessons: [
      {
        id: 'u4-l11',
        title: '第十一课 确立人生目标',
        periods: [
          period('u4-l11-p1', '第1课时 探问人生目标'),
          period('u4-l11-p2', '第2课时 树立正确的人生目标'),
        ],
      },
      {
        id: 'u4-l12',
        title: '第十二课 端正人生态度',
        periods: [
          period('u4-l12-p1', '第1课时 拥有积极的人生态度'),
          period('u4-l12-p2', '第2课时 正确对待顺境和逆境'),
        ],
      },
      {
        id: 'u4-l13',
        title: '第十三课 实现人生价值',
        periods: [
          period('u4-l13-p1', '第1课时 在劳动中创造人生价值'),
          period('u4-l13-p2', '第2课时 在奉献中成就精彩人生'),
        ],
      },
      summaryLesson('u4-sum', '单元思考与行动（四）'),
    ],
  },
];
