# 🚀 项目启动与部署指南 (云端同步版)

本文档包含了项目从本地启动、云端部署到数据库配置的完整流程。经过最新的架构升级，本项目已实现**本地开发与线上部署的数据完全双向同步**，并完美支持完整的增删改查及 CSV 导入导出功能。

---

## 1. 🔗 核心链接与地址

### 🌐 线上部署地址
- **Vercel 生产环境**: [https://ai-exam-demo.vercel.app](https://ai-exam-demo.vercel.app)

### 🗄️ 云数据库连接地址
- **类型**: Vercel Postgres (Neon)
- **DATABASE_URL**: 
  ```env
  postgresql://neondb_owner:npg_iHPM2X6TFmlt@ep-odd-haze-apy004kg-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
  ```
*(此链接已配置在本地的 `.env` 文件以及 Vercel 的环境变量中，请注意保密)*

---

## 2. 💻 本地项目启动步骤

本地开发已深度集成，只需一条命令即可同时启动前端 Vite 代理与后端 Express 服务，且数据直连云端 PostgreSQL。

1. **安装依赖**（如果尚未安装）：
   ```bash
   npm install
   ```
2. **生成 Prisma 客户端**（当表结构有变化时需执行）：
   ```bash
   npx prisma generate
   ```
3. **一键全栈启动**：
   ```bash
   npm run dev:full
   ```
4. **访问本地服务**：
   打开浏览器访问 [http://localhost:5173](http://localhost:5173)。在此页面上新增的任何数据，都会实时同步到线上云数据库。

---

## 3. ☁️ Vercel 部署步骤

项目已针对 Vercel Serverless Function 进行了深度适配，支持一键无缝部署。

1. **执行构建与部署**：
   在项目根目录下，运行以下命令直接推送到 Vercel 生产环境：
   ```bash
   npx vercel --prod --yes
   ```
2. **等待部署完成**：
   终端会输出部署进度，完成后会自动生成生产环境的 URL（如 `https://ai-exam-demo.vercel.app`）。

---

## 4. 🗄️ 如何从零创建 Vercel 云数据库 (附操作步骤)

如果你需要在其他项目中复现此架构，请参考以下 Vercel Postgres 数据库的创建步骤：

1. **登录 Vercel Dashboard**：访问并登录 [Vercel](https://vercel.com/dashboard)。
2. **进入项目设置**：点击你的目标项目（如 `ai-exam-demo`）。
3. **导航至 Storage**：在项目顶部导航栏，点击 **Storage** 选项卡。
4. **创建数据库**：
   - 点击 **Connect Database** 按钮。
   - 在弹出的选项中选择 **Postgres**，然后点击 **Create New**。
   - 接受使用条款，选择一个离你较近的服务器节点（如 Washington D.C.），点击 **Create**。
5. **连接至项目**：
   - 创建成功后，界面会提示你将其连接到当前项目，点击 **Connect**。
   - 连接完成后，Vercel 会自动为项目配置 `POSTGRES_PRISMA_URL` 等环境变量。
6. **获取连接字符串**：
   - 在数据库的配置页面，点击 **.env.local** 选项卡，点击 "Show Secret"。
   - 复制其中的 `POSTGRES_PRISMA_URL` 或 `DATABASE_URL` 的值，这就是你的云数据库地址。

---

## 5. 🔄 数据库结构同步说明

当你在本地修改了 `prisma/schema.prisma` 文件（比如新增了一个字段）后，需要执行以下步骤将改动同步到云数据库：

```bash
# 1. 将表结构推送到云端 PostgreSQL
npx prisma db push

# 2. 重新生成本地的 Prisma Client 以获取最新的类型推断
npx prisma generate
```

> **注意**：本项目使用的是 Prisma 6 经典配置方案，去除了容易引发 Node.js 兼容性问题的 `prisma.config.ts`，确保了极简、高效的 Serverless 部署体验。
