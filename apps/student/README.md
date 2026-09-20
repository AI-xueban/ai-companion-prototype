# AI伴学V2.0

AI伴学V2.0 是面向 5-9 年级学生的平板端伴学产品原型。本项目由 AI伴学V0.6 独立复制并进行工程治理，原 V0.6 目录不受影响。

## 当前范围

- 学生端：首页任务规划、学科地图、错题本、Lumi 空间与成长中心。
- 教师端：班级概览、学情分析、学生管理与激励管理。
- 内部运营端：金币流水、公益项目、商城和风控演示。
- 固定平板交互舞台：2400 x 1600，运行时按可用窗口等比例缩放。
- UI 视觉改版暂未开始，等待后续设计输入。

## 本地运行

要求 Node.js 18 或更高版本。

```powershell
npm install
npm run dev
```

生产构建：

```powershell
npm run build
npm run preview
```

完整工程检查：

```powershell
npm run check
```

## 环境变量

复制 `.env.example` 为 `.env.local`，按需配置：

- `GEMINI_API_KEY`：Gemini 能力。
- `DASHSCOPE_API_KEY`：百炼 / DashScope 能力。
- `DASHSCOPE_BASE_URL`、`DASHSCOPE_MODEL`：可选网关配置。
- `VITE_ENABLE_DEMO_CONTROLS`：生产环境是否显示演示跳转控制器，默认关闭。

当前多数学习数据仍采用本地 Mock，未配置密钥也可体验主要页面。

## 目录职责

- `components/`：按业务域组织的页面与组件。
- `config/`：产品名、版本、舞台尺寸和功能开关。
- `data/`：Mock 数据、题目数据和静态业务配置。
- `hooks/`：跨页面复用的 React 状态逻辑。
- `services/`：AI、知识图谱、奖励与反馈等领域服务。
- `docs/`：需求文档。现行看 `docs/v2.0/`，V2.0 之前基线看 `docs/pre-v2.0/`，总索引见 `docs/README.md`。
- `promo/`：独立宣传物料，不参与主应用模块图。

## 二次开发约束

1. 产品对外名称统一为“AI伴学V2.0”。
2. 正常功能数据与演示场景数据分离，演示入口受功能开关控制。
3. 新增能力优先放入对应业务域，不继续扩大 `App.tsx`。
4. 删除模块前必须确认静态引用、动态入口和文档规划三项均无依赖。
5. 每次改动至少执行 `npm run check`，并回归学生端五个主导航入口。

详细记录见 `docs/v2.0/00-工程治理/AI伴学V2.0-工程治理说明.md`。
