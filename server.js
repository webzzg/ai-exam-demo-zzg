import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

import prisma from './api/lib/prisma.js'

app.get('/api/todo/list', async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 20
  
  const [todos, total] = await Promise.all([
    prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.todo.count()
  ])

  res.json({ list: todos, total, page, pageSize })
})

app.post('/api/todo/add', async (req, res) => {
  const { title } = req.body
  if (!title) return res.status(400).json({ error: '标题不能为空' })
  const todo = await prisma.todo.create({ data: { title: title.trim() } })
  res.status(201).json(todo)
})

app.post('/api/todo/update', async (req, res) => {
  const { id, completed, title } = req.body
  if (!id) return res.status(400).json({ error: '缺少 id' })
  const data = {}
  if (typeof completed === 'boolean') data.completed = completed
  if (typeof title === 'string') data.title = title.trim()

  const todo = await prisma.todo.update({ where: { id: Number(id) }, data })
  res.json(todo)
})

app.post('/api/todo/delete', async (req, res) => {
  const { id } = req.body
  if (!id) return res.status(400).json({ error: '缺少 id' })
  await prisma.todo.delete({ where: { id: Number(id) } })
  res.json({ success: true })
})

// CSV 转义辅助函数
function escapeCsvField(value) {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

// 导出 CSV
app.get('/api/todo/export', async (req, res) => {
  const todos = await prisma.todo.findMany({ orderBy: { createdAt: 'desc' } })
  const header = 'ID,标题,状态,创建时间,更新时间'
  const rows = todos.map(t => [
    t.id,
    escapeCsvField(t.title),
    t.completed ? '已完成' : '待处理',
    t.createdAt.toISOString(),
    t.updatedAt.toISOString()
  ].join(','))
  const csv = [header, ...rows].join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename=todos_export.csv')
  res.send('\uFEFF' + csv)
})

// 导入
app.post('/api/todo/import', async (req, res) => {
  const { items } = req.body
  if (!Array.isArray(items)) return res.status(400).json({ error: '数据格式错误' })

  const created = await prisma.$transaction(
    items.map(item => prisma.todo.create({
      data: {
        title: item.title,
        completed: item.completed === true || item.completed === '已完成'
      }
    }))
  )
  res.json({ success: true, imported: created.length })
})

app.listen(PORT, () => {
  console.log(`\n🚀 全栈 API 服务器已启动: http://localhost:${PORT}`)
  console.log(`🔗 数据库状态: 正在使用云端 PostgreSQL (Vercel Postgres)\n`)
})
