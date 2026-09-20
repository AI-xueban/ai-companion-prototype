# 核心功能重构 PRD：多元智能评估体系 (Assessment Refactor)

> **文档版本**: v1.0  
> **创建日期**: 2024-12-29  
> **编写人**: Senior Product Manager / Edu-Tech Expert  
> **目标模块**: `components/Assessment/AssessmentStages.tsx`  
> **对应理论**: 霍华德·加德纳 (Howard Gardner) 多元智能理论 (Multiple Intelligences)

---

## 1. 项目背景与目标 (Context & Goals)

### 1.1 背景
原本的测评模块（Cognitive/Academic/Style）维度较粗，缺乏心理学理论支撑，难以生成令人信服的“能力画像”。为了提升产品的科学严谨性与用户的信赖感，我们将引入“八大智能”模型。

### 1.2 目标
1.  **科学性 (Scientific Rigor)**：将 8 个智能维度转化为 Web 端可交互的认知任务（Cognitive Tasks）。
2.  **趣味性 (Engagement)**：通过“微交互”游戏化设计，避免枯燥的问卷感。
3.  **画像立体化**: 最终输出一个 8 维雷达图数据，为后续个性化推荐打底。

### 1.3 核心限制
*   **演示阶段**: 每个维度仅设计 **2 道** 典型题目。
*   **交互时长**: 整体流程控制在 3-4 分钟内。
*   **资源限制**: 不依赖外部音频/视频文件，仅使用 CSS/SVG/Lucide Icons 实现交互。

---

## 2. 交互流程设计 (UX Flow)

### 2.1 整体架构
用户进入 -> **引导页 (Intro)** -> **多维挑战循环 (The Loop)** -> **结算页 (Summary)**

*   **多维挑战循环**:
    *   顶部进度条：显示 8 个维度的图标，当前维度高亮。
    *   题目切换：维度 A (Q1 -> Q2) -> 过渡动画 -> 维度 B (Q1 -> Q2)...
    *   即时反馈：每题答完后显示简单的 ✅ 或 ✨，不打断心流。

### 2.2 视觉隐喻
我们将这 8 个维度包装为“大脑的 8 个能量区”：
1.  **言语区** (Verbal)
2.  **逻辑区** (Logical)
3.  **空间区** (Spatial)
4.  **动觉区** (Bodily)
5.  **音乐区** (Musical)
6.  **人际区** (Interpersonal)
7.  **内省区** (Intrapersonal)
8.  **自然区** (Naturalist)

---

## 3. 功能需求详述 (Functional Specs) - 八大维度设计

> **开发指令**: 请为以下每个维度创建一个独立的子组件或配置项，确保代码可维护性。

### 3.1 🗣️ 语言言语智能 (Verbal-Linguistic)
*核心考察: 语义联想、逻辑排除*
*   **Q1 [类比推理]**:
    *   题干: "医生 : 听诊器 :: 画家 : ____ ?"
    *   选项: [A. 博物馆] [B. 颜料] [C. 画笔 (Correct)] [D. 欣赏]
*   **Q2 [异类识别]**:
    *   题干: "找出逻辑上不属于同类的一个词："
    *   选项: [A. 愤怒] [B. 悲伤] [C. 颜色 (Correct)] [D. 喜悦]
    *   *注: C是名词/上位概念，其他是情绪形容词。*

### 3.2 🔢 逻辑数学智能 (Logical-Mathematical)
*核心考察: 归纳推理、代数思维*
*   **Q1 [数字规律]**:
    *   题干: "1, 3, 7, 15, ____ ?" (规律: x2 + 1)
    *   选项: [A. 29] [B. 31 (Correct)] [C. 30] [D. 32]
*   **Q2 [图形天平]**:
    *   题干: "已知: 2🍎 = 1🍉, 1🍉 = 4🍓. 问: 1🍎 = 几🍓?"
    *   选项: [2个 (Correct)] [3个] [4个]

### 3.3 📐 空间智能 (Visual-Spatial)
*核心考察: 心理旋转、视觉重构*
*   **Q1 [心理旋转]**:
    *   题干: 展示一个“L”型积木。
    *   选项: 选出该积木旋转 90度 后的样子。(需用 CSS transform 旋转图标实现)
*   **Q2 [折纸展开]**:
    *   题干: "正方形纸对折两次剪个圆，展开后有几个洞？"
    *   选项: [1个] [2个] [4个 (Correct)]

### 3.4 🏃 肢体动觉智能 (Bodily-Kinesthetic)
*核心考察: 反应速度、抑制控制 (Web端替代方案)*
*   **Q1 [极速反应 (Reflex)]**:
    *   交互: 屏幕中心显示灰色圆圈。文字提示“变绿时立即点击！”。
    *   逻辑: 随机延迟 2000-4000ms 后变绿。记录反应时(ms)。
    *   评分: <300ms 满分, >800ms 低分。
