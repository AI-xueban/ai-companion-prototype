# AI 学伴原型协作仓库

这是产品团队共同维护的高保真演示原型工作区。

## 当前应用

- `apps/student`：小学、初中共用的学生平板原型。
- `apps/admin`：平台运营管理后台。
- 教师管理平台暂时保留在学生端源码的独立模式中；待学生端功能合并稳定后再拆为独立应用，避免本阶段改变既有交互。

## 常用命令

```text
npm run dev:student
npm run check:student
npm run dev:admin
npm run build:admin
```

## Cloudflare Pages 部署

同一仓库分别创建两个 Pages 项目，生产分支均使用 `main`：

| 项目 | 根目录 | 构建命令 | 输出目录 | 环境变量 |
|---|---|---|---|---|
| 学生端（含教师端演示入口） | `apps/student` | `npm run build` | `dist` | `VITE_ENABLE_DEMO_CONTROLS=true` |
| 管理后台 | `apps/admin` | `npm run build` | `dist` | 无 |

学生端标准构建会输出拆分后的 HTML、JS、CSS 和图片资源，并通过
`public/_redirects` 将 SPA 路径回退到 `index.html`。如需离线传阅的单 HTML，
在 `apps/student` 内执行 `npm run build:singlefile`，不要将该产物用于 Pages。

背景视频未提交到 Git。需要在公网部署中启用视频时，先上传到 R2/CDN，再为学生端
设置 `VITE_LUMI_IDLE_VIDEO_URL` 和 `VITE_LUMI_TALKING_VIDEO_URL`；不设置时自动显示封面图。

## 维护原则

- `main` 必须保持可启动、可演示。
- 小学和初中在同一个学生端内按学业上下文切换。
- 不把 `node_modules`、`dist`、ZIP、日志、密钥或临时产物提交到 Git。
- 原始目录继续作为迁移参照，不在原目录上执行合并覆盖。
- 产品取舍与迁移顺序以 `docs/原型合并与Git协作实施基线.md` 为准。
