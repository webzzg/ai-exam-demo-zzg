# 🚀 AI Full-Stack Exam Demo

这是一个基于 **Vue 3 + Element Plus + Express + SQLite** 的全栈考试演示项目。它实现了完整的数据增删改查（CRUD）闭环，并支持 CSV 数据的导入与导出，完美适配 **Vercel** Serverless 环境部署。

## ✨ 项目核心特性

- **全栈闭环**：前端 Vue 3 配合后端 Serverless API，实现真实的生产级交互。
- **虚拟表格**：集成 `el-table-v2` 虚拟化表格，支持海量数据的高性能渲染。
- **导入导出**：
  - **导出**：一键生成符合标准的 CSV 文件（处理了中文 BOM 兼容性）。
  - **导入**：支持 CSV 文件上传，前端解析 + 后端事务批量插入，效率极高。
- **环境自适应**：一套代码同时兼容本地 Node.js 环境（better-sqlite3）与 Vercel Serverless 环境。

## 🛠️ 技术选型

- **前端**：Vue 3 (Composition API), Vite, Element Plus
- **后端**：Express, Vercel Serverless Functions
- **数据库**：SQLite (通过 Prisma 管理 Schema，运行时使用 better-sqlite3)
- **部署**：Vercel (利用 `/tmp` 目录实现 Serverless 环境下的 SQLite 可写操作)

## 📦 快速开始

### 1. 安装依赖
在项目根目录下执行：
```bash
npm install
```

### 2. 本地全栈开发 (推荐)
只需一条命令即可同时启动前端 Vite 和后端 API 服务器：
```bash
npm run dev:full
```
启动后访问：`http://localhost:5173` (或终端提示的端口)

### 3. 分别启动 (可选)
- **仅启动前端**：`npm run dev`
- **仅启动后端 API**：`npm run dev:server`

---

## 🚀 部署到 Vercel

本项目针对 Vercel 进行了深度优化，可通过以下命令一键部署：

```bash
# 安装 Vercel CLI (如果没有)
npm install -g vercel

# 生产环境部署
npx vercel --prod
```

### 线上部署核心点：
- **数据库位置**：在 Vercel 生产环境下，SQLite 数据库会自动拷贝到 `/tmp` 目录以获得写入权限。
- **路由重写**：通过 `vercel.json` 将 `/api/todo/*` 的 RPC 请求统一重定向到 `/api/rpc.js` 容器进行处理。

---

## 📜 常用命令说明

| 命令 | 说明 |
| :--- | :--- |
| `npm run dev:full` | **全栈启动**：使用 `concurrently` 同时运行前后端。 |
| `npm run dev` | **前端开发**：启动 Vite 热更新服务。 |
| `npm run dev:server` | **后端开发**：启动 Express API 服务器（3001 端口）。 |
| `npm run build` | **生产构建**：执行 Prisma 生成与 Vite 构建。 |
| `npx prisma generate` | **模型更新**：根据 `schema.prisma` 更新数据库客户端。 |

---

## 👤 开发者
**张志国** (Vercel 演示项目)
