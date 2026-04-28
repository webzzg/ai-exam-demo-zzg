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

app.listen(PORT, () => {
  console.log(`✅ 本地 API 服务器已启动: http://localhost:${PORT} (使用 better-sqlite3 直连)`)
})
