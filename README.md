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

## 维护原则

- `main` 必须保持可启动、可演示。
- 小学和初中在同一个学生端内按学业上下文切换。
- 不把 `node_modules`、`dist`、ZIP、日志、密钥或临时产物提交到 Git。
- 原始目录继续作为迁移参照，不在原目录上执行合并覆盖。
- 产品取舍与迁移顺序以 `docs/原型合并与Git协作实施基线.md` 为准。

