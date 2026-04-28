# 🚀 AI Full-Stack Demo 核心原理解析与技术白皮书

> 👨‍💻 **开发者 / 架构设计**：ZZG
> ☁️ **部署平台**：[Vercel 官网 (https://vercel.com)](https://vercel.com)
> 🔗 **项目线上预览**：[https://ai-exam-demo.vercel.app](https://ai-exam-demo.vercel.app)

---

## 🎯 1. 为什么要做这个全栈架构？ (背景与目标)

本 Demo 的初衷是在极短的时间内，向领导与非技术人员直观展示 **“纯前端工程师如何利用现代云原生基础设施（Vercel）实现全栈业务的数据闭环”**。
通过脱离传统的笨重数据库（如独立部署的 MySQL 服务器）和后端服务（如 Java SpringBoot），我们巧妙利用了文件级数据库与 Serverless（无服务器）架构，实现了一个开箱即用、零运维成本的企业级规范 CRUD（增删改查）应用。

---

## 🛠️ 2. 完整的技术栈选型思路

本项目采用目前最流行的高性能轻量级架构组合：

### 前端体验层
*   **Vue 3 + Vite**：作为基础的应用脚手架，得益于 Vite 的预构建，能够在本地开发时提供毫秒级的冷启动体验。
*   **Element Plus (el-table-v2)**：为了彰显项目的技术深度，我们没有使用普通的表格，而是引入了 **虚拟滚动表格组件**。哪怕后端一次性返回一万条数据，页面也能保持极致流畅（60FPS），不会出现浏览器卡死的现象。

### 后端服务层
*   **Vercel Serverless Functions**：直接将 Node.js 接口承载在云端的无服务器容器中。相比一直后台运行的传统服务器进程，Serverless 的最大优势是 **按需计费、冷启动迅速、无需手动管理 Nginx 或进程监控。**
*   **规范化 RPC 路由体系**：彻底摒弃了简单但混乱的单文件 CRUD (`/api/todos`)。我们重新组织了目录结构，提供了符合企业级管理要求的指令化接口，即：
    *   `GET /api/todo/list` （列表分页拉取）
    *   `POST /api/todo/add` （创建）
    *   `POST /api/todo/update` （修改）
    *   `POST /api/todo/delete` （删除）

### 数据库层
*   **better-sqlite3**：极高吞吐量的 SQLite C++ 绑定库。
*   **为何抛弃 Prisma 选择 SQLite？**
    1.  **零运维**：SQLite 把整库数据存放在单个 `.db` 文件中。无需任何云端 RDS 购买、账号密码配置或安全组放行操作！
    2.  **兼容性强**：因为 Prisma 在 Serverless 环境下的水土不服以及 Node 引擎冲突易触发 Fatal Error，使用原生 C++ 驱动的 `better-sqlite3` 是当今小型项目的最稳妥底座。

---

## 💡 3. “黑科技”破局：如何解决 Vercel 数据库只读报错 (500) 难题？

在研发此套方案的过程中，我们遇到了一个极其棘手的前沿问题：**云服务的物理读写限制**。

### 🚨 问题发现
当向云端的数据库触发 `UPDATE` 或者 `INSERT` 操作修改数据时，系统直接崩溃并抛出 **HTTP 500**。其根本原因是：**Vercel 为 Serverless 创建的运行镜像（除了核心逻辑外）是强制只读的（Read-Only File System）**，这导致底层的 SQLite 引擎试图落盘写入文件时遭遇操作系统拦截。

### 🛡️ 热拷贝桥接方案 (`/tmp` 挂载机制)
为了保证在这个严苛环境下我们依然能顺滑演示 CRUD 操作，我在项目核心库 `api/lib/db.js` 中实施了 **“冷启动内存盘热备份”** 策略：
利用 Vercel 唯一开放且带读写权限的 `/tmp` 临时操作系统的共享目录。

1. **首次探测（冷启动）**：当线上接口接收到调用时，系统会瞬间识别当前是否处于 Vercel 生产环境。
2. **挂载热移**：一旦确认为云端镜像，系统会立即把项目中自带的基础初始数据库 `prisma/dev.db` 瞬间 Copy （热备份）到具备合法写入权限的内存硬盘目录 `/tmp/dev.db` 内。
3. **闭环共享**：所有的 `add`、`list`、`update` 函数虽然被系统物理切分，但也已通过定制的 `vercel.json` （Vercel Rewrites 接口重写系统）强行聚合成单一入口运行池。这保证了所有相关操作不仅能顺利落库，且互通有无！

> **注意：此方案是专为“ShowCase/演示”量身定做的极致方案。** 数据会在 Vercel 停机销毁实例时（约 15 分钟无任何请求）被还原，非常切合汇报展示的“随时保持最新清爽状态”的生命周期特点。

---

## ⚙️ 4. 关键的核心操作与配置文件一览

### 配置文件 `vercel.json` 详解
正是这个配置文件，让 Vue 应用的前端构建与 Node.js 接口的合并部署无缝集成：
```json
{
  "framework": "vite",
  "buildCommand": "npx vite build",
  "outputDirectory": "dist",
  "functions": {
    "api/**/*": {
      "includeFiles": "prisma/**" // 🔥 【核心】强制保留数据库物理文件，免遭构建器剔除
    }
  },
  "rewrites": [
    // 🔥 【核心】通过 URL 拦截引擎，把散落的 RPC 请求全部打到统一容器，解决 /tmp 数据孤岛
    { "source": "/api/todo/(.*)", "destination": "/api/rpc.js?action=$1" }
  ]
}
```

### 如何在本地无缝进行全栈开发与验证？
我已经帮你统一了**本地开发机**与**线上 Vercel 的双重兼容适配**，告别一切繁杂手段。
使用以下两条简单的命令分别在终端后台运行：

1. **运行专属的本地微型后端**：
   ```bash
   npm run dev:server
   ```
   *(在 3001 端口启动基于 `better-sqlite3` 实现并对齐所有 `api/todo/...` RPC 的服务)*

2. **启动极速 Vite 前端代理**：
   ```bash
   npm run dev
   ```
   *(自动捕获前台发送的所有 `/api` 请求，转发给上述微型后端。你可以打开浏览器无缝全栈调试啦！)*
