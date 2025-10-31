# AI-Travel-Planner

Web 版 AI 旅行规划师，提供语音/文字输入的智能行程规划、费用预算与管理、用户登录与云端同步（可选），并支持地图展示与 Docker 打包部署。

警告：切记不要将任何 API Key 写在代码中。本项目提供「设置」页面用于在运行时输入 Key，并将其保存于浏览器本地（localStorage）。

## 功能概览
- 智能行程规划：输入目的地、日期、预算、偏好，调用大语言模型自动生成行程（可选支持阿里云百炼 DashScope 或 OpenAI 兼容接口）。
- 语音输入：支持浏览器 Web Speech API，实现偏好与记账的语音转文字。
- 地图与导航：集成高德地图 JS API，展示行程地点并自动地理编码。
- 费用预算与管理：文本/语音快速记账，分类统计与总计。
- 用户管理与数据存储：可选 Supabase 登录与云端同步（未配置时使用本地存储）。

## 技术栈
- 前端：Vite + React + TypeScript + React Router + Zustand
- 语音识别：浏览器 Web Speech API（可扩展接入科大讯飞等）
- 地图：高德地图 JS API + 地理编码 REST
- 数据：localStorage（默认） / Supabase（可选）
- 大模型：DashScope 兼容接口 / OpenAI 兼容接口（可选）

## 快速开始（本地开发）
1. 环境要求：建议安装 Node.js 18+。
2. 安装依赖：
   ```bash
   npm install
   ```
3. 启动开发服务器：
   ```bash
   npm run dev
   ```
4. 浏览器打开 `http://localhost:5173/`，先进入「设置」页面，填写：
   - 大模型 Key（DashScope 或 OpenAI 兼容）与模型名
   - 高德地图 Key（用于加载地图与地理编码）
   - 可选：Supabase URL/Anon Key（用于登录与云端同步）

## 构建与预览
```bash
npm run build
npm run preview
```

## Docker 构建与运行
本项目提供生产镜像的 Dockerfile（Nginx 静态部署，支持 SPA 回退）。

```bash
docker build -t ai-travel-planner:latest .
docker run -p 8080:80 ai-travel-planner:latest
```
访问 `http://localhost:8080/` 即可。

如需与后端网关或代理协同，请根据实际部署环境在设置页配置 Base URL 与 Key。

## GitHub Actions（可选）
位于 `.github/workflows/docker-publish.yml` 的工作流可将镜像构建并推送到你的镜像仓库（如阿里云容器镜像服务）。你需要在仓库 Secrets 中配置：
- `REGISTRY_SERVER`：例如 `registry.cn-hangzhou.aliyuncs.com`
- `REGISTRY_USERNAME` / `REGISTRY_PASSWORD`
- `IMAGE_NAME`：例如 `your-namespace/ai-travel-planner`

## 提交要求与 PDF 生成
- 项目代码提交到 GitHub，并在 README 中说明如何运行。
- 如果你使用的不是阿里云百炼的 Key，请在 README 中提供可用 Key（3 个月内有效，用于助教批改），但不要写入代码。
- 生成 PDF：本项目提供脚本将 README 内容与 repo 地址生成 `docs/submission.pdf`。
  ```bash
  npm run generate-pdf
  ```
  生成前请先在脚本里替换你的 GitHub 仓库地址。

## Supabase 表结构（可选）
如果启用云端同步，请在 Supabase 中创建如下表：

```sql
-- 行程计划
create table if not exists public.plans (
  id text primary key,
  destination text not null,
  data jsonb not null,
  updated_at timestamptz not null
);

-- 费用记录
create table if not exists public.expenses (
  id text primary key,
  date date not null,
  category text not null,
  amount numeric not null,
  notes text
);
```

并在项目设置中开启匿名读写或根据需要使用 RLS 策略。

## 安全与隐私
- 不在代码中硬编码任何 API Key。
- 运行时通过设置页输入 Key，保存在浏览器 localStorage。

## 目录结构
```
src/
  components/   # 复用组件：表单、语音、预算、地图视图
  pages/        # 路由页面：首页/规划/预算/设置/登录
  services/     # LLM、地图加载、Supabase 客户端
  store/        # Zustand 设置存储
  hooks/        # 语音识别 Hook
```

## 免责声明
- Web Speech API 的语音识别在不同浏览器支持程度不同，建议使用最新版 Chrome。
- 高德地图与 LLM 服务需自行申请 Key 并遵循其使用条款。