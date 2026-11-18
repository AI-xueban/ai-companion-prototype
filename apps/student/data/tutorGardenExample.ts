import type { AISolveQuestion } from './aiSolveMockData';
import plan from '@/assets/tutor-garden-plan.svg';
import prices from '@/assets/tutor-garden-prices.svg';

/** 自拟布局验收题，仅用于独立演示，不替换现有拍照素材。 */
export const TUTOR_GARDEN_EXAMPLE: AISolveQuestion = {
  id: 'tutor-garden', number: '1', subject: '数学', imageSrc: plan,
  text: '学校准备改造劳动实践花园。阅读花园布局与施工报价，解决围栏、种植面积和预算问题。',
  materials: [
    { type: 'text', text: '学校计划把一块长方形空地改造成劳动实践花园，供同学们种植蔬菜、观察植物生长。花园长24米、宽18米，四周准备安装围栏；北边留一个宽4米的入口，入口处不安装围栏。' },
    { type: 'text', text: '为了方便通行，在花园内铺设一条宽2米、沿南北方向贯通的长方形小路。小路两端与花园边界齐平，其余区域全部用于种植。入口只作为围栏的缺口，不额外占用种植面积。花园布局见图1，施工报价见图2。' },
    { type: 'image', id: 'plan', src: plan, caption: '图1 · 花园布局（示意图）' },
    { type: 'text', text: '预算只计算围栏与小路铺装，不计植物、工具等其他费用；报价已包含施工费用。计算时不考虑围栏厚度，结果写清单位。' },
    { type: 'image', id: 'prices', src: prices, caption: '图2 · 施工报价' },
  ],
  subQuestions: [
    { id: 'fence', label: '第1问', text: '需要安装多少米围栏？', imageIds: ['plan'], conditions: ['长24米，宽18米', '入口宽4米，不安装围栏'] },
    { id: 'area', label: '第2问', text: '除去小路后，种植区域的面积是多少平方米？', imageIds: ['plan'], conditions: ['花园长24米，宽18米', '小路南北贯通，宽2米'] },
    { id: 'cost', label: '第3问', text: '围栏与小路铺装一共需要多少元？', imageIds: ['plan', 'prices'], conditions: ['花园24米 × 18米，入口4米', '小路长18米、宽2米', '围栏18元/米，小路35元/平方米', '入口不装围栏；只计两项施工费'] },
  ],
};