*   **Q2 [精准制动 (Precision)]**:
    *   交互: 一个快速左右移动的滑块。
    *   目标: 点击按钮让滑块停在中间的“绿色区域”。

### 3.5 🎶 音乐智能 (Musical-Rhythmic)
*核心考察: 节奏记忆 (视觉替代)*
*   **Q1 [节奏记忆 (Simon Says)]**:
    *   交互: 3 个彩色鼓面。系统自动播放序列 (如红-蓝-红)，用户需复述。
    *   *Dev Note*: 使用 CSS 动画高亮模拟“播放”，无需真实音频。
*   **Q2 [密度辨识]**:
    *   题干: "哪个波形代表的节奏更快？"
    *   选项: 展示两张 SVG 波形图，一张稀疏，一张密集(Correct)。

### 3.6 🤝 人际智能 (Interpersonal)
*核心考察: 情绪识别、社交决策*
*   **Q1 [眼神识人]**:
    *   题干: 展示一个“眉毛下垂、眼神游离”的简笔画表情。
    *   问题: "他现在的感受是？"
    *   选项: [A. 兴奋] [B. 担忧 (Correct)] [C. 生气]
*   **Q2 [社交决策]**:
    *   题干: "小组作业有人不说话，你作为组长会？"
    *   选项: [A. 无论如何分配简单任务给他 (Correct)] [B. 告诉老师] [C. 自己全做了]

### 3.7 🧘 内省智能 (Intrapersonal)
*核心考察: 元认知、情绪调节*
*   **Q1 [动机源]**:
    *   题干: "当你攻克一道难题时，让你最开心的是？"
    *   选项: [A. 战胜困难的感觉 (成就感)] [B. 老师的表扬 (外部激励)]
    *   *注: 此题无对错，用于画像。A=内驱力强。*
*   **Q2 [挫折应对]**:
    *   题干: "完全听不懂课时，第一反应是？"
    *   选项: [A. 焦虑但坚持听] [B. 课后找资源补 (策略型)]

### 3.8 🌿 自然观察智能 (Naturalist)
*核心考察: 分类思维、细节捕捉*
*   **Q1 [生物归类]**:
    *   题干: "选出所有会飞的动物" (多选)
    *   选项: [🦅 (选)] [🐟] [🦇 (选)] [🦁]
*   **Q2 [细节找茬]**:
    *   题干: "这两片叶子哪里不同？" (展示两片相似叶子，边缘不同)
    *   选项: [A. 颜色] [B. 边缘形状 (Correct)]

---

## 4. 技术实现指令 (For AI Developer)

### 4.1 数据结构定义
```typescript
type DimensionType = 'linguistic' | 'logic' | 'spatial' | 'bodily' | 'musical' | 'interpersonal' | 'intrapersonal' | 'naturalist';

interface Question {
  id: string;
  dimension: DimensionType;
  type: 'choice' | 'reflex' | 'sequence' | 'multiselect';
  title: string;
  content: React.ReactNode; // 题目展示内容
  options?: { id: string, label: string, isCorrect?: boolean }[];
  correctAnswer?: string | string[]; 
}
```

### 4.2 状态管理
*   建议使用 `useReducer` 或单个复杂的 `useState` 对象来管理整个流程。
*   需要记录的数据：
    *   `currentStageIndex`: number (0-7)
    *   `currentQuestionIndex`: number (0-1)
    *   `scores`: Record<DimensionType, number> (0-100)

### 4.3 组件拆分建议
不要把所有代码写在一个文件里。建议在 `AssessmentStages.tsx` 内部定义子组件，或者如果文件太长，进行逻辑拆分：
1.  `AssessmentStageHeader`: 进度条组件 (需适配 8 个图标)。
2.  `QuestionCard`: 通用的题目容器 (包含 Title, Content, OptionGrid)。
3.  `InteractiveGames`:
    *   `ReflexGame`: 动觉题专用。
    *   `RhythmGame`: 音乐题专用。

### 4.4 动画要求
*   使用 `framer-motion` 的 `AnimatePresence` 实现题目切换时的 **Exit/Enter** 效果（如：向左滑出，新题从右滑入）。
*   点击正确选项时，选项框应有 **绿色波纹** 或 **弹跳** 效果。

---

## 5. 后续数据映射 (Data Mapping)

这部分仅作逻辑说明，用于 `onComplete` 后的数据处理：
*   **Linguistic**: 影响推荐的阅读材料难度。
*   **Logic**: 影响理科题目的解题步骤详细程度。
*   **Spatial**: 推荐更多视频/图解类教材。
*   **Bodily**: 推荐“互动式”学习（如拖拽填空）。
*   **Musical**: 推荐“听书/播客”模式。
*   **Interpersonal**: 开启“小组PK”或“互助”功能。
*   **Intrapersonal**: 决定 AI 助手的“鼓励话术”风格。
*   **Naturalist**: 推荐结构化、分类清晰的知识图谱。

