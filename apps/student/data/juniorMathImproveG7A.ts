/** 七年级上册数学 · 同步提高。来源：产品目录截图，层级为 章 → 小节 → 课时/知识点 → 视频。 */

export interface ImproveVideo {
  title: string;
}

export interface ImproveNode {
  title: string;
  videos?: ImproveVideo[];
  children?: ImproveNode[];
}

export interface ImproveSection {
  id: string;
  title: string;
  videos?: ImproveVideo[];
  nodes?: ImproveNode[];
}

export interface ImproveChapter {
  id: string;
  title: string;
  sections: ImproveSection[];
}

export const JUNIOR_MATH_IMPROVE_G7A: ImproveChapter[] = [
  {
    id: 'ch1',
    title: '第一章 有理数',
    sections: [
      {
        id: 's1.1',
        title: '1.1 正数和负数',
        videos: [{ title: '正数和负数' }],
      },
      {
        id: 's1.2',
        title: '1.2 有理数及其大小比较',
        nodes: [
          { title: '1.2.1 有理数的概念', videos: [{ title: '有理数' }] },
          { title: '1.2.2 数轴', videos: [{ title: '数轴' }] },
          { title: '1.2.3 相反数', videos: [{ title: '相反数' }] },
          { title: '1.2.4 绝对值', videos: [{ title: '绝对值' }] },
          { title: '1.2.5 有理数的大小比较', videos: [{ title: '有理数大小比较' }] },
        ],
      },
    ],
  },
  {
    id: 'ch2',
    title: '第二章 有理数的运算',
    sections: [
      {
        id: 's2.1',
        title: '2.1 有理数的加法与减法',
        nodes: [
          {
            title: '2.1.1 有理数的加法',
            children: [
              { title: '第1课时 有理数的加法法则', videos: [{ title: '有理数的加法' }] },
              { title: '第2课时 有理数加法的运算律', videos: [{ title: '有理数的加法' }] },
            ],
          },
          {
            title: '2.1.2 有理数的减法',
            children: [
              { title: '第1课时 有理数的减法法则', videos: [{ title: '有理数的减法' }] },
              { title: '第2课时 有理数的加减混合运算', videos: [{ title: '有理数的加减混合运算' }] },
            ],
          },
        ],
      },
      {
        id: 's2.2',
        title: '2.2 有理数的乘法与除法',
        nodes: [
          {
            title: '2.2.1 有理数的乘法',
            children: [
              { title: '第1课时 有理数的乘法法则', videos: [{ title: '有理数的乘法' }, { title: '倒数' }] },
              { title: '第2课时 有理数乘法的运算律', videos: [{ title: '有理数的乘法' }] },
            ],
          },
          {
            title: '2.2.2 有理数的除法',
            children: [
              { title: '第1课时 有理数的除法法则', videos: [{ title: '有理数的除法' }] },
              { title: '第2课时 有理数的加减乘除混合运算', videos: [{ title: '有理数的乘除混合运算' }] },
            ],
          },
        ],
      },
      {
        id: 's2.3',
        title: '2.3 有理数的乘方',
        nodes: [
          {
            title: '2.3.1 乘方',
            children: [
              { title: '第1课时 乘方', videos: [{ title: '有理数的乘方' }] },
            ],
          },
          { title: '第2课时 有理数的混合运算', videos: [{ title: '有理数的混合运算' }] },
          {
            title: '2.3.2 科学记数法',
            videos: [
              { title: '科学记数法—表示较大的数' },
              { title: '科学记数法—表示较小的数' },
              { title: '由科学记数法求原数' },
            ],
          },
          { title: '2.3.3 近似数', videos: [{ title: '近似数与有效数字' }] },
        ],
      },
    ],
  },
  {
    id: 'ch3',
    title: '第三章 代数式',
    sections: [
      {
        id: 's3.1',
        title: '3.1 列代数式表示数量关系',
        nodes: [
          { title: '第1课时 代数式', videos: [{ title: '代数式' }] },
          { title: '第2课时 列代数式', videos: [{ title: '代数式' }] },
          { title: '第3课时 反比例关系', videos: [{ title: '正比例和反比例' }] },
        ],
      },
      {
        id: 's3.2',
        title: '3.2 代数式的值',
        videos: [{ title: '代数式求值' }],
      },
    ],
  },
  {
    id: 'ch4',
    title: '第四章 整式',
    sections: [
      {
        id: 's4.1',
        title: '4.1 整式',
        nodes: [
          { title: '第1课时 单项式', videos: [{ title: '单项式' }] },
          { title: '第2课时 多项式', videos: [{ title: '多项式' }, { title: '整式' }] },
        ],
      },
      {
        id: 's4.2',
        title: '4.2 整式的加法与减法',
        nodes: [
          { title: '第1课时 合并同类项', videos: [{ title: '同类项' }, { title: '合并同类项' }] },
          { title: '第2课时 去括号', videos: [{ title: '去括号与添括号' }] },
          { title: '第3课时 整式的加减', videos: [{ title: '整式的加减运算' }] },
        ],
      },
    ],
  },
  {
    id: 'ch5',
    title: '第五章 一元一次方程',
    sections: [
      {
        id: 's5.1',
        title: '5.1 方程',
        nodes: [
          { title: '5.1.1 方程', videos: [{ title: '方程的定义' }, { title: '方程的解' }] },
          { title: '5.1.2 等式的性质', videos: [{ title: '等式的性质' }] },
        ],
      },
      {
        id: 's5.2',
        title: '5.2 解一元一次方程',
        nodes: [
          { title: '第1课时 合并同类项解一元一次方程', videos: [{ title: '解一元一次方程' }] },
          { title: '第2课时 移项解一元一次方程', videos: [{ title: '解一元一次方程' }, { title: '一元一次方程的应用' }] },
          { title: '第3课时 去括号解一元一次方程', videos: [{ title: '解一元一次方程' }, { title: '一元一次方程的应用' }] },
          { title: '第4课时 去分母解一元一次方程', videos: [{ title: '解一元一次方程' }, { title: '行程问题' }] },
        ],
      },
      {
        id: 's5.3',
        title: '5.3 实际问题与一元一次方程',
        nodes: [
          { title: '第1课时 配套问题与工程问题', videos: [{ title: '工程问题' }] },
          { title: '第2课时 商品销售问题与比赛积分问题', videos: [{ title: '打折销售问题' }] },
          { title: '第3课时 方案决策问题与分段计费问题', videos: [{ title: '一元一次方程的应用' }] },
          { title: '第4课时 其他问题', videos: [{ title: '一元一次方程的应用' }] },
        ],
      },
    ],
  },
  {
    id: 'ch6',
    title: '第六章 几何图形',
    sections: [
      {
        id: 's6.1',
        title: '6.1 几何图形',
        nodes: [
          {
            title: '6.1.1 立体图形与平面图形',
            children: [
              { title: '第1课时 立体图形与平面图形', videos: [{ title: '认识几何图形' }] },
              { title: '第2课时 从不同方向看物体', videos: [{ title: '简单几何体的三视图' }] },
              { title: '第3课时 立体图形的展开与折叠', videos: [{ title: '几何体的展开与折叠' }] },
            ],
          },
          { title: '6.1.2 点、线、面、体', videos: [{ title: '点、线、面、体' }] },
        ],
      },
      {
        id: 's6.2',
        title: '6.2 直线、射线、线段',
        nodes: [
          { title: '6.2.1 直线、射线、线段', videos: [{ title: '直线、射线、线段' }] },
          {
            title: '6.2.2 线段的比较与运算',
            videos: [
              { title: '比较线段的长短' },
              { title: '线段的性质：两点之间线段最短' },
            ],
          },
        ],
      },
      {
        id: 's6.3',
        title: '6.3 角',
        nodes: [
          {
            title: '6.3.1 角',
            videos: [{ title: '角的概念' }, { title: '角的度量和换算' }, { title: '方向角' }],
          },
          {
            title: '6.3.2 角的比较与运算',
            videos: [{ title: '角的大小比较' }, { title: '角的计算' }, { title: '角平分线的定义' }],
          },
        ],
      },
    ],
  },
];
