# AI Exam Demo 全栈技术说明文档

这份文档旨在帮助你（以及领导）理解这个 Demo 的全栈实现逻辑，即使你主要负责前端开发。

## 1. 核心技术栈
- **前端**: Vue 3 + Vite + Element Plus (虚拟表格 `el-table-v2`)
- **后端**: Vercel Serverless Functions (Node.js)
- **数据库**: SQLite (通过 Prisma ORM 管理)
- **部署平台**: Vercel

## 2. 为什么选择 SQLite？
在全栈 Demo 中，由于你是“纯前端”，我们选择了 **SQLite** 作为数据库，原因如下：
1. **文件型数据库**：它不需要安装像 MySQL 或 PostgreSQL 那样的独立服务器软件。数据库就是一个名为 `dev.db` 的文件。
2. **零配置**：克隆代码后直接就能跑，不需要配置用户名、密码或连接地址。
3. **性能卓越**：对于 Demo 级别的应用，它的读写速度比云端数据库更快。
4. **Prisma 强力驱动**：通过 Prisma，我们不需要写任何 SQL 语句，全部使用 JavaScript 对象的方法（如 `prisma.todo.findMany()`）来操作数据。

> [!NOTE]
> 在 Vercel 生产环境下，SQLite 是只读的。对于需要持久化非易失数据的正式项目，建议切换到 Vercel 提供的 Postgres。但对于“考试演示”，SQLite 是最快且最稳定的方案。

## 3. 全栈架构逻辑
- **API 路由**: Vercel 会自动将 `api/` 目录下的每个文件映射为一个 API 接口。例如 `api/todos.js` 对应 `/api/todos`。
- **分页实现**: 
  - 后端：使用 `prisma.todo.findMany({ skip: x, take: y })` 来跳过前面的数据并取指定数量的数据。
  - 前端：Element Plus 虚拟表格根据 `total` 总数动态渲染页码。
- **虚拟表格**: 面对大量数据（如几万条）时，虚拟表格只渲染可视区域的 DOM，极大提升了流畅度。

## 4. 如何本地运行
1. `npm install` 安装所有依赖。
2. `npx prisma generate` 生成数据库客户端。
3. `npm run dev` 启动前端。
4. `vercel dev` 如果你想在本地模拟 Vercel 的 API 环境。

## 5. 如何部署到 Vercel
直接在终端输入：
```bash
vercel
```
Vercel 会读取 `vercel.json` 中的配置，自动在云端执行 `npx prisma generate` 并完成打包发布。
