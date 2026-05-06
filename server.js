import express from 'express'
import cors from 'cors'
import db from './api/lib/db.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/api/todo/list', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query
  const limit = Number(pageSize)
  const offset = (Number(page) - 1) * limit

  const todos = db.prepare('SELECT * FROM Todo ORDER BY createdAt DESC LIMIT ? OFFSET ?').all(limit, offset)
  const total = db.prepare('SELECT count(*) as count FROM Todo').get().count

  res.json({
    list: todos.map(t => ({ ...t, completed: !!t.completed })),
    total,
    page: Number(page),
    pageSize: Number(pageSize)
  })
})

app.post('/api/todo/add', (req, res) => {
  const { title } = req.body
  if (!title || !title.trim()) return res.status(400).json({ error: '标题不能为空' })

  const stmt = db.prepare('INSERT INTO Todo (title) VALUES (?)')
  const result = stmt.run(title.trim())
  const todo = db.prepare('SELECT * FROM Todo WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ ...todo, completed: !!todo.completed })
})

app.post('/api/todo/update', (req, res) => {
  const { id, completed, title } = req.body
  if (!id) return res.status(400).json({ error: '缺少 id' })

  const updates = []
  const values = []

  if (typeof completed === 'boolean') {
    updates.push('completed = ?')
    values.push(completed ? 1 : 0)
  }
  if (typeof title === 'string') {
    updates.push('title = ?')
    values.push(title.trim())
  }
  updates.push("updatedAt = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE Todo SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  const todo = db.prepare('SELECT * FROM Todo WHERE id = ?').get(id)
  res.json({ ...todo, completed: !!todo.completed })
})

app.post('/api/todo/delete', (req, res) => {
  const { id } = req.body
  if (!id) return res.status(400).json({ error: '缺少 id' })
  db.prepare('DELETE FROM Todo WHERE id = ?').run(id)
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
app.get('/api/todo/export', (req, res) => {
  const todos = db.prepare('SELECT * FROM Todo ORDER BY createdAt DESC').all()
  const header = 'ID,标题,状态,创建时间,更新时间'
  const rows = todos.map(t => [
    t.id,
    escapeCsvField(t.title),
    t.completed ? '已完成' : '待处理',
    t.createdAt,
    t.updatedAt
  ].join(','))
  const csv = [header, ...rows].join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename=todos_export.csv')
  res.send('\uFEFF' + csv)
})

// 导入
app.post('/api/todo/import', (req, res) => {
  const { items } = req.body
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '导入数据不能为空' })
  }

  const insert = db.prepare('INSERT INTO Todo (title, completed) VALUES (?, ?)')
  const insertMany = db.transaction((list) => {
    let count = 0
    for (const item of list) {
      if (!item.title || !item.title.trim()) continue
      const completed = item.completed === true || item.completed === '已完成' || item.completed === 1 ? 1 : 0
      insert.run(item.title.trim(), completed)
      count++
    }
    return count
  })

  const count = insertMany(items)
  res.json({ success: true, imported: count })
})

app.listen(PORT, () => {
  console.log(`✅ 本地 API 服务器已启动: http://localhost:${PORT} (使用 better-sqlite3 直连)`)
})
