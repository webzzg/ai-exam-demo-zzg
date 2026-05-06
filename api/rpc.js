import db from './lib/db.js'

// CSV 转义辅助函数
function escapeCsvField(value) {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

// Vercel Serverless 环境下 req.body 可能是 string 或已解析对象，需要兼容处理
function parseBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return {} }
  }
  return req.body
}

export default async function handler(req, res) {
  // 允许跨域等基础设置
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // 通过 req.url 或 vercel 重写规则判断具体的 action
  const pathname = req.url.split('?')[0]
  const action = pathname.split('/').pop() || req.query.action

  try {
    if (action === 'list') {
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
    
    if (action === 'add') {
      if (req.method !== 'POST') return res.status(405).json({ error: '请使用 POST 请求' })
      const body = parseBody(req)
      const { title } = body
      if (!title || !title.trim()) return res.status(400).json({ error: '标题不能为空' })

      const stmt = db.prepare('INSERT INTO Todo (title) VALUES (?)')
      const result = stmt.run(title.trim())
      const todo = db.prepare('SELECT * FROM Todo WHERE id = ?').get(result.lastInsertRowid)

      return res.status(201).json({ ...todo, completed: !!todo.completed })
    }

    if (action === 'update') {
      if (req.method !== 'POST') return res.status(405).json({ error: '请使用 POST 请求' })
      const body = parseBody(req)
      const { id, completed, title } = body
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

      return res.status(200).json({ ...todo, completed: !!todo.completed })
    }

    if (action === 'delete') {
      if (req.method !== 'POST') return res.status(405).json({ error: '请使用 POST 请求' })
      const body = parseBody(req)
      const { id: deleteId } = body
      if (!deleteId) return res.status(400).json({ error: '缺少 id' })

      db.prepare('DELETE FROM Todo WHERE id = ?').run(deleteId)
      return res.status(200).json({ success: true })
    }

    // ===== 导出 =====
    if (action === 'export') {
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
      // 添加 BOM 标记以便 Excel 正确识别 UTF-8，使用 end() 兼容 Vercel Serverless
      return res.status(200).end('\uFEFF' + csv)
    }

    // ===== 导入 =====
    if (action === 'import') {
      if (req.method !== 'POST') return res.status(405).json({ error: '请使用 POST 请求' })
      const body = parseBody(req)
      const { items } = body
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
      return res.status(200).json({ success: true, imported: count })
    }

    return res.status(404).json({ error: `未知接口行为: ${action}` })
  } catch (error) {
    return res.status(500).json({ error: '服务端报错', msg: error.message })
  }
}
