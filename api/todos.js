import Database from 'better-sqlite3'
import { join } from 'path'

// Vercel Serverless 环境下，通常可以直接通过 process.cwd() 获取根目录
const dbPath = join(process.cwd(), 'prisma', 'dev.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// 确保表存在（以防万一）
db.exec(`
  CREATE TABLE IF NOT EXISTS Todo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  )
`)

export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    switch (req.method) {
      // 获取待办列表（支持分页）
      case 'GET': {
        const { page = 1, pageSize = 20 } = req.query
        const limit = Number(pageSize)
        const offset = (Number(page) - 1) * limit

        const todos = db.prepare('SELECT * FROM Todo ORDER BY createdAt DESC LIMIT ? OFFSET ?').all(limit, offset)
        const total = db.prepare('SELECT count(*) as count FROM Todo').get().count

        return res.status(200).json({
          list: todos.map(t => ({ ...t, completed: !!t.completed })),
          total,
          page: Number(page),
          pageSize: Number(pageSize)
        })
      }

      // 新增待办
      case 'POST': {
        const { title } = req.body
        if (!title || !title.trim()) {
          return res.status(400).json({ error: '标题不能为空' })
        }
        const stmt = db.prepare('INSERT INTO Todo (title) VALUES (?)')
        const result = stmt.run(title.trim())
        const todo = db.prepare('SELECT * FROM Todo WHERE id = ?').get(result.lastInsertRowid)
        return res.status(201).json({ ...todo, completed: !!todo.completed })
      }

      // 更新待办
      case 'PUT': {
        const { id, completed, title } = req.body
        if (!id) {
          return res.status(400).json({ error: '缺少 id' })
        }
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
        return res.status(200).json({ ...todo, completed: !!todo.completed })
      }

      // 删除待办
      case 'DELETE': {
        const { id: deleteId } = req.body
        if (!deleteId) {
          return res.status(400).json({ error: '缺少 id' })
        }
        db.prepare('DELETE FROM Todo WHERE id = ?').run(deleteId)
        return res.status(200).json({ success: true })
      }

      default:
        return res.status(405).json({ error: '不支持的请求方法' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: '服务器内部错误', msg: error.message })
  }
}
