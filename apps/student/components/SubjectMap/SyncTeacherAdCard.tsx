import React from 'react';
import teacherWang from '../../assets/teacher-ads/chinese.png';
import teacherZhao from '../../assets/teacher-ads/zhao.png';
import teacherDeng from '../../assets/teacher-ads/deng.png';
import teacherJia from '../../assets/teacher-ads/jia.png';

export interface TeacherPortrait {
  name: string;
  image: string;
}

export interface TeacherAdContent {
  title: string;
  copy: string;
  teachers: TeacherPortrait[];
}

const P = {
  wang: teacherWang,
  zhao: teacherZhao,
  deng: teacherDeng,
  jia: teacherJia,
};

const ADS: Record<string, TeacherAdContent> = {
  语文: {
    title: '语文名师精讲',
    copy: '跟着名师拆解课文脉络，掌握阅读方法与写作表达，轻松攻克同步重难点。',
    teachers: [
      { name: '王志华', image: P.wang },
      { name: '赵亚军', image: P.zhao },
      { name: '邓山', image: P.deng },
      { name: '加能', image: P.jia },
    ],
  },
  数学: {
    title: '数学名师精讲',
    copy: '公式推导、题型拆解一步到位，把同步重难点讲透练会。',
    teachers: [
      { name: '赵亚军', image: P.zhao },
      { name: '加能', image: P.jia },
      { name: '王志华', image: P.wang },
    ],
  },
  英语: {
    title: '英语外教精讲',
    copy: '外教带读、语法精讲、口语开口，同步课本话题一起练。',
    teachers: [
      { name: '邓山', image: P.deng },
      { name: '加能', image: P.jia },
      { name: '王志华', image: P.wang },
    ],
  },
  道德与法治: {
    title: '道法名师精讲',
    copy: '把单元观点讲清楚，把生活案例讲明白，考试表达更有层次。',
    teachers: [
      { name: '加能', image: P.jia },
      { name: '王志华', image: P.wang },
      { name: '邓山', image: P.deng },
      { name: '赵亚军', image: P.zhao },
    ],
  },
  历史: {
    title: '历史名师精讲',
    copy: '梳理时空线索，抓住关键事件，把教材脉络讲成能记住的故事。',
    teachers: [
      { name: '赵亚军', image: P.zhao },
      { name: '邓山', image: P.deng },
      { name: '加能', image: P.jia },
    ],
  },
  生物: {
    title: '生物名师精讲',
    copy: '概念、实验、易错一起讲，把章节知识连成完整图景。',
    teachers: [
      { name: '王志华', image: P.wang },
      { name: '邓山', image: P.deng },
      { name: '赵亚军', image: P.zhao },
      { name: '加能', image: P.jia },
      { name: '王老师', image: P.wang },
    ],
  },
  地理: {
    title: '地理名师精讲',
    copy: '读图、区位、区域特征分层讲解，把章节目变成可应用的方法。',
    teachers: [
      { name: '加能', image: P.jia },
      { name: '赵亚军', image: P.zhao },
      { name: '邓山', image: P.deng },
    ],
  },
  科学: {
    title: '科学名师精讲',
    copy: '实验现象讲清楚，概念关系讲透彻，同步探究更轻松。',
    teachers: [
      { name: '邓山', image: P.deng },
      { name: '王志华', image: P.wang },
      { name: '加能', image: P.jia },
      { name: '赵亚军', image: P.zhao },
    ],
  },
  物理: {
    title: '物理名师精讲',
    copy: '概念、实验、题型分层突破，把公式背后的物理意义讲明白。',
    teachers: [
      { name: '赵亚军', image: P.zhao },
      { name: '加能', image: P.jia },
      { name: '王志华', image: P.wang },
      { name: '邓山', image: P.deng },
    ],
  },
  化学: {
    title: '化学名师精讲',
    copy: '实验、方程式、易错点一起过，把单元核心讲成能上手的方法。',
    teachers: [
      { name: '邓山', image: P.deng },
      { name: '加能', image: P.jia },
      { name: '王志华', image: P.wang },
      { name: '赵亚军', image: P.zhao },
      { name: '邓老师', image: P.deng },
    ],
  },
};

export function getTeacherAd(subject: string): TeacherAdContent | null {
  return ADS[subject] ?? null;
}

interface SyncTeacherAdCardProps {
  ad: TeacherAdContent;
  onClick?: () => void;
}

/** 教材全解 / 同步提高左侧名师广告位：铺满左侧高度，上方老师头像，下方标题与文案 */
export const SyncTeacherAdCard: React.FC<SyncTeacherAdCardProps> = ({ ad, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex h-full w-[156px] shrink-0 flex-col overflow-hidden rounded-2xl border border-amber-100 bg-[#FFFCF5] text-left shadow-[0_8px_24px_rgba(180,120,40,0.08)] transition hover:shadow-[0_12px_28px_rgba(180,120,40,0.14)]"
  >
    <div
      className="relative min-h-0 flex-[1.35] overflow-hidden bg-[#F7EFD9]"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${ad.teachers.length}, minmax(0, 1fr))` }}
    >
      {ad.teachers.map((teacher, index) => (
        <div key={`${teacher.name}-${index}`} className="relative min-h-0 h-full">
          <img
            src={teacher.image}
            alt={teacher.name}
            className="h-full w-full object-cover object-[center_12%]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#FFFCF5] to-transparent" />
          <span className="absolute inset-x-0 bottom-1.5 text-center text-[9px] font-semibold leading-none text-slate-700">
            {teacher.name}
          </span>
        </div>
      ))}
    </div>
    <div className="mx-2.5 h-px shrink-0 bg-amber-200/80" />
    <div className="flex shrink-0 flex-col justify-end gap-1 px-2.5 pb-3 pt-6">
      <p className="text-[12px] font-semibold leading-4 text-slate-800">{ad.title}</p>
      <p className="text-[10px] leading-4 text-slate-500">{ad.copy}</p>
    </div>
  </button>
);
