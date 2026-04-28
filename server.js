// 本地开发用的 Express 服务器
import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001

// 初始化 SQLite 数据库
const db = new Database(join(__dirname, 'prisma', 'dev.db'))
db.pragma('journal_mode = WAL')

// 创建表
db.exec(`
  CREATE TABLE IF NOT EXISTS Todo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  )
`)

app.use(cors())
app.use(express.json())

app.get('/api/todos', (req, res) => {
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

app.post('/api/todos', (req, res) => {
  const { title } = req.body
  if (!title || !title.trim()) return res.status(400).json({ error: '标题不能为空' })

  const stmt = db.prepare('INSERT INTO Todo (title) VALUES (?)')
  const result = stmt.run(title.trim())
  const todo = db.prepare('SELECT * FROM Todo WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ ...todo, completed: !!todo.completed })
})

app.put('/api/todos', (req, res) => {
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

app.delete('/api/todos', (req, res) => {
  const { id } = req.body
  if (!id) return res.status(400).json({ error: '缺少 id' })
  db.prepare('DELETE FROM Todo WHERE id = ?').run(id)
  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`✅ 本地 API 服务器已启动: http://localhost:${PORT} (使用 better-sqlite3 直连)`)
})
